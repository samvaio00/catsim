"use client";

import { useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { clamp, dist2, lerp } from "@/lib/utils";
import { useSim } from "@/lib/sim/store";
import { sounds } from "@/lib/sim/sounds";
import { onRug, resolveMove, surfaceAt } from "@/lib/sim/world";
import { furStrandTexture } from "@/lib/sim/textures";
import type { Behavior } from "@/lib/sim/types";

/** Pose offsets: how high the root floats and how far the legs fold. */
function poseFor(behavior: Behavior) {
  switch (behavior) {
    case "sit":
    case "solicit":
      return { lift: 0.0, crouch: 0.5, sitTilt: -0.42, tail: 0.4 };
    case "loaf":
    case "sleep":
      return { lift: -0.015, crouch: 0.9, sitTilt: 0, tail: 0.15 };
    case "stretch":
      return { lift: 0.0, crouch: 0.2, sitTilt: 0.22, tail: 0.8 };
    case "groom":
      return { lift: -0.005, crouch: 0.62, sitTilt: -0.3, tail: 0.3 };
    case "pounce":
    case "hunt":
      return { lift: 0.01, crouch: 0.34, sitTilt: 0, tail: 0.9 };
    case "climb":
      return { lift: 0.03, crouch: 0.15, sitTilt: -0.1, tail: 0.7 };
    default:
      return { lift: 0.02, crouch: 0.06, sitTilt: 0, tail: 0.55 };
  }
}

function smoothAngle(current: number, target: number, t: number) {
  let delta = target - current;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return current + delta * t;
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/**
 * Countershading: multiply vertex colors so the dorsal side carries the deep
 * sepia ticking and the belly fades toward unbleached muslin, like the real
 * breed standard. Axis/sign describe which local direction points up.
 */
function applyCountershade(
  geo: THREE.BufferGeometry,
  axis: "y" | "z",
  upSign: 1 | -1,
  top: [number, number, number],
  bottom: [number, number, number],
) {
  const pos = geo.attributes.position;
  geo.computeBoundingBox();
  const bb = geo.boundingBox!;
  const min = axis === "y" ? bb.min.y : bb.min.z;
  const max = axis === "y" ? bb.max.y : bb.max.z;
  const range = Math.max(1e-5, max - min);
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const c = axis === "y" ? pos.getY(i) : pos.getZ(i);
    // t = 1 at the very top, 0 at the very bottom.
    let t = ((c - min) / range) * upSign;
    t = clamp((t + 1) / 2, 0, 1);
    const k = smoothstep(0.15, 0.85, t);
    colors[i * 3] = lerp(bottom[0], top[0], k);
    colors[i * 3 + 1] = lerp(bottom[1], top[1], k);
    colors[i * 3 + 2] = lerp(bottom[2], top[2], k);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
}

/** Sculpted body: one smooth lathe surface from rump to neck, countershaded. */
function bodyGeometry() {
  const profile: [number, number][] = [
    [0.012, 0],
    [0.075, 0.015],
    [0.118, 0.055],
    [0.14, 0.115], // hips
    [0.126, 0.175], // waist tuck
    [0.121, 0.235], // ribcage
    [0.127, 0.29], // chest
    [0.106, 0.335], // shoulder taper
    [0.07, 0.372], // neck
    [0.046, 0.395],
    [0.014, 0.41],
  ];
  const pts = profile.map(([r, y]) => new THREE.Vector2(r, y));
  const geo = new THREE.LatheGeometry(pts, 36);
  // Lathe axis is local +Y; after the mesh rotates x=+90deg, local -Z is up.
  applyCountershade(geo, "z", -1, [0.62, 0.5, 0.38], [1, 0.98, 0.93]);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Sculpted head: sphere pushed toward Singapura anatomy — rounded skull,
 * definite cheek width, gently flattened crown, narrowed chin.
 */
function headGeometry() {
  const geo = new THREE.SphereGeometry(0.084, 36, 28);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);
    const ny = y / 0.084;
    const nz = z / 0.084;
    // Cheeks: widen the lower-front half of the skull.
    const cheek = smoothstep(0.25, -0.3, ny) * smoothstep(-0.6, 0.1, nz);
    x *= 1 + 0.15 * cheek;
    // Crown: flatten the dome a touch.
    if (ny > 0.35) y -= (ny - 0.35) * 0.014;
    // Chin taper toward the muzzle.
    const chin = smoothstep(-0.3, -0.85, ny) * smoothstep(-0.2, 0.6, nz);
    x *= 1 - 0.14 * chin;
    z *= 1 - 0.08 * chin;
    pos.setXYZ(i, x, y, z);
  }
  applyCountershade(geo, "y", 1, [0.66, 0.54, 0.42], [1, 0.98, 0.94]);
  geo.computeVertexNormals();
  return geo;
}

interface FurMats {
  base: THREE.Material;
  /** Same coat without vertex colors, for geometries that carry none. */
  solid: THREE.Material;
  shells: THREE.Material[];
}

/** Parts without countershading get an all-white color attribute so
 *  vertex-colored materials don't render them black. */
function ensureWhiteColors(geo: THREE.BufferGeometry) {
  if (!geo.attributes.color) {
    const n = geo.attributes.position.count;
    geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(n * 3).fill(1), 3));
  }
  return geo;
}

const SHELL_COUNT = 5;

/** A body part: solid coat plus inflated alpha-strand shells for a furry rim. */
function FurPart({
  geometry,
  mats,
  position,
  rotation,
  scale,
  castShadow = true,
}: {
  geometry: THREE.BufferGeometry;
  mats: FurMats;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number] | number;
  castShadow?: boolean;
}) {
  return (
    <group position={position} rotation={rotation} scale={scale ?? 1}>
      <mesh geometry={geometry} material={mats.base} castShadow={castShadow} />
      {mats.shells.map((m, i) => (
        <mesh key={i} geometry={geometry} material={m} scale={1 + (i + 1) * 0.013} />
      ))}
    </group>
  );
}

export function Singapura() {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const tailA = useRef<THREE.Group>(null);
  const tailB = useRef<THREE.Group>(null);
  const earL = useRef<THREE.Group>(null);
  const earR = useRef<THREE.Group>(null);
  const eyeL = useRef<THREE.Group>(null);
  const eyeR = useRef<THREE.Group>(null);
  const lf = useRef<THREE.Group>(null);
  const rf = useRef<THREE.Group>(null);
  const lb = useRef<THREE.Group>(null);
  const rb = useRef<THREE.Group>(null);

  const [coatTex, irisTex] = useTexture(["/textures/coat_tiled.jpg", "/textures/iris.jpg"]);

  const fur = useMemo<FurMats>(() => {
    const coat = coatTex.clone();
    coat.colorSpace = THREE.SRGBColorSpace;
    coat.wrapS = THREE.RepeatWrapping;
    coat.wrapT = THREE.RepeatWrapping;
    coat.repeat.set(1.9, 1.4);
    coat.anisotropy = 8;
    coat.needsUpdate = true;
    const strand = furStrandTexture();
    const base = new THREE.MeshPhysicalMaterial({
      map: coat,
      bumpMap: strand,
      bumpScale: 0.55,
      color: "#f0e2c2",
      roughness: 0.82,
      metalness: 0,
      vertexColors: true,
      sheen: 1.0,
      sheenColor: new THREE.Color("#efe0bd"),
      sheenRoughness: 0.42,
      envMapIntensity: 0.35,
    });
    const solid = new THREE.MeshPhysicalMaterial({
      map: coat,
      bumpMap: strand,
      bumpScale: 0.55,
      color: "#f0e2c2",
      roughness: 0.82,
      metalness: 0,
      sheen: 1.0,
      sheenColor: new THREE.Color("#efe0bd"),
      sheenRoughness: 0.42,
      envMapIntensity: 0.35,
    });
    const shells = Array.from({ length: SHELL_COUNT }, (_, i) => {
      const m = new THREE.MeshStandardMaterial({
        map: coat,
        alphaMap: strand,
        transparent: true,
        depthWrite: false,
        opacity: 0.5 - i * 0.085,
        alphaTest: 0.04,
        roughness: 0.95,
        color: new THREE.Color().setScalar(0.92 - i * 0.05),
        polygonOffset: true,
        polygonOffsetFactor: -1 - i,
      });
      return m;
    });
    return { base, solid, shells };
  }, [coatTex]);

  const geos = useMemo(
    () => ({
      body: bodyGeometry(),
      head: headGeometry(),
      muzzle: ensureWhiteColors(new THREE.SphereGeometry(0.046, 24, 18)),
      cheek: ensureWhiteColors(new THREE.SphereGeometry(0.036, 18, 14)),
      ruff: ensureWhiteColors(new THREE.SphereGeometry(0.052, 18, 14)),
      pouch: ensureWhiteColors(new THREE.SphereGeometry(0.05, 16, 12)),
      thigh: ensureWhiteColors(new THREE.SphereGeometry(0.055, 18, 14)),
      tailSegA: ensureWhiteColors(new THREE.CapsuleGeometry(0.022, 0.1, 4, 12)),
      tailSegB: ensureWhiteColors(new THREE.CapsuleGeometry(0.0155, 0.078, 4, 12)),
      earOuter: ensureWhiteColors(new THREE.ConeGeometry(0.058, 0.128, 20)),
    }),
    [],
  );

  const dark = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#3d2413", roughness: 0.55 }),
    [],
  );
  const innerEar = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#c08b74",
        roughness: 0.92,
        emissive: "#5c3226",
        emissiveIntensity: 0.12,
      }),
    [],
  );
  const noseMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#b06a52",
        roughness: 0.35,
        clearcoat: 0.7,
        clearcoatRoughness: 0.3,
      }),
    [],
  );
  const pawPadMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#4a2a1a", roughness: 0.5 }),
    [],
  );
  const irisMat = useMemo(() => {
    const iris = irisTex.clone();
    iris.colorSpace = THREE.SRGBColorSpace;
    iris.needsUpdate = true;
    return new THREE.MeshPhysicalMaterial({
      map: iris,
      roughness: 0.1,
      clearcoat: 0.9,
      clearcoatRoughness: 0.12,
      envMapIntensity: 0.8,
    });
  }, [irisTex]);
  const corneaMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#ffffff",
        transparent: true,
        opacity: 0.16,
        roughness: 0.04,
        clearcoat: 1,
        clearcoatRoughness: 0.05,
        envMapIntensity: 1.4,
        depthWrite: false,
      }),
    [],
  );

  const stepPhase = useRef(0);
  const lastStep = useRef(0);
  const airborne = useRef(false);
  const loc = useRef({ x: -0.4, y: 0, z: 0.15, heading: 0.4 });
  const surfaceY = useRef(0);
  const nextBlink = useRef(2.5);
  const blinkUntil = useRef(0);
  const nextEarTwitch = useRef(4);
  const earTwitchAt = useRef(0);

  useFrame((state, dt) => {
    const sim = useSim.getState();
    const group = root.current;
    if (!group) return;
    const t = state.clock.elapsedTime;
    const step = Math.min(dt, 0.05);

    if (sim.held?.id === "cat") {
      loc.current.x = sim.held.position[0];
      loc.current.y = sim.held.position[1];
      loc.current.z = sim.held.position[2];
      group.position.set(loc.current.x, loc.current.y, loc.current.z);
      if (tailA.current) tailA.current.rotation.y = Math.sin(t * 10) * 0.5;
      if (tailB.current) tailB.current.rotation.y = Math.sin(t * 10 + 0.8) * 0.5;
      return;
    }

    const pose = poseFor(sim.behavior);
    const dest = sim.target;
    let { x, z, heading } = loc.current;
    let moving = false;

    if (
      dest &&
      (sim.behavior === "walk" ||
        sim.behavior === "explore" ||
        sim.behavior === "come" ||
        sim.behavior === "hunt" ||
        sim.behavior === "litter" ||
        sim.behavior === "eat" ||
        sim.behavior === "drink" ||
        sim.behavior === "sleep" ||
        sim.behavior === "climb" ||
        sim.behavior === "hide" ||
        sim.behavior === "knock" ||
        sim.behavior === "pounce" ||
        sim.behavior === "accident")
    ) {
      const dx = dest[0] - x;
      const dz = dest[2] - z;
      const dist = Math.hypot(dx, dz);
      const speed =
        sim.behavior === "hunt" || sim.behavior === "pounce" || sim.behavior === "come"
          ? 1.35
          : 0.72;
      if (dist > 0.12) {
        heading = smoothAngle(heading, Math.atan2(dx, dz), Math.min(1, step * 9));
        const stepLen = Math.min(dist, speed * step);
        const res = resolveMove(
          x,
          z,
          x + (dx / dist) * stepLen,
          z + (dz / dist) * stepLen,
          dest,
        );
        x = res.x;
        z = res.z;
        moving = res.moved;
      }
    }

    // Ground: floor, rug, or the furniture she is heading onto.
    const surf = surfaceAt(x, z, dest);
    surfaceY.current = lerp(surfaceY.current, surf, Math.min(1, step * 5));
    let y = surfaceY.current + pose.lift;

    if (sim.behavior === "pounce" || sim.behavior === "climb") {
      y += Math.abs(Math.sin(t * 6)) * 0.18;
      if (!airborne.current) {
        airborne.current = true;
        sounds.play("jump");
      }
    } else if (airborne.current) {
      airborne.current = false;
      sounds.play("land", 0.8);
    }

    loc.current = { x, y, z, heading };
    group.position.set(x, y, z);
    group.rotation.y = heading;
    sim.setPosition(x, z, heading);

    // Body: sit tilt, crouch, and a slow breath.
    const breath = 1 + Math.sin(t * (sim.behavior === "sleep" ? 1.1 : 1.9)) * 0.014;
    if (body.current) {
      body.current.rotation.x = lerp(body.current.rotation.x, pose.sitTilt, 0.08);
      body.current.position.y = -pose.crouch * 0.055;
      body.current.scale.set(1, breath, 1);
    }

    // Diagonal gait.
    const walk = moving ? 1 : 0;
    stepPhase.current += step * (walk ? 10 : 2);
    const swing = Math.sin(stepPhase.current) * 0.55 * walk;
    if (lf.current) lf.current.rotation.x = swing - pose.crouch;
    if (rb.current) rb.current.rotation.x = swing - pose.crouch * 0.8;
    if (rf.current) rf.current.rotation.x = -swing - pose.crouch;
    if (lb.current) lb.current.rotation.x = -swing - pose.crouch * 0.8;

    if (walk && t - lastStep.current > 0.28) {
      lastStep.current = t;
      sounds.play(onRug(x, z) ? "stepRug" : "stepWood", 0.7);
    }

    if (head.current) {
      const look = sim.lookAt;
      if (look) {
        const local = new THREE.Vector3(look[0] - x, look[1] - y, look[2] - z);
        local.applyAxisAngle(new THREE.Vector3(0, 1, 0), -heading);
        head.current.rotation.y = lerp(
          head.current.rotation.y,
          clamp(Math.atan2(local.x, local.z), -0.7, 0.7),
          0.08,
        );
        head.current.rotation.x = lerp(
          head.current.rotation.x,
          clamp(-local.y * 0.15, -0.25, 0.3),
          0.08,
        );
      }
      if (sim.behavior === "groom") head.current.rotation.x = 0.55 + Math.sin(t * 6) * 0.1;
      if (sim.behavior === "sleep") head.current.rotation.x = 0.4;
    }

    // Blink every few seconds.
    if (t > nextBlink.current) {
      blinkUntil.current = t + 0.13;
      nextBlink.current = t + 2.2 + Math.random() * 4.5;
    }
    const eyeScale = t < blinkUntil.current || sim.behavior === "sleep" ? 0.08 : 1;
    if (eyeL.current) eyeL.current.scale.y = lerp(eyeL.current.scale.y, eyeScale, 0.55);
    if (eyeR.current) eyeR.current.scale.y = lerp(eyeR.current.scale.y, eyeScale, 0.55);

    // Occasional single-ear twitch.
    if (t > nextEarTwitch.current) {
      earTwitchAt.current = t;
      nextEarTwitch.current = t + 3 + Math.random() * 6;
    }
    const twitch = Math.max(0, 1 - (t - earTwitchAt.current) * 6);
    const twitchWave = Math.sin(twitch * Math.PI * 3) * twitch * 0.35;
    if (earL.current) earL.current.rotation.z = -0.3 + twitchWave;
    if (earR.current) earR.current.rotation.z = 0.3 - twitchWave * 0.6;

    // Tail: carriage from pose, sway from mood.
    const lash = sim.mood === "irritable" || sim.mood === "overstimulated";
    const swaySpeed = lash ? 9 : sim.mood === "playful" ? 4.5 : 2.2;
    const swayAmp = lash ? 0.5 : sim.mood === "playful" ? 0.45 : 0.16;
    if (tailA.current) {
      tailA.current.rotation.x = lerp(tailA.current.rotation.x, -0.2 - pose.tail * 0.5, 0.08);
      tailA.current.rotation.y = Math.sin(t * swaySpeed) * swayAmp;
    }
    if (tailB.current) {
      tailB.current.rotation.x = lerp(tailB.current.rotation.x, -0.15 - pose.tail * 0.35, 0.08);
      tailB.current.rotation.y = Math.sin(t * swaySpeed + 0.9) * swayAmp * 1.35;
    }

    if (sim.behavior === "pounce" && dest && dist2(x, z, dest[0], dest[2]) < 0.35) {
      sounds.play("bat", 1);
    }
  });

  return (
    <group ref={root} position={[-0.4, 0, 0.15]} scale={1.65} userData={{ grabId: "cat" }}>
      <group ref={body}>
        {/* Sculpted torso: lathe axis runs rump (rear) to neck (front). */}
        <FurPart
          geometry={geos.body}
          mats={fur}
          position={[0, 0.135, -0.205]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[1, 1, 0.86]}
        />
        {/* Chest ruff and the slight primordial pouch of a real cat belly. */}
        <FurPart geometry={geos.ruff} mats={fur} position={[0, 0.13, 0.17]} scale={[0.85, 1.05, 0.75]} />
        <FurPart geometry={geos.pouch} mats={fur} position={[0, 0.055, -0.04]} scale={[0.78, 0.62, 0.85]} castShadow={false} />
      </group>

      <group ref={head} position={[0, 0.215, 0.225]}>
        <FurPart geometry={geos.head} mats={fur} scale={[1.04, 0.94, 0.95]} />
        {/* Cheek fur tufts. */}
        <FurPart geometry={geos.cheek} mats={fur} position={[-0.052, -0.028, 0.038]} scale={[0.8, 0.9, 0.85]} castShadow={false} />
        <FurPart geometry={geos.cheek} mats={fur} position={[0.052, -0.028, 0.038]} scale={[0.8, 0.9, 0.85]} castShadow={false} />
        {/* Muzzle with whisker pads and chin. */}
        <FurPart geometry={geos.muzzle} mats={fur} position={[0, -0.032, 0.06]} scale={[1.15, 0.75, 0.9]} castShadow={false} />
        <mesh material={fur.solid} position={[-0.021, -0.024, 0.086]} scale={[1, 0.8, 0.72]}>
          <sphereGeometry args={[0.02, 14, 10]} />
        </mesh>
        <mesh material={fur.solid} position={[0.021, -0.024, 0.086]} scale={[1, 0.8, 0.72]}>
          <sphereGeometry args={[0.02, 14, 10]} />
        </mesh>
        <mesh material={fur.solid} position={[0, -0.06, 0.056]} scale={[0.85, 0.6, 0.9]}>
          <sphereGeometry args={[0.028, 12, 10]} />
        </mesh>
        {/* Nose leather: salmon-pink, wet sheen, nostril shading, philtrum. */}
        <mesh material={noseMat} position={[0, -0.01, 0.104]} scale={[1.35, 0.72, 0.62]}>
          <sphereGeometry args={[0.013, 14, 10]} />
        </mesh>
        <mesh material={dark} position={[-0.0075, -0.015, 0.108]}>
          <sphereGeometry args={[0.0035, 8, 6]} />
        </mesh>
        <mesh material={dark} position={[0.0075, -0.015, 0.108]}>
          <sphereGeometry args={[0.0035, 8, 6]} />
        </mesh>
        <mesh material={dark} position={[0, -0.03, 0.101]} rotation={[0.25, 0, 0]}>
          <boxGeometry args={[0.0022, 0.022, 0.003]} />
        </mesh>

        <Eye refEl={eyeL} position={[-0.044, 0.012, 0.068]} irisMat={irisMat} corneaMat={corneaMat} linerMat={dark} side={-1} />
        <Eye refEl={eyeR} position={[0.044, 0.012, 0.068]} irisMat={irisMat} corneaMat={corneaMat} linerMat={dark} side={1} />

        {/* Singapura ears are large for the head, deeply cupped. */}
        <group ref={earL} position={[-0.06, 0.084, -0.018]} rotation={[0.12, 0.22, -0.3]}>
          <FurPart geometry={geos.earOuter} mats={fur} scale={[1, 1, 0.5]} />
          <mesh material={innerEar} position={[0, -0.012, 0.017]} scale={[0.72, 0.76, 0.32]}>
            <coneGeometry args={[0.058, 0.128, 20]} />
          </mesh>
        </group>
        <group ref={earR} position={[0.06, 0.084, -0.018]} rotation={[0.12, -0.22, 0.3]}>
          <FurPart geometry={geos.earOuter} mats={fur} scale={[1, 1, 0.5]} />
          <mesh material={innerEar} position={[0, -0.012, 0.017]} scale={[0.72, 0.76, 0.32]}>
            <coneGeometry args={[0.058, 0.128, 20]} />
          </mesh>
        </group>

        <Whiskers side={-1} />
        <Whiskers side={1} />
      </group>

      <Leg refEl={lf} position={[-0.06, 0.118, 0.125]} mats={fur} padMat={pawPadMat} />
      <Leg refEl={rf} position={[0.06, 0.118, 0.125]} mats={fur} padMat={pawPadMat} />
      <Leg refEl={lb} position={[-0.066, 0.128, -0.125]} mats={fur} padMat={pawPadMat} thigh={geos.thigh} back />
      <Leg refEl={rb} position={[0.066, 0.128, -0.125]} mats={fur} padMat={pawPadMat} thigh={geos.thigh} back />

      {/* Two-segment tail, slender, with the breed's blunt dark tip. */}
      <group ref={tailA} position={[0, 0.175, -0.195]}>
        <FurPart geometry={geos.tailSegA} mats={fur} position={[0, 0.035, -0.055]} rotation={[1.15, 0, 0]} />
        <group ref={tailB} position={[0, 0.075, -0.105]}>
          <FurPart geometry={geos.tailSegB} mats={fur} position={[0, 0.03, -0.045]} rotation={[1.1, 0, 0]} />
          <mesh castShadow material={dark} position={[0, 0.062, -0.085]} rotation={[1.1, 0, 0]}>
            <capsuleGeometry args={[0.012, 0.042, 4, 8]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function Eye({
  refEl,
  position,
  irisMat,
  corneaMat,
  linerMat,
  side,
}: {
  refEl: RefObject<THREE.Group | null>;
  position: [number, number, number];
  irisMat: THREE.Material;
  corneaMat: THREE.Material;
  linerMat: THREE.Material;
  side: 1 | -1;
}) {
  return (
    <group ref={refEl} position={position} rotation={[0, side * -0.34, 0]}>
      {/* Socket shadow, photoreal iris, domed cornea, catchlight. */}
      <mesh scale={[1, 0.8, 0.48]}>
        <sphereGeometry args={[0.0315, 22, 16]} />
        <meshStandardMaterial color="#191008" roughness={0.32} />
      </mesh>
      <mesh material={irisMat} position={[0, 0, 0.0155]}>
        <circleGeometry args={[0.0235, 28]} />
      </mesh>
      <mesh material={corneaMat} position={[0, 0, 0.002]} scale={[1, 0.8, 0.52]}>
        <sphereGeometry args={[0.033, 22, 16]} />
      </mesh>
      {/* Dark eyeliner rim the breed is known for. */}
      <mesh material={linerMat} position={[0, 0, 0.012]} scale={[1, 0.8, 1]}>
        <torusGeometry args={[0.0305, 0.0032, 8, 28]} />
      </mesh>
      <mesh position={[0.008, 0.01, 0.021]}>
        <sphereGeometry args={[0.005, 8, 8]} />
        <meshStandardMaterial color="#f3efe4" emissive="#ffffff" emissiveIntensity={0.7} />
      </mesh>
    </group>
  );
}

function Whiskers({ side }: { side: 1 | -1 }) {
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#f6efe0",
        roughness: 0.35,
        transparent: true,
        opacity: 0.9,
      }),
    [],
  );
  // Four mystacial whiskers, tapered and slightly fanned.
  const fans = [-0.5, -0.18, 0.14, 0.44];
  return (
    <group>
      <group position={[side * 0.03, -0.028, 0.09]}>
        {fans.map((tilt, i) => (
          <mesh
            key={i}
            material={material}
            position={[side * 0.048, 0.006 + i * 0.006, 0.008 - i * 0.004]}
            rotation={[tilt * 0.3, side * (Math.PI / 2 + tilt * 0.3), 0]}
          >
            <cylinderGeometry args={[0.00028, 0.0009, 0.105 - i * 0.011, 4]} />
          </mesh>
        ))}
      </group>
      {/* Superciliary (eyebrow) whiskers. */}
      <group position={[side * 0.018, 0.048, 0.07]}>
        {[0.1, 0.35].map((tilt, i) => (
          <mesh
            key={i}
            material={material}
            position={[side * (0.012 + i * 0.008), 0.004 + i * 0.006, 0.004]}
            rotation={[-0.5 - tilt * 0.3, side * (Math.PI / 3 + tilt * 0.2), 0]}
          >
            <cylinderGeometry args={[0.00025, 0.0007, 0.05 - i * 0.008, 4]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Leg({
  refEl,
  position,
  mats,
  padMat,
  thigh,
  back,
}: {
  refEl: RefObject<THREE.Group | null>;
  position: [number, number, number];
  mats: FurMats;
  padMat: THREE.Material;
  thigh?: THREE.BufferGeometry;
  back?: boolean;
}) {
  return (
    <group ref={refEl} position={position}>
      {back && thigh && (
        <FurPart geometry={thigh} mats={mats} position={[0, -0.03, -0.015]} scale={[0.9, 1.2, 1.3]} />
      )}
      {/* Upper and lower leg with a subtle bend. */}
      <mesh castShadow material={mats.solid} position={[0, -0.04, back ? -0.004 : 0]}>
        <capsuleGeometry args={[0.023, back ? 0.045 : 0.055, 4, 10]} />
      </mesh>
      <mesh castShadow material={mats.solid} position={[0, -0.09, 0.004]}>
        <capsuleGeometry args={[0.017, 0.045, 4, 10]} />
      </mesh>
      {/* Paw: elongated, with toe separation and dark beans. */}
      <mesh castShadow material={mats.solid} position={[0, -0.12, 0.014]} scale={[1, 0.52, 1.4]}>
        <sphereGeometry args={[0.024, 14, 10]} />
      </mesh>
      {[-0.013, 0, 0.013].map((tx) => (
        <mesh key={tx} material={mats.solid} position={[tx, -0.128, 0.038]} scale={[1, 0.7, 1.2]}>
          <sphereGeometry args={[0.008, 8, 6]} />
        </mesh>
      ))}
      <mesh material={padMat} position={[0, -0.132, 0.014]} scale={[0.72, 0.28, 0.95]}>
        <sphereGeometry args={[0.017, 10, 8]} />
      </mesh>
    </group>
  );
}

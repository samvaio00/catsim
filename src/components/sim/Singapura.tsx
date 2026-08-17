"use client";

import { useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { clamp, dist2, lerp } from "@/lib/utils";
import { useSim } from "@/lib/sim/store";
import { sounds } from "@/lib/sim/sounds";
import { onRug, resolveMove, surfaceAt } from "@/lib/sim/world";
import { singapuraCoatTexture } from "@/lib/sim/textures";
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

  const coat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        map: singapuraCoatTexture(),
        color: "#cbb28a",
        roughness: 0.82,
        metalness: 0,
        sheen: 0.65,
        sheenColor: new THREE.Color("#ecd9ae"),
        sheenRoughness: 0.55,
      }),
    [],
  );
  const dark = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#4a2e1c", roughness: 0.6 }),
    [],
  );
  const innerEar = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#b97a68", roughness: 0.85 }),
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
    if (earL.current) earL.current.rotation.z = -0.18 + twitchWave;
    if (earR.current) earR.current.rotation.z = 0.18 - twitchWave * 0.6;

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
        {/* Hindquarters, torso, chest — overlapping volumes read as one body. */}
        <mesh castShadow material={coat} position={[0, 0.15, -0.055]} scale={[0.8, 0.84, 1.02]}>
          <sphereGeometry args={[0.15, 24, 18]} />
        </mesh>
        <mesh
          castShadow
          material={coat}
          position={[0, 0.135, 0.03]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[1, 1, 0.82]}
        >
          <capsuleGeometry args={[0.105, 0.2, 6, 18]} />
        </mesh>
        <mesh castShadow material={coat} position={[0, 0.135, 0.13]} scale={[0.76, 0.82, 0.95]}>
          <sphereGeometry args={[0.12, 22, 16]} />
        </mesh>
        {/* Neck ruff. */}
        <mesh castShadow material={coat} position={[0, 0.185, 0.185]} scale={[0.62, 0.72, 0.72]}>
          <sphereGeometry args={[0.1, 18, 14]} />
        </mesh>
      </group>

      <group ref={head} position={[0, 0.235, 0.235]}>
        <mesh castShadow material={coat} scale={[1, 0.92, 0.94]}>
          <sphereGeometry args={[0.088, 24, 18]} />
        </mesh>
        {/* Muzzle and nose. */}
        <mesh castShadow material={coat} position={[0, -0.032, 0.062]} scale={[1.2, 0.82, 1]}>
          <sphereGeometry args={[0.047, 16, 12]} />
        </mesh>
        <mesh material={dark} position={[0, -0.014, 0.108]} scale={[1.25, 0.75, 0.7]}>
          <sphereGeometry args={[0.011, 10, 8]} />
        </mesh>
        {/* Chin. */}
        <mesh material={coat} position={[0, -0.058, 0.062]} scale={[0.8, 0.55, 0.9]}>
          <sphereGeometry args={[0.03, 12, 10]} />
        </mesh>

        <Eye refEl={eyeL} position={[-0.044, 0.016, 0.068]} />
        <Eye refEl={eyeR} position={[0.044, 0.016, 0.068]} />

        {/* Singapura ears are large for the head. */}
        <group ref={earL} position={[-0.052, 0.075, -0.012]} rotation={[0.1, 0, -0.18]}>
          <mesh castShadow material={coat} scale={[1, 1, 0.45]}>
            <coneGeometry args={[0.047, 0.105, 12]} />
          </mesh>
          <mesh material={innerEar} position={[0, -0.008, 0.012]} scale={[0.66, 0.72, 0.3]}>
            <coneGeometry args={[0.047, 0.105, 12]} />
          </mesh>
        </group>
        <group ref={earR} position={[0.052, 0.075, -0.012]} rotation={[0.1, 0, 0.18]}>
          <mesh castShadow material={coat} scale={[1, 1, 0.45]}>
            <coneGeometry args={[0.047, 0.105, 12]} />
          </mesh>
          <mesh material={innerEar} position={[0, -0.008, 0.012]} scale={[0.66, 0.72, 0.3]}>
            <coneGeometry args={[0.047, 0.105, 12]} />
          </mesh>
        </group>

        <Whiskers side={-1} />
        <Whiskers side={1} />
      </group>

      <Leg refEl={lf} position={[-0.062, 0.115, 0.115]} material={coat} dark={dark} />
      <Leg refEl={rf} position={[0.062, 0.115, 0.115]} material={coat} dark={dark} />
      <Leg refEl={lb} position={[-0.068, 0.125, -0.115]} material={coat} dark={dark} back />
      <Leg refEl={rb} position={[0.068, 0.125, -0.115]} material={coat} dark={dark} back />

      {/* Two-segment tail with a darker tip. */}
      <group ref={tailA} position={[0, 0.175, -0.19]}>
        <mesh castShadow material={coat} position={[0, 0.035, -0.055]} rotation={[1.15, 0, 0]}>
          <capsuleGeometry args={[0.023, 0.1, 4, 10]} />
        </mesh>
        <group ref={tailB} position={[0, 0.075, -0.105]}>
          <mesh castShadow material={coat} position={[0, 0.03, -0.045]} rotation={[1.1, 0, 0]}>
            <capsuleGeometry args={[0.017, 0.08, 4, 10]} />
          </mesh>
          <mesh castShadow material={dark} position={[0, 0.062, -0.085]} rotation={[1.1, 0, 0]}>
            <capsuleGeometry args={[0.013, 0.045, 4, 8]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function Eye({
  refEl,
  position,
}: {
  refEl: RefObject<THREE.Group | null>;
  position: [number, number, number];
}) {
  const iris = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#8f9436",
        roughness: 0.15,
        clearcoat: 0.8,
        emissive: "#3a4012",
        emissiveIntensity: 0.35,
      }),
    [],
  );
  return (
    <group ref={refEl} position={position}>
      {/* Almond eye: flattened iris, slit pupil, catchlight. */}
      <mesh material={iris} scale={[1, 0.78, 0.5]} rotation={[0, position[0] < 0 ? 0.35 : -0.35, 0]}>
        <sphereGeometry args={[0.027, 16, 12]} />
      </mesh>
      <mesh position={[0, 0, 0.013]} scale={[0.35, 1, 0.4]}>
        <sphereGeometry args={[0.012, 10, 10]} />
        <meshStandardMaterial color="#120c06" roughness={0.25} />
      </mesh>
      <mesh position={[0.007, 0.008, 0.02]}>
        <sphereGeometry args={[0.005, 8, 8]} />
        <meshStandardMaterial color="#f3efe4" emissive="#ffffff" emissiveIntensity={0.6} />
      </mesh>
    </group>
  );
}

function Whiskers({ side }: { side: 1 | -1 }) {
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#f4ecdc",
        roughness: 0.4,
        transparent: true,
        opacity: 0.85,
      }),
    [],
  );
  return (
    <group position={[side * 0.035, -0.03, 0.095]}>
      {[-0.35, 0, 0.35].map((tilt, i) => (
        <mesh
          key={i}
          material={material}
          position={[side * 0.045, 0.004 + i * 0.007, 0.01 - i * 0.004]}
          rotation={[tilt * 0.35, side * (Math.PI / 2 + tilt * 0.28), 0]}
        >
          <cylinderGeometry args={[0.0008, 0.0008, 0.095 - i * 0.012, 4]} />
        </mesh>
      ))}
    </group>
  );
}

function Leg({
  refEl,
  position,
  material,
  dark,
  back,
}: {
  refEl: RefObject<THREE.Group | null>;
  position: [number, number, number];
  material: THREE.Material;
  dark: THREE.Material;
  back?: boolean;
}) {
  return (
    <group ref={refEl} position={position}>
      {back && (
        <mesh castShadow material={material} position={[0, -0.025, -0.012]} scale={[0.9, 1.15, 1.25]}>
          <sphereGeometry args={[0.05, 14, 12]} />
        </mesh>
      )}
      <mesh castShadow material={material} position={[0, -0.065, 0]}>
        <capsuleGeometry args={[0.024, back ? 0.075 : 0.085, 4, 10]} />
      </mesh>
      <mesh castShadow material={material} position={[0, -0.115, 0.012]} scale={[1, 0.55, 1.4]}>
        <sphereGeometry args={[0.026, 12, 10]} />
      </mesh>
      <mesh material={dark} position={[0, -0.122, 0.012]} scale={[0.7, 0.3, 0.9]}>
        <sphereGeometry args={[0.02, 10, 8]} />
      </mesh>
    </group>
  );
}

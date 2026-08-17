"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { CapsuleCollider, RigidBody, type RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { clamp, dist2, lerp } from "@/lib/utils";
import { registerGrab } from "@/lib/sim/grab";
import { useSim } from "@/lib/sim/store";
import { sounds } from "@/lib/sim/sounds";
import { onRug } from "@/lib/sim/world";
import type { Behavior } from "@/lib/sim/types";

const IVORY = new THREE.Color("#e8d3b0");
const SEAL = new THREE.Color("#5a3a24");

function coatMaterial() {
  const material = new THREE.MeshStandardMaterial({
    color: "#c9a078",
    roughness: 0.82,
    metalness: 0.02,
  });
  material.onBeforeCompile = (shader) => {
      shader.uniforms.ivory = { value: IVORY };
      shader.uniforms.seal = { value: SEAL };
      shader.vertexShader = `
        varying vec3 vPos;
        varying vec3 vN;
        ${shader.vertexShader}
      `.replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
         vPos = position;
         vN = normal;`,
      );
      shader.fragmentShader = `
        uniform vec3 ivory;
        uniform vec3 seal;
        varying vec3 vPos;
        varying vec3 vN;
        ${shader.fragmentShader}
      `.replace(
        "#include <color_fragment>",
        `#include <color_fragment>
         float tick = sin(vPos.y * 72.0 + vPos.x * 18.0 + vPos.z * 14.0);
         float n = fract(sin(dot(vPos.xy, vec2(12.9898, 78.233))) * 43758.5453);
         float mixv = smoothstep(-0.35, 0.55, tick * 0.7 + n * 0.45);
         vec3 coat = mix(ivory, seal, mixv * 0.72);
         float points = smoothstep(0.35, 0.7, vPos.z) * smoothstep(0.12, 0.28, abs(vPos.x));
         coat = mix(coat, seal * 0.85, points * 0.35);
         diffuseColor.rgb *= coat;`,
      );
  };
  return material;
}

function poseFor(behavior: Behavior) {
  switch (behavior) {
    case "sit":
    case "solicit":
      return { bodyY: 0.1, crouch: 0.55, tail: 0.4 };
    case "loaf":
    case "sleep":
      return { bodyY: 0.02, crouch: 0.85, tail: 0.15 };
    case "stretch":
      return { bodyY: 0.08, crouch: 0.2, tail: 0.8 };
    case "groom":
      return { bodyY: 0.09, crouch: 0.6, tail: 0.3 };
    case "pounce":
    case "hunt":
      return { bodyY: 0.12, crouch: 0.35, tail: 0.9 };
    case "climb":
      return { bodyY: 0.16, crouch: 0.15, tail: 0.7 };
    default:
      return { bodyY: 0.16, crouch: 0.05, tail: 0.55 };
  }
}

export function Singapura() {
  const body = useRef<RapierRigidBody>(null);
  const group = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group>(null);
  const lf = useRef<THREE.Group>(null);
  const rf = useRef<THREE.Group>(null);
  const lb = useRef<THREE.Group>(null);
  const rb = useRef<THREE.Group>(null);
  const coat = useMemo(() => coatMaterial(), []);
  const stepPhase = useRef(0);
  const lastStep = useRef(0);
  const airborne = useRef(false);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (body.current) {
        registerGrab("cat", body.current);
        window.clearInterval(id);
      }
    }, 50);
    return () => {
      window.clearInterval(id);
      registerGrab("cat", null);
    };
  }, []);

  useFrame((state, dt) => {
    const sim = useSim.getState();
    const rbod = body.current;
    const root = group.current;
    if (!rbod || !root) return;

    if (sim.held?.id === "cat") {
      rbod.setNextKinematicTranslation({
        x: sim.held.position[0],
        y: sim.held.position[1],
        z: sim.held.position[2],
      });
      if (tail.current) tail.current.rotation.y = Math.sin(state.clock.elapsedTime * 10) * 0.5;
      return;
    }

    const t = state.clock.elapsedTime;
    const pose = poseFor(sim.behavior);
    const dest = sim.target;
    const pos = rbod.translation();
    let heading = sim.heading;
    let moving = false;
    let x = pos.x;
    let z = pos.z;
    let y = pose.bodyY;

    if (dest && (sim.behavior === "walk" || sim.behavior === "explore" || sim.behavior === "come" || sim.behavior === "hunt" || sim.behavior === "litter" || sim.behavior === "eat" || sim.behavior === "drink" || sim.behavior === "sleep" || sim.behavior === "climb" || sim.behavior === "hide" || sim.behavior === "knock" || sim.behavior === "pounce" || sim.behavior === "accident")) {
      const dx = dest[0] - pos.x;
      const dz = dest[2] - pos.z;
      const dist = Math.hypot(dx, dz);
      const speed =
        sim.behavior === "hunt" || sim.behavior === "pounce" || sim.behavior === "come" ? 1.35 : 0.72;
      if (dist > 0.12) {
        moving = true;
        heading = Math.atan2(dx, dz);
        x += (dx / dist) * speed * dt;
        z += (dz / dist) * speed * dt;
      }
    }

    if (sim.behavior === "pounce" || sim.behavior === "climb") {
      y += Math.sin(Math.min(1, t * 6)) * 0.18;
      if (!airborne.current) {
        airborne.current = true;
        sounds.play("jump");
      }
    } else if (airborne.current) {
      airborne.current = false;
      sounds.play("land", 0.8);
    }

    rbod.setNextKinematicTranslation({ x, y, z });
    rbod.setNextKinematicRotation(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), heading));
    sim.setPosition(x, z, heading);

    const walk = moving ? 1 : 0;
    stepPhase.current += dt * (walk ? 10 : 2);
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
        head.current.rotation.y = lerp(head.current.rotation.y, clamp(Math.atan2(local.x, local.z), -0.7, 0.7), 0.08);
        head.current.rotation.x = lerp(head.current.rotation.x, clamp(-local.y * 0.15, -0.25, 0.3), 0.08);
      }
      if (sim.behavior === "groom") head.current.rotation.x = 0.55 + Math.sin(t * 6) * 0.1;
    }

    if (tail.current) {
      tail.current.rotation.x = lerp(tail.current.rotation.x, -0.4 + pose.tail * 0.3, 0.08);
      tail.current.rotation.y = Math.sin(t * (sim.mood === "irritable" ? 8 : 2.2)) * (sim.mood === "playful" ? 0.45 : 0.18);
    }

    root.position.y = Math.sin(t * 2.4) * 0.008;

    if (sim.behavior === "pounce" && dest && dist2(x, z, dest[0], dest[2]) < 0.35) {
      sounds.play("bat", 1);
    }
  });

  return (
    <RigidBody ref={body} type="kinematicPosition" position={[-0.6, 0.16, 0.2]} colliders={false} friction={0.9}>
      <CapsuleCollider args={[0.1, 0.13]} position={[0, 0.12, 0]} />
      <group ref={group} userData={{ grabId: "cat" }}>
        <mesh castShadow material={coat} position={[0, 0.12, 0]} scale={[0.78, 0.72, 1.15]}>
          <sphereGeometry args={[0.16, 18, 14]} />
        </mesh>
        <mesh castShadow material={coat} position={[0, 0.13, 0.12]} scale={[0.7, 0.68, 0.7]}>
          <sphereGeometry args={[0.13, 16, 14]} />
        </mesh>
        <group ref={head} position={[0, 0.2, 0.22]}>
          <mesh castShadow material={coat} scale={[0.92, 0.82, 0.88]}>
            <sphereGeometry args={[0.11, 16, 14]} />
          </mesh>
          <mesh position={[-0.055, 0.12, -0.01]} rotation={[0.15, 0, -0.25]} material={coat}>
            <coneGeometry args={[0.055, 0.1, 6]} />
          </mesh>
          <mesh position={[0.055, 0.12, -0.01]} rotation={[0.15, 0, 0.25]} material={coat}>
            <coneGeometry args={[0.055, 0.1, 6]} />
          </mesh>
          <mesh position={[-0.038, 0.03, 0.088]}>
            <sphereGeometry args={[0.028, 12, 10]} />
            <meshStandardMaterial color="#2a1a10" />
          </mesh>
          <mesh position={[0.038, 0.03, 0.088]}>
            <sphereGeometry args={[0.028, 12, 10]} />
            <meshStandardMaterial color="#2a1a10" />
          </mesh>
          <mesh position={[-0.034, 0.036, 0.11]}>
            <sphereGeometry args={[0.008, 8, 8]} />
            <meshStandardMaterial color="#f3efe4" emissive="#ffffff" emissiveIntensity={0.2} />
          </mesh>
          <mesh position={[0.042, 0.036, 0.11]}>
            <sphereGeometry args={[0.008, 8, 8]} />
            <meshStandardMaterial color="#f3efe4" emissive="#ffffff" emissiveIntensity={0.2} />
          </mesh>
          <mesh position={[0, -0.01, 0.108]}>
            <sphereGeometry args={[0.014, 8, 8]} />
            <meshStandardMaterial color="#d27a62" />
          </mesh>
          <mesh position={[-0.03, 0.045, 0.09]} rotation={[0, 0, 0.4]}>
            <boxGeometry args={[0.03, 0.006, 0.002]} />
            <meshStandardMaterial color="#3d2416" />
          </mesh>
          <mesh position={[0.03, 0.045, 0.09]} rotation={[0, 0, -0.4]}>
            <boxGeometry args={[0.03, 0.006, 0.002]} />
            <meshStandardMaterial color="#3d2416" />
          </mesh>
        </group>
        <Leg refEl={lf} position={[-0.07, 0.08, 0.1]} material={coat} />
        <Leg refEl={rf} position={[0.07, 0.08, 0.1]} material={coat} />
        <Leg refEl={lb} position={[-0.07, 0.08, -0.12]} material={coat} back />
        <Leg refEl={rb} position={[0.07, 0.08, -0.12]} material={coat} back />
        <group ref={tail} position={[0, 0.16, -0.2]}>
          <mesh castShadow material={coat} position={[0, 0.02, -0.08]} rotation={[1.1, 0, 0]}>
            <capsuleGeometry args={[0.022, 0.16, 4, 8]} />
          </mesh>
          <mesh castShadow material={coat} position={[0, 0.08, -0.18]} rotation={[0.7, 0, 0]}>
            <capsuleGeometry args={[0.016, 0.1, 4, 8]} />
          </mesh>
        </group>
      </group>
    </RigidBody>
  );
}

function Leg({
  refEl,
  position,
  material,
  back,
}: {
  refEl: RefObject<THREE.Group | null>;
  position: [number, number, number];
  material: THREE.Material;
  back?: boolean;
}) {
  return (
    <group ref={refEl} position={position}>
      <mesh castShadow material={material} position={[0, -0.07, 0]}>
        <capsuleGeometry args={[0.028, back ? 0.09 : 0.08, 4, 8]} />
      </mesh>
      <mesh position={[0, -0.13, 0.01]}>
        <sphereGeometry args={[0.022, 8, 8]} />
        <meshStandardMaterial color="#3a2416" />
      </mesh>
    </group>
  );
}

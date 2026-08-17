"use client";

import { useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { clamp, dist2, lerp } from "@/lib/utils";
import { useSim } from "@/lib/sim/store";
import { sounds } from "@/lib/sim/sounds";
import { onRug } from "@/lib/sim/world";
import type { Behavior } from "@/lib/sim/types";

function coatMaterial() {
  return new THREE.MeshStandardMaterial({
    color: "#c4a06e",
    roughness: 0.78,
    metalness: 0.04,
  });
}

function poseFor(behavior: Behavior) {
  switch (behavior) {
    case "sit":
    case "solicit":
      return { bodyY: 0.12, crouch: 0.55, tail: 0.4 };
    case "loaf":
    case "sleep":
      return { bodyY: 0.05, crouch: 0.85, tail: 0.15 };
    case "stretch":
      return { bodyY: 0.1, crouch: 0.2, tail: 0.8 };
    case "groom":
      return { bodyY: 0.11, crouch: 0.6, tail: 0.3 };
    case "pounce":
    case "hunt":
      return { bodyY: 0.14, crouch: 0.35, tail: 0.9 };
    case "climb":
      return { bodyY: 0.2, crouch: 0.15, tail: 0.7 };
    default:
      return { bodyY: 0.18, crouch: 0.05, tail: 0.55 };
  }
}

export function Singapura() {
  const root = useRef<THREE.Group>(null);
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
  const loc = useRef({ x: -0.4, y: 0.18, z: 0.15, heading: 0.4 });

  useFrame((state, dt) => {
    const sim = useSim.getState();
    const group = root.current;
    if (!group) return;

    if (sim.held?.id === "cat") {
      loc.current.x = sim.held.position[0];
      loc.current.y = sim.held.position[1];
      loc.current.z = sim.held.position[2];
      group.position.set(loc.current.x, loc.current.y, loc.current.z);
      if (tail.current) tail.current.rotation.y = Math.sin(state.clock.elapsedTime * 10) * 0.5;
      return;
    }

    const t = state.clock.elapsedTime;
    const pose = poseFor(sim.behavior);
    const dest = sim.target;
    let { x, z, heading } = loc.current;
    let y = pose.bodyY;
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
        sim.behavior === "hunt" || sim.behavior === "pounce" || sim.behavior === "come" ? 1.35 : 0.72;
      if (dist > 0.12) {
        moving = true;
        heading = Math.atan2(dx, dz);
        x += (dx / dist) * speed * dt;
        z += (dz / dist) * speed * dt;
      }
    }

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
        head.current.rotation.y = lerp(
          head.current.rotation.y,
          clamp(Math.atan2(local.x, local.z), -0.7, 0.7),
          0.08,
        );
        head.current.rotation.x = lerp(head.current.rotation.x, clamp(-local.y * 0.15, -0.25, 0.3), 0.08);
      }
      if (sim.behavior === "groom") head.current.rotation.x = 0.55 + Math.sin(t * 6) * 0.1;
    }

    if (tail.current) {
      tail.current.rotation.x = lerp(tail.current.rotation.x, -0.4 + pose.tail * 0.3, 0.08);
      tail.current.rotation.y = Math.sin(t * (sim.mood === "irritable" ? 8 : 2.2)) * (sim.mood === "playful" ? 0.45 : 0.18);
    }

    if (sim.behavior === "pounce" && dest && dist2(x, z, dest[0], dest[2]) < 0.35) {
      sounds.play("bat", 1);
    }
  });

  return (
    <group ref={root} position={[-0.4, 0.18, 0.15]} scale={1.65} userData={{ grabId: "cat" }}>
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
          <meshStandardMaterial color="#f3efe4" emissive="#ffffff" emissiveIntensity={0.25} />
        </mesh>
        <mesh position={[0.042, 0.036, 0.11]}>
          <sphereGeometry args={[0.008, 8, 8]} />
          <meshStandardMaterial color="#f3efe4" emissive="#ffffff" emissiveIntensity={0.25} />
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

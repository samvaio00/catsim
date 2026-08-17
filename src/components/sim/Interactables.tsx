"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, type RapierRigidBody } from "@react-three/rapier";
import { registerGrab, type GrabId } from "@/lib/sim/grab";
import { useSim } from "@/lib/sim/store";
import { sounds } from "@/lib/sim/sounds";

function impactSound(kind: "bounce" | "ceramic" | "plastic" | "cushion" | "woodHit", mag: number) {
  if (mag < 1.6) return;
  sounds.play(kind, Math.min(1.4, mag / 12));
}

function useGrabRef(id: GrabId) {
  const ref = useRef<RapierRigidBody>(null);
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (ref.current) {
        registerGrab(id, ref.current);
        window.clearInterval(timer);
      }
    }, 50);
    return () => {
      window.clearInterval(timer);
      registerGrab(id, null);
    };
  }, [id]);
  return ref;
}

export function Interactables() {
  const knockToken = useSim((s) => s.knockToken);
  const lastKnock = useRef(0);
  const mug = useGrabRef("mug");
  const remote = useGrabRef("remote");
  const ball = useGrabRef("ball");
  const mouse = useGrabRef("mouse");
  const cushion = useGrabRef("cushion");

  useFrame(() => {
    if (knockToken !== lastKnock.current) {
      lastKnock.current = knockToken;
      const body = Math.random() < 0.5 ? mug.current : remote.current;
      body?.applyImpulse({ x: (Math.random() - 0.5) * 0.08, y: 0.04, z: 0.06 }, true);
      sounds.play("bat", 0.9);
    }
  });

  return (
    <group>
      <RigidBody
        ref={ball}
        position={[0.7, 0.2, -0.2]}
        colliders="ball"
        restitution={0.72}
        friction={0.35}
        mass={0.08}
        onContactForce={(e) => impactSound("bounce", e.totalForceMagnitude)}
      >
        <mesh castShadow userData={{ grabId: "ball" }}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshStandardMaterial color="#d85a3a" roughness={0.4} />
        </mesh>
      </RigidBody>

      <RigidBody
        ref={mouse}
        position={[-0.8, 0.12, 0.4]}
        colliders="hull"
        mass={0.05}
        friction={0.6}
        onContactForce={(e) => impactSound("plastic", e.totalForceMagnitude)}
      >
        <group userData={{ grabId: "mouse" }}>
          <mesh castShadow>
            <capsuleGeometry args={[0.035, 0.08, 6, 10]} />
            <meshStandardMaterial color="#6b6f74" />
          </mesh>
          <mesh position={[0.06, 0.01, 0]} rotation={[0, 0, 0.4]}>
            <cylinderGeometry args={[0.004, 0.004, 0.08, 6]} />
            <meshStandardMaterial color="#c9b48a" />
          </mesh>
        </group>
      </RigidBody>

      <RigidBody
        ref={mug}
        position={[0.42, 0.48, 0.72]}
        colliders="hull"
        mass={0.2}
        friction={0.4}
        onContactForce={(e) => impactSound("ceramic", e.totalForceMagnitude)}
      >
        <group userData={{ grabId: "mug" }}>
          <mesh castShadow>
            <cylinderGeometry args={[0.045, 0.04, 0.09, 14]} />
            <meshStandardMaterial color="#f2efe8" roughness={0.25} />
          </mesh>
          <mesh position={[0.055, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.028, 0.007, 8, 14]} />
            <meshStandardMaterial color="#f2efe8" />
          </mesh>
        </group>
      </RigidBody>

      <RigidBody
        ref={remote}
        position={[-0.05, 0.44, 0.95]}
        colliders="cuboid"
        mass={0.12}
        friction={0.5}
        onContactForce={(e) => impactSound("plastic", e.totalForceMagnitude)}
      >
        <mesh castShadow userData={{ grabId: "remote" }}>
          <boxGeometry args={[0.14, 0.025, 0.045]} />
          <meshStandardMaterial color="#2b2d31" />
        </mesh>
      </RigidBody>

      <RigidBody
        ref={cushion}
        position={[-1.7, 0.28, 0.55]}
        colliders="cuboid"
        mass={0.18}
        friction={0.8}
        onContactForce={(e) => impactSound("cushion", e.totalForceMagnitude)}
      >
        <mesh castShadow userData={{ grabId: "cushion" }}>
          <boxGeometry args={[0.28, 0.1, 0.28]} />
          <meshStandardMaterial color="#b56a4a" roughness={0.95} />
        </mesh>
      </RigidBody>

      <Messes />
      <PlayWand />
    </group>
  );
}

function Messes() {
  const messes = useSim((s) => s.messes);
  const cleanMess = useSim((s) => s.cleanMess);
  return (
    <group>
      {messes.map((mess) => (
        <group key={mess.id} position={mess.position} userData={{ care: `mess:${mess.id}` }}>
          <mesh
            userData={{ care: `mess:${mess.id}` }}
            onClick={(e) => {
              e.stopPropagation();
              cleanMess(mess.id);
            }}
          >
            <sphereGeometry args={[mess.type === "fur" ? 0.05 : 0.07, 8, 8]} />
            <meshStandardMaterial
              color={
                mess.type === "accident"
                  ? "#c9b56a"
                  : mess.type === "kibble"
                    ? "#6a4420"
                    : mess.type === "water"
                      ? "#8ec4d8"
                      : mess.type === "litter-scatter"
                        ? "#d9c48a"
                        : "#d8c8b0"
              }
            />
          </mesh>
          <mesh userData={{ care: `mess:${mess.id}` }} position={[0, 0.02, 0]}>
            <sphereGeometry args={[0.16, 8, 8]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function PlayWand() {
  const playSession = useSim((s) => s.playSession);
  const prey = useSim((s) => s.prey);
  if (!playSession || !prey) return null;
  return (
    <group position={[prey[0], 0.18, prey[2]]}>
      <mesh>
        <sphereGeometry args={[0.035, 10, 10]} />
        <meshStandardMaterial color="#c43b2a" emissive="#c43b2a" emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.5, 6]} />
        <meshStandardMaterial color="#2c2118" />
      </mesh>
    </group>
  );
}

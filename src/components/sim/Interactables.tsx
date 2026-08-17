"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CapsuleCollider, CuboidCollider, RigidBody, type RapierRigidBody } from "@react-three/rapier";
import { registerGrab, type GrabId } from "@/lib/sim/grab";
import { useSim } from "@/lib/sim/store";
import { sounds } from "@/lib/sim/sounds";
import { ROOM, surfaceAt } from "@/lib/sim/world";

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

/**
 * Fixed colliders matching the furniture in LivingRoom so toys rest on the
 * floor, rug, table and sofa instead of falling through the world.
 * One fixed body with many explicit cuboids — cheap and exact.
 */
function RoomColliders() {
  const W = ROOM.size.x;
  const D = ROOM.size.z;
  // [cx, cy, cz, halfX, halfY, halfZ]
  const boxes: [number, number, number, number, number, number][] = [
    [0, -0.1, 0, W / 2, 0.1, D / 2], // floor
    [ROOM.rug[0], 0.016, ROOM.rug[2], 1.8, 0.016, 1.3], // rug
    [0, 1.35, -D / 2 - 0.07, W / 2 + 0.2, 1.45, 0.07], // walls
    [0, 1.35, D / 2 + 0.07, W / 2 + 0.2, 1.45, 0.07],
    [-W / 2 - 0.07, 1.35, 0, 0.07, 1.45, D / 2 + 0.2],
    [W / 2 + 0.07, 1.35, 0, 0.07, 1.45, D / 2 + 0.2],
    [0.2, 0.26, 2.42, 1.35, 0.26, 0.49], // sofa
    [-2.4, 0.25, 0.85, 0.46, 0.25, 0.45], // armchair
    [0.25, 0.22, 0.8, 0.6, 0.22, 0.32], // coffee table
    [-0.05, 0.25, -2.95, 0.8, 0.25, 0.2], // tv stand
    [-3.65, 0.775, -0.15, 0.36, 0.775, 0.15], // bookshelf
    [-3.3, 0.3, -2.2, 0.32, 0.3, 0.32], // cat tree base + mid
    [-3.3, 0.9, -2.2, 0.25, 0.31, 0.25], // cat tree condo + top
    [-2.55, 0.85, -0.35, 0.1, 0.85, 0.1], // lamp
    [-3.0, 0.1, -1.5, 0.15, 0.1, 0.15], // plant
    [ROOM.litter[0], 0.06, ROOM.litter[2], 0.29, 0.06, 0.21], // litter
    [ROOM.food[0], 0.035, ROOM.food[2], 0.16, 0.035, 0.16], // food bowl
    [ROOM.water[0], 0.035, ROOM.water[2], 0.15, 0.035, 0.15], // water bowl
  ];
  return (
    <RigidBody type="fixed" colliders={false} friction={0.8}>
      {boxes.map(([x, y, z, hx, hy, hz], i) => (
        <CuboidCollider key={i} args={[hx, hy, hz]} position={[x, y, z]} />
      ))}
    </RigidBody>
  );
}

/**
 * The cat as a kinematic body: her scripted movement drives the collider, so
 * walking into the ball nudges it and being carried can sweep things aside.
 */
function CatBody() {
  const ref = useGrabRef("cat");
  useFrame(() => {
    const body = ref.current;
    if (!body) return;
    const sim = useSim.getState();
    if (sim.held?.id === "cat") return; // hand drives it via moveHold
    const [x, , z] = sim.position;
    const y = surfaceAt(x, z, sim.target) + 0.17;
    body.setNextKinematicTranslation({ x, y, z });
  });
  return (
    <RigidBody
      ref={ref}
      type="kinematicPosition"
      colliders={false}
      position={[-0.4, 0.17, 0.15]}
      enabledRotations={[false, false, false]}
    >
      <CapsuleCollider args={[0.08, 0.13]} />
    </RigidBody>
  );
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
      // Shove it off the coffee table toward the room.
      body?.applyImpulse(
        { x: (Math.random() - 0.5) * 0.09, y: 0.05, z: -0.09 - Math.random() * 0.05 },
        true,
      );
      sounds.play("bat", 0.9);
    }
  });

  return (
    <group>
      <RoomColliders />
      <CatBody />

      <RigidBody
        ref={ball}
        position={[0.7, 0.3, -0.2]}
        colliders="ball"
        restitution={0.72}
        friction={0.35}
        mass={0.08}
        onContactForce={(e) => impactSound("bounce", e.totalForceMagnitude)}
      >
        <mesh castShadow userData={{ grabId: "ball" }}>
          <sphereGeometry args={[0.07, 20, 20]} />
          <meshStandardMaterial color="#d85a3a" roughness={0.4} />
        </mesh>
      </RigidBody>

      <RigidBody
        ref={mouse}
        position={[-0.8, 0.2, 0.4]}
        colliders="hull"
        mass={0.05}
        friction={0.6}
        onContactForce={(e) => impactSound("plastic", e.totalForceMagnitude)}
      >
        <group userData={{ grabId: "mouse" }}>
          <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.032, 0.07, 6, 12]} />
            <meshStandardMaterial color="#6b6f74" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.02, 0]} scale={[1, 0.6, 1.3]}>
            <sphereGeometry args={[0.03, 10, 8]} />
            <meshStandardMaterial color="#7c8085" roughness={0.85} />
          </mesh>
          <mesh position={[-0.09, 0.005, 0]} rotation={[0, 0, 1.2]}>
            <cylinderGeometry args={[0.003, 0.003, 0.09, 6]} />
            <meshStandardMaterial color="#c9b48a" roughness={0.9} />
          </mesh>
        </group>
      </RigidBody>

      <RigidBody
        ref={mug}
        position={[0.55, 0.56, 0.72]}
        colliders="hull"
        mass={0.2}
        friction={0.4}
        onContactForce={(e) => impactSound("ceramic", e.totalForceMagnitude)}
      >
        <group userData={{ grabId: "mug" }}>
          <mesh castShadow>
            <cylinderGeometry args={[0.045, 0.04, 0.1, 16]} />
            <meshStandardMaterial color="#f2efe8" roughness={0.2} />
          </mesh>
          <mesh position={[0.055, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.026, 0.007, 8, 16]} />
            <meshStandardMaterial color="#f2efe8" roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.045, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.012, 14]} />
            <meshStandardMaterial color="#4a2c18" roughness={0.35} />
          </mesh>
        </group>
      </RigidBody>

      <RigidBody
        ref={remote}
        position={[-0.05, 0.52, 0.95]}
        colliders="cuboid"
        mass={0.12}
        friction={0.5}
        onContactForce={(e) => impactSound("plastic", e.totalForceMagnitude)}
      >
        <group userData={{ grabId: "remote" }}>
          <mesh castShadow>
            <boxGeometry args={[0.15, 0.028, 0.05]} />
            <meshStandardMaterial color="#24262a" roughness={0.45} />
          </mesh>
          <mesh position={[0, 0.016, 0]}>
            <boxGeometry args={[0.11, 0.006, 0.032]} />
            <meshStandardMaterial color="#3a3d42" roughness={0.5} />
          </mesh>
        </group>
      </RigidBody>

      <RigidBody
        ref={cushion}
        position={[-0.6, 0.66, 2.32]}
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
  return (
    <group>
      {messes.map((mess) => (
        <group key={mess.id} position={mess.position} userData={{ care: `mess:${mess.id}` }}>
          <mesh userData={{ care: `mess:${mess.id}` }} scale={[1, 0.35, 1]}>
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

"use client";

import { RigidBody } from "@react-three/rapier";
import { useSim } from "@/lib/sim/store";
import { ROOM } from "@/lib/sim/world";

function Box({
  args,
  position,
  color,
  roughness = 0.7,
  metalness = 0,
}: {
  args: [number, number, number];
  position: [number, number, number];
  color: string;
  roughness?: number;
  metalness?: number;
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
    </mesh>
  );
}

function StaticBox({
  args,
  position,
  color,
  roughness = 0.75,
}: {
  args: [number, number, number];
  position: [number, number, number];
  color: string;
  roughness?: number;
}) {
  return (
    <RigidBody type="fixed" colliders="cuboid" position={position} friction={0.9}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={args} />
        <meshStandardMaterial color={color} roughness={roughness} />
      </mesh>
    </RigidBody>
  );
}

export function LivingRoom() {
  const foodBowl = useSim((s) => s.foodBowl);
  const waterBowl = useSim((s) => s.waterBowl);
  const litterDirt = useSim((s) => s.litterDirt);
  const refillFood = useSim((s) => s.refillFood);
  const refillWater = useSim((s) => s.refillWater);
  const scoopLitter = useSim((s) => s.scoopLitter);

  return (
    <group>
      <hemisphereLight args={["#f3e6c8", "#6b5344", 0.55]} />
      <directionalLight
        castShadow
        position={[4.2, 6.4, 2.2]}
        intensity={1.35}
        color="#fff1d0"
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={18}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />
      <pointLight position={[-1.8, 2.1, 1.4]} intensity={0.35} color="#ffd7a1" />

      <RigidBody type="fixed" colliders="cuboid" friction={0.85} position={[0, -0.1, 0]}>
        <mesh receiveShadow userData={{ floor: true }}>
          <boxGeometry args={[ROOM.size.x, 0.2, ROOM.size.z]} />
          <meshStandardMaterial color="#8a5a36" roughness={0.55} />
        </mesh>
      </RigidBody>

      <mesh position={[0.1, 0.012, 0.15]} receiveShadow userData={{ floor: true }}>
        <boxGeometry args={[3.4, 0.02, 2.5]} />
        <meshStandardMaterial color="#7a3d32" roughness={0.95} />
      </mesh>

      <StaticBox args={[ROOM.size.x, 2.6, 0.12]} position={[0, 1.3, -ROOM.size.z / 2]} color="#efe4d2" />
      <StaticBox args={[ROOM.size.x, 2.6, 0.12]} position={[0, 1.3, ROOM.size.z / 2]} color="#efe4d2" />
      <StaticBox args={[0.12, 2.6, ROOM.size.z]} position={[-ROOM.size.x / 2, 1.3, 0]} color="#f2e8d8" />
      <StaticBox args={[0.12, 2.6, ROOM.size.z]} position={[ROOM.size.x / 2, 1.3, 0]} color="#f2e8d8" />

      <mesh position={[0, 2.62, 0]} receiveShadow>
        <boxGeometry args={[ROOM.size.x, 0.08, ROOM.size.z]} />
        <meshStandardMaterial color="#f7f0e4" roughness={0.9} />
      </mesh>

      <group position={[3.95, 1.45, 0.2]}>
        <mesh>
          <boxGeometry args={[0.06, 1.5, 1.7]} />
          <meshStandardMaterial color="#cfe6ff" transparent opacity={0.28} roughness={0.05} metalness={0.2} />
        </mesh>
        <mesh position={[0.05, 0, 0]}>
          <boxGeometry args={[0.04, 1.56, 1.76]} />
          <meshStandardMaterial color="#d8c4a4" />
        </mesh>
      </group>
      <mesh position={[3.2, 0.01, 0.35]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.4, 2.1]} />
        <meshStandardMaterial color="#ffe9b0" transparent opacity={0.22} />
      </mesh>

      <StaticBox args={[2.5, 0.42, 0.92]} position={[0.15, 0.21, 2.45]} color="#5c3d2e" />
      <StaticBox args={[2.5, 0.38, 0.18]} position={[0.15, 0.58, 2.82]} color="#6b4634" />
      <StaticBox args={[0.18, 0.42, 0.9]} position={[-1.02, 0.58, 2.45]} color="#6b4634" />
      <StaticBox args={[0.18, 0.42, 0.9]} position={[1.32, 0.58, 2.45]} color="#6b4634" />
      <mesh position={[0.15, 0.46, 2.4]} castShadow>
        <boxGeometry args={[2.2, 0.12, 0.7]} />
        <meshStandardMaterial color="#8d5a44" roughness={0.9} />
      </mesh>

      <StaticBox args={[0.86, 0.38, 0.86]} position={[-2.35, 0.19, 0.9]} color="#4e3a2c" />
      <mesh position={[-2.35, 0.46, 0.78]} castShadow>
        <boxGeometry args={[0.82, 0.16, 0.7]} />
        <meshStandardMaterial color="#7d5340" roughness={0.92} />
      </mesh>
      <StaticBox args={[0.16, 0.42, 0.82]} position={[-2.35, 0.58, 1.24]} color="#5a4030" />

      <StaticBox args={[1.15, 0.08, 0.62]} position={[0.2, 0.36, 0.85]} color="#3d2a20" />
      <RigidBody type="fixed" colliders="cuboid" position={[0.2, 0.16, 0.85]}>
        <mesh castShadow>
          <boxGeometry args={[0.08, 0.32, 0.08]} />
          <meshStandardMaterial color="#2f2118" />
        </mesh>
      </RigidBody>

      <StaticBox args={[1.5, 0.48, 0.38]} position={[-0.1, 0.24, -2.95]} color="#2a2420" />
      <mesh position={[-0.1, 0.72, -2.95]}>
        <boxGeometry args={[1.15, 0.62, 0.06]} />
        <meshStandardMaterial color="#1a1c20" />
      </mesh>
      <mesh position={[-0.1, 0.72, -2.94]}>
        <planeGeometry args={[1.05, 0.52]} />
        <meshStandardMaterial color="#6d8aa8" emissive="#243044" emissiveIntensity={0.2} />
      </mesh>

      <StaticBox args={[0.7, 1.5, 0.28]} position={[-3.7, 0.75, -0.2]} color="#5a4032" />
      {[-0.45, 0, 0.45].map((y) => (
        <Box key={y} args={[0.62, 0.04, 0.24]} position={[-3.7, 0.42 + y + 0.5, -0.2]} color="#6b4b3a" />
      ))}

      <group position={[-2.6, 0, -0.15]}>
        <mesh position={[0, 0.95, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.05, 1.9, 10]} />
          <meshStandardMaterial color="#d8c39a" />
        </mesh>
        <mesh position={[0, 1.88, 0]}>
          <sphereGeometry args={[0.16, 12, 12]} />
          <meshStandardMaterial color="#fff4d2" emissive="#ffd27a" emissiveIntensity={0.4} />
        </mesh>
      </group>

      <group position={ROOM.catTree}>
        <RigidBody type="fixed" colliders="cuboid" position={[0, -0.55, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.09, 0.09, 1.15, 10]} />
            <meshStandardMaterial color="#c4a882" roughness={1} />
          </mesh>
        </RigidBody>
        <StaticBox args={[0.55, 0.06, 0.55]} position={[0, 0.05, 0]} color="#6a4a36" />
        <StaticBox args={[0.48, 0.06, 0.48]} position={[0.05, 0.55, 0]} color="#6a4a36" />
        <mesh position={[0.02, 0.28, 0.18]} castShadow>
          <boxGeometry args={[0.32, 0.28, 0.08]} />
          <meshStandardMaterial color="#8d6a4a" />
        </mesh>
      </group>

      <group position={ROOM.food} userData={{ care: "food" }}>
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          userData={{ care: "food" }}
          onClick={(e) => {
            e.stopPropagation();
            refillFood();
          }}
        >
          <cylinderGeometry args={[0.13, 0.16, 0.05, 20]} />
          <meshStandardMaterial color="#d7d0c6" roughness={0.3} metalness={0.15} />
        </mesh>
        <mesh position={[0, 0.03, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.03, 16]} />
          <meshStandardMaterial color={foodBowl > 8 ? "#6b4a28" : "#d7d0c6"} />
        </mesh>
        <mesh
          position={[0.32, 0.08, 0.02]}
          castShadow
          userData={{ care: "food" }}
          onClick={(e) => {
            e.stopPropagation();
            refillFood();
          }}
        >
          <boxGeometry args={[0.16, 0.2, 0.1]} />
          <meshStandardMaterial color="#c45c2a" />
        </mesh>
      </group>

      <group position={ROOM.water} userData={{ care: "water" }}>
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          userData={{ care: "water" }}
          onClick={(e) => {
            e.stopPropagation();
            refillWater();
          }}
        >
          <cylinderGeometry args={[0.12, 0.15, 0.05, 20]} />
          <meshStandardMaterial color="#cfd8de" roughness={0.25} metalness={0.2} />
        </mesh>
        <mesh position={[0, 0.03, 0]}>
          <cylinderGeometry args={[0.09, 0.09, 0.025, 16]} />
          <meshStandardMaterial
            color={waterBowl > 8 ? "#7eb6d4" : "#cfd8de"}
            transparent
            opacity={waterBowl > 8 ? 0.65 : 1}
          />
        </mesh>
      </group>

      <group
        position={ROOM.litter}
        userData={{ care: "litter" }}
        onClick={(e) => {
          e.stopPropagation();
          scoopLitter();
        }}
      >
        <StaticBox args={[0.55, 0.08, 0.4]} position={[0, 0.02, 0]} color="#ece4d4" />
        <mesh position={[0, 0.06, 0]}>
          <boxGeometry args={[0.48, 0.05, 0.34]} />
          <meshStandardMaterial color={litterDirt > 55 ? "#9a8458" : "#e6d7a8"} />
        </mesh>
      </group>
    </group>
  );
}

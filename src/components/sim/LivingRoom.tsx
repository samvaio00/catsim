"use client";

import { useSim } from "@/lib/sim/store";
import { ROOM } from "@/lib/sim/world";

function Box({
  args,
  position,
  color,
  roughness = 0.75,
  metalness = 0,
  rotation,
  userData,
}: {
  args: [number, number, number];
  position: [number, number, number];
  color: string;
  roughness?: number;
  metalness?: number;
  rotation?: [number, number, number];
  userData?: Record<string, unknown>;
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow userData={userData}>
      <boxGeometry args={args} />
      <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
    </mesh>
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
      <hemisphereLight args={["#fff4dd", "#6a4a38", 0.85]} />
      <ambientLight intensity={0.35} color="#f3e6d0" />
      <directionalLight
        castShadow
        position={[3.8, 5.8, 1.6]}
        intensity={1.8}
        color="#fff3d2"
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={16}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />
      <pointLight position={[3.4, 1.6, 0.3]} intensity={0.8} color="#ffe7a8" />
      <pointLight position={[-1.6, 1.9, 1.2]} intensity={0.45} color="#ffd7a1" />

      <mesh position={[0, -0.1, 0]} receiveShadow userData={{ floor: true }}>
        <boxGeometry args={[ROOM.size.x, 0.2, ROOM.size.z]} />
        <meshStandardMaterial color="#9a6238" roughness={0.45} />
      </mesh>
      {[-3, -1.5, 0, 1.5, 3].map((x) => (
        <mesh key={x} position={[x, 0.002, 0]} receiveShadow userData={{ floor: true }}>
          <boxGeometry args={[0.04, 0.002, ROOM.size.z]} />
          <meshStandardMaterial color="#7d4d2c" />
        </mesh>
      ))}

      <mesh position={[0.1, 0.015, 0.2]} receiveShadow userData={{ floor: true }}>
        <boxGeometry args={[3.6, 0.03, 2.6]} />
        <meshStandardMaterial color="#8b2e28" roughness={0.95} />
      </mesh>
      <mesh position={[0.1, 0.02, 0.2]} receiveShadow>
        <boxGeometry args={[3.2, 0.02, 2.2]} />
        <meshStandardMaterial color="#6f241f" roughness={1} />
      </mesh>

      <Box args={[ROOM.size.x, 2.7, 0.14]} position={[0, 1.35, -ROOM.size.z / 2]} color="#f3e6cf" />
      <Box args={[ROOM.size.x, 2.7, 0.14]} position={[0, 1.35, ROOM.size.z / 2]} color="#efe0c6" />
      <Box args={[0.14, 2.7, ROOM.size.z]} position={[-ROOM.size.x / 2, 1.35, 0]} color="#f6ead4" />
      <Box args={[0.14, 2.7, ROOM.size.z]} position={[ROOM.size.x / 2, 1.35, 0]} color="#f6ead4" />
      <Box args={[ROOM.size.x, 0.1, ROOM.size.z]} position={[0, 2.7, 0]} color="#fff6e8" roughness={0.95} />
      <Box args={[ROOM.size.x, 0.12, 0.12]} position={[0, 2.55, ROOM.size.z / 2 - 0.12]} color="#e8d3b0" />
      <Box args={[ROOM.size.x, 0.12, 0.12]} position={[0, 0.18, ROOM.size.z / 2 - 0.12]} color="#e8d3b0" />

      <group position={[ROOM.size.x / 2 - 0.12, 1.45, 0.15]}>
        <Box args={[0.05, 1.7, 2.1]} position={[0, 0, 0]} color="#d7b58a" />
        <mesh position={[-0.04, 0, 0]}>
          <boxGeometry args={[0.04, 1.46, 1.86]} />
          <meshStandardMaterial color="#b9dfff" transparent opacity={0.35} roughness={0.05} metalness={0.15} />
        </mesh>
        <Box args={[0.08, 1.72, 0.08]} position={[-0.02, 0, 0]} color="#c9a36e" />
      </group>
      <mesh position={[2.9, 0.02, 0.15]} rotation={[-Math.PI / 2, 0, 0.1]}>
        <planeGeometry args={[1.8, 2.4]} />
        <meshStandardMaterial color="#ffe29a" transparent opacity={0.28} />
      </mesh>

      <Box args={[2.7, 0.46, 0.98]} position={[0.2, 0.23, 2.42]} color="#5a3828" />
      <Box args={[2.7, 0.42, 0.16]} position={[0.2, 0.64, 2.84]} color="#6d4432" />
      <Box args={[0.16, 0.5, 0.96]} position={[-1.08, 0.64, 2.42]} color="#6d4432" />
      <Box args={[0.16, 0.5, 0.96]} position={[1.48, 0.64, 2.42]} color="#6d4432" />
      <Box args={[2.35, 0.16, 0.72]} position={[0.2, 0.5, 2.35]} color="#a45d45" roughness={0.92} />
      <Box args={[0.42, 0.22, 0.42]} position={[-0.7, 0.58, 2.3]} color="#c46a4a" roughness={0.95} />
      <Box args={[0.42, 0.22, 0.42]} position={[1.05, 0.58, 2.3]} color="#d8c4a0" roughness={0.95} />

      <Box args={[0.92, 0.4, 0.9]} position={[-2.4, 0.2, 0.85]} color="#4a3224" />
      <Box args={[0.86, 0.18, 0.72]} position={[-2.4, 0.48, 0.72]} color="#8a5340" roughness={0.92} />
      <Box args={[0.16, 0.48, 0.86]} position={[-2.4, 0.62, 1.2]} color="#5a4030" />

      <Box args={[1.2, 0.08, 0.64]} position={[0.25, 0.38, 0.8]} color="#3a2418" />
      <Box args={[0.08, 0.3, 0.08]} position={[0.25, 0.16, 0.8]} color="#2a1a12" />
      <Box args={[0.22, 0.04, 0.28]} position={[-0.15, 0.43, 0.72]} color="#1b1d22" />
      <mesh position={[0.55, 0.48, 0.72]}>
        <cylinderGeometry args={[0.05, 0.04, 0.1, 14]} />
        <meshStandardMaterial color="#f4efe6" roughness={0.2} />
      </mesh>

      <Box args={[1.6, 0.5, 0.4]} position={[-0.05, 0.25, -2.95]} color="#2c2620" />
      <Box args={[1.22, 0.68, 0.06]} position={[-0.05, 0.78, -2.94]} color="#111318" />
      <mesh position={[-0.05, 0.78, -2.9]}>
        <planeGeometry args={[1.1, 0.56]} />
        <meshStandardMaterial color="#7ea0c4" emissive="#3a5a7a" emissiveIntensity={0.35} />
      </mesh>

      <Box args={[0.72, 1.55, 0.3]} position={[-3.65, 0.78, -0.15]} color="#6a4532" />
      {[-0.4, 0.05, 0.5].map((y) => (
        <Box key={y} args={[0.64, 0.05, 0.26]} position={[-3.65, 0.55 + y, -0.15]} color="#7d5640" />
      ))}
      <Box args={[0.18, 0.22, 0.14]} position={[-3.65, 1.15, -0.12]} color="#c45c3a" />
      <Box args={[0.14, 0.2, 0.12]} position={[-3.52, 0.72, -0.1]} color="#3d6b8a" />

      <mesh position={[-1.2, 1.7, ROOM.size.z / 2 - 0.1]}>
        <boxGeometry args={[0.7, 0.5, 0.04]} />
        <meshStandardMaterial color="#d8c08a" />
      </mesh>
      <mesh position={[-1.2, 1.7, ROOM.size.z / 2 - 0.13]}>
        <planeGeometry args={[0.58, 0.38]} />
        <meshStandardMaterial color="#6b8f6a" />
      </mesh>
      <mesh position={[1.35, 1.75, ROOM.size.z / 2 - 0.1]}>
        <boxGeometry args={[0.5, 0.62, 0.04]} />
        <meshStandardMaterial color="#d8c08a" />
      </mesh>
      <mesh position={[1.35, 1.75, ROOM.size.z / 2 - 0.13]}>
        <planeGeometry args={[0.38, 0.5]} />
        <meshStandardMaterial color="#c47a4a" />
      </mesh>

      <group position={[-2.55, 0, -0.35]}>
        <mesh position={[0, 0.95, 0]} castShadow>
          <cylinderGeometry args={[0.045, 0.055, 1.9, 10]} />
          <meshStandardMaterial color="#e2c89a" />
        </mesh>
        <mesh position={[0, 1.9, 0]}>
          <sphereGeometry args={[0.2, 14, 14]} />
          <meshStandardMaterial color="#fff6d6" emissive="#ffd27a" emissiveIntensity={0.55} />
        </mesh>
      </group>

      <group position={[-3.2, 0, -2.15]}>
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.16, 0.13, 0.16, 12]} />
          <meshStandardMaterial color="#8a4a32" />
        </mesh>
        <mesh position={[0, 0.38, 0]} castShadow>
          <sphereGeometry args={[0.28, 12, 10]} />
          <meshStandardMaterial color="#2f6b3a" />
        </mesh>
        <mesh position={[0.12, 0.55, 0.05]}>
          <sphereGeometry args={[0.16, 10, 8]} />
          <meshStandardMaterial color="#3d7d44" />
        </mesh>
      </group>

      <group position={ROOM.catTree}>
        <mesh position={[0, 0.15, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 1.3, 10]} />
          <meshStandardMaterial color="#c9ad86" roughness={1} />
        </mesh>
        <Box args={[0.62, 0.07, 0.62]} position={[0, 0.04, 0]} color="#6a4a36" />
        <Box args={[0.52, 0.07, 0.52]} position={[0.06, 0.62, 0]} color="#6a4a36" />
        <Box args={[0.36, 0.3, 0.1]} position={[0.02, 0.32, 0.2]} color="#8d6a4a" />
      </group>

      <group position={ROOM.food} userData={{ care: "food" }}>
        <mesh
          userData={{ care: "food" }}
          onClick={(e) => {
            e.stopPropagation();
            refillFood();
          }}
        >
          <cylinderGeometry args={[0.14, 0.17, 0.06, 20]} />
          <meshStandardMaterial color="#e8e0d4" roughness={0.3} metalness={0.15} />
        </mesh>
        <mesh position={[0, 0.03, 0]}>
          <cylinderGeometry args={[0.11, 0.11, 0.03, 16]} />
          <meshStandardMaterial color={foodBowl > 8 ? "#6b4a28" : "#e8e0d4"} />
        </mesh>
        <Box
          args={[0.18, 0.22, 0.12]}
          position={[0.34, 0.11, 0.02]}
          color="#d85a28"
          userData={{ care: "food" }}
        />
      </group>

      <group position={ROOM.water} userData={{ care: "water" }}>
        <mesh
          userData={{ care: "water" }}
          onClick={(e) => {
            e.stopPropagation();
            refillWater();
          }}
        >
          <cylinderGeometry args={[0.13, 0.16, 0.06, 20]} />
          <meshStandardMaterial color="#d5e2ea" roughness={0.25} metalness={0.2} />
        </mesh>
        <mesh position={[0, 0.03, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.03, 16]} />
          <meshStandardMaterial
            color={waterBowl > 8 ? "#6eb8d8" : "#d5e2ea"}
            transparent
            opacity={waterBowl > 8 ? 0.7 : 1}
          />
        </mesh>
      </group>

      <mesh position={[0.85, 0.08, -0.15]} castShadow userData={{ grabId: "ball" }}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#e24b2e" roughness={0.35} />
      </mesh>
      <mesh position={[-0.7, 0.06, 0.35]} rotation={[0, 0.4, 0.2]} castShadow userData={{ grabId: "mouse" }}>
        <capsuleGeometry args={[0.04, 0.09, 6, 10]} />
        <meshStandardMaterial color="#5c6166" />
      </mesh>

      <group
        position={ROOM.litter}
        userData={{ care: "litter" }}
        onClick={(e) => {
          e.stopPropagation();
          scoopLitter();
        }}
      >
        <Box args={[0.58, 0.1, 0.42]} position={[0, 0.04, 0]} color="#f2eadc" userData={{ care: "litter" }} />
        <Box
          args={[0.5, 0.06, 0.36]}
          position={[0, 0.08, 0]}
          color={litterDirt > 55 ? "#9a8458" : "#e8d7a4"}
          userData={{ care: "litter" }}
        />
      </group>
    </group>
  );
}

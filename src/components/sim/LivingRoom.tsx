"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { RoundedBox } from "@react-three/drei";
import { useSim } from "@/lib/sim/store";
import { ROOM } from "@/lib/sim/world";
import {
  artTexture,
  fabricTexture,
  plasterTexture,
  rugTexture,
  sisalTexture,
  woodFloorTexture,
} from "@/lib/sim/textures";

export function LivingRoom() {
  const foodBowl = useSim((s) => s.foodBowl);
  const waterBowl = useSim((s) => s.waterBowl);
  const litterDirt = useSim((s) => s.litterDirt);

  const mats = useMemo(
    () => ({
      floor: new THREE.MeshStandardMaterial({
        map: woodFloorTexture(),
        roughness: 0.55,
        metalness: 0.05,
      }),
      plaster: new THREE.MeshStandardMaterial({ map: plasterTexture(), roughness: 0.95 }),
      rug: new THREE.MeshStandardMaterial({ map: rugTexture(), roughness: 0.98 }),
      sofa: new THREE.MeshStandardMaterial({
        map: fabricTexture("#7a4a34", "sofa", 21),
        roughness: 0.96,
      }),
      sofaCushion: new THREE.MeshStandardMaterial({
        map: fabricTexture("#a4603f", "sofaCushion", 22),
        roughness: 0.97,
      }),
      chair: new THREE.MeshStandardMaterial({
        map: fabricTexture("#4f3a2c", "chair", 23),
        roughness: 0.96,
      }),
      chairCushion: new THREE.MeshStandardMaterial({
        map: fabricTexture("#8a5340", "chairCushion", 24),
        roughness: 0.97,
      }),
      darkWood: new THREE.MeshStandardMaterial({ color: "#4a3020", roughness: 0.5 }),
      walnut: new THREE.MeshStandardMaterial({ color: "#6b4a30", roughness: 0.45 }),
      trim: new THREE.MeshStandardMaterial({ color: "#e8d3b0", roughness: 0.8 }),
      sisal: new THREE.MeshStandardMaterial({ map: sisalTexture(), roughness: 1 }),
      carpet: new THREE.MeshStandardMaterial({
        map: fabricTexture("#6a4a36", "treeCarpet", 25),
        roughness: 1,
      }),
      ceramic: new THREE.MeshStandardMaterial({ color: "#f2efe8", roughness: 0.25 }),
    }),
    [],
  );

  return (
    <group>
      {/* --- Lighting: late-afternoon sun through the window, warm lamp. --- */}
      <hemisphereLight args={["#fff4dd", "#6a4a38", 0.7]} />
      <ambientLight intensity={0.3} color="#f3e6d0" />
      <directionalLight
        castShadow
        position={[4.6, 4.4, 1.2]}
        intensity={2.1}
        color="#ffe9bd"
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={18}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-bias={-0.0004}
      />
      <pointLight position={[-2.55, 1.55, -0.35]} intensity={5} distance={6} decay={2} color="#ffcf8e" />
      <pointLight position={[3.2, 1.7, 0.3]} intensity={2.5} distance={7} decay={2} color="#ffe7a8" />

      {/* --- Floor and rug --- */}
      <mesh position={[0, -0.1, 0]} receiveShadow userData={{ floor: true }} material={mats.floor}>
        <boxGeometry args={[ROOM.size.x, 0.2, ROOM.size.z]} />
      </mesh>
      <mesh
        position={[ROOM.rug[0], 0.016, ROOM.rug[2]]}
        receiveShadow
        userData={{ floor: true }}
        material={mats.rug}
      >
        <boxGeometry args={[3.6, 0.032, 2.6]} />
      </mesh>

      {/* --- Walls, ceiling, baseboards --- */}
      <mesh position={[0, 1.35, -ROOM.size.z / 2]} receiveShadow material={mats.plaster}>
        <boxGeometry args={[ROOM.size.x, 2.7, 0.14]} />
      </mesh>
      <mesh position={[0, 1.35, ROOM.size.z / 2]} receiveShadow material={mats.plaster}>
        <boxGeometry args={[ROOM.size.x, 2.7, 0.14]} />
      </mesh>
      <mesh position={[-ROOM.size.x / 2, 1.35, 0]} receiveShadow material={mats.plaster}>
        <boxGeometry args={[0.14, 2.7, ROOM.size.z]} />
      </mesh>
      <mesh position={[ROOM.size.x / 2, 1.35, 0]} receiveShadow material={mats.plaster}>
        <boxGeometry args={[0.14, 2.7, ROOM.size.z]} />
      </mesh>
      <mesh position={[0, 2.7, 0]}>
        <boxGeometry args={[ROOM.size.x, 0.1, ROOM.size.z]} />
        <meshStandardMaterial color="#f6eedd" roughness={0.95} />
      </mesh>
      {[
        [0, 0.09, -ROOM.size.z / 2 + 0.09, ROOM.size.x, 0.18, 0.05],
        [0, 0.09, ROOM.size.z / 2 - 0.09, ROOM.size.x, 0.18, 0.05],
        [-ROOM.size.x / 2 + 0.09, 0.09, 0, 0.05, 0.18, ROOM.size.z],
        [ROOM.size.x / 2 - 0.09, 0.09, 0, 0.05, 0.18, ROOM.size.z],
      ].map(([x, y, z, w, h, d], i) => (
        <mesh key={i} position={[x, y, z]} material={mats.trim}>
          <boxGeometry args={[w, h, d]} />
        </mesh>
      ))}

      {/* --- Window with muntins, sky, and a sun patch on the floor --- */}
      <group position={[ROOM.size.x / 2 - 0.1, 1.5, 0.15]}>
        <mesh material={mats.trim}>
          <boxGeometry args={[0.06, 1.8, 2.2]} />
        </mesh>
        <mesh position={[-0.045, 0, 0]}>
          <boxGeometry args={[0.03, 1.56, 1.96]} />
          <meshStandardMaterial color="#bfe0f4" emissive="#a8cfe8" emissiveIntensity={0.8} roughness={0.1} />
        </mesh>
        {[-0.49, 0, 0.49].map((z) => (
          <mesh key={z} position={[-0.05, 0, z]} material={mats.trim}>
            <boxGeometry args={[0.04, 1.56, 0.045]} />
          </mesh>
        ))}
        <mesh position={[-0.05, 0, 0]} material={mats.trim}>
          <boxGeometry args={[0.04, 0.045, 1.96]} />
        </mesh>
        <mesh position={[-0.08, -0.95, 0]} material={mats.trim}>
          <boxGeometry args={[0.14, 0.05, 2.3]} />
        </mesh>
      </group>
      <mesh position={[2.95, 0.034, 0.2]} rotation={[-Math.PI / 2, 0, 0.12]}>
        <planeGeometry args={[1.7, 2.3]} />
        <meshStandardMaterial color="#ffdf94" transparent opacity={0.3} depthWrite={false} />
      </mesh>

      {/* --- Sofa: base, arms, back, seat + back cushions, throw pillows --- */}
      <group position={[0.2, 0, 2.42]}>
        <RoundedBox args={[2.7, 0.42, 0.98]} radius={0.05} smoothness={3} position={[0, 0.21, 0]} castShadow receiveShadow material={mats.sofa} />
        <RoundedBox args={[2.7, 0.5, 0.2]} radius={0.06} smoothness={3} position={[0, 0.62, 0.4]} castShadow material={mats.sofa} />
        <RoundedBox args={[0.2, 0.34, 0.98]} radius={0.06} smoothness={3} position={[-1.25, 0.55, 0]} castShadow material={mats.sofa} />
        <RoundedBox args={[0.2, 0.34, 0.98]} radius={0.06} smoothness={3} position={[1.25, 0.55, 0]} castShadow material={mats.sofa} />
        {[-0.82, 0, 0.82].map((x) => (
          <RoundedBox key={x} args={[0.78, 0.15, 0.72]} radius={0.06} smoothness={3} position={[x, 0.475, -0.06]} castShadow receiveShadow material={mats.sofaCushion} />
        ))}
        {[-0.82, 0, 0.82].map((x) => (
          <RoundedBox key={x} args={[0.78, 0.4, 0.16]} radius={0.07} smoothness={3} position={[x, 0.66, 0.28]} rotation={[-0.12, 0, 0]} castShadow material={mats.sofaCushion} />
        ))}
        <RoundedBox args={[0.36, 0.36, 0.12]} radius={0.06} smoothness={3} position={[-1.0, 0.68, 0.22]} rotation={[-0.2, 0, 0.35]} castShadow>
          <meshStandardMaterial map={fabricTexture("#c4703f", "pillow1", 26)} roughness={0.97} />
        </RoundedBox>
        <RoundedBox args={[0.36, 0.36, 0.12]} radius={0.06} smoothness={3} position={[1.02, 0.68, 0.22]} rotation={[-0.2, 0, -0.3]} castShadow>
          <meshStandardMaterial map={fabricTexture("#d8c4a0", "pillow2", 27)} roughness={0.97} />
        </RoundedBox>
      </group>

      {/* --- Armchair --- */}
      <group position={[-2.4, 0, 0.85]} rotation={[0, 0.35, 0]}>
        <RoundedBox args={[0.92, 0.38, 0.9]} radius={0.05} smoothness={3} position={[0, 0.19, 0]} castShadow receiveShadow material={mats.chair} />
        <RoundedBox args={[0.92, 0.52, 0.18]} radius={0.06} smoothness={3} position={[0, 0.6, 0.36]} castShadow material={mats.chair} />
        <RoundedBox args={[0.16, 0.3, 0.9]} radius={0.06} smoothness={3} position={[-0.4, 0.52, 0]} castShadow material={mats.chair} />
        <RoundedBox args={[0.16, 0.3, 0.9]} radius={0.06} smoothness={3} position={[0.4, 0.52, 0]} castShadow material={mats.chair} />
        <RoundedBox args={[0.66, 0.14, 0.66]} radius={0.06} smoothness={3} position={[0, 0.44, -0.02]} castShadow receiveShadow material={mats.chairCushion} />
        <RoundedBox args={[0.66, 0.36, 0.14]} radius={0.07} smoothness={3} position={[0, 0.6, 0.26]} rotation={[-0.12, 0, 0]} castShadow material={mats.chairCushion} />
      </group>

      {/* --- Coffee table: wood top, lower shelf, tapered legs --- */}
      <group position={[0.25, 0, 0.8]}>
        <mesh position={[0, 0.415, 0]} castShadow receiveShadow material={mats.walnut}>
          <boxGeometry args={[1.2, 0.05, 0.64]} />
        </mesh>
        <mesh position={[0, 0.14, 0]} castShadow material={mats.darkWood}>
          <boxGeometry args={[1.0, 0.03, 0.5]} />
        </mesh>
        {[
          [-0.54, -0.26],
          [0.54, -0.26],
          [-0.54, 0.26],
          [0.54, 0.26],
        ].map(([x, z]) => (
          <mesh key={`${x}${z}`} position={[x, 0.195, z]} castShadow material={mats.darkWood}>
            <cylinderGeometry args={[0.025, 0.035, 0.39, 10]} />
          </mesh>
        ))}
      </group>

      {/* --- TV console and screen --- */}
      <group position={[-0.05, 0, -2.95]}>
        <RoundedBox args={[1.6, 0.5, 0.4]} radius={0.03} smoothness={2} position={[0, 0.25, 0]} castShadow receiveShadow material={mats.darkWood} />
        <mesh position={[0, 0.26, 0.21]}>
          <boxGeometry args={[0.68, 0.34, 0.02]} />
          <meshStandardMaterial color="#241a10" roughness={0.4} />
        </mesh>
        <group position={[0, 0.86, 0.05]}>
          <RoundedBox args={[1.3, 0.74, 0.05]} radius={0.015} smoothness={2} castShadow>
            <meshStandardMaterial color="#101216" roughness={0.3} metalness={0.4} />
          </RoundedBox>
          <mesh position={[0, 0, 0.028]}>
            <planeGeometry args={[1.22, 0.66]} />
            <meshStandardMaterial color="#20344a" emissive="#33507a" emissiveIntensity={0.5} roughness={0.15} metalness={0.3} />
          </mesh>
          <mesh position={[0, -0.45, -0.04]} material={mats.darkWood}>
            <boxGeometry args={[0.3, 0.16, 0.06]} />
          </mesh>
        </group>
      </group>

      {/* --- Bookshelf with real books --- */}
      <group position={[-3.65, 0, -0.15]}>
        <RoundedBox args={[0.72, 1.55, 0.3]} radius={0.02} smoothness={2} position={[0, 0.775, 0]} castShadow receiveShadow material={mats.walnut} />
        {[0.32, 0.78, 1.22].map((y, shelf) => (
          <group key={y} position={[0, y, 0.02]}>
            <mesh material={mats.darkWood}>
              <boxGeometry args={[0.64, 0.03, 0.26]} />
            </mesh>
            {[-0.24, -0.14, -0.05, 0.05, 0.15, 0.24].map((x, i) => {
              const h = 0.16 + ((shelf * 7 + i * 3) % 5) * 0.025;
              const colors = ["#a4502e", "#3d6b8a", "#8a7a3a", "#5d3a54", "#2e5d43", "#b08a3a"];
              return (
                <mesh key={i} position={[x, 0.02 + h / 2, 0]} castShadow rotation={[0, 0, i === 5 && shelf === 1 ? 0.22 : 0]}>
                  <boxGeometry args={[0.07, h, 0.18]} />
                  <meshStandardMaterial color={colors[(shelf + i) % colors.length]} roughness={0.85} />
                </mesh>
              );
            })}
          </group>
        ))}
      </group>

      {/* --- Framed prints on the sofa wall --- */}
      <group position={[-1.2, 1.72, ROOM.size.z / 2 - 0.1]}>
        <mesh material={mats.walnut}>
          <boxGeometry args={[0.72, 0.52, 0.035]} />
        </mesh>
        <mesh position={[0, 0, -0.022]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[0.6, 0.4]} />
          <meshStandardMaterial map={artTexture("leaves")} roughness={0.9} />
        </mesh>
      </group>
      <group position={[1.35, 1.78, ROOM.size.z / 2 - 0.1]}>
        <mesh material={mats.walnut}>
          <boxGeometry args={[0.52, 0.64, 0.035]} />
        </mesh>
        <mesh position={[0, 0, -0.022]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[0.4, 0.52]} />
          <meshStandardMaterial map={artTexture("sunset")} roughness={0.9} />
        </mesh>
      </group>

      {/* --- Floor lamp with drum shade --- */}
      <group position={[-2.55, 0, -0.35]}>
        <mesh position={[0, 0.02, 0]} castShadow material={mats.darkWood}>
          <cylinderGeometry args={[0.16, 0.18, 0.04, 16]} />
        </mesh>
        <mesh position={[0, 0.85, 0]} castShadow material={mats.darkWood}>
          <cylinderGeometry args={[0.02, 0.02, 1.66, 8]} />
        </mesh>
        <mesh position={[0, 1.68, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.24, 0.26, 18, 1, true]} />
          <meshStandardMaterial color="#e8d4a8" roughness={0.9} side={THREE.DoubleSide} emissive="#ffca7a" emissiveIntensity={0.12} />
        </mesh>
      </group>

      {/* --- Potted plant --- */}
      <group position={[-3.0, 0, -1.5]}>
        <mesh position={[0, 0.1, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.11, 0.2, 14]} />
          <meshStandardMaterial color="#9a5238" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.19, 0]}>
          <cylinderGeometry args={[0.13, 0.13, 0.03, 14]} />
          <meshStandardMaterial color="#3a2818" roughness={1} />
        </mesh>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const a = (i / 6) * Math.PI * 2;
          const lean = 0.35 + (i % 3) * 0.14;
          return (
            <group key={i} rotation={[0, a, 0]}>
              <mesh position={[0, 0.42, 0]} rotation={[lean, 0, 0]} castShadow>
                <cylinderGeometry args={[0.006, 0.009, 0.5, 6]} />
                <meshStandardMaterial color="#3d5a2e" roughness={0.9} />
              </mesh>
              <mesh
                position={[0, 0.52 + (i % 3) * 0.09, 0.24 + (i % 2) * 0.08]}
                rotation={[lean + 0.9, 0, 0]}
                scale={[0.5, 1, 0.12]}
                castShadow
              >
                <sphereGeometry args={[0.14, 10, 8]} />
                <meshStandardMaterial color={i % 2 ? "#2f6b3a" : "#3d7d44"} roughness={0.75} />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* --- Cat tree: carpeted platforms, sisal post, hidey condo --- */}
      <group position={[-3.3, 0, -2.2]}>
        <mesh position={[0, 0.025, 0]} castShadow receiveShadow material={mats.carpet}>
          <boxGeometry args={[0.64, 0.05, 0.64]} />
        </mesh>
        <mesh position={[-0.14, 0.32, -0.14]} castShadow material={mats.sisal}>
          <cylinderGeometry args={[0.055, 0.055, 0.58, 12]} />
        </mesh>
        <mesh position={[0, 0.6, 0]} castShadow receiveShadow material={mats.carpet}>
          <boxGeometry args={[0.52, 0.05, 0.52]} />
        </mesh>
        <RoundedBox args={[0.4, 0.34, 0.4]} radius={0.03} smoothness={2} position={[0.08, 0.82, 0.08]} castShadow material={mats.carpet} />
        <mesh position={[0.08, 0.78, 0.285]}>
          <cylinderGeometry args={[0.09, 0.09, 0.02, 16]} />
          <meshStandardMaterial color="#241812" roughness={1} />
        </mesh>
        <mesh position={[0.16, 0.95, 0.16]} castShadow material={mats.sisal}>
          <cylinderGeometry args={[0.05, 0.05, 0.56, 12]} />
        </mesh>
        <mesh position={[0, 1.2, 0]} castShadow receiveShadow material={mats.carpet}>
          <boxGeometry args={[0.5, 0.05, 0.5]} />
        </mesh>
      </group>

      {/* --- Food station --- */}
      <group position={ROOM.food} userData={{ care: "food" }}>
        <mesh userData={{ care: "food" }} castShadow material={mats.ceramic}>
          <cylinderGeometry args={[0.14, 0.17, 0.07, 24]} />
        </mesh>
        <mesh position={[0, 0.026, 0]} userData={{ care: "food" }}>
          <cylinderGeometry args={[0.11, 0.11, 0.032, 20]} />
          <meshStandardMaterial color={foodBowl > 8 ? "#6b4a28" : "#d8d0c2"} roughness={0.7} />
        </mesh>
        {/* Kibble bag */}
        <group position={[0.36, 0, 0.04]} userData={{ care: "food" }}>
          <RoundedBox args={[0.2, 0.3, 0.12]} radius={0.02} smoothness={2} position={[0, 0.15, 0]} castShadow userData={{ care: "food" }}>
            <meshStandardMaterial color="#d85a28" roughness={0.6} />
          </RoundedBox>
          <mesh position={[0, 0.16, 0.062]} userData={{ care: "food" }}>
            <planeGeometry args={[0.13, 0.16]} />
            <meshStandardMaterial color="#f4e8d4" roughness={0.7} />
          </mesh>
        </group>
      </group>

      {/* --- Water bowl --- */}
      <group position={ROOM.water} userData={{ care: "water" }}>
        <mesh userData={{ care: "water" }} castShadow>
          <cylinderGeometry args={[0.13, 0.16, 0.07, 24]} />
          <meshStandardMaterial color="#c4d4de" roughness={0.25} metalness={0.25} />
        </mesh>
        <mesh position={[0, 0.026, 0]} userData={{ care: "water" }}>
          <cylinderGeometry args={[0.105, 0.105, 0.032, 20]} />
          <meshPhysicalMaterial
            color={waterBowl > 8 ? "#5ea8cc" : "#c4d4de"}
            transparent
            opacity={waterBowl > 8 ? 0.75 : 1}
            roughness={0.1}
            clearcoat={0.6}
          />
        </mesh>
      </group>

      {/* --- Litter box --- */}
      <group position={ROOM.litter} userData={{ care: "litter" }}>
        <RoundedBox args={[0.58, 0.14, 0.42]} radius={0.03} smoothness={2} position={[0, 0.06, 0]} castShadow userData={{ care: "litter" }}>
          <meshStandardMaterial color="#e8e0d0" roughness={0.6} />
        </RoundedBox>
        <mesh position={[0, 0.115, 0]} userData={{ care: "litter" }}>
          <boxGeometry args={[0.5, 0.04, 0.34]} />
          <meshStandardMaterial color={litterDirt > 55 ? "#9a8458" : "#e0cd9c"} roughness={1} />
        </mesh>
      </group>
    </group>
  );
}

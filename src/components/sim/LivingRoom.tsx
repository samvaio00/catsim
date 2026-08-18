"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Environment, Lightformer, RoundedBox, useTexture } from "@react-three/drei";
import { useSim } from "@/lib/sim/store";
import { ROOM } from "@/lib/sim/world";
import {
  aoBlobTexture,
  artTexture,
  fabricTexture,
  litterTexture,
  plasterTexture,
  rugTexture,
  sisalTexture,
} from "@/lib/sim/textures";

/** Deterministic pseudo-random generator (kept pure for render safety). */
function seededRand(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Fake ambient-occlusion blob grounding a piece of furniture. */
function AoBlob({
  position,
  size,
  opacity = 0.55,
}: {
  position: [number, number, number];
  size: [number, number];
  opacity?: number;
}) {
  const tex = useMemo(() => aoBlobTexture(), []);
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
      <planeGeometry args={size} />
      <meshBasicMaterial map={tex} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  );
}

/** One gathered curtain panel: a half-cylinder shell that reads as draped cloth. */
function Curtain({
  position,
  material,
  flip,
}: {
  position: [number, number, number];
  material: THREE.Material;
  flip?: boolean;
}) {
  return (
    <group position={position} rotation={[0, flip ? Math.PI : 0, 0]}>
      <mesh castShadow material={material}>
        <cylinderGeometry args={[0.1, 0.13, 1.78, 14, 6, true, -0.6, 1.9]} />
      </mesh>
      {/* Tieback pinch */}
      <mesh material={material} position={[0.01, -0.35, 0.06]} scale={[0.55, 0.08, 0.55]}>
        <sphereGeometry args={[0.1, 10, 8]} />
      </mesh>
    </group>
  );
}

export function LivingRoom() {
  const foodBowl = useSim((s) => s.foodBowl);
  const waterBowl = useSim((s) => s.waterBowl);
  const litterDirt = useSim((s) => s.litterDirt);
  const woodTex = useTexture("/textures/wood_floor.jpg");

  const mats = useMemo(() => {
    const wood = woodTex.clone();
    wood.colorSpace = THREE.SRGBColorSpace;
    wood.wrapS = THREE.RepeatWrapping;
    wood.wrapT = THREE.RepeatWrapping;
    wood.repeat.set(2.2, 1.7);
    wood.anisotropy = 8;
    wood.needsUpdate = true;
    const woodRough = woodTex.clone();
    woodRough.colorSpace = THREE.NoColorSpace;
    woodRough.wrapS = THREE.RepeatWrapping;
    woodRough.wrapT = THREE.RepeatWrapping;
    woodRough.repeat.set(2.2, 1.7);
    woodRough.needsUpdate = true;
    return {
      floor: new THREE.MeshPhysicalMaterial({
        map: wood,
        roughnessMap: woodRough,
        roughness: 0.9,
        metalness: 0,
        clearcoat: 0.14,
        clearcoatRoughness: 0.5,
        envMapIntensity: 0.5,
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
      darkWood: new THREE.MeshStandardMaterial({ color: "#4a3020", roughness: 0.5, envMapIntensity: 0.3 }),
      walnut: new THREE.MeshStandardMaterial({ color: "#6b4a30", roughness: 0.45, envMapIntensity: 0.3 }),
      trim: new THREE.MeshStandardMaterial({ color: "#e8d3b0", roughness: 0.8 }),
      sisal: new THREE.MeshStandardMaterial({ map: sisalTexture(), roughness: 1 }),
      carpet: new THREE.MeshStandardMaterial({
        map: fabricTexture("#6a4a36", "treeCarpet", 25),
        roughness: 1,
      }),
      ceramic: new THREE.MeshPhysicalMaterial({
        color: "#f2efe8",
        roughness: 0.18,
        clearcoat: 0.7,
        clearcoatRoughness: 0.2,
        envMapIntensity: 0.9,
      }),
      curtain: new THREE.MeshStandardMaterial({
        map: fabricTexture("#caa26a", "curtain", 41),
        roughness: 0.92,
        side: THREE.DoubleSide,
      }),
      blanket: new THREE.MeshStandardMaterial({
        map: fabricTexture("#c2b193", "blanket", 43),
        roughness: 1,
      }),
      litter: new THREE.MeshStandardMaterial({ map: litterTexture(), roughness: 1 }),
      kibble: new THREE.MeshStandardMaterial({ color: "#5d3a1c", roughness: 0.75 }),
    };
  }, [woodTex]);

  const kibbles = useMemo(() => {
    // Deterministic scatter of kibble bits inside the food bowl.
    const rand = seededRand(11);
    return Array.from({ length: 16 }, () => {
      const a = rand() * Math.PI * 2;
      const r = rand() * 0.075;
      return {
        position: [Math.cos(a) * r, 0.042, Math.sin(a) * r] as [number, number, number],
        scale: 0.7 + rand() * 0.6,
        rot: rand() * Math.PI,
      };
    });
  }, []);

  return (
    <group>
      {/* --- Image-based fill so glossy surfaces have something to reflect --- */}
      <Environment resolution={64} frames={1}>
        <Lightformer intensity={2.2} color="#ffe6bd" position={[4, 2.4, 0.4]} rotation={[0, -Math.PI / 2, 0]} scale={[2.4, 2, 1]} />
        <Lightformer intensity={0.6} color="#f6ead2" position={[0, 3, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[4, 4, 1]} />
        <Lightformer intensity={0.35} color="#ffd9a0" position={[-3, 1.6, -0.4]} rotation={[0, Math.PI / 2, 0]} scale={[1.4, 1.2, 1]} />
      </Environment>

      {/* --- Lighting: late-afternoon sun through the window, warm lamp. --- */}
      <hemisphereLight args={["#fff4dd", "#6a4a38", 0.55]} />
      <ambientLight intensity={0.22} color="#f3e6d0" />
      <directionalLight
        castShadow
        position={[4.6, 4.4, 1.2]}
        intensity={2.3}
        color="#ffe9bd"
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={18}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-bias={-0.0004}
        shadow-normalBias={0.015}
        shadow-radius={4}
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
      {/* Rug fringe at both short ends. */}
      {[-1, 1].map((side) =>
        Array.from({ length: 18 }, (_, i) => (
          <mesh key={`${side}-${i}`} material={mats.trim} position={[ROOM.rug[0] - 1.7 + i * 0.2, 0.012, ROOM.rug[2] + side * 1.36]}>
            <boxGeometry args={[0.045, 0.006, 0.12]} />
          </mesh>
        )),
      )}

      {/* --- Walls, ceiling, baseboards, crown molding --- */}
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
      <mesh position={[0, 2.7, 0]} material={mats.plaster}>
        <boxGeometry args={[ROOM.size.x, 0.1, ROOM.size.z]} />
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
      {[
        [0, 2.6, -ROOM.size.z / 2 + 0.08, ROOM.size.x, 0.09, 0.05],
        [0, 2.6, ROOM.size.z / 2 - 0.08, ROOM.size.x, 0.09, 0.05],
        [-ROOM.size.x / 2 + 0.08, 2.6, 0, 0.05, 0.09, ROOM.size.z],
        [ROOM.size.x / 2 - 0.08, 2.6, 0, 0.05, 0.09, ROOM.size.z],
      ].map(([x, y, z, w, h, d], i) => (
        <mesh key={`crown-${i}`} position={[x, y, z]} material={mats.trim}>
          <boxGeometry args={[w, h, d]} />
        </mesh>
      ))}

      {/* --- Window with muntins, glass, curtains, sky, sun patch --- */}
      <group position={[ROOM.size.x / 2 - 0.1, 1.5, 0.15]}>
        <mesh material={mats.trim}>
          <boxGeometry args={[0.06, 1.8, 2.2]} />
        </mesh>
        <mesh position={[-0.045, 0, 0]}>
          <boxGeometry args={[0.03, 1.56, 1.96]} />
          <meshStandardMaterial color="#bfe0f4" emissive="#a8cfe8" emissiveIntensity={0.8} roughness={0.1} />
        </mesh>
        {/* Glass pane with real reflections. */}
        <mesh position={[-0.028, 0, 0]}>
          <boxGeometry args={[0.012, 1.56, 1.96]} />
          <meshPhysicalMaterial color="#d8ecf6" transparent opacity={0.22} roughness={0.05} metalness={0} envMapIntensity={1.2} />
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
        {/* Curtain rod and panels. */}
        <mesh position={[-0.18, 1.02, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.darkWood}>
          <cylinderGeometry args={[0.018, 0.018, 2.6, 10]} />
        </mesh>
        <Curtain position={[-0.18, 0.12, -1.12]} material={mats.curtain} />
        <Curtain position={[-0.18, 0.12, 1.12]} material={mats.curtain} flip />
      </group>
      <mesh position={[2.95, 0.034, 0.2]} rotation={[-Math.PI / 2, 0, 0.12]}>
        <planeGeometry args={[1.7, 2.3]} />
        <meshStandardMaterial color="#ffdf94" transparent opacity={0.3} depthWrite={false} />
      </mesh>

      {/* --- Contact shadows grounding the furniture --- */}
      <AoBlob position={[0.2, 0.033, 2.42]} size={[3.3, 1.6]} opacity={0.6} />
      <AoBlob position={[-2.4, 0.033, 0.85]} size={[1.5, 1.5]} opacity={0.55} />
      <AoBlob position={[0.25, 0.033, 0.8]} size={[1.8, 1.2]} opacity={0.5} />
      <AoBlob position={[-0.05, 0.033, -2.95]} size={[2.1, 0.9]} opacity={0.55} />
      <AoBlob position={[-3.65, 0.033, -0.15]} size={[1.2, 0.8]} opacity={0.55} />
      <AoBlob position={[-3.0, 0.033, -1.5]} size={[0.6, 0.6]} opacity={0.5} />
      <AoBlob position={[-3.3, 0.033, -2.2]} size={[1.1, 1.1]} opacity={0.55} />
      <AoBlob position={[-2.55, 0.033, -0.35]} size={[0.55, 0.55]} opacity={0.45} />
      <AoBlob position={[ROOM.food[0], 0.033, ROOM.food[2]]} size={[0.75, 0.55]} opacity={0.4} />
      <AoBlob position={[ROOM.litter[0], 0.033, ROOM.litter[2]]} size={[0.95, 0.75]} opacity={0.4} />

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
        {/* Throw blanket draped over the left arm. */}
        <RoundedBox args={[0.34, 0.05, 0.8]} radius={0.02} smoothness={2} position={[-1.25, 0.74, -0.05]} rotation={[0, 0.06, 0]} castShadow material={mats.blanket} />
        <RoundedBox args={[0.34, 0.5, 0.05]} radius={0.02} smoothness={2} position={[-1.25, 0.5, -0.44]} rotation={[0.04, 0, 0]} castShadow material={mats.blanket} />
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
            <meshPhysicalMaterial color="#20344a" emissive="#33507a" emissiveIntensity={0.5} roughness={0.12} metalness={0.3} clearcoat={0.8} clearcoatRoughness={0.1} envMapIntensity={1.1} />
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
        <mesh position={[0, 0.026, 0]} userData={{ care: "food" }} material={foodBowl > 8 ? mats.kibble : mats.ceramic}>
          <cylinderGeometry args={[0.11, 0.11, 0.032, 20]} />
        </mesh>
        {/* Individual kibble bits when the bowl is full. */}
        {foodBowl > 8 &&
          kibbles.map((k, i) => (
            <mesh key={i} position={k.position} rotation={[0, k.rot, 0]} scale={k.scale} material={mats.kibble} userData={{ care: "food" }}>
              <sphereGeometry args={[0.011, 8, 6]} />
            </mesh>
          ))}
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
        <mesh userData={{ care: "water" }} castShadow material={mats.ceramic}>
          <cylinderGeometry args={[0.13, 0.16, 0.07, 24]} />
        </mesh>
        <mesh position={[0, 0.026, 0]} userData={{ care: "water" }}>
          <cylinderGeometry args={[0.105, 0.105, 0.032, 20]} />
          <meshPhysicalMaterial
            color={waterBowl > 8 ? "#5ea8cc" : "#c4d4de"}
            transparent
            opacity={waterBowl > 8 ? 0.75 : 1}
            roughness={0.08}
            clearcoat={0.7}
            envMapIntensity={1.2}
          />
        </mesh>
      </group>

      {/* --- Litter box --- */}
      <group position={ROOM.litter} userData={{ care: "litter" }}>
        <RoundedBox args={[0.58, 0.14, 0.42]} radius={0.03} smoothness={2} position={[0, 0.06, 0]} castShadow userData={{ care: "litter" }}>
          <meshStandardMaterial color="#e8e0d0" roughness={0.6} />
        </RoundedBox>
        <mesh position={[0, 0.115, 0]} userData={{ care: "litter" }} material={mats.litter}>
          <boxGeometry args={[0.5, 0.04, 0.34]} />
        </mesh>
        {litterDirt > 55 && (
          <mesh position={[0, 0.118, 0]} userData={{ care: "litter" }}>
            <boxGeometry args={[0.5, 0.042, 0.34]} />
            <meshStandardMaterial color="#9a8458" transparent opacity={0.55} roughness={1} />
          </mesh>
        )}
      </group>
    </group>
  );
}

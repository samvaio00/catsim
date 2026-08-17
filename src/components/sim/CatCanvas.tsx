"use client";

import { useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { SoftShadows } from "@react-three/drei";
import { TICK_MS } from "@/lib/sim/needs";
import { sounds } from "@/lib/sim/sounds";
import { useSim } from "@/lib/sim/store";
import { CameraRig } from "@/components/sim/CameraRig";
import { Interactables } from "@/components/sim/Interactables";
import { LivingRoom } from "@/components/sim/LivingRoom";
import { Singapura } from "@/components/sim/Singapura";
import { TouchController } from "@/components/sim/TouchController";

function SimClock() {
  const tick = useSim((s) => s.tick);
  useEffect(() => {
    const id = window.setInterval(tick, TICK_MS);
    return () => window.clearInterval(id);
  }, [tick]);
  return null;
}

export function CatCanvas() {
  return (
    <div className="absolute inset-0 touch-none">
      <SimClock />
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ position: [3.4, 2.6, 3.8], fov: 42, near: 0.1, far: 40 }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener(
            "webglcontextlost",
            (e) => e.preventDefault(),
            false,
          );
        }}
        onPointerDown={() => {
          void sounds.unlock();
        }}
      >
        <color attach="background" args={["#d7c4a3"]} />
        <fog attach="fog" args={["#d7c4a3", 8, 16]} />
        <SoftShadows size={18} samples={8} focus={0.6} />
        <Physics gravity={[0, -9.6, 0]} interpolate>
          <LivingRoom />
          <Interactables />
          <Singapura />
        </Physics>
        <CameraRig />
        <TouchController />
      </Canvas>
    </div>
  );
}

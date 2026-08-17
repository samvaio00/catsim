"use client";

import { Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
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
        dpr={[1, 1.6]}
        camera={{ position: [4.2, 3.1, 4.6], fov: 46, near: 0.1, far: 40 }}
        onCreated={({ gl }) => {
          gl.setClearColor("#7fa0c4", 1);
          gl.domElement.addEventListener("webglcontextlost", (e) => e.preventDefault(), false);
        }}
        onPointerDown={() => {
          void sounds.unlock();
        }}
      >
        <color attach="background" args={["#8eb4d4"]} />
        <LivingRoom />
        <Singapura />
        <Suspense fallback={null}>
          <Physics gravity={[0, -9.6, 0]} interpolate>
            <Interactables />
          </Physics>
        </Suspense>
        <CameraRig />
        <TouchController />
      </Canvas>
    </div>
  );
}

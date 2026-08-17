"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useSim } from "@/lib/sim/store";
import { ROOM_VIEW, touchCamera } from "@/lib/sim/touchCamera";

export function CameraRig() {
  const { camera } = useThree();
  const look = useRef(new THREE.Vector3(...ROOM_VIEW.look));
  const ready = useRef(false);

  useFrame(() => {
    const [px, , pz] = useSim.getState().position;
    look.current.lerp(new THREE.Vector3(px * 0.35 + ROOM_VIEW.look[0], ROOM_VIEW.look[1], pz * 0.35 + ROOM_VIEW.look[2]), 0.04);

    touchCamera.dist = Math.min(ROOM_VIEW.maxDist, Math.max(ROOM_VIEW.minDist, touchCamera.dist));
    touchCamera.pol = Math.min(1.28, Math.max(0.72, touchCamera.pol));

    const az = touchCamera.az;
    const pol = touchCamera.pol;
    const dist = touchCamera.dist;
    const target = look.current;
    let cx = target.x + Math.sin(az) * Math.sin(pol) * dist;
    let cy = target.y + Math.cos(pol) * dist;
    let cz = target.z + Math.cos(az) * Math.sin(pol) * dist;
    cx = Math.min(ROOM_VIEW.max.x, Math.max(ROOM_VIEW.min.x, cx));
    cy = Math.min(ROOM_VIEW.max.y, Math.max(ROOM_VIEW.min.y, cy));
    cz = Math.min(ROOM_VIEW.max.z, Math.max(ROOM_VIEW.min.z, cz));

    if (!ready.current) {
      camera.position.set(cx, cy, cz);
      ready.current = true;
    } else {
      camera.position.lerp(new THREE.Vector3(cx, cy, cz), 0.16);
    }
    camera.lookAt(target);
  });

  return null;
}

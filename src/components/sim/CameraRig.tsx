"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useSim } from "@/lib/sim/store";
import { touchCamera } from "@/lib/sim/touchCamera";

export function CameraRig() {
  const { camera } = useThree();
  const look = useRef(new THREE.Vector3());

  useFrame((_, dt) => {
    const [x, , z] = useSim.getState().position;
    const target = look.current;
    target.lerp(new THREE.Vector3(x, 0.35, z), 1 - Math.pow(0.08, dt * 60));
    const az = touchCamera.az;
    const pol = touchCamera.pol;
    const dist = touchCamera.dist;
    const cx = target.x + Math.sin(az) * Math.sin(pol) * dist;
    const cy = target.y + Math.cos(pol) * dist;
    const cz = target.z + Math.cos(az) * Math.sin(pol) * dist;
    camera.position.lerp(new THREE.Vector3(cx, cy, cz), 0.12);
    camera.lookAt(target);
  });

  return null;
}

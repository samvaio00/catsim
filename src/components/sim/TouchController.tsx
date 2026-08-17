"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { GrabId } from "@/lib/sim/grab";
import { useSim } from "@/lib/sim/store";
import { sounds } from "@/lib/sim/sounds";
import { ROOM_VIEW, touchCamera } from "@/lib/sim/touchCamera";
import { clampToRoom } from "@/lib/sim/world";

type PointerInfo = {
  x: number;
  y: number;
  grab: GrabId | null;
  care: string | null;
  floor: boolean;
};

const pointers = new Map<number, PointerInfo>();
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const hit = new THREE.Vector3();

function readUserData(obj: THREE.Object3D) {
  let cur: THREE.Object3D | null = obj;
  let grab: GrabId | null = null;
  let care: string | null = null;
  let floor = false;
  while (cur) {
    const data = cur.userData as { grabId?: GrabId; care?: string; floor?: boolean };
    if (data.grabId) grab = data.grabId;
    if (data.care) care = data.care;
    if (data.floor) floor = true;
    cur = cur.parent;
  }
  return { grab, care, floor };
}

export function TouchController() {
  const { gl, camera, scene, size } = useThree();

  useEffect(() => {
    const el = gl.domElement;

    let orbiting = false;
    let lastX = 0;
    let lastY = 0;
    let pinchStart = 0;
    let distStart = touchCamera.dist;
    let pendingPet: number | null = null;
    let downAt = 0;
    let moved = false;

    const cast = (clientX: number, clientY: number) => {
      const rect = el.getBoundingClientRect();
      ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(scene.children, true);
      const first = hits.find((h) => !h.object.userData.ignore);
      const info = first ? readUserData(first.object) : { grab: null, care: null, floor: true };
      if (!first) info.floor = true;
      return info;
    };

    const projectFloor = (clientX: number, clientY: number, y = 0.08) => {
      const rect = el.getBoundingClientRect();
      ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      floorPlane.constant = -y;
      raycaster.ray.intersectPlane(floorPlane, hit);
      const [x, z] = clampToRoom(hit.x, hit.z);
      return [x, y, z] as [number, number, number];
    };

    const midpoint = () => {
      const pts = [...pointers.values()];
      if (pts.length < 2) return null;
      return { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
    };

    const pinch = () => {
      const pts = [...pointers.values()];
      if (pts.length < 2) return 0;
      return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    };

    const sharedGrab = () => {
      const pts = [...pointers.values()];
      if (pts.length < 2) return null;
      if (pts[0].grab && pts[0].grab === pts[1].grab) return pts[0].grab;
      return pts[0].grab ?? pts[1].grab;
    };

    const applyLift = () => {
      const mid = midpoint();
      if (!mid) return;
      const spread = pinch();
      const height = Math.min(1.35, Math.max(0.16, 0.12 + (spread - 70) / 280));
      const pos = projectFloor(mid.x, mid.y, height);
      useSim.getState().moveHold(pos);
    };

    const onDown = (e: PointerEvent) => {
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      sounds.unlock();
      const info = cast(e.clientX, e.clientY);
      pointers.set(e.pointerId, {
        x: e.clientX,
        y: e.clientY,
        grab: info.grab,
        care: info.care,
        floor: info.floor && !info.grab && !info.care,
      });
      downAt = performance.now();
      moved = false;
      lastX = e.clientX;
      lastY = e.clientY;

      if (pointers.size === 2) {
        if (pendingPet) {
          window.clearTimeout(pendingPet);
          pendingPet = null;
          useSim.getState().stopPet();
        }
        const grab = sharedGrab();
        if (grab) {
          orbiting = false;
          const mid = midpoint()!;
          const spread = pinch();
          const height = Math.min(1.35, Math.max(0.22, 0.16 + (spread - 70) / 280));
          useSim.getState().startHold(grab, "lift", projectFloor(mid.x, mid.y, height));
        } else {
          pinchStart = pinch();
          distStart = touchCamera.dist;
        }
        return;
      }

      if (info.grab === "cat") {
        pendingPet = window.setTimeout(() => {
          pendingPet = null;
          if (pointers.size === 1 && !useSim.getState().held) useSim.getState().startPet();
        }, 90);
        return;
      }

      if (info.grab) {
        const pos = projectFloor(e.clientX, e.clientY, 0.12);
        useSim.getState().startHold(info.grab, "drag", pos);
        return;
      }

      if (info.care) return;

      if (useSim.getState().playSession && info.floor) {
        useSim.getState().setPrey(projectFloor(e.clientX, e.clientY, 0.05));
        return;
      }

      orbiting = true;
    };

    const onMove = (e: PointerEvent) => {
      const prev = pointers.get(e.pointerId);
      if (!prev) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      if (Math.hypot(e.clientX - prev.x, e.clientY - prev.y) > 8) moved = true;
      pointers.set(e.pointerId, { ...prev, x: e.clientX, y: e.clientY });

      const held = useSim.getState().held;
      if (held?.mode === "lift" && pointers.size >= 2) {
        applyLift();
        return;
      }
      if (held?.mode === "drag" && pointers.size === 1) {
        useSim.getState().moveHold(projectFloor(e.clientX, e.clientY, held.id === "cat" ? 0.16 : 0.12));
        if (useSim.getState().playSession && held.id !== "cat") {
          useSim.getState().setPrey(projectFloor(e.clientX, e.clientY, 0.05));
        }
        return;
      }
      if (pointers.size === 2 && !held) {
        const now = pinch();
        if (pinchStart > 0) {
          touchCamera.dist = Math.min(
          ROOM_VIEW.maxDist,
          Math.max(ROOM_VIEW.minDist, distStart * (pinchStart / Math.max(40, now))),
        );
        }
        return;
      }
      if (orbiting && pointers.size === 1) {
        touchCamera.az -= dx * 0.005;
        touchCamera.pol = Math.min(1.28, Math.max(0.72, touchCamera.pol + dy * 0.004));
      }
      if (useSim.getState().playSession && pointers.size === 1 && prev.floor) {
        useSim.getState().setPrey(projectFloor(e.clientX, e.clientY, 0.05));
      }
      lastX = e.clientX;
      lastY = e.clientY;
    };

    const onUp = (e: PointerEvent) => {
      const info = pointers.get(e.pointerId);
      pointers.delete(e.pointerId);
      if (pendingPet) {
        window.clearTimeout(pendingPet);
        pendingPet = null;
      }

      const held = useSim.getState().held;
      if (held && pointers.size < (held.mode === "lift" ? 2 : 1)) {
        useSim.getState().endHold();
      }
      useSim.getState().stopPet();
      orbiting = pointers.size === 1;
      pinchStart = 0;

      if (info?.care && !moved && performance.now() - downAt < 450) {
        const sim = useSim.getState();
        if (info.care === "food") sim.refillFood();
        else if (info.care === "water") sim.refillWater();
        else if (info.care === "litter") sim.scoopLitter();
        else if (info.care.startsWith("mess:")) sim.cleanMess(info.care.slice(5));
      }

      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
    };

    const block = (e: Event) => e.preventDefault();
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("contextmenu", block);
    el.addEventListener("gesturestart", block);
    void size;

    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("contextmenu", block);
      el.removeEventListener("gesturestart", block);
      pointers.clear();
    };
  }, [gl, camera, scene, size]);

  return null;
}

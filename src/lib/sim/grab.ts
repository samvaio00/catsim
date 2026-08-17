import type { RapierRigidBody } from "@react-three/rapier";

export type GrabId = "cat" | "ball" | "mouse" | "mug" | "remote" | "cushion";

export type HoldMode = "none" | "drag" | "lift";

export const GRAB_LABELS: Record<GrabId, string> = {
  cat: "Pura",
  ball: "the ball",
  mouse: "the mouse toy",
  mug: "the mug",
  remote: "the remote",
  cushion: "the cushion",
};

const bodies = new Map<GrabId, RapierRigidBody>();

export function registerGrab(id: GrabId, body: RapierRigidBody | null) {
  if (body) bodies.set(id, body);
  else bodies.delete(id);
}

export function grabBody(id: GrabId) {
  return bodies.get(id) ?? null;
}

export function isToy(id: GrabId) {
  return id !== "cat";
}

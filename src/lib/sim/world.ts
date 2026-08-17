export const ROOM = {
  size: { x: 8.4, z: 6.6, h: 2.7 },
  food: [2.35, 0.05, -2.25] as [number, number, number],
  water: [2.85, 0.05, -2.25] as [number, number, number],
  litter: [-3.35, 0.04, 2.45] as [number, number, number],
  sofa: [0.2, 0.52, 2.35] as [number, number, number],
  armchair: [-2.4, 0.5, 0.8] as [number, number, number],
  coffee: [0.25, 0.42, 0.8] as [number, number, number],
  catTree: [-3.3, 1.22, -2.2] as [number, number, number],
  sunPatch: [3.15, 0.02, 0.35] as [number, number, number],
  rug: [0.1, 0.01, 0.15] as [number, number, number],
  player: [0.4, 0.9, -0.2] as [number, number, number],
};

/**
 * Furniture footprints. `top` is the height a cat stands at when she is on
 * the piece; `climbable` pieces let her cross the footprint (to hop on),
 * everything else blocks floor-level movement so she paths around it.
 */
export interface Furniture {
  id: string;
  cx: number;
  cz: number;
  hx: number;
  hz: number;
  top: number;
  climbable: boolean;
}

export const FURNITURE: Furniture[] = [
  { id: "sofa", cx: 0.2, cz: 2.42, hx: 1.35, hz: 0.49, top: 0.52, climbable: true },
  { id: "armchair", cx: -2.4, cz: 0.85, hx: 0.46, hz: 0.45, top: 0.5, climbable: true },
  { id: "coffee", cx: 0.25, cz: 0.8, hx: 0.6, hz: 0.32, top: 0.44, climbable: false },
  { id: "tvstand", cx: -0.05, cz: -2.95, hx: 0.8, hz: 0.2, top: 0.5, climbable: false },
  { id: "shelf", cx: -3.65, cz: -0.15, hx: 0.36, hz: 0.15, top: 1.55, climbable: false },
  { id: "catTree", cx: -3.3, cz: -2.2, hx: 0.34, hz: 0.34, top: 1.22, climbable: true },
  { id: "lamp", cx: -2.55, cz: -0.35, hx: 0.14, hz: 0.14, top: 1.9, climbable: false },
  { id: "plant", cx: -3.0, cz: -1.5, hx: 0.17, hz: 0.17, top: 0.16, climbable: false },
];

function inside(f: Furniture, x: number, z: number, margin = 0) {
  return (
    Math.abs(x - f.cx) < f.hx + margin && Math.abs(z - f.cz) < f.hz + margin
  );
}

export function onRug(x: number, z: number) {
  return Math.abs(x - ROOM.rug[0]) < 1.7 && Math.abs(z - ROOM.rug[2]) < 1.25;
}

export function clampToRoom(x: number, z: number): [number, number] {
  const pad = 0.55;
  return [
    Math.min(ROOM.size.x / 2 - pad, Math.max(-ROOM.size.x / 2 + pad, x)),
    Math.min(ROOM.size.z / 2 - pad, Math.max(-ROOM.size.z / 2 + pad, z)),
  ];
}

/**
 * The floor height under the cat at (x, z), given where she is headed.
 * She only stands on furniture when that piece is her destination — otherwise
 * she is blocked before entering its footprint.
 */
export function surfaceAt(
  x: number,
  z: number,
  dest: [number, number, number] | null,
): number {
  if (dest) {
    for (const f of FURNITURE) {
      if (!f.climbable) continue;
      if (inside(f, dest[0], dest[2], 0.1) && inside(f, x, z, 0.05)) {
        return f.id === "catTree" ? dest[1] : f.top;
      }
    }
  }
  return onRug(x, z) ? 0.032 : 0;
}

export interface MoveResult {
  x: number;
  z: number;
  /** False when every axis was blocked — treat as "arrived". */
  moved: boolean;
}

/**
 * Slide the cat around furniture. A destination inside a climbable footprint
 * unlocks that one piece so she can hop up; everything else repels.
 */
export function resolveMove(
  fromX: number,
  fromZ: number,
  toX: number,
  toZ: number,
  dest: [number, number, number] | null,
): MoveResult {
  const passable = (f: Furniture) =>
    f.climbable && dest !== null && inside(f, dest[0], dest[2], 0.12);
  const blocked = (x: number, z: number) =>
    FURNITURE.some((f) => !passable(f) && inside(f, x, z, 0.1));

  if (!blocked(toX, toZ)) return { x: toX, z: toZ, moved: true };
  if (!blocked(toX, fromZ)) return { x: toX, z: fromZ, moved: true };
  if (!blocked(fromX, toZ)) return { x: fromX, z: toZ, moved: true };
  return { x: fromX, z: fromZ, moved: false };
}

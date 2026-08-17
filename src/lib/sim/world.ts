export const ROOM = {
  size: { x: 8.4, z: 6.6 },
  food: [2.35, 0.05, -2.25] as [number, number, number],
  water: [2.85, 0.05, -2.25] as [number, number, number],
  litter: [-3.35, 0.04, 2.45] as [number, number, number],
  sofa: [0.15, 0.28, 2.35] as [number, number, number],
  armchair: [-2.35, 0.24, 0.85] as [number, number, number],
  coffee: [0.2, 0.22, 0.85] as [number, number, number],
  catTree: [-3.35, 0.7, -2.25] as [number, number, number],
  sunPatch: [3.15, 0.02, 0.35] as [number, number, number],
  rug: [0.1, 0.01, 0.15] as [number, number, number],
  player: [0.4, 0.9, -0.2] as [number, number, number],
};

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

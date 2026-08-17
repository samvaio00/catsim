import { clamp } from "@/lib/utils";
import type { DailyChores, Mess, Needs } from "@/lib/sim/types";

/** One real second ≈ one simulated minute so a session feels like a day. */
export const TICK_MS = 100;
export const SIM_MINUTES_PER_TICK = 0.1;
export const MINUTES_PER_DAY = 24 * 60;
export const PLAY_SECONDS_GOAL = 75;

export function decayNeeds(needs: Needs, awake: boolean, dtMin: number): Needs {
  const next = { ...needs };
  next.hunger = clamp(next.hunger - 0.22 * dtMin);
  next.thirst = clamp(next.thirst - 0.3 * dtMin);
  next.play = clamp(next.play - 0.38 * dtMin);
  next.affection = clamp(next.affection - 0.16 * dtMin);
  if (awake) {
    next.energy = clamp(next.energy - 0.14 * dtMin);
  } else {
    next.energy = clamp(next.energy + 0.55 * dtMin);
  }
  next.bladder = clamp(next.bladder + 0.2 * dtMin);
  return next;
}

export function computeComfort(
  needs: Needs,
  litterDirt: number,
  messCount: number,
  foodBowl: number,
  waterBowl: number,
) {
  const clean = 100 - litterDirt;
  const messPenalty = Math.min(40, messCount * 12);
  const bowls = (foodBowl + waterBowl) / 2;
  return clamp(
    0.28 * needs.energy +
      0.18 * needs.play +
      0.16 * needs.affection +
      0.18 * clean +
      0.12 * bowls +
      0.08 * needs.hunger -
      messPenalty,
  );
}

export function emptyChores(): DailyChores {
  return {
    fed: false,
    watered: false,
    scooped: false,
    played: false,
    cleaned: true,
  };
}

export function choreScore(chores: DailyChores, messes: Mess[], playSeconds: number) {
  const parts = [
    chores.fed,
    chores.watered,
    chores.scooped,
    chores.played || playSeconds >= PLAY_SECONDS_GOAL,
    messes.length === 0,
  ];
  return Math.round((parts.filter(Boolean).length / parts.length) * 100);
}

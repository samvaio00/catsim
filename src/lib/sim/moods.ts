import type { Mood, Needs } from "@/lib/sim/types";

export function moodFromState(
  needs: Needs,
  overstim: number,
  recentPet: boolean,
): Mood {
  if (overstim > 70) return "overstimulated";
  if (needs.hunger < 28 || needs.thirst < 24) return "hungry";
  if (needs.comfort < 32 || needs.bladder > 80) return "irritable";
  if (needs.energy < 28) return "sleepy";
  if (needs.play < 34) return "playful";
  if (recentPet && needs.affection > 45 && overstim < 40) return "affectionate";
  if (needs.play > 55 && needs.energy > 50) return "curious";
  if (needs.comfort > 62 && needs.hunger > 45) return "content";
  return needs.affection < 40 ? "affectionate" : "curious";
}

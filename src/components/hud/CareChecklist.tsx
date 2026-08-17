"use client";

import { Button } from "@/components/ui/button";
import { PLAY_SECONDS_GOAL, choreScore } from "@/lib/sim/needs";
import { useSim } from "@/lib/sim/store";

export function CareChecklist() {
  const chores = useSim((s) => s.chores);
  const messes = useSim((s) => s.messes);
  const playSeconds = useSim((s) => s.playSecondsToday);
  const litterDirt = useSim((s) => s.litterDirt);
  const foodBowl = useSim((s) => s.foodBowl);
  const waterBowl = useSim((s) => s.waterBowl);
  const refillFood = useSim((s) => s.refillFood);
  const refillWater = useSim((s) => s.refillWater);
  const scoopLitter = useSim((s) => s.scoopLitter);
  const cleanAll = useSim((s) => s.cleanAll);
  const togglePlay = useSim((s) => s.togglePlay);
  const playSession = useSim((s) => s.playSession);
  const score = choreScore(chores, messes, playSeconds);

  const items = [
    { done: chores.fed && foodBowl > 15, label: "Feed", action: refillFood },
    { done: chores.watered && waterBowl > 15, label: "Water", action: refillWater },
    { done: chores.scooped && litterDirt < 40, label: "Scoop", action: scoopLitter },
    {
      done: chores.played || playSeconds >= PLAY_SECONDS_GOAL,
      label: playSession ? "Play on" : "Play",
      action: () => togglePlay(),
    },
    { done: messes.length === 0, label: messes.length ? `Clean ${messes.length}` : "Clean", action: cleanAll },
  ];

  return (
    <div className="pointer-events-auto rounded-2xl bg-black/40 p-2 shadow-lg backdrop-blur-sm">
      <p className="mb-1 px-1 text-[11px] font-medium tracking-wide text-white/80 uppercase">
        Today {score}%
      </p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <Button
            key={item.label}
            type="button"
            variant={item.done ? "secondary" : "default"}
            size="sm"
            className="h-10 px-3"
            onClick={item.action}
          >
            {item.done ? "✓ " : ""}
            {item.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

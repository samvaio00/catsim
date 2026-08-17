"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    {
      done: chores.fed && foodBowl > 15,
      label: "Feed",
      detail: foodBowl < 15 ? "Bowl is empty" : "Bowl has food",
      action: refillFood,
    },
    {
      done: chores.watered && waterBowl > 15,
      label: "Fresh water",
      detail: waterBowl < 15 ? "Water is low" : "Water is in",
      action: refillWater,
    },
    {
      done: chores.scooped && litterDirt < 40,
      label: "Scoop litter",
      detail: litterDirt > 55 ? "Box is dirty" : "Box is usable",
      action: scoopLitter,
    },
    {
      done: chores.played || playSeconds >= PLAY_SECONDS_GOAL,
      label: "Play hunt",
      detail: `${Math.round(playSeconds)}s / ${PLAY_SECONDS_GOAL}s today`,
      action: () => togglePlay(),
    },
    {
      done: messes.length === 0,
      label: "Clean messes",
      detail: messes.length ? `${messes.length} still on the floor` : "Floor is clear",
      action: cleanAll,
    },
  ];

  return (
    <Card className="pointer-events-auto bg-card/90 backdrop-blur-md">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          Today&apos;s care
          <span className="text-sm font-normal text-muted-foreground">{score}% done</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          This is the real job. A cute cat still needs a human who scoops, plays, and picks up.
        </p>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-2">
        {items.map((item) => (
          <Button
            key={item.label}
            type="button"
            variant={item.done ? "secondary" : "default"}
            size="lg"
            className="h-12 w-full justify-between px-3 text-left"
            onClick={item.action}
          >
            <span>
              <span className="mr-2">{item.done ? "✓" : "○"}</span>
              {item.label}
              {item.label === "Play hunt" && playSession ? " (on)" : ""}
            </span>
            <span className="text-xs font-normal opacity-80">{item.detail}</span>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}

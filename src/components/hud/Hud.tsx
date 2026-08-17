"use client";

import { CareChecklist } from "@/components/hud/CareChecklist";
import { CommandBar } from "@/components/hud/CommandBar";
import { NeedsPanel } from "@/components/hud/NeedsPanel";
import { TrainerIntro } from "@/components/hud/TrainerIntro";
import { useSim } from "@/lib/sim/store";

export function Hud() {
  const tip = useSim((s) => s.lastTip);
  const day = useSim((s) => s.day);
  const held = useSim((s) => s.held);
  const simMinutes = useSim((s) => s.simMinutes);
  const hour = Math.floor(simMinutes / 60) % 24;
  const minute = Math.floor(simMinutes % 60)
    .toString()
    .padStart(2, "0");

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4">
      <TrainerIntro />
      <div className="flex items-start justify-between gap-3">
        <div className="w-[min(100%,22rem)]">
          <NeedsPanel />
        </div>
        <div className="pointer-events-auto max-w-sm rounded-2xl bg-card/90 px-3 py-2 text-right text-sm shadow-md ring-1 ring-foreground/10 backdrop-blur-md">
          <p className="font-medium">
            Day {day} · {hour}:{minute}
          </p>
          <p className="text-muted-foreground">
            {held
              ? held.mode === "lift"
                ? `Two-finger lift: ${held.id}`
                : `Dragging ${held.id}`
              : "1 finger pet/drag · 2 fingers lift"}
          </p>
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <CareChecklist />
        <div className="space-y-2">
          {tip ? (
            <div className="pointer-events-auto rounded-2xl bg-card/90 px-4 py-3 text-sm leading-relaxed shadow-md ring-1 ring-foreground/10 backdrop-blur-md">
              <p className="text-xs font-medium tracking-wide text-primary uppercase">Lesson</p>
              <p>{tip}</p>
            </div>
          ) : null}
          <CommandBar />
        </div>
      </div>
    </div>
  );
}

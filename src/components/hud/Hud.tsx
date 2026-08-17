"use client";

import { useState } from "react";
import { CareChecklist } from "@/components/hud/CareChecklist";
import { CommandBar } from "@/components/hud/CommandBar";
import { NeedsPanel } from "@/components/hud/NeedsPanel";
import { TrainerIntro } from "@/components/hud/TrainerIntro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NEED_KEYS, NEED_LABELS } from "@/lib/sim/types";
import { useSim } from "@/lib/sim/store";

export function Hud() {
  const [open, setOpen] = useState(false);
  const tip = useSim((s) => s.lastTip);
  const day = useSim((s) => s.day);
  const held = useSim((s) => s.held);
  const mood = useSim((s) => s.mood);
  const name = useSim((s) => s.name);
  const needs = useSim((s) => s.needs);
  const simMinutes = useSim((s) => s.simMinutes);
  const hour = Math.floor(simMinutes / 60) % 24;
  const minute = Math.floor(simMinutes % 60)
    .toString()
    .padStart(2, "0");

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-2 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <TrainerIntro />
      <div className="flex items-start justify-between gap-2">
        <div className="pointer-events-auto max-w-[min(100%,22rem)] rounded-2xl bg-black/35 px-3 py-2 text-white shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">{name}</p>
            <Badge variant="secondary" className="capitalize">
              {mood}
            </Badge>
            <Button type="button" size="xs" variant="secondary" onClick={() => setOpen((v) => !v)}>
              {open ? "Hide" : "Needs"}
            </Button>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {NEED_KEYS.map((key) => (
              <span key={key} className="flex items-center gap-1 text-[10px] uppercase tracking-wide">
                {NEED_LABELS[key]}
                <span className="h-1.5 w-8 overflow-hidden rounded-full bg-white/25">
                  <span
                    className="block h-full bg-amber-300"
                    style={{ width: `${Math.max(6, needs[key])}%` }}
                  />
                </span>
              </span>
            ))}
          </div>
          {open ? <div className="mt-2"><NeedsPanel /></div> : null}
        </div>
        <div className="pointer-events-auto rounded-2xl bg-black/35 px-3 py-2 text-right text-xs text-white shadow-lg backdrop-blur-sm">
          <p className="font-medium">
            Day {day} · {hour}:{minute}
          </p>
          <p className="text-white/80">
            {held
              ? held.mode === "lift"
                ? `Lifting ${held.id}`
                : `Dragging ${held.id}`
              : "1 finger pet · 2 fingers lift"}
          </p>
        </div>
      </div>
      <div className="space-y-2">
        {tip ? (
          <div className="pointer-events-auto mx-auto max-w-3xl rounded-xl bg-black/40 px-3 py-2 text-sm text-white shadow-md backdrop-blur-sm">
            {tip}
          </div>
        ) : null}
        <div className="grid gap-2 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
          <CareChecklist />
          <CommandBar />
        </div>
      </div>
    </div>
  );
}

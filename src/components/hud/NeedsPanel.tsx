"use client";

import { NEED_KEYS, NEED_LABELS, NEED_WHY } from "@/lib/sim/types";
import { useSim } from "@/lib/sim/store";

export function NeedsPanel() {
  const needs = useSim((s) => s.needs);
  return (
    <div className="max-h-[36vh] space-y-2 overflow-y-auto pr-1 text-left text-white">
      {NEED_KEYS.map((key) => (
        <div key={key}>
          <div className="flex justify-between text-xs font-medium">
            <span>{NEED_LABELS[key]}</span>
            <span>{Math.round(needs[key])}</span>
          </div>
          <p className="text-[11px] leading-snug text-white/75">{NEED_WHY[key]}</p>
        </div>
      ))}
    </div>
  );
}

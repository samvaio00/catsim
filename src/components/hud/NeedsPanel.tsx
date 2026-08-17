"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NEED_KEYS, NEED_LABELS, NEED_WHY, MOOD_COPY } from "@/lib/sim/types";
import { useSim } from "@/lib/sim/store";

function barColor(key: string, value: number) {
  const invert = key === "bladder";
  const bad = invert ? value > 70 : value < 30;
  const mid = invert ? value > 45 : value < 50;
  return bad ? "bg-destructive" : mid ? "bg-amber-600" : "bg-emerald-700";
}

export function NeedsPanel() {
  const needs = useSim((s) => s.needs);
  const mood = useSim((s) => s.mood);
  const behavior = useSim((s) => s.behavior);
  const name = useSim((s) => s.name);

  return (
    <Card className="pointer-events-auto max-h-[48vh] overflow-y-auto bg-card/90 backdrop-blur-md">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          <span>{name}&apos;s needs</span>
          <Badge variant="secondary" className="capitalize">
            {mood}
          </Badge>
        </CardTitle>
        <p className="text-sm leading-snug text-muted-foreground">{MOOD_COPY[mood]}</p>
        <p className="text-xs text-muted-foreground">
          Right now she is <span className="font-medium text-foreground">{behavior}</span>.
        </p>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {NEED_KEYS.map((key) => (
          <div key={key} className="space-y-1">
            <div className="flex items-center justify-between text-xs font-medium">
              <span>{NEED_LABELS[key]}</span>
              <span>{Math.round(needs[key])}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${barColor(key, needs[key])}`}
                style={{ width: `${Math.max(4, needs[key])}%` }}
              />
            </div>
            <p className="text-[11px] leading-snug text-muted-foreground">{NEED_WHY[key]}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

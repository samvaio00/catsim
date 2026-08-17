"use client";

import { Button } from "@/components/ui/button";
import { sounds } from "@/lib/sim/sounds";
import { useSim } from "@/lib/sim/store";

export function TrainerIntro() {
  const seen = useSim((s) => s.seenIntro);
  const dismiss = useSim((s) => s.dismissIntro);
  if (seen) return null;

  return (
    <div className="pointer-events-auto absolute inset-0 z-20 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-card p-6 shadow-2xl ring-1 ring-foreground/10">
        <p className="text-sm font-medium tracking-wide text-primary uppercase">Cat guardian trainer</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Pura is not a toy</h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          She is a Singapura — a small, busy real-world breed. This iPad room is practice for what
          owning a cat actually takes: food, clean water, a scooped box, play that feels like hunting,
          and cleaning up after a creature who cannot use a dustpan.
        </p>
        <ul className="mt-4 space-y-2 text-base">
          <li>
            <strong>One finger</strong> on Pura = pet. Stop if her tail lashes or she hisses.
          </li>
          <li>
            <strong>Two fingers</strong> on Pura or a thing = pick it up. Spread to lift, let go to drop.
          </li>
          <li>
            <strong>One finger</strong> on a toy = drag it. That is play.
          </li>
          <li>
            <strong>Tap</strong> the food bag, water bowl, litter, or a mess to do the job.
          </li>
          <li>
            <strong>Speak or type</strong> come, play, dinner, scoop. She may ignore you. That is honest.
          </li>
        </ul>
        <p className="mt-4 text-sm text-muted-foreground">
          If you skip play, she knocks stuff over. If you skip the box, she may go on the floor. You
          clean it. That is what it means to have a cat.
        </p>
        <Button
          type="button"
          size="lg"
          className="mt-6 h-14 w-full text-base"
          onClick={() => {
            void sounds.unlock();
            dismiss();
          }}
        >
          I will take care of her
        </Button>
      </div>
    </div>
  );
}

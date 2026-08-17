"use client";

import dynamic from "next/dynamic";
import { Hud } from "@/components/hud/Hud";

const CatCanvas = dynamic(
  () => import("@/components/sim/CatCanvas").then((m) => m.CatCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-[#d7c4a3] text-lg">
        Opening the living room…
      </div>
    ),
  },
);

export default function Home() {
  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-[#d7c4a3]">
      <CatCanvas />
      <Hud />
    </main>
  );
}

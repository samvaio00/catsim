export type NeedKey =
  | "hunger"
  | "thirst"
  | "energy"
  | "bladder"
  | "play"
  | "affection"
  | "comfort";

export type Mood =
  | "content"
  | "playful"
  | "curious"
  | "sleepy"
  | "hungry"
  | "irritable"
  | "affectionate"
  | "overstimulated";

export type Behavior =
  | "idle"
  | "walk"
  | "explore"
  | "sit"
  | "loaf"
  | "stretch"
  | "groom"
  | "eat"
  | "drink"
  | "litter"
  | "sleep"
  | "hunt"
  | "play"
  | "climb"
  | "solicit"
  | "come"
  | "knock"
  | "hide"
  | "pounce"
  | "accident";

export type MessType =
  | "accident"
  | "kibble"
  | "water"
  | "litter-scatter"
  | "fur";

export type CommandIntent =
  | "come"
  | "sit"
  | "stay"
  | "no"
  | "praise"
  | "play"
  | "fetch"
  | "dinner"
  | "treat"
  | "litter"
  | "sleep"
  | "water"
  | "name"
  | "scoop"
  | "clean";

export interface Mess {
  id: string;
  type: MessType;
  position: [number, number, number];
}

export interface LastCommand {
  text: string;
  intent: CommandIntent | null;
  obeyed: boolean;
  reason: string;
  at: number;
}

export interface DailyChores {
  fed: boolean;
  watered: boolean;
  scooped: boolean;
  played: boolean;
  cleaned: boolean;
}

export interface Needs {
  hunger: number;
  thirst: number;
  energy: number;
  bladder: number;
  play: number;
  affection: number;
  comfort: number;
}

export const NEED_KEYS: NeedKey[] = [
  "hunger",
  "thirst",
  "energy",
  "bladder",
  "play",
  "affection",
  "comfort",
];

export const NEED_LABELS: Record<NeedKey, string> = {
  hunger: "Hunger",
  thirst: "Thirst",
  energy: "Energy",
  bladder: "Litter need",
  play: "Play",
  affection: "Company",
  comfort: "Comfort",
};

export const NEED_WHY: Record<NeedKey, string> = {
  hunger:
    "A real cat cannot open the cupboard. If the bowl stays empty she gets loud, then withdrawn.",
  thirst:
    "Cats often drink too little. Fresh water every day protects their kidneys.",
  energy:
    "Cats sleep a lot — that is normal. She still needs a quiet, safe place to do it.",
  bladder:
    "She will use a clean box. A dirty box is why cats pee on floors and laundry.",
  play:
    "Indoor cats must hunt with you. No playtime means boredom, night zoomies, and broken things.",
  affection:
    "Singapuras are people cats. Ignoring her is not 'independence' — it is loneliness.",
  comfort:
    "Comfort drops when the room is messy, the box stinks, or she is hungry. Cleanup is care.",
};

export const MOOD_COPY: Record<Mood, string> = {
  content: "Relaxed and okay — this is what good daily care looks like.",
  playful: "She wants to hunt. This is the moment to play, not just pet.",
  curious: "Checking her territory. That is healthy indoor-cat work.",
  sleepy: "A real cat sleeps 12–16 hours. Let her rest.",
  hungry: "She is asking for food the only way she can.",
  irritable: "Needs are piled up. Forcing cuddles now can make her hiss.",
  affectionate: "She chose you. A short pet is the right answer.",
  overstimulated: "Too much touching. Hands off until her tail settles.",
};

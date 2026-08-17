import type { CommandIntent } from "@/lib/sim/types";

const RULES: { intent: CommandIntent; patterns: RegExp[] }[] = [
  { intent: "come", patterns: [/\b(come|here|pura|kitty|come here|here kitty)\b/] },
  { intent: "sit", patterns: [/\b(sit|sit down|down)\b/] },
  { intent: "stay", patterns: [/\b(stay|wait|hold on)\b/] },
  { intent: "no", patterns: [/\b(no|stop|off|leave it|enough)\b/] },
  { intent: "praise", patterns: [/\b(good (girl|kitty|cat|job)|nice|sweet girl)\b/] },
  { intent: "play", patterns: [/\b(play|wand|hunt|let'?s play)\b/] },
  { intent: "fetch", patterns: [/\b(fetch|get (it|the (ball|mouse|toy)))\b/] },
  { intent: "dinner", patterns: [/\b(dinner|food|eat|hungry|breakfast|supper|feed)\b/] },
  { intent: "treat", patterns: [/\b(treat|treats|snack)\b/] },
  { intent: "litter", patterns: [/\b(litter|box|potty|toilet)\b/] },
  { intent: "scoop", patterns: [/\b(scoop|clean the box|clean litter)\b/] },
  { intent: "clean", patterns: [/\b(clean( up)?|pick up|wipe|mess)\b/] },
  { intent: "sleep", patterns: [/\b(sleep|nap|bed|rest)\b/] },
  { intent: "water", patterns: [/\b(water|drink)\b/] },
  { intent: "name", patterns: [/\b(what'?s your name|say your name|pura)\b/] },
];

export function parseCommand(raw: string): CommandIntent | null {
  const text = raw.trim().toLowerCase();
  if (!text) return null;
  for (const rule of RULES) {
    if (rule.patterns.some((re) => re.test(text))) return rule.intent;
  }
  return null;
}

export const COMMAND_HINTS = [
  "come",
  "sit",
  "play",
  "dinner",
  "treat",
  "no",
  "good girl",
  "scoop",
  "clean up",
];

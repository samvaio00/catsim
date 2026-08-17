import { dist2, uid } from "@/lib/utils";
import type { Behavior, CommandIntent, Mess, Mood, Needs } from "@/lib/sim/types";
import { ROOM } from "@/lib/sim/world";

export interface BehaviorPick {
  behavior: Behavior;
  target: [number, number, number] | null;
  lookAt: [number, number, number] | null;
  tip: string | null;
  mess?: Mess;
  knock: boolean;
  vocal: "meow" | "meowHungry" | "meowAnnoyed" | "trill" | "chirp" | "hiss" | null;
}

export function obedienceChance(
  intent: CommandIntent,
  mood: Mood,
  needs: Needs,
  askedRecently: boolean,
) {
  let chance = 0.42 + needs.affection / 280;
  if (askedRecently) chance -= 0.22;
  if (mood === "irritable" || mood === "overstimulated") chance -= 0.28;
  if (mood === "playful" && (intent === "sit" || intent === "stay" || intent === "come")) {
    chance -= 0.2;
  }
  if (intent === "dinner" && needs.hunger < 40) chance = 0.95;
  if (intent === "water" && needs.thirst < 40) chance = 0.92;
  if (intent === "litter" && needs.bladder > 70) chance = 0.9;
  if (intent === "play" && needs.play < 50) chance = 0.88;
  if (intent === "praise") chance = 1;
  if (intent === "no") chance = mood === "playful" ? 0.35 : 0.7;
  if (intent === "name") chance = 0.8;
  return Math.max(0.08, Math.min(0.97, chance));
}

export function commandToBehavior(
  intent: CommandIntent,
  prey: [number, number, number] | null,
): BehaviorPick {
  switch (intent) {
    case "come":
      return {
        behavior: "come",
        target: ROOM.player,
        lookAt: ROOM.player,
        tip: "She came because she wanted to — cats are not dogs. That is still a win.",
        knock: false,
        vocal: "trill",
      };
    case "sit":
    case "stay":
      return {
        behavior: "sit",
        target: null,
        lookAt: ROOM.player,
        tip: "Stay only lasts a few seconds. Real cats do not hold poses for people.",
        knock: false,
        vocal: "meow",
      };
    case "play":
    case "fetch":
      return {
        behavior: "hunt",
        target: prey ?? ROOM.rug,
        lookAt: prey ?? ROOM.player,
        tip: "Play is how an indoor cat hunts. Two short sessions a day is the real job.",
        knock: false,
        vocal: "chirp",
      };
    case "dinner":
      return {
        behavior: "eat",
        target: ROOM.food,
        lookAt: ROOM.food,
        tip: null,
        knock: false,
        vocal: "meowHungry",
      };
    case "water":
      return {
        behavior: "drink",
        target: ROOM.water,
        lookAt: ROOM.water,
        tip: null,
        knock: false,
        vocal: null,
      };
    case "litter":
      return {
        behavior: "litter",
        target: ROOM.litter,
        lookAt: ROOM.litter,
        tip: null,
        knock: false,
        vocal: null,
      };
    case "sleep":
      return {
        behavior: "sleep",
        target: ROOM.sofa,
        lookAt: null,
        tip: "If she actually sleeps near you, she feels safe. Do not poke her awake.",
        knock: false,
        vocal: null,
      };
    case "treat":
      return {
        behavior: "come",
        target: ROOM.player,
        lookAt: ROOM.player,
        tip: "Treats are extra, not dinner. Real cats get chubby fast.",
        knock: false,
        vocal: "trill",
      };
    case "no":
      return {
        behavior: "sit",
        target: null,
        lookAt: ROOM.player,
        tip: "A firm 'no' plus moving the thing works better than yelling.",
        knock: false,
        vocal: "meowAnnoyed",
      };
    case "praise":
      return {
        behavior: "solicit",
        target: ROOM.player,
        lookAt: ROOM.player,
        tip: "Praise right after the good thing. Cats learn timing, not speeches.",
        knock: false,
        vocal: "trill",
      };
    case "name":
      return {
        behavior: "idle",
        target: null,
        lookAt: ROOM.player,
        tip: "She knows her name when it predicts food, play, or you. Use it kindly.",
        knock: false,
        vocal: "meow",
      };
    default:
      return {
        behavior: "idle",
        target: null,
        lookAt: ROOM.player,
        tip: null,
        knock: false,
        vocal: null,
      };
  }
}

export function pickAutonomous(args: {
  needs: Needs;
  mood: Mood;
  foodBowl: number;
  waterBowl: number;
  litterDirt: number;
  playSession: boolean;
  prey: [number, number, number] | null;
  position: [number, number, number];
}): BehaviorPick {
  const { needs, mood, foodBowl, waterBowl, litterDirt, playSession, prey, position } = args;

  if (playSession && prey) {
    return {
      behavior: dist2(position[0], position[2], prey[0], prey[2]) < 0.45 ? "pounce" : "hunt",
      target: prey,
      lookAt: prey,
      tip: "Keep the toy like prey: sneak, dash, catch, then let her 'kill' it.",
      knock: false,
      vocal: Math.random() < 0.2 ? "chirp" : null,
    };
  }

  if (needs.bladder > 86) {
    if (litterDirt > 78 && Math.random() < 0.55) {
      const pos: [number, number, number] = [
        position[0] + (Math.random() - 0.5) * 0.8,
        0.02,
        position[2] + (Math.random() - 0.5) * 0.8,
      ];
      return {
        behavior: "accident",
        target: pos,
        lookAt: null,
        tip: "This is not spite. A dirty box, or a box too far, is why real cats go on the floor. You clean it. Then you scoop.",
        mess: { id: uid("mess"), type: "accident", position: pos },
        knock: false,
        vocal: "meowAnnoyed",
      };
    }
    return {
      behavior: "litter",
      target: ROOM.litter,
      lookAt: ROOM.litter,
      tip: "After she goes, scoop. Waiting until it 'looks bad' is how the box becomes a no.",
      knock: false,
      vocal: null,
    };
  }

  if (needs.hunger < 26) {
    if (foodBowl > 8) {
      return {
        behavior: "eat",
        target: ROOM.food,
        lookAt: ROOM.food,
        tip: "She eats small meals. Leaving stale food out is not the same as feeding her on purpose.",
        knock: false,
        vocal: null,
      };
    }
    return {
      behavior: "solicit",
      target: ROOM.player,
      lookAt: ROOM.player,
      tip: "That meow means the bowl is empty. Fill it — she cannot.",
      knock: false,
      vocal: "meowHungry",
    };
  }

  if (needs.thirst < 24) {
    if (waterBowl > 8) {
      return {
        behavior: "drink",
        target: ROOM.water,
        lookAt: ROOM.water,
        tip: "Change water daily. Cats skip stale bowls and get dehydrated.",
        knock: false,
        vocal: null,
      };
    }
    return {
      behavior: "solicit",
      target: ROOM.player,
      lookAt: ROOM.player,
      tip: "Refill the water. Dry food makes this even more important.",
      knock: false,
      vocal: "meowHungry",
    };
  }

  if (needs.energy < 22) {
    return {
      behavior: "sleep",
      target: Math.random() < 0.5 ? ROOM.sofa : ROOM.sunPatch,
      lookAt: null,
      tip: "Sleeping is not laziness. A tired cat who was played with is a polite cat tonight.",
      knock: false,
      vocal: null,
    };
  }

  if (needs.play < 28 && mood !== "sleepy") {
    if (Math.random() < 0.4) {
      return {
        behavior: "knock",
        target: ROOM.coffee,
        lookAt: ROOM.coffee,
        tip: "Bored cats invent jobs. Knocking things over is a request for play, not a joke.",
        knock: true,
        vocal: "chirp",
      };
    }
    return {
      behavior: "explore",
      target: wanderNear(position),
      lookAt: ROOM.player,
      tip: "If you do not play, she will pace and get into stuff. That is on the human.",
      knock: false,
      vocal: null,
    };
  }

  if (needs.affection < 32) {
    return {
      behavior: "solicit",
      target: ROOM.player,
      lookAt: ROOM.player,
      tip: "A head bunts means hello. Pet the cheek and shoulder — skip the belly.",
      knock: false,
      vocal: "trill",
    };
  }

  if (mood === "sleepy") {
    return {
      behavior: Math.random() < 0.5 ? "loaf" : "sleep",
      target: ROOM.armchair,
      lookAt: null,
      tip: null,
      knock: false,
      vocal: null,
    };
  }

  const roll = Math.random();
  if (roll < 0.18) {
    return {
      behavior: "groom",
      target: null,
      lookAt: null,
      tip: "Grooming is healthy. Hair on the sofa is part of the deal — you vacuum.",
      knock: false,
      vocal: null,
    };
  }
  if (roll < 0.3) {
    return {
      behavior: "stretch",
      target: null,
      lookAt: null,
      tip: null,
      knock: false,
      vocal: null,
    };
  }
  if (roll < 0.42) {
    return {
      behavior: "climb",
      target: ROOM.catTree,
      lookAt: null,
      tip: "A cat tree is not furniture for you. Height makes her feel safe.",
      knock: false,
      vocal: null,
    };
  }
  if (roll < 0.55) {
    return {
      behavior: "sit",
      target: null,
      lookAt: ROOM.player,
      tip: null,
      knock: false,
      vocal: null,
    };
  }
  return {
    behavior: "explore",
    target: wanderNear(position),
    lookAt: null,
    tip: null,
    knock: false,
    vocal: null,
  };
}

function wanderNear(pos: [number, number, number]): [number, number, number] {
  return [
    pos[0] + (Math.random() - 0.5) * 3.2,
    0,
    pos[2] + (Math.random() - 0.5) * 2.6,
  ];
}

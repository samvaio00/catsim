"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { clamp, uid } from "@/lib/utils";
import { commandToBehavior, obedienceChance, pickAutonomous } from "@/lib/sim/behavior";
import { parseCommand } from "@/lib/sim/commands";
import { moodFromState } from "@/lib/sim/moods";
import {
  PLAY_SECONDS_GOAL,
  SIM_MINUTES_PER_TICK,
  TICK_MS,
  choreScore,
  computeComfort,
  decayNeeds,
  emptyChores,
  MINUTES_PER_DAY,
} from "@/lib/sim/needs";
import { sounds } from "@/lib/sim/sounds";
import type {
  Behavior,
  CommandIntent,
  DailyChores,
  LastCommand,
  Mess,
  Mood,
  Needs,
} from "@/lib/sim/types";
import type { GrabId, HoldMode } from "@/lib/sim/grab";
import { GRAB_LABELS, grabBody, isToy } from "@/lib/sim/grab";
import { ROOM, clampToRoom } from "@/lib/sim/world";

export interface SimStore {
  name: string;
  needs: Needs;
  mood: Mood;
  behavior: Behavior;
  target: [number, number, number] | null;
  lookAt: [number, number, number] | null;
  position: [number, number, number];
  heading: number;
  foodBowl: number;
  waterBowl: number;
  litterDirt: number;
  messes: Mess[];
  playSession: boolean;
  prey: [number, number, number] | null;
  playSecondsToday: number;
  simMinutes: number;
  day: number;
  lastCommand: LastCommand | null;
  lastTip: string | null;
  petting: boolean;
  overstim: number;
  seenIntro: boolean;
  muted: boolean;
  chores: DailyChores;
  knockToken: number;
  treatPending: boolean;
  listening: boolean;
  speechError: string | null;
  lastAskAt: number;
  held: { id: GrabId; mode: HoldMode; position: [number, number, number] } | null;
  tick: () => void;
  issueCommand: (text: string) => void;
  setPrey: (prey: [number, number, number] | null) => void;
  setPosition: (x: number, z: number, heading: number) => void;
  startPet: () => void;
  stopPet: () => void;
  refillFood: () => void;
  refillWater: () => void;
  scoopLitter: () => void;
  cleanMess: (id: string) => void;
  cleanAll: () => void;
  giveTreat: () => void;
  togglePlay: (on?: boolean) => void;
  toggleMute: () => void;
  setListening: (on: boolean) => void;
  setSpeechError: (msg: string | null) => void;
  dismissIntro: () => void;
  resetDay: () => void;
  startHold: (id: GrabId, mode: HoldMode, position: [number, number, number]) => void;
  moveHold: (position: [number, number, number]) => void;
  endHold: () => void;
}

const initialNeeds = (): Needs => ({
  hunger: 62,
  thirst: 68,
  energy: 72,
  bladder: 22,
  play: 48,
  affection: 55,
  comfort: 70,
});

export const useSim = create<SimStore>()(
  persist(
    (set, get) => ({
      name: "Pura",
      needs: initialNeeds(),
      mood: "curious",
      behavior: "explore",
      target: ROOM.rug,
      lookAt: ROOM.player,
      position: [-0.6, 0, 0.2],
      heading: 0.4,
      foodBowl: 35,
      waterBowl: 40,
      litterDirt: 18,
      messes: [],
      playSession: false,
      prey: null,
      playSecondsToday: 0,
      simMinutes: 9 * 60,
      day: 1,
      lastCommand: null,
      lastTip:
        "A cat is a roommate with a bladder, a hunting brain, and no hands. You do the boring jobs.",
      petting: false,
      overstim: 0,
      seenIntro: false,
      muted: false,
      chores: emptyChores(),
      knockToken: 0,
      treatPending: false,
      listening: false,
      speechError: null,
      lastAskAt: 0,
      held: null,

      tick: () => {
        const s = get();
        const awake = s.behavior !== "sleep" && s.behavior !== "loaf";
        const needs = decayNeeds(s.needs, awake, SIM_MINUTES_PER_TICK);
        let foodBowl = s.foodBowl;
        let waterBowl = s.waterBowl;
        let litterDirt = s.litterDirt;
        let messes = s.messes;
        let playSecondsToday = s.playSecondsToday;
        let chores = { ...s.chores };
        let overstim = s.overstim;
        let simMinutes = s.simMinutes + SIM_MINUTES_PER_TICK;
        let day = s.day;
        let tip = s.lastTip;

        if (s.behavior === "eat" && foodBowl > 0) {
          foodBowl = clamp(foodBowl - 0.9);
          needs.hunger = clamp(needs.hunger + 1.6);
          needs.bladder = clamp(needs.bladder + 0.15);
          if (Math.random() < 0.04) {
            messes = [
              ...messes,
              {
                id: uid("mess"),
                type: "kibble",
                position: [ROOM.food[0] + 0.15, 0.02, ROOM.food[2] + 0.1],
              },
            ];
            chores.cleaned = false;
          }
        }
        if (s.behavior === "drink" && waterBowl > 0) {
          waterBowl = clamp(waterBowl - 0.7);
          needs.thirst = clamp(needs.thirst + 1.8);
          needs.bladder = clamp(needs.bladder + 0.25);
        }
        if (s.behavior === "litter") {
          needs.bladder = clamp(needs.bladder - 2.4);
          litterDirt = clamp(litterDirt + 0.55);
          if (Math.random() < 0.03) {
            messes = [
              ...messes,
              {
                id: uid("mess"),
                type: "litter-scatter",
                position: [ROOM.litter[0] + 0.25, 0.02, ROOM.litter[2] - 0.15],
              },
            ];
            chores.cleaned = false;
          }
        }
        if (s.behavior === "groom" && Math.random() < 0.02) {
          messes = [
            ...messes,
            {
              id: uid("mess"),
              type: "fur",
              position: [s.position[0], 0.02, s.position[2]],
            },
          ];
          chores.cleaned = false;
        }
        if (s.playSession) {
          playSecondsToday += TICK_MS / 1000;
          needs.play = clamp(needs.play + 1.1);
          needs.energy = clamp(needs.energy - 0.25);
          if (playSecondsToday >= PLAY_SECONDS_GOAL) chores.played = true;
        }
        if (s.petting) {
          needs.affection = clamp(needs.affection + 0.9);
          overstim = clamp(overstim + (needs.play < 30 ? 1.6 : 0.9));
          if (overstim > 78) {
            sounds.play("hiss");
            tip = "She hissed. That is a clear no. Stop and give space — that is respect, not failure.";
          } else {
            sounds.play("pet");
          }
        } else {
          overstim = clamp(overstim - 0.7);
        }

        needs.comfort = computeComfort(needs, litterDirt, messes.length, foodBowl, waterBowl);
        const mood = moodFromState(needs, overstim, s.petting);

        if (simMinutes >= MINUTES_PER_DAY) {
          simMinutes = 0;
          day += 1;
          chores = emptyChores();
          playSecondsToday = 0;
          tip = `Day ${day}. Real cats need this again tomorrow. Care does not reset as a streak you cash in.`;
        }

        if (s.held?.id === "cat") {
          needs.affection = clamp(needs.affection - 0.08);
          overstim = clamp(overstim + 0.55);
          needs.comfort = computeComfort(needs, litterDirt, messes.length, foodBowl, waterBowl);
          set({
            needs,
            mood: moodFromState(needs, overstim, s.petting),
            foodBowl,
            waterBowl,
            litterDirt,
            messes,
            playSecondsToday,
            chores,
            overstim,
            simMinutes,
            day,
            lastTip: tip,
          });
          return;
        }

        const hold =
          s.behavior === "eat" ||
          s.behavior === "drink" ||
          s.behavior === "litter" ||
          s.behavior === "sleep" ||
          s.behavior === "hunt" ||
          s.behavior === "pounce" ||
          s.behavior === "come" ||
          s.petting;

        let behavior = s.behavior;
        let target = s.target;
        let lookAt = s.lookAt;
        let knockToken = s.knockToken;

        if (!hold && Math.random() < 0.18) {
          const pick = pickAutonomous({
            needs,
            mood,
            foodBowl,
            waterBowl,
            litterDirt,
            playSession: s.playSession,
            prey: s.prey,
            position: s.position,
          });
          behavior = pick.behavior;
          target = pick.target;
          lookAt = pick.lookAt;
          if (pick.tip) tip = pick.tip;
          if (pick.mess) {
            messes = [...messes, pick.mess];
            chores.cleaned = false;
            sounds.play("meowAnnoyed");
          }
          if (pick.knock) {
            knockToken += 1;
            sounds.play("bat");
          }
          if (pick.vocal) sounds.play(pick.vocal);
        } else if (s.playSession && s.prey) {
          behavior = "hunt";
          target = s.prey;
          lookAt = s.prey;
        }

        if (mood === "hungry" && Math.random() < 0.04) sounds.play("meowHungry");

        set({
          needs,
          mood,
          behavior,
          target,
          lookAt,
          foodBowl,
          waterBowl,
          litterDirt,
          messes,
          playSecondsToday,
          chores,
          overstim,
          simMinutes,
          day,
          lastTip: tip,
          knockToken,
        });
      },

      issueCommand: (text) => {
        const s = get();
        const intent = parseCommand(text);
        const askedRecently = Date.now() - s.lastAskAt < 4000;
        if (!intent) {
          set({
            lastCommand: {
              text,
              intent: null,
              obeyed: false,
              reason: "She heard sounds, not a job she knows.",
              at: Date.now(),
            },
            lastTip: "Try plain words: come, sit, play, dinner, scoop, clean up.",
          });
          sounds.play("meow");
          return;
        }

        if (intent === "scoop") {
          get().scoopLitter();
          return;
        }
        if (intent === "clean") {
          get().cleanAll();
          return;
        }
        if (intent === "play" || intent === "fetch") {
          get().togglePlay(true);
        }
        if (intent === "dinner" && s.foodBowl < 12) {
          set({
            lastCommand: {
              text,
              intent,
              obeyed: false,
              reason: "The bowl is empty. Fill it first — that is your job.",
              at: Date.now(),
            },
            lastTip: "Click the food bag, then she can eat. Cats do not serve themselves.",
            behavior: "solicit",
            lookAt: ROOM.player,
          });
          sounds.play("meowHungry");
          return;
        }

        const chance = obedienceChance(intent, s.mood, s.needs, askedRecently);
        const obeyed = Math.random() < chance;
        if (!obeyed) {
          set({
            lastCommand: {
              text,
              intent,
              obeyed: false,
              reason: ignoreReason(intent, s.mood),
              at: Date.now(),
            },
            lastAskAt: Date.now(),
            lastTip: ignoreReason(intent, s.mood),
          });
          sounds.play(s.mood === "irritable" ? "meowAnnoyed" : "meow");
          return;
        }

        const pick = commandToBehavior(intent, s.prey);
        set({
          behavior: pick.behavior,
          target: pick.target,
          lookAt: pick.lookAt,
          lastTip: pick.tip ?? s.lastTip,
          lastCommand: {
            text,
            intent,
            obeyed: true,
            reason: "She chose to listen this time.",
            at: Date.now(),
          },
          lastAskAt: Date.now(),
        });
        if (pick.vocal) sounds.play(pick.vocal);
        if (intent === "treat") get().giveTreat();
      },

      setPrey: (prey) => set({ prey }),
      setPosition: (x, z, heading) => {
        const [cx, cz] = clampToRoom(x, z);
        set({ position: [cx, 0, cz], heading });
      },
      startPet: () => {
        const s = get();
        if (s.overstim > 78) {
          sounds.play("hiss");
          set({
            petting: false,
            behavior: "hide",
            target: ROOM.catTree,
            lastTip: "Hands off. Overstimulated cats bite. That is communication.",
          });
          return;
        }
        set({ petting: true, lookAt: ROOM.player });
        sounds.play("purrStart");
        sounds.play("pet");
      },
      stopPet: () => {
        set({ petting: false });
        sounds.play("purrStop");
      },
      refillFood: () => {
        sounds.play("kibble");
        set((s) => ({
          foodBowl: 100,
          chores: { ...s.chores, fed: true },
          lastTip: "Measured meals beat an always-full bowl. You decide when dinner happens.",
          behavior: s.needs.hunger < 55 ? "eat" : s.behavior,
          target: s.needs.hunger < 55 ? ROOM.food : s.target,
        }));
      },
      refillWater: () => {
        sounds.play("waterPour");
        set((s) => ({
          waterBowl: 100,
          chores: { ...s.chores, watered: true },
          lastTip: "Fresh water every day. Wash the bowl — slime on the sides is why they stop drinking.",
          behavior: s.needs.thirst < 55 ? "drink" : s.behavior,
          target: s.needs.thirst < 55 ? ROOM.water : s.target,
        }));
      },
      scoopLitter: () => {
        sounds.play("scoop");
        set((s) => ({
          litterDirt: clamp(s.litterDirt - 70),
          chores: { ...s.chores, scooped: true },
          lastTip: "Scoop clumps every day. Dump the whole box on a schedule. This is the unglamorous half of love.",
        }));
      },
      cleanMess: (id) => {
        sounds.play("wipe");
        set((s) => {
          const messes = s.messes.filter((m) => m.id !== id);
          return {
            messes,
            chores: { ...s.chores, cleaned: messes.length === 0 },
            lastTip:
              messes.length === 0
                ? "Room's clean. Living with a cat means you will do this again."
                : "Still more to pick up. Accidents and fur are part of the contract.",
          };
        });
      },
      cleanAll: () => {
        const s = get();
        if (s.messes.length === 0) {
          set({ lastTip: "Floor is already clear. Check the litter box next." });
          return;
        }
        sounds.play("wipe");
        set({
          messes: [],
          chores: { ...s.chores, cleaned: true },
          lastTip: "You cleaned up after her. That is ownership, not a punishment.",
        });
      },
      giveTreat: () => {
        sounds.play("treat");
        set((s) => ({
          treatPending: true,
          needs: { ...s.needs, hunger: clamp(s.needs.hunger + 6), affection: clamp(s.needs.affection + 4) },
          lastTip: "One treat. Not a handful. Extra calories add up on a tiny Singapura.",
        }));
        window.setTimeout(() => set({ treatPending: false }), 1500);
      },
      togglePlay: (on) => {
        const playSession = on ?? !get().playSession;
        set({
          playSession,
          behavior: playSession ? "hunt" : "idle",
          lastTip: playSession
            ? "Drag the wand or toss the mouse. Stop before she gets tired and mean."
            : "End play with a catch and a snack. That tells her the hunt is over.",
        });
        sounds.play(playSession ? "chirp" : "ui");
      },
      toggleMute: () => {
        const muted = !get().muted;
        sounds.setMuted(muted);
        set({ muted });
      },
      setListening: (listening) => set({ listening }),
      setSpeechError: (speechError) => set({ speechError }),
      startHold: (id, mode, position) => {
        const body = grabBody(id);
        if (body && isToy(id)) {
          body.setBodyType(2, true);
          body.setLinvel({ x: 0, y: 0, z: 0 }, true);
          body.setAngvel({ x: 0, y: 0, z: 0 }, true);
        }
        if (id === "cat") {
          sounds.play(mode === "lift" ? "meowAnnoyed" : "trill");
        } else {
          sounds.play(mode === "lift" ? "plastic" : "bat", 0.6);
        }
        set({
          held: { id, mode, position },
          petting: id === "cat" && mode === "drag",
          lastTip:
            id === "cat" && mode === "lift"
              ? "Two fingers lift her. In real life, support the chest and back legs — and put her down if she squirms."
              : mode === "lift"
                ? `You picked up ${GRAB_LABELS[id]}. Spread fingers to lift higher, then drop it back.`
                : id === "cat"
                  ? "One finger is a pet. Two fingers pick her up."
                  : `Drag ${GRAB_LABELS[id]} on the floor. Two fingers pick it up.`,
        });
      },
      moveHold: (position) => {
        const held = get().held;
        if (!held) return;
        const body = grabBody(held.id);
        if (body) {
          if (held.id === "cat") {
            body.setNextKinematicTranslation({ x: position[0], y: position[1], z: position[2] });
          } else {
            body.setNextKinematicTranslation({ x: position[0], y: position[1], z: position[2] });
          }
        }
        set({ held: { ...held, position } });
        if (held.id === "cat") {
          get().setPosition(position[0], position[2], get().heading);
        }
      },
      endHold: () => {
        const held = get().held;
        if (!held) return;
        const body = grabBody(held.id);
        if (body && isToy(held.id)) {
          body.setBodyType(0, true);
          body.setLinvel({ x: 0, y: -0.4, z: 0 }, true);
        }
        if (held.id === "cat") {
          sounds.play("land", Math.min(1.3, 0.4 + held.position[1]));
          set({
            held: null,
            petting: false,
            behavior: held.position[1] > 0.7 ? "hide" : "sit",
            target: held.position[1] > 0.7 ? ROOM.catTree : null,
            lastTip:
              held.mode === "lift"
                ? "She may walk away after being carried. That is a real cat setting a boundary."
                : get().lastTip,
          });
          sounds.play("purrStop");
          return;
        }
        sounds.play(held.id === "mug" ? "ceramic" : "plastic", 0.5);
        set({ held: null });
      },
      dismissIntro: () => set({ seenIntro: true }),
      resetDay: () =>
        set({
          chores: emptyChores(),
          playSecondsToday: 0,
          simMinutes: 8 * 60,
          day: get().day + 1,
          lastTip: "New day. She still needs food, water, a clean box, play, and a clean floor.",
        }),
    }),
    {
      name: "pura-cat-sim",
      partialize: (s) => ({
        name: s.name,
        needs: s.needs,
        foodBowl: s.foodBowl,
        waterBowl: s.waterBowl,
        litterDirt: s.litterDirt,
        messes: s.messes,
        playSecondsToday: s.playSecondsToday,
        simMinutes: s.simMinutes,
        day: s.day,
        seenIntro: s.seenIntro,
        muted: s.muted,
        chores: s.chores,
      }),
    },
  ),
);

function ignoreReason(intent: CommandIntent, mood: Mood) {
  if (mood === "playful") return "She is mid-hunt in her head. Play first, then ask again.";
  if (mood === "sleepy") return "She heard you and chose the nap. That is allowed.";
  if (mood === "hungry" && intent !== "dinner") return "Food is louder than your words right now.";
  if (mood === "irritable") return "Needs are stacked. Fix the bowl or the box before training.";
  if (mood === "overstimulated") return "She wants space, not a command.";
  return "Cats opt in. Ask once, then earn it with care.";
}

export function guardianScore() {
  const s = useSim.getState();
  return choreScore(s.chores, s.messes, s.playSecondsToday);
}

"use client";

import * as THREE from "three";

/** Procedural canvas textures so the room and the cat read as real materials
 *  without shipping multi-megabyte asset files. Everything is generated once
 *  and cached at module scope. */

const cache = new Map<string, THREE.CanvasTexture>();

function makeCanvas(w: number, h: number) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  return { canvas, ctx: canvas.getContext("2d")! };
}

function toTexture(canvas: HTMLCanvasElement, repeatX = 1, repeatY = 1) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Deterministic pseudo-random so every reload renders the same room. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function woodFloorTexture() {
  const key = "wood";
  const hit = cache.get(key);
  if (hit) return hit;

  const { canvas, ctx } = makeCanvas(1024, 1024);
  const rand = rng(7);
  ctx.fillStyle = "#8a5a34";
  ctx.fillRect(0, 0, 1024, 1024);

  const plankH = 64;
  for (let row = 0; row < 1024 / plankH; row++) {
    let x = -Math.floor(rand() * 200);
    while (x < 1024) {
      const w = 180 + rand() * 160;
      const tone = 0.82 + rand() * 0.36;
      const r = Math.round(138 * tone);
      const g = Math.round(90 * tone);
      const b = Math.round(52 * tone);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x, row * plankH + 2, w - 3, plankH - 4);

      // Grain: long wavy strokes.
      ctx.strokeStyle = `rgba(70,40,18,${0.12 + rand() * 0.14})`;
      ctx.lineWidth = 1 + rand() * 1.4;
      const lines = 3 + Math.floor(rand() * 4);
      for (let i = 0; i < lines; i++) {
        const gy = row * plankH + 6 + rand() * (plankH - 12);
        ctx.beginPath();
        ctx.moveTo(x + 4, gy);
        for (let px = x + 4; px < x + w - 8; px += 26) {
          ctx.lineTo(px, gy + (rand() - 0.5) * 5);
        }
        ctx.stroke();
      }
      // Knots.
      if (rand() < 0.3) {
        const kx = x + 20 + rand() * (w - 40);
        const ky = row * plankH + 12 + rand() * (plankH - 24);
        ctx.fillStyle = "rgba(62,36,16,0.5)";
        ctx.beginPath();
        ctx.ellipse(kx, ky, 5 + rand() * 5, 3 + rand() * 3, rand(), 0, Math.PI * 2);
        ctx.fill();
      }
      // Plank end gap.
      ctx.fillStyle = "rgba(40,22,10,0.85)";
      ctx.fillRect(x + w - 3, row * plankH + 2, 3, plankH - 4);
      x += w;
    }
    // Row gap.
    ctx.fillStyle = "rgba(40,22,10,0.9)";
    ctx.fillRect(0, row * plankH, 1024, 2);
  }

  const tex = toTexture(canvas, 3, 2.4);
  cache.set(key, tex);
  return tex;
}

export function fabricTexture(base: string, key: string, seed = 21) {
  const cacheKey = `fabric:${key}`;
  const hit = cache.get(cacheKey);
  if (hit) return hit;

  const { canvas, ctx } = makeCanvas(256, 256);
  const rand = rng(seed);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 256);
  // Woven cross-hatch noise.
  for (let y = 0; y < 256; y += 2) {
    for (let x = 0; x < 256; x += 2) {
      const v = rand();
      ctx.fillStyle = v > 0.5 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.07)";
      ctx.fillRect(x, y, 2, 1);
      ctx.fillRect(x, y, 1, 2);
    }
  }
  // Slight blotchiness like worn upholstery.
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(0,0,0,${0.02 + rand() * 0.04})`;
    ctx.beginPath();
    ctx.ellipse(rand() * 256, rand() * 256, 12 + rand() * 30, 10 + rand() * 26, rand() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = toTexture(canvas, 2, 2);
  cache.set(cacheKey, tex);
  return tex;
}

export function rugTexture() {
  const key = "rug";
  const hit = cache.get(key);
  if (hit) return hit;

  const { canvas, ctx } = makeCanvas(1024, 768);
  const rand = rng(33);
  ctx.fillStyle = "#7e2a24";
  ctx.fillRect(0, 0, 1024, 768);

  // Mottled pile.
  for (let i = 0; i < 9000; i++) {
    ctx.fillStyle = `rgba(${40 + rand() * 60},${14 + rand() * 22},${14 + rand() * 20},${0.08 + rand() * 0.1})`;
    ctx.fillRect(rand() * 1024, rand() * 768, 2.4, 2.4);
  }

  // Border bands.
  ctx.strokeStyle = "#d9b878";
  ctx.lineWidth = 14;
  ctx.strokeRect(34, 34, 1024 - 68, 768 - 68);
  ctx.strokeStyle = "#3d1512";
  ctx.lineWidth = 6;
  ctx.strokeRect(58, 58, 1024 - 116, 768 - 116);
  ctx.strokeStyle = "#d9b878";
  ctx.lineWidth = 3;
  ctx.strokeRect(70, 70, 1024 - 140, 768 - 140);

  // Central medallion + diamonds.
  ctx.save();
  ctx.translate(512, 384);
  ctx.strokeStyle = "rgba(217,184,120,0.85)";
  ctx.lineWidth = 6;
  for (const s of [210, 150, 92]) {
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s * 1.35, 0);
    ctx.lineTo(0, s);
    ctx.lineTo(-s * 1.35, 0);
    ctx.closePath();
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(217,184,120,0.5)";
  for (let a = 0; a < 8; a++) {
    ctx.save();
    ctx.rotate((a / 8) * Math.PI * 2);
    ctx.beginPath();
    ctx.ellipse(0, -120, 16, 34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  const tex = toTexture(canvas);
  tex.repeat.set(1, 1);
  cache.set(key, tex);
  return tex;
}

export function plasterTexture() {
  const key = "plaster";
  const hit = cache.get(key);
  if (hit) return hit;
  const { canvas, ctx } = makeCanvas(256, 256);
  const rand = rng(55);
  ctx.fillStyle = "#efe4cf";
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = `rgba(${120 + rand() * 60},${100 + rand() * 50},${70 + rand() * 40},${0.05 + rand() * 0.06})`;
    ctx.fillRect(rand() * 256, rand() * 256, 1.6, 1.6);
  }
  const tex = toTexture(canvas, 4, 1.6);
  cache.set(key, tex);
  return tex;
}

export function sisalTexture() {
  const key = "sisal";
  const hit = cache.get(key);
  if (hit) return hit;
  const { canvas, ctx } = makeCanvas(256, 256);
  const rand = rng(77);
  ctx.fillStyle = "#b99a6a";
  ctx.fillRect(0, 0, 256, 256);
  // Wrapped-rope ridges.
  for (let y = 0; y < 256; y += 7) {
    ctx.fillStyle = "rgba(84,60,32,0.55)";
    ctx.fillRect(0, y, 256, 2.4);
    ctx.fillStyle = "rgba(232,210,168,0.4)";
    ctx.fillRect(0, y + 3, 256, 1.4);
  }
  for (let i = 0; i < 700; i++) {
    ctx.fillStyle = `rgba(70,50,26,${0.1 + rand() * 0.16})`;
    ctx.fillRect(rand() * 256, rand() * 256, 2, 1.2);
  }
  const tex = toTexture(canvas, 2, 3);
  cache.set(key, tex);
  return tex;
}

/** Singapura coat: warm ivory-sepia base with dark brown agouti ticking,
 *  deepest along the spine (texture V axis maps roughly along the body). */
export function singapuraCoatTexture() {
  const key = "coat";
  const hit = cache.get(key);
  if (hit) return hit;
  const { canvas, ctx } = makeCanvas(512, 512);
  const rand = rng(99);
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, "#8a6844"); // spine
  grad.addColorStop(0.35, "#b28a5c");
  grad.addColorStop(0.7, "#c6a271");
  grad.addColorStop(1, "#dcc096"); // belly
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Agouti ticking: many short dark strokes.
  for (let i = 0; i < 5200; i++) {
    const y = rand() * 512;
    const spine = 1 - Math.min(1, y / 512) * 0.55;
    ctx.strokeStyle = `rgba(58,36,20,${(0.10 + rand() * 0.2) * spine})`;
    ctx.lineWidth = 0.8 + rand() * 1.1;
    const x = rand() * 512;
    const len = 2 + rand() * 5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (rand() - 0.5) * 3, y + len);
    ctx.stroke();
  }
  const tex = toTexture(canvas, 1, 1);
  cache.set(key, tex);
  return tex;
}

export function artTexture(variant: "leaves" | "sunset") {
  const key = `art:${variant}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const { canvas, ctx } = makeCanvas(256, 320);
  const rand = rng(variant === "leaves" ? 5 : 9);
  if (variant === "leaves") {
    ctx.fillStyle = "#e8e0cd";
    ctx.fillRect(0, 0, 256, 320);
    for (let i = 0; i < 9; i++) {
      const x = 30 + rand() * 196;
      const y = 40 + rand() * 240;
      ctx.strokeStyle = "#40513a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y + 40);
      ctx.quadraticCurveTo(x + 8, y, x, y - 40);
      ctx.stroke();
      ctx.fillStyle = `rgba(${70 + rand() * 30},${110 + rand() * 40},${70 + rand() * 20},0.85)`;
      for (let l = 0; l < 6; l++) {
        ctx.beginPath();
        ctx.ellipse(x + (rand() - 0.5) * 30, y - 30 + l * 12, 5 + rand() * 6, 12 + rand() * 8, (rand() - 0.5) * 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else {
    const grad = ctx.createLinearGradient(0, 0, 0, 320);
    grad.addColorStop(0, "#f4c97e");
    grad.addColorStop(0.55, "#d98a52");
    grad.addColorStop(1, "#5d3a44");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 320);
    ctx.fillStyle = "#f8e6b0";
    ctx.beginPath();
    ctx.arc(128, 170, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(60,40,50,0.85)";
    for (let i = 0; i < 5; i++) {
      const y = 220 + i * 16 + rand() * 6;
      ctx.fillRect(0, y, 256, 4 + rand() * 5);
    }
  }
  const tex = toTexture(canvas);
  cache.set(key, tex);
  return tex;
}

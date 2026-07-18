"use client";

import { useEffect, useRef } from "react";

const GRID_SIZE = 28;
const DOT_RADIUS = 1;
const ATTRACT_RADIUS = 200;
const ATTRACT_STRENGTH = 0.55;
const EASE = 0.12;
const OVERSCAN = ATTRACT_RADIUS;
const HOVER_AMPLITUDE = 3;
const LIGHT_DOT_COLOR = "#b9b9b9";
const DARK_DOT_COLOR = "#3d3d3d";
const SCATTER_SPEED_MIN = 1.2;
const SCATTER_FORCE = 0.16;
const VELOCITY_DAMPING = 0.9;

type Dot = {
  homeX: number;
  homeY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
  speed: number;
};

export default function DotGridCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dots: Dot[] = [];
    let width = 0;
    let height = 0;
    let dpr = 1;
    let dotColor = "#e5e5e5";
    let raf = 0;
    let running = false;
    const mouse = { x: -1e4, y: -1e4, vx: 0, vy: 0 };
    let lastMove = 0;

    const readColor = () => {
      dotColor = document.documentElement.classList.contains("dark")
        ? DARK_DOT_COLOR
        : LIGHT_DOT_COLOR;
    };

    const buildDots = () => {
      dots = [];
      for (
        let y = GRID_SIZE / 2 - OVERSCAN;
        y < height + OVERSCAN;
        y += GRID_SIZE
      ) {
        for (
          let x = GRID_SIZE / 2 - OVERSCAN;
          x < width + OVERSCAN;
          x += GRID_SIZE
        ) {
          dots.push({
            homeX: x,
            homeY: y,
            x,
            y,
            vx: 0,
            vy: 0,
            phase: Math.random() * Math.PI * 2,
            speed: 0.8 + Math.random() * 0.7,
          });
        }
      }
    };

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      buildDots();
      draw();
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = dotColor;
      for (const dot of dots) {
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, DOT_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const step = () => {
      const now = performance.now() / 1000;
      const mouseActive = mouse.x > -1e3;
      const mouseSpeed = Math.hypot(mouse.vx, mouse.vy);
      let settled = true;
      for (const dot of dots) {
        const dx = mouse.x - dot.homeX;
        const dy = mouse.y - dot.homeY;
        const dist = Math.hypot(dx, dy);
        let targetX = dot.homeX;
        let targetY = dot.homeY;
        if (dist < ATTRACT_RADIUS && dist > 0) {
          const pull = (1 - dist / ATTRACT_RADIUS) * ATTRACT_STRENGTH;
          const wobble = HOVER_AMPLITUDE * pull;
          const t = now * dot.speed * 1.2 + dot.phase;
          targetX = dot.homeX + dx * pull + Math.cos(t) * wobble;
          targetY = dot.homeY + dy * pull + Math.sin(t * 1.3) * wobble;
          settled = false;
        }
        if (mouseSpeed > SCATTER_SPEED_MIN && dist < ATTRACT_RADIUS) {
          const cx = mouse.x - dot.x;
          const cy = mouse.y - dot.y;
          const cdist = Math.hypot(cx, cy) || 1;
          const falloff = 1 - dist / ATTRACT_RADIUS;
          const kick =
            Math.min(mouseSpeed - SCATTER_SPEED_MIN, 6) *
            SCATTER_FORCE *
            falloff;
          dot.vx += (-cx / cdist) * kick + mouse.vx * 0.05 * falloff;
          dot.vy += (-cy / cdist) * kick + mouse.vy * 0.05 * falloff;
        }
        dot.vx = (dot.vx + (targetX - dot.x) * EASE) * VELOCITY_DAMPING;
        dot.vy = (dot.vy + (targetY - dot.y) * EASE) * VELOCITY_DAMPING;
        dot.x += dot.vx;
        dot.y += dot.vy;
        if (
          Math.abs(targetX - dot.x) > 0.05 ||
          Math.abs(targetY - dot.y) > 0.05 ||
          Math.abs(dot.vx) > 0.02 ||
          Math.abs(dot.vy) > 0.02
        ) {
          settled = false;
        }
      }
      mouse.vx *= 0.8;
      mouse.vy *= 0.8;
      draw();
      if (settled && !mouseActive) {
        running = false;
        return;
      }
      raf = requestAnimationFrame(step);
    };

    const wake = () => {
      if (!running) {
        running = true;
        raf = requestAnimationFrame(step);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = parent.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const dt = Math.max(e.timeStamp - lastMove, 8);
      if (mouse.x > -1e3) {
        // px per ms, smoothed
        mouse.vx = mouse.vx * 0.7 + ((x - mouse.x) / dt) * 0.3;
        mouse.vy = mouse.vy * 0.7 + ((y - mouse.y) / dt) * 0.3;
      }
      lastMove = e.timeStamp;
      mouse.x = x;
      mouse.y = y;
      wake();
    };

    const onPointerLeave = () => {
      mouse.x = -1e4;
      mouse.y = -1e4;
      mouse.vx = 0;
      mouse.vy = 0;
      wake();
    };

    readColor();
    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(parent);

    const themeObserver = new MutationObserver(() => {
      readColor();
      draw();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    parent.addEventListener("pointermove", onPointerMove);
    parent.addEventListener("pointerleave", onPointerLeave);

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      themeObserver.disconnect();
      parent.removeEventListener("pointermove", onPointerMove);
      parent.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden
    />
  );
}

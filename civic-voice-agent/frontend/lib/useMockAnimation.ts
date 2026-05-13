"use client";

import { useEffect, useRef, RefObject } from "react";

const SCENES = ["normal", "obstruction", "pedestrian", "accident", "normal"];

interface Car {
  x: number;
  y: number;
  speed: number;
  color: string;
}

interface State {
  cars: Car[];
  pedX: number;
  stripeOffset: number;
}

export function useMockAnimation(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  enabled: boolean,
) {
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const state: State = {
      cars: [
        { x: 0.32, y: 0, speed: 2.2, color: "#ef4444" },
        { x: 0.52, y: -180, speed: 1.6, color: "#3b82f6" },
        { x: 0.72, y: -360, speed: 1.9, color: "#22c55e" },
      ],
      pedX: -0.1,
      stripeOffset: 0,
    };

    const tick = () => {
      const sceneIdx = Math.floor(Date.now() / 30000) % SCENES.length;
      draw(ctx, canvas.width, canvas.height, state, SCENES[sceneIdx]);
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [enabled, canvasRef]);
}

function draw(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  state: State,
  scene: string,
) {
  ctx.fillStyle = "#1a1f28";
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "#0f141c";
  ctx.fillRect(0, 0, w * 0.15, h);
  ctx.fillRect(w * 0.85, 0, w * 0.15, h);

  state.stripeOffset = (state.stripeOffset + 4) % 60;
  ctx.fillStyle = "#facc15";
  for (let y = -60; y < h + 60; y += 60) {
    ctx.fillRect(w / 2 - 3, y + state.stripeOffset, 6, 30);
  }

  ctx.fillStyle = "#e6e8eb";
  ctx.fillRect(w * 0.18, 0, 3, h);
  ctx.fillRect(w * 0.82 - 3, 0, 3, h);

  for (let i = 0; i < state.cars.length; i++) {
    const car = state.cars[i];
    const stopped =
      (scene === "obstruction" && i === 0) ||
      (scene === "accident" && i < 2);
    if (!stopped) {
      car.y += car.speed;
      if (car.y > h + 80) car.y = -80;
    }
    drawCar(
      ctx,
      car.x * w,
      car.y,
      car.color,
      scene === "accident" && i === 1 ? 0.15 : 0,
    );
  }

  if (scene === "pedestrian") {
    state.pedX += 0.004;
    if (state.pedX > 1.1) state.pedX = -0.1;
    drawPedestrian(ctx, state.pedX * w, h * 0.5);
  } else {
    state.pedX = -0.1;
  }

  ctx.fillStyle = "rgba(11, 14, 20, 0.75)";
  ctx.fillRect(10, 10, 170, 28);
  ctx.fillStyle = "#facc15";
  ctx.font = "bold 12px ui-monospace, Menlo, monospace";
  ctx.fillText("● MOCK FEED · LIVE", 18, 28);

  ctx.fillStyle = "#22c55e";
  ctx.font = "11px ui-monospace, Menlo, monospace";
  const ts = new Date().toLocaleTimeString();
  ctx.fillText(ts, w - 92, 28);

  ctx.fillStyle = "rgba(11, 14, 20, 0.75)";
  ctx.fillRect(10, h - 36, 220, 26);
  ctx.fillStyle = "#e6e8eb";
  ctx.font = "11px ui-monospace, Menlo, monospace";
  ctx.fillText(`scene: ${scene}`, 18, h - 18);
}

function drawCar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  color: string,
  rotate = 0,
) {
  ctx.save();
  ctx.translate(cx, y + 35);
  ctx.rotate(rotate * Math.PI);
  ctx.fillStyle = color;
  ctx.fillRect(-20, -35, 40, 70);
  ctx.fillStyle = "#0b0e14";
  ctx.fillRect(-16, -28, 32, 18);
  ctx.fillRect(-16, 10, 32, 14);
  ctx.restore();
}

function drawPedestrian(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = "#fbbf24";
  ctx.beginPath();
  ctx.arc(x, y, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - 5, y + 6, 10, 18);
  ctx.strokeStyle = "#fbbf24";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 5, y + 24);
  ctx.lineTo(x - 5, y + 38);
  ctx.moveTo(x + 5, y + 24);
  ctx.lineTo(x + 5, y + 38);
  ctx.stroke();
}

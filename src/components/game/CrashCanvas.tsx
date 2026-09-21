import { useEffect, useRef } from "react";
import { useGame } from "@/lib/crash/store";

const CELL = 128;
const STAR_COUNT = 70;

type Star = { x: number; y: number; r: number; a: number };

function load(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function CrashCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let running = true;
    let rocket: HTMLImageElement | null = null;
    let boom: HTMLImageElement | null = null;
    void Promise.all([load("/apogee/rocket.png"), load("/apogee/boom.png")]).then(
      ([r, b]) => {
        rocket = r;
        boom = b;
      },
    );

    const stars: Star[] = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.4 + Math.random() * 1.4,
      a: 0.25 + Math.random() * 0.7,
    }));

    let last = performance.now();
    let flight = 0;
    let boomT = 0;
    let prevPhase = useGame.getState().phase;
    const path: { x: number; y: number }[] = [];

    const loop = (now: number) => {
      if (!running) return;
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const state = useGame.getState();

      if (state.phase === "flying" && prevPhase !== "flying") {
        flight = 0;
        path.length = 0;
        boomT = 0;
      }
      if (state.phase === "crashed" && prevPhase === "flying") boomT = 0;
      if (state.phase === "betting" && prevPhase !== "betting") {
        flight = 0;
        path.length = 0;
        boomT = 0;
      }
      prevPhase = state.phase;

      if (state.phase === "flying") {
        flight += dt;
        state.tick(flight);
      }
      if (state.phase === "crashed") boomT += dt;

      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const shake = state.phase === "crashed" && boomT < 0.45 ? (0.45 - boomT) * 18 : 0;
      const ox = (Math.random() - 0.5) * shake;
      const oy = (Math.random() - 0.5) * shake;

      ctx.fillStyle = "#07080d";
      ctx.fillRect(0, 0, w, h);
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#10131c");
      g.addColorStop(0.55, "#07080d");
      g.addColorStop(1, "#140c08");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.translate(ox, oy);

      for (const s of stars) {
        ctx.fillStyle = `rgba(244,239,230,${s.a})`;
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      const padL = 28;
      const padB = 28;
      const padT = 72;
      const padR = 40;
      const plotW = w - padL - padR;
      const plotH = h - padT - padB;
      const tVis = Math.max(flight, 0.001);
      const maxT = Math.max(8, tVis * 1.15);
      const maxM = Math.max(2, useGame.getState().multiplier * 1.25);
      const xAt = (sec: number) => padL + (sec / maxT) * plotW;
      const yAt = (m: number) => padT + plotH - (Math.log(m) / Math.log(maxM)) * plotH;

      ctx.strokeStyle = "rgba(139,147,167,0.18)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padL, padT);
      ctx.lineTo(padL, h - padB);
      ctx.lineTo(w - padR, h - padB);
      ctx.stroke();

      const mx = xAt(tVis);
      const my = yAt(useGame.getState().multiplier);
      if (state.phase !== "betting") {
        path.push({ x: mx, y: my });
        if (path.length > 400) path.shift();
        ctx.beginPath();
        ctx.strokeStyle = state.phase === "crashed" ? "#ff6a2a" : "#f4efe6";
        ctx.lineWidth = 2.5;
        ctx.lineJoin = "round";
        path.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
      }

      if (state.phase === "crashed" && boom) {
        const frame = Math.min(3, Math.floor(boomT * 10));
        const sx = (frame % 2) * CELL;
        const sy = Math.floor(frame / 2) * CELL;
        const size = 110;
        ctx.drawImage(boom, sx, sy, CELL, CELL, mx - size / 2, my - size / 2, size, size);
      } else if (rocket && (state.phase === "flying" || state.phase === "betting")) {
        const frame = Math.floor(now / 90) % 4;
        const sx = (frame % 2) * CELL;
        const sy = Math.floor(frame / 2) * CELL;
        const size = 72;
        const x = state.phase === "betting" ? padL + 8 : mx - size / 2;
        const y = state.phase === "betting" ? h - padB - size - 4 : my - size / 2;
        ctx.drawImage(rocket, sx, sy, CELL, CELL, x, y, size, size);
      }

      ctx.restore();
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 size-full" aria-hidden />;
}

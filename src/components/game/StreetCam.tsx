import { useEffect, useRef } from "react";
import { useGame, type Clip } from "@/lib/street/store";

const CLIPS: Record<Clip, string> = {
  idle: "/stoop/idle.mp4",
  cal: "/stoop/cal.mp4",
  ned: "/stoop/ned.mp4",
};

export function StreetCam() {
  const clip = useGame((s) => s.clip);
  const clipNonce = useGame((s) => s.clipNonce);
  const clipEnded = useGame((s) => s.clipEnded);
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.src = CLIPS[clip];
    el.loop = clip === "idle";
    el.muted = true;
    void el.play().catch(() => undefined);
  }, [clip, clipNonce]);

  return (
    <video
      ref={ref}
      className="absolute inset-0 size-full object-cover"
      poster="/stoop/poster.jpg"
      playsInline
      muted
      autoPlay
      onEnded={clipEnded}
      aria-label="Street dice camera"
    />
  );
}

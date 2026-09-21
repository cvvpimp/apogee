import { useEffect, useRef } from "react";
import { useGame, type Clip } from "@/lib/blackjack/store";

const CLIPS: Record<Clip, string> = {
  idle: "/dealer/idle.mp4",
  shuffle: "/dealer/shuffle.mp4",
  deal: "/dealer/deal.mp4",
  talk: "/dealer/talk.mp4",
};

export function DealerCam() {
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
    el.playsInline = true;
    void el.play().catch(() => undefined);
  }, [clip, clipNonce]);

  return (
    <video
      ref={ref}
      className="absolute inset-0 size-full object-cover object-[center_20%]"
      poster="/dealer/poster.jpg"
      playsInline
      muted
      autoPlay
      onEnded={clipEnded}
      aria-label="Live dealer camera"
    />
  );
}

import { Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { useGame } from "@/lib/blackjack/store";
import { cn } from "@/lib/utils";

const PROMPTS = ["What should I do?", "How does blackjack pay?", "Shuffle again"];

export function Dealer() {
  const vicLine = useGame((s) => s.vicLine);
  const chat = useGame((s) => s.chat);
  const busy = useGame((s) => s.chatBusy);
  const sendChat = useGame((s) => s.sendChat);
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    void sendChat(text);
    setDraft("");
    setOpen(true);
  }

  return (
    <div className="rounded-[20px] bg-ink/80 p-3 shadow-[inset_0_0_0_1px_rgba(232,220,196,0.1)]">
      <button
        type="button"
        className="flex w-full items-start gap-3 text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="mt-0.5 font-table text-[10px] tracking-[0.2em] text-line uppercase">
          Lottie
        </span>
        <p className="min-w-0 flex-1 font-display text-[15px] leading-snug text-cream">
          {vicLine}
        </p>
      </button>

      {open ? (
        <div className="mt-3 flex flex-col gap-2">
          <div className="max-h-32 space-y-1.5 overflow-y-auto">
            {chat.map((m) => (
              <p
                key={m.id}
                className={cn(
                  "rounded-[10px] px-2.5 py-1 text-sm leading-snug",
                  m.role === "you"
                    ? "ml-8 bg-cream/10 text-cream"
                    : "mr-4 bg-rail/80 text-cream/90",
                )}
              >
                {m.text}
              </p>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                disabled={busy}
                onClick={() => void sendChat(p)}
                className="rounded-full border border-cream/15 px-2.5 py-1 font-table text-[10px] tracking-wider text-muted uppercase hover:border-cream/35 hover:text-cream"
              >
                {p}
              </button>
            ))}
          </div>
          <form onSubmit={onSubmit} className="flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Talk to Lottie"
              maxLength={400}
              className="h-11 min-w-0 flex-1 rounded-[10px] border border-cream/15 bg-ink/50 px-3 text-sm text-cream placeholder:text-muted/70 focus:border-line/50 focus:outline-none"
            />
            <Button
              type="submit"
              variant="rail"
              size="icon"
              disabled={busy || !draft.trim()}
              aria-label="Send"
            >
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

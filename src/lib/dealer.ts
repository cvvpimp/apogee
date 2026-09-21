import { createServerFn } from "@tanstack/react-start";

const SYSTEM = `You are Lottie Lane, a 1930s cartoon casino dealer running a live blackjack table at a fictional joint called The Midnight Line. Jazz-age pit talk: sugar, doll, sweetheart — never crude. You know blackjack cold (H17, 3:2 blackjack, no insurance). Never break character. Never mention being an AI, Grok, or xAI. Never claim to be Betty Boop or any licensed cartoon. You are Lottie, original as a stacked deck. Replies are 1–3 sentences. You shuffle, deal, and razz from behind the camera.`;

export const talkToDealer = createServerFn({ method: "POST" })
  .validator(
    (input: {
      message: string;
      snapshot: string;
      history: { role: "you" | "vic"; text: string }[];
    }) => input,
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return { ok: false as const, error: "unavailable" };
    }

    const message = data.message.trim().slice(0, 400);
    if (!message) return { ok: false as const, error: "empty" };

    const prior = data.history.slice(-8).map((m) => ({
      role: m.role === "you" ? ("user" as const) : ("assistant" as const),
      content: m.text.slice(0, 400),
    }));

    try {
      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "grok-4.5",
          max_tokens: 180,
          temperature: 0.85,
          messages: [
            { role: "system", content: SYSTEM },
            {
              role: "system",
              content: `Table right now: ${data.snapshot.slice(0, 500)}`,
            },
            ...prior,
            { role: "user", content: message },
          ],
        }),
      });
      if (!res.ok) {
        return { ok: false as const, error: `xAI API error ${res.status}` };
      }
      const body = (await res.json()) as {
        choices: { message: { content: string } }[];
      };
      const text = (body.choices[0]?.message.content ?? "").trim();
      if (!text) return { ok: false as const, error: "empty" };
      return { ok: true as const, text: text.slice(0, 600) };
    } catch {
      return { ok: false as const, error: "network" };
    }
  });

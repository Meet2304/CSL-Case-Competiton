/**
 * Findoe, the advisor's assistant: Claude Haiku 5.5 grounded in the settlement
 * rulebook's output for one client. The browser sends the client context (built
 * by findoeContext) and the conversation; this streams back plain text.
 *
 * Only signed-in advisors may call it. Without an API key it answers 503
 * { offline: true } and the browser falls back to the simulated assistant.
 */
import Anthropic from "@anthropic-ai/sdk";
import { cookies } from "next/headers";
import { parseRole, SESSION_COOKIE } from "@/lib/session";

const MODEL = "claude-haiku-5-5";
const MAX_CONTEXT_CHARS = 60_000;
const MAX_TURNS = 30;

const SYSTEM = `You are Findoe, the assistant inside PNC's advisor workbench. You help a wealth advisor decide and carry out the next steps for one client — often a family that has just lost someone.

How you work:
- The CLIENT CONTEXT is your only source of facts. It comes from the bank's records and from a deterministic settlement rulebook that has already decided every legal route, date and threshold. Never invent or change a route, a date, a dollar amount, a legal rule or a citation. If something isn't in the context, say you don't have it and, if it matters, which open question the advisor should confirm.
- When you mention a legal point, cite it exactly as the context does (e.g. 20 Pa.C.S. § 6304).
- Personalize: use the client's notes, contact preference, family situation and history to tell the advisor how to approach the step, not just what it is.
- Be practical and brief: lead with the answer or the action, then the reason. Short paragraphs or a short list. No headings, no preamble, no sign-off.
- With a grieving client, model a gentle tone: condolence first, no pressure, nothing urgent unless a date truly requires it.
- You give general guidance, not legal or tax advice; steps marked for sign-off need a professional before they're final. Say so only when it matters to the question.
- All client data is mock data for a prototype.`;

type Turn = { role: "user" | "assistant"; content: string };

function isTurns(x: unknown): x is Turn[] {
  return (
    Array.isArray(x) &&
    x.length > 0 &&
    x.length <= MAX_TURNS &&
    x.every(
      (t) =>
        t &&
        (t.role === "user" || t.role === "assistant") &&
        typeof t.content === "string" &&
        t.content.length > 0 &&
        t.content.length <= 8_000,
    ) &&
    x[0].role === "user" &&
    x.at(-1).role === "user"
  );
}

const hasCredentials = () => !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
const isAdvisor = async () => parseRole((await cookies()).get(SESSION_COOKIE)?.value) === "advisor";

/** Whether Findoe can reach Claude, so the panel can say so before the first question. */
export async function GET() {
  if (!(await isAdvisor())) return Response.json({ error: "Advisors only" }, { status: 401 });
  return Response.json({ live: hasCredentials(), model: MODEL });
}

export async function POST(request: Request) {
  if (!(await isAdvisor())) return Response.json({ error: "Advisors only" }, { status: 401 });

  let body: { context?: unknown; messages?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { context, messages } = body;
  if (typeof context !== "string" || context.length > MAX_CONTEXT_CHARS || !isTurns(messages))
    return Response.json({ error: "Invalid request" }, { status: 400 });

  if (!hasCredentials()) return Response.json({ offline: true }, { status: 503 });

  const client = new Anthropic();
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 16000,
    // Conversational advice over a fixed context: low effort keeps replies quick.
    output_config: { effort: "low" },
    system: [
      { type: "text", text: SYSTEM },
      {
        type: "text",
        text: `CLIENT CONTEXT\n\n${context}`,
        // The context is identical for every question about this client.
        cache_control: { type: "ephemeral" },
      },
    ],
    messages,
  });

  const encoder = new TextEncoder();
  const body$ = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta")
            controller.enqueue(encoder.encode(event.delta.text));
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal")
          controller.enqueue(encoder.encode("\n\nI can't help with that one."));
        else if (final.stop_reason === "max_tokens")
          controller.enqueue(encoder.encode("\n\n(Reply cut short.)"));
        controller.close();
      } catch (error) {
        const message =
          error instanceof Anthropic.AuthenticationError
            ? "Findoe can't reach Claude: the API key was rejected."
            : error instanceof Anthropic.RateLimitError
              ? "Findoe is rate-limited right now. Try again in a moment."
              : error instanceof Anthropic.APIError
                ? `Findoe hit an API error (${error.status ?? "network"}). Try again.`
                : "Findoe lost the connection. Try again.";
        controller.enqueue(encoder.encode(`\n\n${message}`));
        controller.close();
      }
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(body$, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}

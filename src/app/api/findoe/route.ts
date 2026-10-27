/**
 * Findoe, the advisor's assistant: Claude Haiku 5.5 grounded in the settlement
 * rulebook's output for one client. The browser sends the client context (built
 * by findoeContext) and the conversation; this streams back plain text.
 *
 * Only signed-in advisors may call it. It reaches Claude, in order of
 * preference, with:
 * 1. ANTHROPIC_API_KEY (or ANTHROPIC_AUTH_TOKEN): straight to the Claude API.
 * 2. AI_GATEWAY_API_KEY: through Vercel AI Gateway.
 * 3. Nothing at all when deployed on Vercel: AI Gateway accepts the
 *    deployment's own OIDC token (VERCEL_OIDC_TOKEN, or the
 *    x-vercel-oidc-token request header), billed to the Vercel team.
 * With none of these it answers 503 { offline: true } and the browser falls
 * back to the simulated assistant.
 */
import Anthropic from "@anthropic-ai/sdk";
import { cookies, headers } from "next/headers";
import { parseRole, SESSION_COOKIE } from "@/lib/session";

const MODEL = "claude-haiku-5-5";
const GATEWAY_URL = "https://ai-gateway.vercel.sh";
const GATEWAY_MODEL = "anthropic/claude-haiku-5.5";
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

type Connection = { client: Anthropic; model: string; via: "anthropic" | "gateway" };

/** How to reach Claude from this request, or null when no credentials are available. */
async function connect(): Promise<Connection | null> {
  if (process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN)
    return { client: new Anthropic(), model: MODEL, via: "anthropic" };
  const gatewayKey =
    process.env.AI_GATEWAY_API_KEY ||
    process.env.VERCEL_OIDC_TOKEN ||
    (await headers()).get("x-vercel-oidc-token");
  if (gatewayKey)
    return {
      client: new Anthropic({ apiKey: gatewayKey, baseURL: GATEWAY_URL }),
      model: GATEWAY_MODEL,
      via: "gateway",
    };
  return null;
}

const isAdvisor = async () => parseRole((await cookies()).get(SESSION_COOKIE)?.value) === "advisor";

/** Whether Findoe can reach Claude, so the panel can say so before the first question. */
export async function GET() {
  if (!(await isAdvisor())) return Response.json({ error: "Advisors only" }, { status: 401 });
  const connection = await connect();
  return Response.json({ live: connection !== null, model: MODEL, via: connection?.via ?? null });
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

  const connection = await connect();
  if (!connection) return Response.json({ offline: true }, { status: 503 });

  const stream = connection.client.messages.stream({
    model: connection.model,
    max_tokens: 16000,
    // Conversational advice over a fixed context: low effort keeps replies quick. Sent only
    // to the Claude API directly; AI Gateway gets the model's default.
    ...(connection.via === "anthropic" && { output_config: { effort: "low" as const } }),
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

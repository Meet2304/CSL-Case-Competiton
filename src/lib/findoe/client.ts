/**
 * Asks Findoe (src/app/api/findoe) and streams the reply. Resolves to
 * "offline" when no API key is configured, so the caller can fall back to the
 * simulated assistant.
 */
export type FindoeTurn = { role: "user" | "assistant"; content: string };

/** True when the server has Claude credentials configured. */
export async function findoeIsLive(): Promise<boolean> {
  try {
    const res = await fetch("/api/findoe", { cache: "no-store" });
    return res.ok && (await res.json()).live === true;
  } catch {
    return false;
  }
}

export async function askFindoe({
  context,
  messages,
  onText,
  signal,
}: {
  context: string;
  messages: FindoeTurn[];
  onText: (chunk: string) => void;
  signal?: AbortSignal;
}): Promise<"ok" | "offline"> {
  const res = await fetch("/api/findoe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ context, messages }),
    signal,
  });
  if (res.status === 503) return "offline";
  if (!res.ok || !res.body) throw new Error(`Findoe request failed (${res.status})`);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    onText(decoder.decode(value, { stream: true }));
  }
  return "ok";
}

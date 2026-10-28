/**
 * Lets any page hand Findoe a question ("Ask Findoe" buttons): the panel
 * opens and asks it as if typed. A window event, so pages don't need to know
 * where Findoe is mounted.
 */
const EVENT = "findoe:ask";

export function askFindoe(question: string) {
  window.dispatchEvent(new CustomEvent<string>(EVENT, { detail: question }));
}

/** Subscribes to questions sent with `askFindoe`; returns the unsubscribe. */
export function onAskFindoe(handler: (question: string) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<string>).detail);
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}

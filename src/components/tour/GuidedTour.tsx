"use client";

import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore } from "react";
import { resetDemo } from "@/components/advisor/RecordDeathDialog";
import { FindoeLogo } from "@/components/brand/FindoeLogo";
import {
  FILM_STYLE,
  find,
  inView,
  rectOf,
  setValue,
  sleep,
  waitFor,
} from "@/components/film/driver";
import { useHashTab } from "@/components/shared/useHashTab";
import {
  savingsBeneficiaries,
  tourLoss,
  tourPeople,
  tourProducts,
  tourScenes,
  tourStops,
  tourWillDraft,
} from "@/data/tour";
import { bereavementActions, currentBereavement } from "@/lib/bereavement";
import { visiblePart, type Rect, type Target } from "@/lib/film";
import { filmSignIn, filmSignOut } from "@/lib/filmSession";
import { householdActions } from "@/lib/householdStore";
import { routes } from "@/lib/routes";
import {
  cameraFor,
  frameIds,
  pageToStage,
  planStop,
  productOf,
  stageLayout,
  viewportFor,
  type FrameId,
  type StageLayout,
  type TourFocus,
  type TourCast,
  type TourStep,
  type TourStop,
  type TourWorld,
} from "@/lib/tour";
import { REVIEW_SCREEN, screens } from "@/lib/will/flow";
import { saveWill, setWillStatus } from "@/lib/will/storage";
import { Cast } from "./Cast";
import { Ecosystem } from "./Ecosystem";
import { Frame, GLIDE_MS, hiddenFrame, MOVE_MS, VEIL_MS, type FrameView } from "./Frame";
import { Memorial } from "./Memorial";
import { Notes, type PlacedNote } from "./Notes";
import { Products } from "./Products";

const stopIds = tourStops.map((s) => s.id);
/** The keys the stage answers to; inside a card they are handed back to it. */
const stageKeys = new Set(["ArrowRight", "ArrowLeft", "PageDown", "PageUp", " ", "Home", "Escape"]);
const lastStop = tourStops.length - 1;

// The stage fills the window; its size is read from the browser rather than kept in state.
function subscribeToStage(onChange: () => void) {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}
const readStage = () => `${window.innerWidth}x${window.innerHeight}`;
const noStage = () => "";

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

type Views = Record<FrameId, FrameView>;
const allHidden = Object.fromEntries(frameIds.map((id) => [id, hiddenFrame])) as Views;

/**
 * Puts John's will where the story needs it: not started yet (what the bank
 * knows already filled in, for him to go through), or signed and on file.
 */
function seedWill(status: "none" | "on-file") {
  if (status === "none") {
    saveWill(tourLoss.personId, { draft: tourWillDraft });
    setWillStatus(tourLoss.personId, "none");
    return;
  }
  saveWill(tourLoss.personId, {
    draft: tourWillDraft,
    progress: {
      screen: REVIEW_SCREEN,
      furthest: screens.length - 1,
      answered: screens.map((s) => s.id),
      returnToReview: false,
    },
  });
  setWillStatus(tourLoss.personId, status);
}

/**
 * Puts the demo's saved state where a scene needs it. Before John has put his
 * affairs in order, everything starts clean. After that, his will is on file
 * and his Savings names the children. Once he has died the bank has recorded
 * it and has Maya's copy of the certificate; after that his advisor has begun
 * the transfer. Moving forward these are what the people on stage just did,
 * so this only fills in what is missing; jumping in or stepping back
 * (`fresh`), it rebuilds them.
 */
function prepareWorld(world: TourWorld, fresh: boolean) {
  if (world === "before") {
    if (!fresh) return;
    resetDemo();
    seedWill("none");
    return;
  }
  if (fresh) resetDemo();
  seedWill("on-file");
  householdActions.setBeneficiaries(
    "acct-jordan-savings",
    savingsBeneficiaries.map((p) => p.id),
  );
  if (world === "ready") return;
  if (!currentBereavement().losses.some((l) => l.personName === tourLoss.personName))
    bereavementActions.recordLoss({
      personName: tourLoss.personName,
      date: tourLoss.date,
      reportedVia: tourLoss.reportedVia,
      recordedOn: tourLoss.date,
    });
  // Maya sent the bank John's death certificate; the advisor saw it verified.
  if (!currentBereavement().deathCertificate)
    bereavementActions.uploadCertificate("death-certificate.pdf", tourLoss.date);
  if (world === "loss") return;
  if (!currentBereavement().transfers?.[tourLoss.personId])
    bereavementActions.initiateTransfer(tourLoss.personId, new Date().toISOString());
}

/**
 * A still copy of a page as it looks now: its markup and styles, with what was
 * typed into its fields, and nothing that runs.
 */
function snapshot(page: Document) {
  const copy = page.documentElement.cloneNode(true) as HTMLElement;
  const fields = page.querySelectorAll<HTMLInputElement>("input, textarea, select");
  copy.querySelectorAll<HTMLInputElement>("input, textarea, select").forEach((field, i) => {
    const from = fields[i];
    if (!from) return;
    if (field instanceof HTMLTextAreaElement) field.textContent = from.value;
    else field.setAttribute("value", from.value);
    if (from.checked) field.setAttribute("checked", "");
  });
  copy.querySelectorAll("script, noscript, iframe").forEach((n) => n.remove());
  const base = page.createElement("base");
  base.href = page.location.href;
  copy.querySelector("head")?.prepend(base);
  return `<!doctype html>${copy.outerHTML}`;
}

/** Whether React has taken over an element, so it answers clicks and typing. */
function awake(el: Element) {
  return Object.keys(el).some((k) => k.startsWith("__reactProps"));
}

/** Scrolls a page so the element can be seen, and waits for the page to come to rest. */
async function reveal(el: HTMLElement, smooth: boolean) {
  const view = el.ownerDocument.defaultView;
  if (!view || inView(el)) return;
  const fits = el.getBoundingClientRect().height + 48 <= view.innerHeight;
  el.scrollIntoView({
    block: fits ? "center" : "start",
    inline: "nearest",
    behavior: smooth ? "smooth" : "instant",
  });
  let last = Number.NaN;
  for (let i = 0; i < 16; i++) {
    await sleep(smooth ? 90 : 16);
    if (view.scrollY === last) break;
    last = view.scrollY;
  }
  // scrollIntoView also scrolls whatever holds the frame, which would shift the picture.
  const frame = view.frameElement;
  for (let box = frame?.parentElement; box; box = box.parentElement) box.scrollTo(0, 0);
  frame?.ownerDocument.defaultView?.scrollTo(0, 0);
}

/** The first stop after `at` that shows screens, if only moments with the family lie between. */
function nextScreens(at: number): number | null {
  for (let n = at + 1; n < tourStops.length; n++) if (tourStops[n].scene) return n;
  return null;
}

/**
 * The guided tour: one family's story on a plain white stage. Between acts
 * the stage shows the family themselves; within an act, the working app, one
 * card per person, with a spotlight on the one thing that matters. Four small
 * dots at the top say which part of Findoe is on stage. The stop lives in the
 * URL hash; the arrow keys step through it, and each press plays one stop
 * and then rests.
 *
 * Every press answers at once. Pressing on while a stop is still playing
 * finishes it straight away and moves on; pressing back always works. The
 * screens of the next act are loaded, out of sight, while the family is on
 * stage, and a card never goes blank: a new page fades in over the old one.
 */
export function GuidedTour() {
  const [stopId, setStopId] = useHashTab(stopIds);
  const index = stopIds.indexOf(stopId);
  const stop = tourStops[index];
  const stageKey = useSyncExternalStore(subscribeToStage, readStage, noStage);
  const [w, h] = stageKey ? stageKey.split("x").map(Number) : [0, 0];
  // Side-by-side screens cannot be read on a phone, so the tour asks for more room instead.
  const cramped = stageKey !== "" && (w < 900 || h < 520);
  const layout = stageKey && !cramped ? stageLayout(w, h) : null;

  const [views, setViews] = useState<Views>(allHidden);
  /** Notes beside a card, placed once the stop has settled. */
  const [notes, setNotes] = useState<{ at: number; placed: PlacedNote[] } | null>(null);
  /** The stop that has finished playing; the stage is at rest only while it is the one showing. */
  const [settledAt, setSettledAt] = useState<number | null>(null);
  const settled = settledAt === index;
  /** The moment with the family on stage. It stays until the screens that replace it are ready. */
  const [castOn, setCastOn] = useState<TourCast | null>(stop.cast ?? null);

  const iframes = useRef<Partial<Record<FrameId, HTMLIFrameElement | null>>>({});
  const loaded = useRef<Partial<Record<FrameId, () => void>>>({});
  /** Waiting for a card's still copy (`cover`) to be drawn. */
  const covered = useRef<Partial<Record<FrameId, () => void>>>({});
  /** Lets a card's page scroll again once its still copy is lifted. */
  const held = useRef<Partial<Record<FrameId, () => void>>>({});
  /** What each card's camera is framing, and how its page is laid out, as the run last set them. */
  const live = useRef<Views>(allHidden);
  const stage = useRef<StageLayout | null>(null);
  /** Who the browser is signed in as; the app's pages share one session. */
  const session = useRef<FrameId | "nobody" | null>(null);
  /** Sign-ins happen one at a time, in the order they were asked for. */
  const signing = useRef<Promise<void>>(Promise.resolve());
  /** Counts the runs, so a run that has been overtaken by a newer stop stops. */
  const run = useRef(0);
  const previous = useRef<number | null>(null);
  /** Whether the stop on stage finished playing (a ref, so a run can read it as it starts). */
  const finished = useRef(false);
  /** The presenter pressed on while the stop was playing: finish it at once... */
  const hurry = useRef(false);
  /** ...and then move on, once for every press. */
  const queued = useRef(0);
  /** Each page loaded gets its own key, so an old page and its replacement never share one. */
  const pageKeys = useRef(0);
  /** The next act's screens, loaded out of sight while the family is on stage. */
  const staged = useRef<{ scene: string; ready: Promise<boolean> } | null>(null);
  const stageRun = useRef(0);

  useEffect(() => {
    stage.current = layout;
  });

  const go = (n: number) => setStopId(stopIds[Math.min(Math.max(n, 0), lastStop)]);

  const settle = (done: number | null) => {
    finished.current = done !== null;
    setSettledAt(done);
  };

  const patch = (id: FrameId, change: Partial<FrameView>) => {
    live.current = { ...live.current, [id]: { ...live.current[id], ...change } };
    setViews(live.current);
  };

  const doc = (id: FrameId) => () => iframes.current[id]?.contentDocument;
  /** Whether steps should be run at once rather than played out. */
  const brisk = (fast: boolean) => fast || hurry.current;

  /** The size of a card's page, for clipping what the camera frames. */
  const pageSize = (id: FrameId) => {
    const view = live.current[id];
    const rect = stage.current?.slots[view.slot];
    return rect ? viewportFor(rect, view.width) : { w: view.width, h: 800 };
  };

  /** A card's page as it looks now (its width and camera), to keep on screen while the next loads. */
  const freeze = (id: FrameId): FrameView["old"] => {
    const view = live.current[id];
    if (!view.shown || !view.page) return undefined;
    const cam = cameraFor(pageSize(id), view.focus, { maxZoom: view.maxZoom, fit: view.fit });
    return {
      key: view.page.key,
      src: view.page.src,
      width: view.width,
      transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.scale})`,
    };
  };

  const signInAs = (id: FrameId | "nobody") => {
    signing.current = signing.current.then(async () => {
      if (session.current === id) return;
      if (id === "nobody") await filmSignOut();
      else await filmSignIn(tourPeople[id].userId);
      session.current = id;
    });
    return signing.current;
  };

  /** Loads a page of the app in a card and waits for it; the page it replaces stays until then. */
  const load = (id: FrameId, path: string, old?: FrameView["old"]) =>
    new Promise<void>((resolve) => {
      loaded.current[id] = resolve;
      patch(id, { old, page: { key: ++pageKeys.current, src: path }, veil: true });
      setTimeout(resolve, 20_000);
    });

  /** Points a card's camera at an element, or at the whole page. */
  const frame = (id: FrameId, el: HTMLElement | null, cut: boolean, focus?: TourFocus) =>
    patch(id, {
      focus: el ? visiblePart(rectOf(el), pageSize(id)) : undefined,
      maxZoom: focus?.maxZoom,
      fit: focus?.fit,
      spot: el !== null && focus !== undefined && focus.spot !== false,
      pad: focus?.pad,
      cut,
    });

  /** Moves a card's pointer to an element and presses. */
  const point = async (id: FrameId, el: HTMLElement) => {
    const r = rectOf(el);
    // Fields are entered at their start; everything else is pressed in the middle.
    const field = el.matches("input, textarea");
    const at = { x: field ? r.x + Math.min(40, r.w / 4) : r.x + r.w / 2, y: r.y + r.h / 2 };
    patch(id, { pointer: { ...at, shown: true, down: false } });
    await sleep(hurry.current ? 0 : 680);
    patch(id, { pointer: { ...at, shown: true, down: true } });
    await sleep(hurry.current ? 0 : 180);
    patch(id, { pointer: { ...at, shown: true, down: false } });
  };

  /** Whether an element is inside what a card's camera is showing. */
  const inFrame = (id: FrameId, r: Rect) => {
    const f = live.current[id].focus;
    return !f || (r.x >= f.x && r.y >= f.y && r.x + r.w <= f.x + f.w && r.y + r.h <= f.y + f.h);
  };

  /**
   * Holds a still copy of a card's page over it (under any already there), and
   * waits until it is drawn. Only `except`, if found, stays live through it.
   */
  const hide = (id: FrameId, except?: Target) =>
    new Promise<void>((resolve) => {
      const page = doc(id)();
      const old = freeze(id);
      if (!page?.defaultView || !old) return resolve();
      const keep = except ? find(page, except) : null;
      const r = keep ? rectOf(keep) : null;
      const view = page.defaultView;
      const at = { x: view.scrollX, y: view.scrollY };
      if (r && !held.current[id]) {
        // What shows through stays where it is: the page may not scroll under the copy.
        const still = () => {
          if (view.scrollX !== at.x || view.scrollY !== at.y) view.scrollTo(at.x, at.y);
        };
        view.addEventListener("scroll", still);
        held.current[id] = () => view.removeEventListener("scroll", still);
      }
      covered.current[id] = resolve;
      patch(id, {
        covers: [
          {
            key: ++pageKeys.current,
            html: snapshot(page),
            width: old.width,
            transform: old.transform,
            scroll: at,
            hole: r ? { x: r.x - 8, y: r.y - 8, w: r.w + 16, h: r.h + 16 } : undefined,
            fading: false,
          },
          ...(live.current[id].covers ?? []),
        ],
      });
      setTimeout(resolve, 3000);
    }).then(async () => {
      await nextFrame();
      await nextFrame();
    });

  /** Lifts a card's still copies away, now or once they have faded. */
  const uncover = async (id: FrameId, fade: boolean) => {
    held.current[id]?.();
    held.current[id] = undefined;
    const was = live.current[id].covers;
    if (!was?.length) return;
    if (fade) {
      patch(id, { covers: was.map((c) => ({ ...c, fading: true })) });
      await sleep(VEIL_MS + 80);
    }
    if (live.current[id].covers?.[0]?.key === was[0].key) patch(id, { covers: undefined });
  };

  /** Whether any card is holding a still copy over its page. */
  const hiding = () => frameIds.some((id) => live.current[id].covers?.length);

  /** Points the cameras at what the stop is about: straight there if a still copy is lifting. */
  const land = async (target: TourStop, alive: () => boolean) => {
    if (!hiding()) return aim(target, false, alive);
    await aim(target, true, alive);
    if (!alive()) return;
    await nextFrame();
    await Promise.all(frameIds.map((id) => uncover(id, true)));
  };

  /** Runs a stop's steps: played out with the pointer, or at once when `fast` (or hurried). */
  const act = async (steps: TourStep[] | undefined, fast: boolean, alive: () => boolean) => {
    for (const step of steps ?? []) {
      if (!alive()) return;
      if (step.do === "pause") {
        // Run at once, a run of quick clicks still leaves the page a moment to keep up.
        await sleep(brisk(fast) ? Math.min(step.ms, 100) : step.ms);
        continue;
      }
      const id = step.in;
      if (step.do === "hide") {
        // A card that is not showing yet has nothing to hold still.
        if (live.current[id].shown && !live.current[id].veil) await hide(id, step.except);
        continue;
      }
      if (step.do === "wait") {
        await waitFor(doc(id), step.for, 20_000);
        continue;
      }
      if (step.do === "look") {
        if (brisk(fast)) continue;
        const el = await waitFor(doc(id), step.at);
        if (!el || !alive()) continue;
        await reveal(el, true);
        frame(id, el, false, { on: step.at, maxZoom: 1.35 });
        await sleep(MOVE_MS + 300);
        continue;
      }
      const target: Target = step.do === "click" ? step.on : step.into;
      let el = await waitFor(doc(id), target, 12_000);
      // A page that has just loaded shows its controls before React has taken them over; until
      // then a click is lost (or a link reloads the whole page), so wait until they work.
      for (let t = 0; el && !awake(el) && t < 100; t++) {
        await sleep(50);
        if (!el.isConnected) el = find(el.ownerDocument, target);
      }
      if (!alive()) return;
      if (!el) continue;
      const quick = "quick" in step && step.quick;
      if (!brisk(fast) && !quick) {
        await reveal(el, true);
        // Pull back when the control is outside what the camera is showing.
        if (!inFrame(id, rectOf(el))) {
          frame(id, null, false);
          await sleep(MOVE_MS * 0.7);
        }
        await point(id, el);
        if (!alive()) return;
      }
      if (step.do === "click") {
        // The app's pages share one session, so it must be this person's before they act.
        await signInAs(id);
        if (!alive()) return;
        el.click();
      } else {
        el.focus({ preventScroll: true });
        if (brisk(fast)) setValue(el, step.text);
        else
          for (let i = 1; i <= step.text.length; i++) {
            setValue(el, step.text.slice(0, i));
            await sleep(step.text.length > 24 ? 22 : 60);
            if (!alive()) return;
            if (hurry.current) {
              setValue(el, step.text);
              break;
            }
          }
      }
      if (!quick) await sleep(brisk(fast) ? 60 : 420);
    }
  };

  /** Points every card's camera at what the stop is about. */
  const aim = async (target: TourStop, cut: boolean, alive: () => boolean) => {
    const scene = tourScenes[target.scene!];
    const ids = frameIds.filter((id) => scene.frames[id]);
    for (const id of ids) patch(id, { dim: target.spot !== undefined && target.spot !== id });
    const jump = (id: FrameId) =>
      cut || hurry.current || !live.current[id].shown || live.current[id].veil;
    // What the notes explain must be on screen before the camera settles.
    if (target.notes) {
      const page = doc(target.notes.in)();
      const el = page ? find(page, target.notes.items[0].at) : null;
      if (el) await reveal(el, !jump(target.notes.in));
      if (!alive()) return;
    }
    const apply = async (id: FrameId) => {
      const focus = target.focus?.[id];
      const view = doc(id)()?.defaultView;
      const instant = jump(id);
      if (!focus) {
        if (!view) return;
        // The whole page, from the top.
        if (view.scrollY > 0) view.scrollTo({ top: 0, behavior: instant ? "instant" : "smooth" });
        frame(id, null, instant);
        return;
      }
      if (focus.top) {
        const start = await waitFor(doc(id), focus.top, 6000);
        start?.scrollIntoView({ block: "start", behavior: instant ? "instant" : "smooth" });
        if (start && !instant) await sleep(450);
      }
      const el = await waitFor(doc(id), focus.on, 6000);
      if (!alive()) return;
      if (el) await reveal(el, !instant);
      frame(id, el, instant, focus);
    };
    await Promise.all(ids.map(apply));
  };

  /** Keeps the cameras on what they frame while the pages settle (late content, an answer). */
  const follow = async (target: TourStop, alive: () => boolean) => {
    const scene = tourScenes[target.scene!];
    const ids = frameIds.filter((id) => scene.frames[id]);
    for (const ms of [450, 900]) {
      await sleep(ms);
      if (!alive()) return;
      for (const id of ids) {
        const focus = target.focus?.[id];
        const page = doc(id)();
        const el = focus && page ? find(page, focus.on) : null;
        if (el) frame(id, el, false, focus);
      }
    }
  };

  /** Measures what a stop's notes are about and places them on the stage. */
  const placeNotes = (target: TourStop, to: number) => {
    const rect = target.notes && stage.current?.slots[live.current[target.notes.in].slot];
    if (!target.notes || !rect) return;
    const id = target.notes.in;
    const view = live.current[id];
    const page = viewportFor(rect, view.width);
    const camera = cameraFor(page, view.focus, { maxZoom: view.maxZoom, fit: view.fit });
    const d = doc(id)();
    const placed: PlacedNote[] = [];
    for (const note of target.notes.items) {
      const el = d ? find(d, note.at) : null;
      if (!el) continue;
      const anchor = pageToStage(rect, view.width, camera, rectOf(el));
      // A note about something the card is not showing would point at nothing.
      const midY = anchor.y + Math.min(anchor.h / 2, 22);
      if (midY < rect.y || midY > rect.y + rect.h) continue;
      placed.push({ note, anchor, card: rect });
    }
    setNotes({ at: to, placed });
  };

  /**
   * Opens a scene's pages in the cards that are not kept from the scene
   * before: the demo state first, then each page, signed in as its person.
   * Cards on stage keep showing their old page until the new one is ready.
   */
  const openScene = async (
    sceneId: string,
    fresh: boolean,
    keep: Set<FrameId>,
    olds: Partial<Record<FrameId, FrameView["old"]>>,
    alive: () => boolean,
  ) => {
    const scene = tourScenes[sceneId];
    prepareWorld(scene.world, fresh);
    for (const id of frameIds) {
      const next = scene.frames[id];
      if (!next || keep.has(id)) continue;
      await signInAs(id);
      if (!alive()) return false;
      await load(id, next.path, olds[id]);
      if (!alive()) return false;
      await waitFor(doc(id), next.ready, 20_000);
      await doc(id)()?.fonts.ready;
      if (!alive()) return false;
    }
    return true;
  };

  /** While the family is on stage, quietly loads the screens of the act that follows. */
  const stageAhead = (at: number) => {
    const n = nextScreens(at);
    if (n === null) return;
    const sceneId = tourStops[n].scene!;
    if (staged.current?.scene === sceneId) return;
    const token = ++stageRun.current;
    const scene = tourScenes[sceneId];
    for (const id of frameIds) {
      const next = scene.frames[id];
      if (next) patch(id, { slot: next.slot, width: next.width, glide: false, focus: undefined });
    }
    staged.current = {
      scene: sceneId,
      ready: openScene(sceneId, scene.world === "before", new Set(), {}, () => {
        return stageRun.current === token;
      }),
    };
  };

  const dropStaged = () => {
    stageRun.current++;
    staged.current = null;
  };

  /** Fades the cards' new pages in over their old ones, then lets the old ones go. */
  const unveil = async (ids: FrameId[]) => {
    await nextFrame();
    await nextFrame();
    for (const id of ids) patch(id, { veil: false, shown: true });
    setCastOn(null);
    // Once the new page has faded in, the one it replaced can go.
    const gone = Object.fromEntries(ids.map((id) => [id, live.current[id].old?.key]));
    void sleep(VEIL_MS + 80).then(() => {
      for (const id of ids)
        if (gone[id] !== undefined && live.current[id].old?.key === gone[id])
          patch(id, { old: undefined });
    });
  };

  const play = useEffectEvent(async (from: number | null, to: number, alive: () => boolean) => {
    const target = tourStops[to];
    setNotes(null);
    // A still copy left over a card by a stop that was cut short.
    for (const id of frameIds) void uncover(id, false);
    // Leaving a stop before its steps finished: the pages are in an unknown state, so start over.
    const interrupted = from !== null && !finished.current;
    const plan = planStop(tourStops, tourScenes, interrupted ? null : from, to);
    // More presses still to come: this stop is passed through at once too.
    hurry.current = queued.current > 0;
    settle(null);

    if (plan.kind === "cast") {
      for (const id of frameIds)
        if (live.current[id].shown)
          patch(id, {
            shown: false,
            dim: false,
            glide: false,
            pointer: { ...live.current[id].pointer, shown: false },
          });
      setCastOn(target.cast ?? null);
      settle(to);
      if (queued.current > 0) {
        queued.current--;
        go(to + 1);
        return;
      }
      stageAhead(to);
      return;
    }

    if (plan.kind === "enter") {
      const scene = tourScenes[target.scene!];
      const ids = frameIds.filter((id) => scene.frames[id]);
      const carry = new Set(plan.carry);
      const keep = new Set(plan.carry.filter((id) => scene.frames[id]!.keep));
      const world = scene.world;
      // John's name rises over the three screens while they load; any other moment waits for them.
      if (target.memorial) setCastOn(null);
      const ready = staged.current?.scene === target.scene && plan.animate ? staged.current : null;
      if (!ready) dropStaged();

      const olds: Partial<Record<FrameId, FrameView["old"]>> = {};
      let moves = false;
      for (const id of frameIds) {
        const next = scene.frames[id];
        const was = live.current[id];
        if (!next) {
          if (!was.shown) continue;
          // Two views becoming one: the card that leaves glides into the one that stays.
          const into = scene.merge?.[id] && scene.frames[scene.merge[id]!];
          patch(id, {
            shown: false,
            dim: false,
            glide: Boolean(into),
            slot: into ? into.slot : was.slot,
            pointer: { ...was.pointer, shown: false },
          });
          moves ||= Boolean(into);
          continue;
        }
        // On stage already: the card stays, glides to its place, and keeps its page until the next is ready.
        if (was.shown && !keep.has(id)) olds[id] = freeze(id);
        const glide = was.shown && was.slot !== next.slot;
        moves ||= glide;
        const third = ["third1", "third2", "third3"].indexOf(next.slot);
        patch(id, {
          slot: next.slot,
          width: next.width,
          glide,
          // Once John has died, his own screen has lost its color.
          quiet: id === "husband" && (world === "loss" || world === "after"),
          dim: false,
          // Three screens arrive one by one under John's name.
          delay: !was.shown && third >= 0 && plan.animate ? 250 + third * 300 : 0,
          from: next.slot === "right" ? "right" : "below",
          pointer: { ...was.pointer, shown: false },
        });
        if (!carry.has(id) && was.shown) patch(id, { focus: undefined, spot: false, cut: true });
      }
      if (!alive()) return;

      let opened: boolean;
      if (ready) {
        opened = await ready.ready;
        staged.current = null;
        // Moving forward, the state the people on stage made carries on; fill in what is missing.
        if (opened) prepareWorld(world, false);
      } else {
        const fresh = !plan.animate || (world === "before" && carry.size === 0);
        opened = await openScene(target.scene!, fresh, keep, olds, alive);
      }
      if (!alive()) return;
      if (!opened) {
        // The staged pages were dropped on the way; open them now.
        if (!(await openScene(target.scene!, false, keep, olds, alive))) return;
      }
      // Opened directly (a jump, or a step back): put the pages where the scene before left them.
      if (carry.size === 0 && scene.setup) await act(scene.setup, true, alive);
      for (const earlier of plan.replay) {
        if (!alive()) return;
        await act(tourStops[earlier].steps, true, alive);
      }
      if (!alive()) return;

      if (plan.animate && target.steps?.length) {
        // Open on the pages as they are, then play the steps out.
        if (plan.replay.length) await aim(tourStops[plan.replay.at(-1)!], true, alive);
        await unveil(ids);
        await sleep(hurry.current ? 0 : moves ? GLIDE_MS * 0.6 : 450);
        await act(target.steps, false, alive);
        if (!alive()) return;
        await land(target, alive);
      } else {
        await act(target.steps, true, alive);
        if (!alive()) return;
        await aim(target, true, alive);
        if (!alive()) return;
        await unveil(ids);
      }
    } else if (plan.kind === "refocus") {
      await aim(target, false, alive);
    } else {
      await act(target.steps, false, alive);
      if (!alive()) return;
      await land(target, alive);
    }
    if (!alive()) return;
    for (const id of frameIds)
      if (live.current[id].pointer.shown)
        patch(id, { pointer: { ...live.current[id].pointer, shown: false } });
    // Keys go to the stage, not to a field the app focused inside a card.
    if (document.activeElement instanceof HTMLIFrameElement) document.activeElement.blur();
    settle(to);
    if (queued.current > 0) {
      queued.current--;
      go(to + 1);
      return;
    }
    void follow(target, alive);
    if (target.notes) {
      // Notes are placed once the camera has come to rest.
      await sleep(MOVE_MS);
      if (alive()) placeNotes(target, to);
    }
  });

  // A stop typed into the address bar: tell the app's router, or its next sign-in puts the old one back.
  useEffect(() => {
    const sync = () => window.history.replaceState(window.history.state, "", window.location.href);
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const ready = layout !== null;
  useEffect(() => {
    if (!ready) return;
    const token = ++run.current;
    const from = previous.current;
    previous.current = index;
    void play(from, index, () => run.current === token);
  }, [index, ready]);

  const exit = async () => {
    run.current++;
    dropStaged();
    await filmSignOut();
    window.location.assign(routes.signOn);
  };

  /** On to the next stop; if this one is still playing, it finishes at once first. */
  const forward = () => {
    if (index + queued.current >= lastStop) return;
    if (settled) go(index + 1);
    else {
      hurry.current = true;
      queued.current++;
    }
  };
  /** Anywhere but forward: presses still waiting are dropped. */
  const jump = (n: number) => {
    queued.current = 0;
    go(n);
  };

  const onKey = useEffectEvent((key: string) => {
    if (key === "ArrowRight" || key === "PageDown" || key === " ") forward();
    else if (key === "ArrowLeft" || key === "PageUp") jump(index - 1);
    else if (key === "Home") jump(0);
    else if (key === "Escape") void exit();
    else return false;
    return true;
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // A held key counts once.
      if (e.altKey || e.ctrlKey || e.metaKey || e.repeat) return;
      // Space belongs to a focused button or link; everywhere else it moves the tour on.
      if (e.key === " " && (e.target as HTMLElement | null)?.closest?.("button, a")) return;
      if (onKey(e.key)) e.preventDefault();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const onCovered = (id: FrameId) => {
    covered.current[id]?.();
    covered.current[id] = undefined;
  };

  /** Every page a card loads: tidy it for the stage and keep the tour's keys working inside it. */
  const onPageLoad = (id: FrameId) => {
    const d = iframes.current[id]?.contentDocument;
    if (!d?.head) return;
    if (!d.getElementById("tour-style")) {
      const style = d.createElement("style");
      style.id = "tour-style";
      // The sign-on page links to this tour; inside the tour that link would only be in the way.
      style.textContent = `${FILM_STYLE}a[href="${routes.tour}"]{visibility:hidden}`;
      d.head.append(style);
    }
    // Nobody types into the app during the tour, so its keys all belong to the stage.
    d.addEventListener("keydown", (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.repeat) return;
      if (!stageKeys.has(e.key)) return;
      e.preventDefault();
      window.dispatchEvent(new KeyboardEvent("keydown", { key: e.key }));
    });
    loaded.current[id]?.();
    loaded.current[id] = undefined;
  };

  const register = (id: FrameId, el: HTMLIFrameElement | null) => {
    iframes.current[id] = el;
  };

  const cast = castOn;
  const product = productOf(stop, tourScenes);
  // John's name: where the family moment shows it once he has died, then risen above the three screens.
  const memorial = cast === "loss" ? "cast" : stop.memorial ? "top" : "off";
  const shownNotes = notes && notes.at === index && settled ? notes.placed : [];

  return (
    <div
      data-settled={settled}
      data-stop={stop.id}
      onClick={(e) => {
        // A click on the stage is a press of →.
        if (!(e.target as HTMLElement).closest("button, a")) forward();
      }}
      onScroll={(e) => e.currentTarget.scrollTo(0, 0)}
      className="tour-stage fixed inset-0 overflow-hidden bg-white text-pnc-ink"
    >
      <p className="sr-only" aria-live="polite">
        {product ? tourProducts[product].name : ""}
      </p>

      {layout && (
        <Products
          active={product}
          mode={
            cast === "title"
              ? "diagram"
              : cast === "vision"
                ? "vision"
                : cast === "finale"
                  ? "finale"
                  : "dots"
          }
          dotsH={layout.dotsH}
          area={layout.cast}
        />
      )}

      {/* The opening: the ecosystem's labels and brackets, and the product's name, small, at the upper right. */}
      {layout && <Ecosystem shown={cast === "title"} layout={layout} />}

      {layout && <Memorial state={memorial} layout={layout} />}

      {/* Beneath the screens, so the family fades away behind them as they arrive. */}
      {layout && <Cast cast={cast} area={layout.cast} />}

      {layout &&
        frameIds.map((id) => (
          <Frame
            key={id}
            id={id}
            view={views[id]}
            rect={layout.slots[views[id].slot]}
            register={register}
            onLoad={onPageLoad}
            onCover={onCovered}
          />
        ))}

      {layout && <Notes placed={shownNotes} stageH={h} />}

      {cramped && (
        <div className="absolute inset-0 grid place-items-center px-8 text-center">
          <div className="max-w-sm">
            <FindoeLogo className="mx-auto size-12" />
            <p className="mt-5 font-display text-2xl font-medium leading-tight text-pnc-navy">
              This tour needs a larger screen
            </p>
            <p className="mt-3 text-pnc-muted">
              It shows the laptop version of the app, sometimes three people side by side. Open it
              on a laptop or widen this window, and it picks up where you left off.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

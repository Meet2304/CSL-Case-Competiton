import { describe, expect, it } from "vitest";
import { rulebook } from "@/data/settlement";
import {
  advisorChat,
  advisorSteps,
  claimable,
  claimDocs,
  mayaChat,
  policySteps,
  readiness,
  shareOrder,
  tourAccounts,
  tourCaptions,
  tourChapters,
  tourGlow,
  tourPeople,
} from "@/data/tour";
import {
  frameIds,
  initialTourState,
  lastBeat,
  layoutWidth,
  nextBeat,
  previousStop,
  slotWidth,
  stageLayout,
  stopAt,
  tourBeats,
  tourStates,
  tourStops,
  visibleToDavid,
  type SlotId,
} from "@/lib/tour";

const words = (text: string) => text.trim().split(/\s+/).length;
const captions = Object.values(tourCaptions);
const at = (caption: keyof typeof tourCaptions) =>
  tourStates[tourStops.find((stop) => tourStates[stop].caption === caption)!];

describe("the tour's words", () => {
  it("keeps every caption short enough to read at a glance", () => {
    for (const c of captions) {
      expect(words(c.title), c.title).toBeLessThanOrEqual(8);
      expect(words(c.body), c.body).toBeLessThanOrEqual(20);
    }
  });

  it("introduces nobody outside the family and their advisor", () => {
    const said = JSON.stringify([
      tourPeople,
      captions,
      advisorChat,
      mayaChat,
      advisorSteps,
      claimDocs,
      policySteps,
      claimable,
      readiness,
    ]);
    expect(said).not.toMatch(/\bAlex\b|Dana|Morgan|Avery|Jamie|Taylor|Placeholder|Example|Sample/);
  });

  it("shows every caption, in chapter order", () => {
    // Some captions belong to a run (Findoe working), so every beat counts, not only the stops.
    const shown = tourStates.map((state) => state.caption);
    expect(new Set(shown)).toEqual(new Set(Object.keys(tourCaptions)));
    const order = shown.map((id) =>
      tourChapters.findIndex((c) => c.id === tourCaptions[id].chapter),
    );
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it("cites only sources that exist in the rulebook", () => {
    const laws = [...advisorChat.claims, ...mayaChat.claims].flatMap((c) => c.law ?? []);
    expect(laws.length).toBeGreaterThan(0);
    for (const id of laws) expect(rulebook.sources[id], id).toBeDefined();
    for (const claim of [...advisorChat.claims, ...mayaChat.claims])
      expect(claim.law ?? claim.record, claim.text).toBeTruthy();
  });
});

describe("moving through the tour", () => {
  it("only ever moves on a key press", () => {
    // Every run of automatic beats ends at a stop, and the tour starts and ends on one.
    expect(tourBeats[0].auto).toBeUndefined();
    expect(tourBeats[lastBeat].auto).toBeUndefined();
    expect(tourStops[0]).toBe(0);
    expect(tourStops.at(-1)).toBe(lastBeat);
  });

  it("plays the next beat from a stop, and skips to the stop when pressed mid-run", () => {
    expect(nextBeat(0)).toBe(1);
    expect(tourBeats[1].auto).toBeDefined();
    expect(nextBeat(1)).toBe(tourStops[1]);
    expect(nextBeat(lastBeat)).toBe(lastBeat);
  });

  it("steps back a whole stop at a time", () => {
    expect(previousStop(0)).toBe(0);
    expect(previousStop(tourStops[1])).toBe(0);
    expect(previousStop(tourStops[1] - 1)).toBe(0);
    expect(previousStop(lastBeat)).toBe(tourStops.at(-2));
  });

  it("opens part-way through at a stop, never mid-run", () => {
    expect(stopAt(1)).toBe(0);
    expect(stopAt(tourStops[3])).toBe(tourStops[3]);
    expect(stopAt(9999)).toBe(lastBeat);
    expect(stopAt(Number.NaN)).toBe(0);
  });

  it("does not change the state it starts from", () => {
    expect(initialTourState.shared).toEqual([]);
    expect(tourStates[0]).toEqual(initialTourState);
  });
});

describe("whose screens are on stage", () => {
  it("gives every person their own glow", () => {
    const colors = frameIds.map((id) => tourGlow[id][0]);
    expect(new Set(colors).size).toBe(frameIds.length);
  });

  it("opens on John and Maya, side by side, each signing on", () => {
    const { frames } = tourStates[0];
    expect([frames.husband.slot, frames.wife.slot]).toEqual(["left", "right"]);
    expect([frames.husband.page, frames.wife.page]).toEqual(["signin", "signin"]);
    expect(frames.husband.border && frames.wife.border).toBe(true);
    expect(frames.child1.shown || frames.advisor.shown).toBe(false);
  });

  it("drops the borders for the one family dashboard", () => {
    const { frames } = at("family");
    expect(frames.husband.page).toBe("family");
    expect(frames.husband.border).toBe(false);
    expect(frames.wife.shown).toBe(false);
  });

  it("shows three bordered screens when John dies, then only the advisor's", () => {
    const three = at("three").frames;
    expect(
      (["husband", "wife", "advisor"] as const).map((id) => [
        three[id].shown,
        three[id].border,
        three[id].page,
      ]),
    ).toEqual([
      [true, true, "closed"],
      [true, true, "condolence"],
      [true, true, "alert"],
    ]);
    const after = at("advHome").frames;
    expect(frameIds.filter((id) => after[id].shown)).toEqual(["advisor"]);
    expect(after.advisor.slot).toBe("full");
  });

  it("ends on Maya's screen alone, with her border", () => {
    const maya = at("maya").frames;
    expect(frameIds.filter((id) => maya[id].shown)).toEqual(["wife"]);
    expect(maya.wife.border).toBe(true);
    expect(maya.wife.page).toBe("unclaimed");
  });
});

describe("what a click changes", () => {
  it("shows David one more account each time John shares one", () => {
    expect(visibleToDavid(at("admin"))).toEqual(["studentChecking"]);
    expect(visibleToDavid(at("share1"))).toEqual(["studentChecking", shareOrder[0]]);
    expect(visibleToDavid(at("share3"))).toEqual(["studentChecking", ...shareOrder]);
    // Assets and a debt, as the story promises.
    const shared = shareOrder.map((id) => tourAccounts[id].balance);
    expect(shared.some((b) => b > 0) && shared.some((b) => b < 0)).toBe(true);
  });

  it("lets Maya send the claim only once every document is in", () => {
    expect(at("claim").docs).toBe(0);
    expect(at("fills").docs).toBe(claimDocs.length);
    expect(at("fills").jointClaim).toBe("start");
    expect(at("processing").jointClaim).toBe("processing");
    expect(at("processing").frames.wife.page).toBe("unclaimed");
  });

  it("offers Maya only what names her", () => {
    for (const { account } of claimable) {
      const a = tourAccounts[account];
      expect(a.owners.includes("husband"), a.name).toBe(true);
    }
    expect(claimable.filter((c) => tourAccounts[c.account].external)).toHaveLength(1);
  });

  it("has Findoe work before it answers", () => {
    expect(at("ask").advChat).toMatchObject({ typed: true, sent: false, answered: false });
    // Its working is a stop of its own, with every step done, so it can be read and narrated.
    expect(at("thinking").advChat).toMatchObject({
      sent: true,
      thought: advisorChat.steps.length + 1,
      answered: false,
    });
    expect(at("answer").advChat).toMatchObject({ sent: true, answered: true });
    expect(at("mayaThinking").mayaChat).toMatchObject({
      thought: mayaChat.steps.length + 1,
      answered: false,
    });
    expect(at("mayaAnswer").mayaChat.answered).toBe(true);
    expect(at("maya").claimStarted).toBe(true);
  });
});

describe("the stage", () => {
  const sizes: [number, number][] = [
    [1280, 720],
    [1440, 900],
    [1920, 1080],
    [2560, 1440],
  ];

  it("keeps every screen on the stage and above the caption", () => {
    for (const [w, h] of sizes) {
      const { slots, captionH } = stageLayout(w, h);
      for (const [id, r] of Object.entries(slots)) {
        expect(r.x, `${id} ${w}x${h}`).toBeGreaterThanOrEqual(0);
        expect(r.x + r.w, `${id} ${w}x${h}`).toBeLessThanOrEqual(w);
        expect(r.y + r.h, `${id} ${w}x${h}`).toBeLessThanOrEqual(h - captionH);
      }
    }
  });

  it("gives every page the height it was designed for", () => {
    // Pages are laid out `slotWidth` rem wide; these are the shortest they may become.
    const least: Record<string, number> = { full: 37, left: 38.5, third1: 33 };
    for (const [w, h] of sizes) {
      const { slots } = stageLayout(w, h);
      for (const [id, min] of Object.entries(least)) {
        const r = slots[id as SlotId];
        const rems = r.h / (r.w / slotWidth[id as SlotId]);
        expect(rems, `${id} ${w}x${h}`).toBeGreaterThanOrEqual(min);
      }
    }
  });

  it("draws sparse pages larger, and still fits them", () => {
    const narrow = layoutWidth({ slot: "left", page: "admin" });
    expect(narrow).toBeLessThan(slotWidth.left);
    expect(layoutWidth({ slot: "left", page: "kid" })).toBe(narrow);
    // Only side by side: the same page alone on the stage would use the full width.
    expect(layoutWidth({ slot: "full", page: "admin" })).toBe(slotWidth.full);
    expect(layoutWidth({ slot: "left", page: "assets" })).toBe(slotWidth.left);
    for (const [w, h] of sizes) {
      const r = stageLayout(w, h).slots.left;
      expect(r.h / (r.w / narrow), `${w}x${h}`).toBeGreaterThanOrEqual(33);
    }
  });

  it("does not let side-by-side screens overlap", () => {
    for (const [w, h] of sizes) {
      const { slots } = stageLayout(w, h);
      expect(slots.left.x + slots.left.w).toBeLessThan(slots.right.x);
      expect(slots.third1.x + slots.third1.w).toBeLessThan(slots.third2.x);
      expect(slots.third2.x + slots.third2.w).toBeLessThan(slots.third3.x);
    }
  });
});

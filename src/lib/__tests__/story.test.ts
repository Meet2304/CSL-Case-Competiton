import { describe, expect, it } from "vitest";
import { rulebook } from "@/data/settlement";
import {
  accessRows,
  advisorFindoe,
  childrenNote,
  claimDocs,
  closing,
  condolence,
  conversation,
  findoe,
  inheritances,
  mayaShown,
  lines,
  named,
  storyAccounts,
  storyPeople,
  unclaimed,
  word,
} from "@/data/story";
import {
  PLATE,
  WORLD,
  fit,
  flightTime,
  fly,
  focusView,
  lastStop,
  nextStop,
  plateIds,
  plateLit,
  plateOrigin,
  previousStop,
  stopFromHash,
  stopIndex,
  stops,
  threadLegs,
  threadOrder,
  viewOf,
  worldView,
} from "@/lib/story";

const words = (text: string) => text.trim().split(/\s+/).length;

describe("the story's script", () => {
  it("gives every stop its own id", () => {
    expect(new Set(stops.map((s) => s.id)).size).toBe(stops.length);
  });

  it("visits every plate, and ends on the whole canvas", () => {
    for (const id of plateIds)
      expect(
        stops.some((s) => s.plate === id),
        id,
      ).toBe(true);
    expect(stops[lastStop].plate).toBe("world");
  });

  it("opens any stop from its link, and the first stop from anything else", () => {
    stops.forEach((s, i) => expect(stopFromHash(`#${s.id}`)).toBe(i));
    expect(stopFromHash("#nowhere")).toBe(0);
    expect(stopFromHash("")).toBe(0);
  });

  it("moves one stop per press and stops at either end", () => {
    expect(nextStop(0)).toBe(1);
    expect(nextStop(lastStop)).toBe(lastStop);
    expect(previousStop(0)).toBe(0);
    expect(previousStop(lastStop)).toBe(lastStop - 1);
  });

  it("lights only the plate the camera is on, or every plate for the closing shots", () => {
    const home = stopIndex("home");
    expect(plateIds.filter((id) => plateLit(id, home))).toEqual(["john"]);
    expect(plateIds.every((id) => plateLit(id, stopIndex("circle")))).toBe(true);
  });

  it("draws one leg of the thread for each move between plates, on the stop that arrives", () => {
    expect(threadLegs).toHaveLength(threadOrder.length - 1);
    threadLegs.forEach((leg, i) => {
      const s = stops[stopIndex(leg.from)];
      expect(s.plate === "world" || s.plate === threadOrder[i + 1], leg.from).toBe(true);
    });
    expect(threadOrder[0]).toBe("family");
    expect(threadOrder.at(-1)).toBe("family");
  });
});

describe("the camera", () => {
  it("frames a whole plate when a stop has no focus, or the focus cannot be found", () => {
    const i = stopIndex("home");
    expect(viewOf(i)).toEqual({ ...plateOrigin("john"), w: PLATE.w, h: PLATE.h });
    expect(viewOf(stopIndex("outside"), () => null)).toEqual(viewOf(i));
  });

  it("closes in on a focus without leaving its plate", () => {
    const v = focusView("john", { x: 1300, y: 800, w: 200, h: 80 });
    const o = plateOrigin("john");
    expect(v.w).toBeLessThan(PLATE.w);
    expect(v.x + v.w).toBeLessThanOrEqual(o.x + PLATE.w + 1e-6);
    expect(v.y + v.h).toBeLessThanOrEqual(o.y + PLATE.h + 1e-6);
    expect(v.h / v.w).toBeCloseTo(PLATE.h / PLATE.w);
  });

  it("shows the whole canvas in the closing shots", () => {
    expect(worldView.w).toBeGreaterThanOrEqual(WORLD.w);
    expect(worldView.h).toBeGreaterThanOrEqual(WORLD.h);
  });

  it("starts and ends a move exactly on its two views", () => {
    const a = viewOf(stopIndex("title"));
    const b = viewOf(stopIndex("home"));
    expect(fly(a, b, 0)).toEqual(expect.objectContaining({ w: a.w }));
    const end = fly(a, b, 1);
    expect(end.x).toBeCloseTo(b.x);
    expect(end.y).toBeCloseTo(b.y);
    expect(end.w).toBeCloseTo(b.w);
    expect(flightTime(a, b)).toBeGreaterThan(flightTime(a, a));
  });

  it("fits a view whole into any window, centred", () => {
    const v = viewOf(stopIndex("home"));
    for (const [W, H] of [
      [1440, 800],
      [800, 900],
      [2560, 1000],
    ]) {
      const f = fit(v, W, H);
      expect(v.w * f.scale).toBeLessThanOrEqual(W + 1e-6);
      expect(v.h * f.scale).toBeLessThanOrEqual(H + 1e-6);
      expect(f.x + (v.x + v.w / 2) * f.scale).toBeCloseTo(W / 2);
    }
  });
});

describe("the story's words", () => {
  it("keeps every line on the canvas short enough to read at a glance", () => {
    for (const line of Object.values(lines)) expect(words(line!), line).toBeLessThanOrEqual(12);
  });

  it("names nobody outside the family and their advisor", () => {
    const said = JSON.stringify([storyPeople, lines, closing, advisorFindoe, word, conversation]);
    expect(said).not.toMatch(/\bAlex\b|Dana|Morgan|Avery|Jamie|Taylor|Placeholder|Example|Sample/);
  });

  it("never tells a client there is nothing for them to do", () => {
    const toClients = JSON.stringify([
      word,
      condolence,
      childrenNote,
      conversation,
      unclaimed,
      claimDocs,
      lines,
      closing,
      findoe,
    ]);
    expect(toClients).not.toMatch(/nothing (you|to do|here)|need to do|have to do|no rush/i);
  });

  it("cites only sources in the legal library, and every marker has its source", () => {
    for (const r of [findoe.johnBefore, findoe.johnAfter, findoe.maya, mayaShown]) {
      const markers = [...r.text.matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1]));
      for (const n of markers) expect(r.sources[n - 1], r.text).toBeDefined();
      for (const s of r.sources)
        if (s.kind === "law") expect(rulebook.sources[s.key], s.key).toBeDefined();
    }
  });

  it("asks the real Findoe, which sees the gaps close once John names his beneficiaries", () => {
    expect(findoe.johnBefore.text).toMatch(/would go through probate/);
    expect(findoe.johnAfter.text).not.toMatch(/probate/);
    expect(findoe.maya.text).toMatch(/^Most likely very little/);
  });
});

describe("the family's money", () => {
  it("names beneficiaries the way John's will gives his Savings, and Maya on the brokerage", () => {
    const shares = (list: { share: number }[]) => list.reduce((s, t) => s + t.share, 0);
    for (const n of named) expect(shares(n.to)).toBeCloseTo(1);
    expect(named.find((n) => n.account === "savings")!.to.map((t) => t.person)).toEqual([
      "david",
      "alexa",
    ]);
    expect(named.find((n) => n.account === "brokerage")!.to.map((t) => t.person)).toEqual(["maya"]);
  });

  it("passes on every dollar of each account it divides, and no more", () => {
    const passed: Record<string, number> = {};
    for (const b of inheritances)
      for (const it of b.items) passed[it.account] = (passed[it.account] ?? 0) + it.amount;
    for (const [id, amount] of Object.entries(passed))
      expect(amount, id).toBeCloseTo(storyAccounts[id as keyof typeof storyAccounts].balance);
  });

  it("only ever widens what David sees, and never shows Alexa anything", () => {
    const rank = { hidden: 0, account: 1, balance: 2 };
    for (const r of accessRows) {
      expect(rank[r.david[1]]).toBeGreaterThanOrEqual(rank[r.david[0]]);
      expect(r.alexa).toEqual(["hidden", "hidden"]);
    }
  });
});

import { describe, expect, it } from "vitest";
import { advisorCustomers, routineNotifications } from "@/data/advisor";
import { profileFor } from "@/data/clients";
import { accounts, people, previousNames } from "@/data/household";
import { deathCertificates } from "@/data/estate";
import { buildNotifications, openLoss, withRecordedLosses } from "@/lib/advisor";
import { factsFor } from "@/lib/assistant";
import { findDemoUser } from "@/data/users";

const john = advisorCustomers.find((c) => c.id === "c-sample")!;

describe("production advisor demo", () => {
  it("uses the same four Smith family names on both sides", () => {
    const names = ["John Smith", "Maya Smith", "David Smith", "Alexa Smith"];
    expect(people.slice(0, 4).map((p) => p.name)).toEqual(names);
    expect([john.name, ...john.household.map((p) => p.name)]).toEqual(names);
    expect(
      profileFor(john.id)!
        .members.slice(0, 4)
        .map((p) => p.name),
    ).toEqual(names);
    expect(deathCertificates["p-jordan"].decedent).toBe(john.name);
    expect(findDemoUser("alexa")?.personId).toBe("p-riley");
    expect(findDemoUser("alexis")?.personId).toBe("p-riley");
  });

  it("opens on John's death alone without browser setup", () => {
    expect(advisorCustomers.flatMap((c) => c.lossEvents).map((l) => l.memberName)).toEqual([
      john.name,
    ]);
    expect(openLoss(john)?.relationship).toBe("Self");
    const members = factsFor(john, profileFor(john.id)!, "2026-10-24").p.members;
    expect(members.filter((p) => p.status === "Deceased").map((p) => p.name)).toEqual([
      "John Smith",
    ]);
    expect(members.slice(1, 4).every((p) => p.status === "Living")).toBe(true);
    expect(
      buildNotifications(advisorCustomers, routineNotifications)
        .filter((n) => n.urgent)
        .map((n) => n.customerId),
    ).toEqual([john.id]);
  });

  it("keeps John's advisor holdings aligned with his customer accounts", () => {
    const owned = accounts.filter((a) => a.owners.includes("p-jordan") && !a.external);
    expect(john.accountCount).toBe(owned.length);
    // The Private Bank-scale household (portfolio home): about $2.73M of John's own at PNC.
    expect(john.relationshipValue).toBeCloseTo(2_728_524.36, 2);
    expect(john.relationshipValue).toBeCloseTo(
      owned.reduce((sum, a) => sum + a.balance, 0),
      2,
    );
    expect(
      profileFor(john.id)!
        .holdings.filter((h) => !h.external)
        .reduce((sum, h) => sum + h.value, 0),
    ).toBeCloseTo(john.relationshipValue, 2);
  });

  it("migrates earlier saved names and does not duplicate the seeded death", () => {
    expect(previousNames.John).toBe(john.name);
    expect(previousNames.Alexis).toBe("Alexa Smith");
    const book = withRecordedLosses(advisorCustomers, [
      { id: "again", personName: john.name, date: "2026-10-24", reportedVia: "Phone call" },
    ]);
    expect(book.find((c) => c.id === john.id)!.lossEvents).toHaveLength(1);
  });
});

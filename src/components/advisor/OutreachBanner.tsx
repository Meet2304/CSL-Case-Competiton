"use client";

import { HeartHandshake, Mail, Phone, Users } from "lucide-react";
import { advisorCustomers } from "@/data/advisor";
import { outreachGuide } from "@/data/bereavement";
import { assessImpact, customerAnchor, lossContact } from "@/lib/advisor";
import { firstName, formatDate } from "@/lib/format";
import { useAdvisorBook } from "./useAdvisorBook";

/**
 * Highlights deaths the bank has just recorded, shows the assessed impact on
 * each affected household, and recommends personal, humane outreach.
 */
export function OutreachBanner() {
  const { recorded } = useAdvisorBook();
  if (recorded.length === 0) return null;

  return (
    <div className="space-y-3">
      {[...recorded].reverse().map((loss) => {
        const impacts = assessImpact(advisorCustomers, loss.personName);
        // Contact the household most directly affected: a survivor first, else next of kin.
        const primary = impacts.find((i) => i.relationship !== "Self") ?? impacts[0];
        const contact =
          primary &&
          lossContact(primary.customer, {
            id: loss.id,
            date: loss.date,
            relationship: primary.relationship,
            memberName: loss.personName,
            reportedVia: loss.reportedVia,
            followUpComplete: false,
          });
        const first = contact ? firstName(contact.name) : undefined;
        const guide = contact && outreachGuide(contact.name, loss.personName);

        return (
          <section
            key={loss.id}
            aria-label={`Death recorded: ${loss.personName}`}
            className="rounded-md bg-attention-bg p-4 ring-1 ring-attention-line @3xl:p-5"
          >
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-attention ring-1 ring-attention-line">
                <HeartHandshake className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-attention">
                  Death recorded · {formatDate(loss.recordedOn, "medium")}
                </p>
                <h3 className="mt-0.5 text-lg font-semibold text-pnc-ink">
                  {guide ? guide.title : `${loss.personName} passed away`}
                </h3>
                <p className="mt-0.5 text-sm text-pnc-ink">
                  {loss.personName} passed away on {formatDate(loss.date, "medium")} (reported via{" "}
                  {loss.reportedVia.toLowerCase()}).
                  {first &&
                    " A personal call in the next day or two matters more than anything else right now."}
                </p>

                {/* Assessed from the household records after intake — not entered by the advisor. */}
                <div className="mt-3 rounded-md bg-white px-3 py-2.5 text-sm">
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-pnc-muted">
                    <Users className="size-3.5" aria-hidden="true" /> Impact on family
                  </p>
                  <ul className="mt-1 space-y-0.5 text-pnc-ink">
                    {impacts.map(({ customer, relationship }) => (
                      <li key={customer.id}>
                        <a
                          href={`#${customerAnchor(customer.id)}`}
                          className="font-semibold text-pnc-link hover:underline"
                        >
                          {customer.name}
                        </a>
                        {relationship === "Self"
                          ? " — their own accounts; estate handled with the next of kin"
                          : ` — lost their ${relationship.toLowerCase()}`}
                      </li>
                    ))}
                  </ul>
                </div>

                {guide && (
                  <div className="mt-3 grid gap-4 @3xl:grid-cols-2">
                    <ul className="space-y-1 text-sm text-pnc-ink">
                      {guide.tips.map((t) => (
                        <li key={t} className="flex gap-2">
                          <span
                            className="mt-2 size-1.5 shrink-0 rounded-full bg-attention"
                            aria-hidden="true"
                          />
                          {t}
                        </li>
                      ))}
                    </ul>
                    <figure>
                      <figcaption className="text-xs font-semibold uppercase tracking-wide text-pnc-muted">
                        Suggested first words
                      </figcaption>
                      <blockquote className="mt-1 rounded-md bg-white px-3 py-2 text-sm italic leading-relaxed text-pnc-ink">
                        {guide.script}
                      </blockquote>
                    </figure>
                  </div>
                )}

                {first && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a
                      href="#"
                      className="inline-flex items-center gap-1.5 rounded-full bg-pnc-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-pnc-blue-800"
                    >
                      <Phone className="size-4" aria-hidden="true" /> Call {first}
                    </a>
                    <a
                      href="#"
                      className="inline-flex items-center gap-1.5 rounded-full border border-pnc-line bg-white px-4 py-2 text-sm font-semibold text-pnc-ink hover:border-pnc-link hover:text-pnc-link"
                    >
                      <Mail className="size-4" aria-hidden="true" /> Send a condolence note
                    </a>
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}

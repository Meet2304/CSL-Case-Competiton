"use client";

import { HeartHandshake, Mail, Phone } from "lucide-react";
import { advisorCustomers } from "@/data/advisor";
import { outreachGuide } from "@/data/bereavement";
import { customerAnchor } from "@/lib/advisor";
import { formatDate } from "@/lib/format";
import { useAdvisorBook } from "./useAdvisorBook";

/**
 * Highlights deaths the bank has just recorded and recommends personal,
 * humane outreach — what to say first, and what not to lead with.
 */
export function OutreachBanner() {
  const { recorded } = useAdvisorBook();
  if (recorded.length === 0) return null;

  return (
    <div className="space-y-3">
      {[...recorded].reverse().map((loss) => {
        const customer = advisorCustomers.find((c) => c.id === loss.customerId);
        if (!customer) return null;
        const first = customer.name.split(" ")[0];
        const guide = outreachGuide(customer.name, loss.memberName);
        return (
          <section
            key={loss.id}
            aria-label={`Recent loss: ${customer.name}`}
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
                <h3 className="mt-0.5 text-lg font-semibold text-pnc-ink">{guide.title}</h3>
                <p className="mt-0.5 text-sm text-pnc-ink">
                  {loss.memberName}, {first}&apos;s {loss.relationship.toLowerCase()}, passed away
                  on {formatDate(loss.date, "medium")}. A personal call in the next day or two
                  matters more than anything else right now.
                </p>

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
                  <a
                    href={`#${customerAnchor(customer.id)}`}
                    className="inline-flex items-center px-2 text-sm font-semibold text-pnc-link hover:underline"
                  >
                    Go to customer
                  </a>
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}

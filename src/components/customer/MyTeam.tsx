import { Mail } from "lucide-react";
import { PersonAvatar } from "@/components/ui/PersonAvatar";
import { relationshipTeam } from "@/data/portfolio";
import { cn } from "@/lib/format";

/** "My Team": the people at the bank who look after this household, with how to reach them. */
export function MyTeam({ className }: { className?: string }) {
  return (
    <section
      aria-labelledby="my-team-title"
      className={cn("rounded-lg bg-white shadow-card", className)}
    >
      <h2
        id="my-team-title"
        className="border-b border-pnc-line px-5 py-4 font-display text-xl font-medium text-pnc-ink"
      >
        My Team
      </h2>
      <ul className="divide-y divide-pnc-line">
        {relationshipTeam.map((c) => (
          <li key={c.id} className="flex gap-3.5 px-5 py-4">
            <PersonAvatar seed={c.avatarSeed} look={c.avatar} className="size-12 ring-pnc-line" />
            <div className="min-w-0">
              <p className="font-semibold text-pnc-ink">{c.name}</p>
              <p className="text-xs text-pnc-muted">{c.title}</p>
              <div className="mt-2 flex flex-col items-start gap-1 text-sm font-semibold text-pnc-link">
                <a href={`tel:${c.phone.replace(/[^\d+]/g, "")}`} className="hover:underline">
                  {c.phone}
                </a>
                <a href={`mailto:${c.email}`} className="break-all hover:underline">
                  {c.email}
                </a>
                <a
                  href={`mailto:${c.email}`}
                  className="inline-flex items-center gap-1.5 hover:underline"
                  aria-label={`Message ${c.name}`}
                >
                  <Mail className="size-4" aria-hidden="true" /> Message
                </a>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

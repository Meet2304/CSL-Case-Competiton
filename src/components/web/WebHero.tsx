import { FacetBackdrop } from "@/components/brand/FacetBackdrop";
import { MOCK_AS_OF } from "@/data/mock";
import { formatDate } from "@/lib/format";

/** The blue faceted band under the top nav: date line + page title. */
export function WebHero({ title, showDate = true }: { title: string; showDate?: boolean }) {
  return (
    <section className="relative isolate text-white">
      <FacetBackdrop className="-z-10" />
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-6 sm:px-6">
        {showDate && <p className="text-sm text-white/85">{formatDate(MOCK_AS_OF, "long")}</p>}
        <h1 className="mt-1 font-display text-3xl font-medium sm:text-4xl">{title}</h1>
      </div>
    </section>
  );
}

import { PersonAvatar } from "@/components/ui/PersonAvatar";
import { tourPeople, type TourPersonId } from "@/data/tour";
import { cn } from "@/lib/format";

/** A person in the story, drawn as the app draws them. */
export function Avatar({ person, className }: { person: TourPersonId; className?: string }) {
  const p = tourPeople[person];
  return <PersonAvatar seed={p.id} look={p.look} className={cn("size-8", className)} />;
}

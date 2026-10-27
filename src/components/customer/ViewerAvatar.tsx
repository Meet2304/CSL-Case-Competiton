"use client";

import { PersonAvatar } from "@/components/ui/PersonAvatar";
import { useViewer } from "./Viewer";

/** The signed-in customer's illustrated avatar. */
export function ViewerAvatar({ className }: { className?: string }) {
  const { person } = useViewer();
  return <PersonAvatar seed={person.id} className={className} />;
}

import type { ReactNode } from "react";
import { signOff } from "@/lib/auth";

/**
 * Signs off via a Server Action (clears the demo session cookie). A form
 * rather than a link, so link prefetching can never sign anyone out.
 */
export function SignOffButton({
  children,
  className,
  label = "Sign off",
}: {
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <form action={signOff} className="contents">
      <button type="submit" aria-label={label} title={label} className={className}>
        {children}
      </button>
    </form>
  );
}

import { cn } from "@/lib/format";

// Deterministic pseudo-random so the facet pattern is identical on every render.
function seeded(i: number) {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

const COLS = 8;
const ROWS = 5;
const W = 48;
const H = 42;

const facets = Array.from({ length: COLS * ROWS * 2 }, (_, i) => {
  const cell = Math.floor(i / 2);
  const col = cell % COLS;
  const row = Math.floor(cell / COLS);
  const x = col * W;
  const y = row * H;
  const upper = i % 2 === 0;
  const points = upper
    ? `${x},${y} ${x + W},${y} ${x},${y + H}`
    : `${x + W},${y} ${x + W},${y + H} ${x},${y + H}`;
  const r = seeded(i + 1);
  return {
    points,
    fill: r > 0.5 ? "#ffffff" : "#000000",
    opacity: r > 0.5 ? (r - 0.5) * 0.12 : r * 0.12,
  };
});

/**
 * The blue gradient with faint triangular facets used behind PNC headers,
 * the mobile sign-on screen, and the bottom tab bar. Place inside a
 * `relative` container; content should sit above it.
 */
export function FacetBackdrop({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden bg-gradient-to-b from-pnc-blue-700 to-pnc-blue-900",
        className,
      )}
    >
      <svg className="h-full w-full" preserveAspectRatio="none">
        <defs>
          <pattern id="pnc-facets" width={COLS * W} height={ROWS * H} patternUnits="userSpaceOnUse">
            {facets.map((f, i) => (
              <polygon key={i} points={f.points} fill={f.fill} fillOpacity={f.opacity} />
            ))}
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#pnc-facets)" />
      </svg>
    </div>
  );
}

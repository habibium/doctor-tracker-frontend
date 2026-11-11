import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/*
 * Quiet artwork behind the top of a page, one per section so pages are told apart at a
 * glance. Every drawing is anchored to the right edge of a fixed 1600 × 136 canvas, so
 * narrower panels crop it from the left and nothing reflows. All geometry is computed
 * once at module load from fixed seeds, which keeps it prerenderable.
 */

const W = 1600;
const H = 136;

/** A rounded plus, the silhouette of the logo's cross. */
function crossPath(cx: number, cy: number, size: number, arm: number, r: number, ri = r) {
  const h = size / 2;
  const a = arm;
  const p = (x: number, y: number) => `${+(cx + x).toFixed(2)} ${+(cy + y).toFixed(2)}`;
  return [
    `M${p(-a + r, -h)}`,
    `H${+(cx + a - r).toFixed(2)}`,
    `A${r} ${r} 0 0 1 ${p(a, -h + r)}`,
    `V${+(cy - a - ri).toFixed(2)}`,
    `A${ri} ${ri} 0 0 0 ${p(a + ri, -a)}`,
    `H${+(cx + h - r).toFixed(2)}`,
    `A${r} ${r} 0 0 1 ${p(h, -a + r)}`,
    `V${+(cy + a - r).toFixed(2)}`,
    `A${r} ${r} 0 0 1 ${p(h - r, a)}`,
    `H${+(cx + a + ri).toFixed(2)}`,
    `A${ri} ${ri} 0 0 0 ${p(a, a + ri)}`,
    `V${+(cy + h - r).toFixed(2)}`,
    `A${r} ${r} 0 0 1 ${p(a - r, h)}`,
    `H${+(cx - a + r).toFixed(2)}`,
    `A${r} ${r} 0 0 1 ${p(-a, h - r)}`,
    `V${+(cy + a + ri).toFixed(2)}`,
    `A${ri} ${ri} 0 0 0 ${p(-a - ri, a)}`,
    `H${+(cx - h + r).toFixed(2)}`,
    `A${r} ${r} 0 0 1 ${p(-h, a - r)}`,
    `V${+(cy - a + r).toFixed(2)}`,
    `A${r} ${r} 0 0 1 ${p(-h + r, -a)}`,
    `H${+(cx - a - ri).toFixed(2)}`,
    `A${ri} ${ri} 0 0 0 ${p(-a, -a - ri)}`,
    `V${+(cy - h + r).toFixed(2)}`,
    `A${r} ${r} 0 0 1 ${p(-a + r, -h)}`,
    "Z",
  ].join("");
}

/** Deterministic pseudo-random sequence (a small LCG), so output is identical every render. */
function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

/* Dashboard: a monitor trace over graph paper. */
const PULSE_BASE = 82;
const PULSE_END = W - 56;
const PULSE_PATH = (() => {
  const beats = [W - 150, W - 390, W - 630, W - 870, W - 1110, W - 1350];
  const segments: string[] = [`M0 ${PULSE_BASE}`];
  for (const x of [...beats].reverse()) {
    segments.push(
      `L${x - 78} ${PULSE_BASE}`,
      `Q${x - 64} ${PULSE_BASE - 12} ${x - 50} ${PULSE_BASE}`,
      `L${x - 14} ${PULSE_BASE}`,
      `L${x - 8} ${PULSE_BASE + 8}`,
      `L${x} ${PULSE_BASE - 52}`,
      `L${x + 9} ${PULSE_BASE + 20}`,
      `L${x + 16} ${PULSE_BASE}`,
      `L${x + 40} ${PULSE_BASE}`,
      `Q${x + 58} ${PULSE_BASE - 18} ${x + 76} ${PULSE_BASE}`,
    );
  }
  segments.push(`L${PULSE_END} ${PULSE_BASE}`);
  return segments.join("");
})();

function PulseMotif() {
  return (
    <>
      <defs>
        <pattern id="motif-graph" width="22" height="22" patternUnits="userSpaceOnUse" x={W % 22}>
          <path d="M22 0H0V22" fill="none" stroke="currentColor" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width={W} height={H} fill="url(#motif-graph)" className="text-motif-blue opacity-[0.07] dark:opacity-[0.09]" />
      <path
        d={PULSE_PATH}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        className="text-motif-blue opacity-35 dark:opacity-45"
      />
      <circle cx={PULSE_END} cy={PULSE_BASE} r="10" className="fill-motif-mint opacity-20" />
      <circle cx={PULSE_END} cy={PULSE_BASE} r="4.5" className="fill-motif-mint" />
    </>
  );
}

/* Doctors: a lattice of the logo's cross, a few picked out. */
const CROSS_PITCH = 36;
const CROSS_ORIGIN = W % CROSS_PITCH;
const CROSS_HIGHLIGHTS = (() => {
  const random = seeded(7);
  // The rightmost lattice column on even rows; odd rows sit half a pitch to the left.
  const lastColumn =
    CROSS_ORIGIN +
    CROSS_PITCH / 2 +
    CROSS_PITCH * Math.floor((W - CROSS_ORIGIN - CROSS_PITCH / 2) / CROSS_PITCH);
  const marks: { d: string; tone: "mint" | "navy" }[] = [];
  for (let row = 0; row < 4; row++) {
    const y = 18 + row * CROSS_PITCH;
    const shift = row % 2 ? CROSS_PITCH / 2 : 0;
    for (let col = 0; col < 18; col++) {
      const x = lastColumn - col * CROSS_PITCH - shift;
      const roll = random();
      if (roll > 0.88) marks.push({ d: crossPath(x, y, 14, 2.5, 1.8, 1.2), tone: roll > 0.96 ? "mint" : "navy" });
    }
  }
  return marks;
})();

function CrossMotif() {
  const tile = CROSS_PITCH;
  return (
    <>
      <defs>
        <pattern id="motif-cross" width={tile} height={tile * 2} patternUnits="userSpaceOnUse" x={CROSS_ORIGIN}>
          <path d={crossPath(tile / 2, tile / 2, 12, 2, 1.5, 1)} fill="currentColor" />
          <path d={crossPath(0, tile * 1.5, 12, 2, 1.5, 1)} fill="currentColor" />
          <path d={crossPath(tile, tile * 1.5, 12, 2, 1.5, 1)} fill="currentColor" />
        </pattern>
      </defs>
      <rect
        width={W}
        height={H}
        fill="url(#motif-cross)"
        className="text-motif-navy opacity-[0.09] dark:opacity-[0.16]"
      />
      {CROSS_HIGHLIGHTS.map((mark, index) => (
        <path
          key={index}
          d={mark.d}
          className={cn(
            mark.tone === "mint" ? "fill-motif-mint opacity-70" : "fill-motif-navy opacity-30 dark:opacity-45",
          )}
        />
      ))}
    </>
  );
}

/* Patients: a ward board of rounded beds, some occupied. */
const BED = 18;
const BED_PITCH = 27;
const BED_ORIGIN = W % BED_PITCH;
const BEDS = (() => {
  const random = seeded(23);
  const beds: { x: number; y: number; tone: "mint" | "mint-soft" | "blue" }[] = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 22; col++) {
      const x = W - BED_PITCH * (col + 1) + (BED_PITCH - BED) / 2;
      const y = row * BED_PITCH + (BED_PITCH - BED) / 2;
      const roll = random();
      if (roll > 0.74) beds.push({ x, y, tone: roll > 0.97 ? "blue" : roll > 0.88 ? "mint" : "mint-soft" });
    }
  }
  return beds;
})();

function WardMotif() {
  const inset = (BED_PITCH - BED) / 2;
  return (
    <>
      <defs>
        <pattern id="motif-ward" width={BED_PITCH} height={BED_PITCH} patternUnits="userSpaceOnUse" x={BED_ORIGIN}>
          <rect
            x={inset + 0.5}
            y={inset + 0.5}
            width={BED - 1}
            height={BED - 1}
            rx="5.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width={W} height={H} fill="url(#motif-ward)" className="text-motif-mint opacity-25 dark:opacity-20" />
      {BEDS.map((bed, index) => (
        <rect
          key={index}
          x={bed.x}
          y={bed.y}
          width={BED}
          height={BED}
          rx="6"
          className={cn(
            bed.tone === "blue" && "fill-motif-blue opacity-35",
            bed.tone === "mint" && "fill-motif-mint opacity-45 dark:opacity-40",
            bed.tone === "mint-soft" && "fill-motif-mint opacity-[0.16] dark:opacity-[0.14]",
          )}
        />
      ))}
    </>
  );
}

/* Doctor profile: the logo's cross as a badge, split on the diagonal like the mark. */
const BADGE_X = W - 124;
const BADGE_Y = 14;
const BADGE_RINGS = [64, 112, 160, 208].map((size, index) =>
  crossPath(BADGE_X, BADGE_Y, size, size * 0.2, size * 0.16, size * 0.07 + index),
);
const BADGE_CORE = crossPath(BADGE_X, BADGE_Y, 64, 12.8, 10.2, 4.5);

function BadgeMotif() {
  const reach = 200;
  return (
    <>
      <defs>
        <clipPath id="motif-badge-blue">
          <polygon
            points={`${BADGE_X - reach},${BADGE_Y + reach} ${BADGE_X - reach},${BADGE_Y - reach} ${BADGE_X + reach},${BADGE_Y - reach}`}
          />
        </clipPath>
        <clipPath id="motif-badge-mint">
          <polygon
            points={`${BADGE_X - reach},${BADGE_Y + reach} ${BADGE_X + reach},${BADGE_Y + reach} ${BADGE_X + reach},${BADGE_Y - reach}`}
          />
        </clipPath>
      </defs>
      {(["blue", "mint"] as const).map((tone) => (
        <g
          key={tone}
          clipPath={`url(#motif-badge-${tone})`}
          className={tone === "blue" ? "text-motif-blue" : "text-motif-mint"}
        >
          <path d={BADGE_CORE} fill="currentColor" className="opacity-15 dark:opacity-20" />
          {BADGE_RINGS.map((d, index) => (
            <path
              key={index}
              d={d}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              style={{ opacity: 0.42 - index * 0.08 }}
            />
          ))}
        </g>
      ))}
    </>
  );
}

const MOTIFS = {
  dashboard: PulseMotif,
  doctors: CrossMotif,
  patients: WardMotif,
  profile: BadgeMotif,
} satisfies Record<string, () => ReactNode>;

export type PageMotifName = keyof typeof MOTIFS;

/**
 * Positioned against the panel, not the page column, so it spans the panel's full width.
 * Render it first on a page, before any content.
 */
export function PageMotif({ name }: { name: PageMotifName }) {
  const Motif = MOTIFS[name];
  return (
    <div
      aria-hidden="true"
      data-slot="page-motif"
      className="motif-mask pointer-events-none absolute inset-x-0 top-0 -z-10 h-28 overflow-hidden opacity-75 select-none md:h-34 md:opacity-100"
    >
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        className="absolute top-0 right-0 max-w-none"
        focusable="false"
      >
        <Motif />
      </svg>
    </div>
  );
}

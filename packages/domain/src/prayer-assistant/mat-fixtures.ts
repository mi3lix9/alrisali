import type { LumaFrame } from "./mat";

// Luminance traces of a phone lying face-up on the prayer mat, at the 15 fps
// the camera runs. MODELLED, NOT RECORDED: no phone has run Mat mode in the
// rebuild yet (ticket 46 leaves the device run open). Each trace follows what
// the old app measured on real phones while its thresholds were tuned:
// - A sujud dims the ceiling to 50–75 % of its light, not to black: the head
//   hovers 10–30 cm over the lens and side light still reaches it.
// - Auto-exposure raises the gain within about a second, so a covered lens
//   creeps back towards the ceiling's brightness while staying flat (it loses
//   the ceiling's texture).
// - Auto-exposure can flicker a covered lens bright for a few hundred ms.
// - Ruku and standing barely shade the ceiling.
// Replace them with recorded traces once the device run logs frames.

export const FRAME_MS = 1000 / 15;

/** The ceiling seen from the mat: its mean luminance and texture (spatial variance). */
interface Ceiling {
  mean: number;
  variance: number;
}

/** A plain ceiling with light fittings and edges in view. */
export const TEXTURED_CEILING: Ceiling = { mean: 0.55, variance: 0.012 };
/** A smooth, evenly lit ceiling: its texture carries no signal. */
export const FLAT_CEILING: Ceiling = { mean: 0.6, variance: 0.0015 };
/** A room lit by one small lamp. */
export const DARK_ROOM: Ceiling = { mean: 0.08, variance: 0.001 };

/** Where the light goes, as shares of the ceiling's own brightness and texture. */
interface Shade {
  light: number;
  texture: number;
}

/** A linear ramp from the previous shade to `to` over `ms`. */
export interface Segment {
  ms: number;
  to: Shade;
}

const OPEN: Shade = { light: 1, texture: 1 };

/** Nothing over the lens: standing, reciting, sitting. */
export const open = (ms: number): Segment[] => [{ ms, to: OPEN }];

/** Bowing in Ruku over the phone: a faint shade. */
export const ruku = (ms = 2000): Segment[] => [
  { ms: 400, to: { light: 0.93, texture: 0.9 } },
  { ms: ms - 800, to: { light: 0.93, texture: 0.9 } },
  { ms: 400, to: OPEN },
];

interface SujudShape {
  ms?: number;
  /** The darkest share of the ceiling's light, reached on the way down. */
  dip?: number;
  /** How far auto-exposure brings the light back over the sujud. */
  creep?: number;
  /** The ceiling texture still visible. */
  texture?: number;
  /** How long the head takes to come down. */
  descentMs?: number;
}

/** One sujud over the lens, down and back up. */
export const sujud = ({
  ms = 3000,
  dip = 0.45,
  creep = 0.15,
  texture = 0.08,
  descentMs = 300,
}: SujudShape = {}): Segment[] => [
  { ms: descentMs, to: { light: dip, texture } },
  { ms: ms - descentMs - 300, to: { light: dip + creep, texture } },
  { ms: 300, to: OPEN },
];

/** A sujud during which auto-exposure flickers the covered lens bright. */
export const flickeringSujud = (): Segment[] => [
  { ms: 300, to: { light: 0.45, texture: 0.08 } },
  { ms: 1200, to: { light: 0.5, texture: 0.08 } },
  { ms: 100, to: { light: 0.92, texture: 0.7 } },
  { ms: 250, to: { light: 0.92, texture: 0.7 } },
  { ms: 100, to: { light: 0.5, texture: 0.08 } },
  { ms: 1200, to: { light: 0.58, texture: 0.08 } },
  { ms: 300, to: OPEN },
];

/** A hand or a child passing over the phone. */
export const passBy = (ms = 1000): Segment[] => [
  { ms: 150, to: { light: 0.3, texture: 0.1 } },
  { ms: ms - 300, to: { light: 0.3, texture: 0.1 } },
  { ms: 150, to: OPEN },
];

/** Sensor noise: a fixed sequence, so every run sees the same frames. */
const noise = (seed: number) => {
  let value = seed;
  return () => {
    value = (value * 1_103_515_245 + 12_345) % 2_147_483_648;
    return value / 2_147_483_648 - 0.5;
  };
};

/** The frames a phone under this ceiling reads through these segments. */
export const trace = (
  ceiling: Ceiling,
  segments: readonly Segment[],
  seed = 46
): LumaFrame[] => {
  const jitter = noise(seed);
  const frames: LumaFrame[] = [];
  let from = OPEN;
  let start = 0;
  for (const { ms, to } of segments) {
    for (let at = start; at < start + ms; at += FRAME_MS) {
      const done = Math.min(1, (at - start) / ms);
      const light = from.light + (to.light - from.light) * done;
      const texture = from.texture + (to.texture - from.texture) * done;
      frames.push({
        at: Math.round(at),
        mean: ceiling.mean * light * (1 + jitter() * 0.02),
        variance: ceiling.variance * texture * (1 + jitter() * 0.2),
      });
    }
    // Continue on the next frame boundary so frames stay evenly spaced.
    start += Math.ceil(ms / FRAME_MS) * FRAME_MS;
    from = to;
  }
  return frames;
};

/** One Rak'ah after its Qiyam: Ruku, I'tidal, two sujuds with the Jalsa between. */
export const rakah = (sujudShape?: SujudShape): Segment[] => [
  ...ruku(),
  ...open(1500),
  ...sujud(sujudShape),
  ...open(1500),
  ...sujud(sujudShape),
];

/**
 * A Fajr under a textured ceiling: the phone settles, the Believer recites,
 * then two Rak'ahs and a final Tashahhud long enough to end it at Normal.
 */
export const fajr = (sujudShape?: SujudShape): Segment[] => [
  ...open(3000),
  ...open(6000),
  ...rakah(sujudShape),
  ...open(8000),
  ...rakah(sujudShape),
  ...open(15_000),
];

/** A Dhuhr: the middle Tashahhud, then standing for Rak'ahs three and four. */
export const dhuhr = (): Segment[] => [
  ...open(3000),
  ...open(6000),
  ...rakah(),
  ...open(8000),
  ...rakah(),
  ...open(9500),
  ...open(6000),
  ...rakah(),
  ...open(8000),
  ...rakah(),
  ...open(15_000),
];

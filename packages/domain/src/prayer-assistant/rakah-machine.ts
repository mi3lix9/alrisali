import type { Salah } from "../shared";
import { paceHolds } from "./pace";
import type { PaceChoice, PaceHolds } from "./pace";

/** A posture within a Rak'ah. */
export const POSITIONS = [
  "qiyam",
  "ruku",
  "itidal",
  "sujud",
  "jalsa",
  "tashahhud",
] as const;

export type Position = (typeof POSITIONS)[number];

/** Rak'ahs in each Salah. */
export const RAKAH_COUNT = {
  fajr: 2,
  dhuhr: 4,
  asr: 4,
  maghrib: 3,
  isha: 4,
} as const satisfies Record<Salah, number>;

/** The middle Tashahhud follows the second Rak'ah of a longer Salah. */
const MIDDLE_TASHAHHUD_AFTER = 2;

/** The Positions of one Rak'ah, before any Tashahhud. */
const RAKAH_POSITIONS = [
  "qiyam",
  "ruku",
  "itidal",
  "sujud",
  "jalsa",
  "sujud",
] as const satisfies readonly Position[];

/** One step the Believer performs: a Position in a Rak'ah. */
export interface Step {
  rakah: number;
  position: Position;
  /** The final Tashahhud, whose hold ends the Salah. */
  final: boolean;
}

/** Every step of a Salah in order, ending with the final Tashahhud. */
export const salahSteps = (salah: Salah): readonly Step[] => {
  const total = RAKAH_COUNT[salah];
  return Array.from({ length: total }, (_, index) => index + 1).flatMap(
    (rakah): Step[] => {
      const positions: Step[] = RAKAH_POSITIONS.map((position) => ({
        rakah,
        position,
        final: false,
      }));
      if (rakah === total) {
        return [...positions, { rakah, position: "tashahhud", final: true }];
      }
      if (rakah === MIDDLE_TASHAHHUD_AFTER) {
        return [...positions, { rakah, position: "tashahhud", final: false }];
      }
      return positions;
    }
  );
};

/**
 * What the Prayer Assistant learns, from any Recognition Mode or the
 * Believer's hand. Every mode feeds the same machine:
 *
 * - `advance`: a tap, or a Takbir in Sound mode, moves one step on.
 * - `back`: a tap undoes one step, to correct a mistake.
 * - `sensed`: a continuous reading (Camera, Head Height) of the Position the
 *   Believer is in, or null when none is recognised. It counts once it has
 *   held for the Pace; sensing never moves backwards.
 * - `confirmed`: a Position a sensor has already proven (Mat mode's sujud
 *   cover). It moves straight to the next step in that Position without a
 *   hold, never jumping past a Tashahhud.
 * - `tick`: time passes, so the final Tashahhud hold can end the Salah.
 *
 * An Observation is a Sighting stamped with `at`, a monotonic time in
 * milliseconds.
 */
export type Sighting =
  | { kind: "advance" }
  | { kind: "back" }
  | { kind: "sensed"; position: Position | null }
  | { kind: "confirmed"; position: Position }
  | { kind: "tick" };

export type Observation = Sighting & { at: number };

/** Positions that count as the same posture while holding. */
type Posture = Exclude<Position, "jalsa" | "tashahhud"> | "seated";

interface Sensing {
  posture: Posture;
  /** When the Believer took this posture. */
  since: number;
}

interface FinalHold {
  /** When the Believer sat for the final Tashahhud. */
  since: number;
  /** When sensing last saw them leave the seat, while it may be a flicker. */
  leftAt: number | null;
}

export interface AssistantState {
  salah: Salah;
  holds: PaceHolds;
  steps: readonly Step[];
  /** The step the Believer is in now. */
  index: number;
  /** The final Tashahhud was held: the Salah is done. */
  completed: boolean;
  sensing: Sensing | null;
  finalHold: FinalHold | null;
}

/** The Prayer Assistant at the start of a Salah, standing in the first Rak'ah. */
export const startSalah = (salah: Salah, pace: PaceChoice): AssistantState => ({
  salah,
  holds: paceHolds(pace),
  steps: salahSteps(salah),
  index: 0,
  completed: false,
  sensing: null,
  finalHold: null,
});

export const currentStep = (state: AssistantState): Step => {
  const step = state.steps[state.index];
  if (!step) {
    throw new Error(`No step ${state.index} in ${state.salah}`);
  }
  return step;
};

/**
 * When the final Tashahhud hold will end the Salah if the Believer stays
 * seated, or null outside it. The screen ticks the machine at that time.
 */
export const completesAt = (state: AssistantState): number | null =>
  state.completed || !state.finalHold || state.finalHold.leftAt !== null
    ? null
    : state.finalHold.since + state.holds.finalTashahhudMs;

const postureOf = (position: Position): Posture =>
  position === "jalsa" || position === "tashahhud" ? "seated" : position;

/** Moves to a step; arriving at the final Tashahhud starts its hold. */
const moveTo = (
  state: AssistantState,
  index: number,
  at: number,
  sittingSince: number = at
): AssistantState => ({
  ...state,
  index,
  finalHold: state.steps[index]?.final
    ? { since: sittingSince, leftAt: null }
    : null,
});

const finishIfHeld = (state: AssistantState, at: number): AssistantState => {
  const end = completesAt(state);
  return end !== null && at >= end ? { ...state, completed: true } : state;
};

const advance = (state: AssistantState, at: number): AssistantState =>
  currentStep(state).final
    ? { ...state, completed: true }
    : moveTo(state, state.index + 1, at);

const back = (state: AssistantState, at: number): AssistantState =>
  state.index === 0 ? state : moveTo(state, state.index - 1, at);

const confirmed = (
  state: AssistantState,
  position: Position,
  at: number
): AssistantState => {
  for (let index = state.index + 1; index < state.steps.length; index += 1) {
    const step = state.steps[index];
    if (step?.position === position) {
      return moveTo(state, index, at);
    }
    if (step?.position === "tashahhud") {
      return state;
    }
  }
  return state;
};

/** The final Tashahhud's clock survives a flicker but not a real rise. */
const holdFinal = (
  state: AssistantState,
  posture: Posture,
  at: number
): AssistantState => {
  const hold = state.finalHold;
  if (!hold) {
    return state;
  }
  if (posture === "seated") {
    return hold.leftAt === null
      ? state
      : { ...state, finalHold: { since: hold.since, leftAt: null } };
  }
  const leftAt = hold.leftAt ?? at;
  return at - leftAt >= state.holds.positionMs
    ? { ...state, finalHold: null }
    : { ...state, finalHold: { since: hold.since, leftAt } };
};

const sensed = (
  state: AssistantState,
  position: Position,
  at: number
): AssistantState => {
  const posture = postureOf(position);
  const sensing =
    state.sensing?.posture === posture ? state.sensing : { posture, since: at };
  const held = at - sensing.since;
  const next: AssistantState = { ...state, sensing };
  const step = currentStep(state);
  const following = state.steps[state.index + 1];

  if (step.final) {
    // Sitting back down after a real rise starts the hold again.
    return next.finalHold || posture !== "seated"
      ? holdFinal(next, posture, at)
      : moveTo(next, state.index, at, sensing.since);
  }
  if (!following) {
    return next;
  }

  const rising = following.position === "qiyam" && following.rakah > step.rakah;
  if (rising || following.position === "tashahhud") {
    // After a Rak'ah's last sujud: sitting makes a Tashahhud, standing rises
    // for the next Rak'ah (past a middle Tashahhud the camera missed).
    if (posture === "seated" && following.position === "tashahhud") {
      return held >= state.holds.tashahhudMs
        ? moveTo(next, state.index + 1, at, sensing.since)
        : next;
    }
    const standing = position === "qiyam" || position === "itidal";
    const rise = state.steps.findIndex(
      (candidate, index) => index > state.index && candidate.rakah > step.rakah
    );
    return standing && rise !== -1 && held >= state.holds.risingMs
      ? moveTo(next, rise, at)
      : next;
  }

  return postureOf(following.position) === posture &&
    held >= state.holds.positionMs
    ? moveTo(next, state.index + 1, at)
    : next;
};

/** The machine after one Observation; a finished Salah ignores the rest. */
export const observe = (
  state: AssistantState,
  observation: Observation
): AssistantState => {
  if (state.completed) {
    return state;
  }
  const { at } = observation;
  switch (observation.kind) {
    case "advance": {
      return advance(state, at);
    }
    case "back": {
      return back(state, at);
    }
    case "confirmed": {
      return finishIfHeld(confirmed(state, observation.position, at), at);
    }
    case "sensed": {
      return finishIfHeld(
        observation.position === null
          ? state
          : sensed(state, observation.position, at),
        at
      );
    }
    case "tick": {
      return finishIfHeld(state, at);
    }
    default: {
      return state;
    }
  }
};

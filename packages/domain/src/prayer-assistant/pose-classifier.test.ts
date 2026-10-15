import { describe, expect, it } from "vitest";

import { decodeMoveNet, KEYPOINTS } from "./pose";
import type { Keypoint, Pose } from "./pose";
import {
  classifyPose,
  POSE_FRAME_MS,
  startPoseClassifier,
} from "./pose-classifier";
import type { PoseClassifier, PoseEngine } from "./pose-classifier";
import { NAMOZ_MOVENET } from "./pose-fixtures";
import { currentStep, observe, startSalah } from "./rakah-machine";
import type { AssistantState, Position } from "./rakah-machine";

const recorded = (name: keyof typeof NAMOZ_MOVENET): Pose =>
  decodeMoveNet(NAMOZ_MOVENET[name], "up");

const STANDING = recorded("standing");
const TAKBIR = recorded("takbir");
const QIYAM = recorded("qiyam");
const RUKU = recorded("ruku");
const SUJUD = recorded("sujud");
const SEATED = recorded("seated");
const SALAM_RIGHT = recorded("salamRight");
const SALAM_LEFT = recorded("salamLeft");

/** A pose part-way from `from` to `to` (0 = from, 1 = to). */
const between = (from: Pose, to: Pose, share: number): Pose => {
  const entries = KEYPOINTS.map((name): [string, Keypoint] => [
    name,
    {
      y: from[name].y + (to[name].y - from[name].y) * share,
      x: from[name].x + (to[name].x - from[name].x) * share,
      score: Math.min(from[name].score, to[name].score),
    },
  ]);
  return Object.fromEntries(entries) as Pose;
};

/** The same pose, the Believer standing further from the camera. */
const fartherAway = (pose: Pose, scale: number): Pose => {
  const entries = KEYPOINTS.map((name): [string, Keypoint] => [
    name,
    { ...pose[name], y: 1 - (1 - pose[name].y) * scale },
  ]);
  return Object.fromEntries(entries) as Pose;
};

/** Every reading over the frames, at the sensor's frame rate. */
const readings = (
  classifier: PoseClassifier,
  frames: readonly (Pose | null)[],
  calibrating = true
): { classifier: PoseClassifier; positions: (Position | null)[] } => {
  let current = classifier;
  const positions: (Position | null)[] = [];
  for (const pose of frames) {
    const reading = classifyPose(current, pose, calibrating);
    current = reading.classifier;
    positions.push(reading.position);
  }
  return { classifier: current, positions };
};

const hold = (pose: Pose, frames: number): Pose[] =>
  Array.from({ length: frames }, () => pose);

/** What the classifier settles on after each held pose, mid-Salah. */
const settled = (
  classifier: PoseClassifier,
  poses: readonly Pose[],
  framesEach = 8
): (Position | null)[] => {
  let current = classifier;
  return poses.map((pose) => {
    const reading = readings(current, hold(pose, framesEach), false);
    current = reading.classifier;
    return reading.positions.at(-1) ?? null;
  });
};

const ENGINES = ["camera", "head-height"] as const satisfies PoseEngine[];

/** A classifier that has seen the Believer stand still before the Salah. */
const calibrated = (engine: PoseEngine, bowSensitivity = 70): PoseClassifier =>
  readings(startPoseClassifier(engine, bowSensitivity), hold(STANDING, 10))
    .classifier;

/** One Rak'ah's Positions held as long as a Believer at Normal Pace would. */
const rakah = (standFrames: number): Pose[] => [
  ...hold(QIYAM, standFrames),
  ...hold(RUKU, 15),
  ...hold(QIYAM, 15),
  ...hold(SUJUD, 15),
  ...hold(SEATED, 15),
  ...hold(SUJUD, 15),
];

describe(classifyPose, () => {
  it.each(ENGINES)(
    "%s: recognises nothing until a steady stand sets the standing reference",
    (engine) => {
      const { positions } = readings(
        startPoseClassifier(engine, 70),
        hold(STANDING, 8)
      );
      expect(positions.slice(0, 7)).toStrictEqual(
        Array.from({ length: 7 }, () => null)
      );
      expect(positions.at(-1)).toBe("qiyam");
    }
  );

  it.each(ENGINES)(
    "%s: reads a recorded Rak'ah, I'tidal after Ruku and Qiyam after the sitting",
    (engine) => {
      const ready = calibrated(engine);
      expect(
        settled(ready, [
          TAKBIR,
          QIYAM,
          RUKU,
          QIYAM,
          SUJUD,
          SEATED,
          SUJUD,
          QIYAM,
        ])
      ).toStrictEqual([
        "qiyam",
        "qiyam",
        "ruku",
        "itidal",
        "sujud",
        "jalsa",
        "sujud",
        "qiyam",
      ]);
    }
  );

  it.each(ENGINES)(
    "%s: reads the final sitting and both salams as seated",
    (engine) => {
      const ready = calibrated(engine);
      expect(
        settled(ready, [SUJUD, SEATED, SALAM_RIGHT, SALAM_LEFT])
      ).toStrictEqual(["sujud", "jalsa", "jalsa", "jalsa"]);
    }
  );

  it.each(ENGINES)(
    "%s: recognises nothing without a body in view",
    (engine) => {
      const ready = calibrated(engine);
      const unseen = Object.fromEntries(
        KEYPOINTS.map((name) => [name, { ...STANDING[name], score: 0.05 }])
      ) as Pose;
      expect(readings(ready, [null, unseen]).positions).toStrictEqual([
        null,
        null,
      ]);
    }
  );

  it.each(ENGINES)(
    "%s: a shallow bow counts as Ruku only at a high bow sensitivity",
    (engine) => {
      const shallowBow = between(QIYAM, RUKU, 0.45);
      const bowAt = (sensitivity: number) =>
        settled(calibrated(engine, sensitivity), [QIYAM, shallowBow]).at(-1);
      expect(bowAt(100)).toBe("ruku");
      expect(bowAt(0)).not.toBe("ruku");
    }
  );

  it.each(ENGINES)(
    "%s: re-sets the standing reference on a later steady stand until the Salah moves on",
    (engine) => {
      const steppedBack = fartherAway(STANDING, 0.6);
      const tooClose = calibrated(engine);

      // Still in the first Qiyam: standing still farther away re-calibrates.
      const recalibrated = readings(tooClose, hold(steppedBack, 10));
      expect(recalibrated.positions.at(-1)).toBe("qiyam");

      // Once the Salah has moved on, the reference stays: a held bow or
      // sitting can never become the new stand.
      const frozen = readings(tooClose, hold(steppedBack, 10), false);
      expect(frozen.positions.at(-1)).not.toBe("qiyam");
    }
  );

  it("head-height: a bow seen from the front counts by the head dropping to the shoulders", () => {
    const headDown = Object.fromEntries(
      KEYPOINTS.map((name) => {
        const point = QIYAM[name];
        const head = KEYPOINTS.indexOf(name) <= KEYPOINTS.indexOf("right_ear");
        return [name, head ? { ...point, y: point.y + 0.07 } : point];
      })
    ) as Pose;
    expect(settled(calibrated("head-height"), [QIYAM, headDown])).toStrictEqual(
      ["qiyam", "ruku"]
    );
    expect(settled(calibrated("camera"), [QIYAM, headDown])).toStrictEqual([
      "qiyam",
      "qiyam",
    ]);
  });
});

describe("a recorded Fajr through the rak'ah machine", () => {
  it.each(ENGINES)(
    "%s: every classified frame, sent as `sensed`, completes the Salah",
    (engine) => {
      const frames = [
        ...hold(STANDING, 10),
        ...hold(TAKBIR, 5),
        ...rakah(20),
        ...rakah(20),
        // The final Tashahhud, held past Normal Pace's 12 s.
        ...hold(SEATED, 140),
      ];
      let classifier = startPoseClassifier(engine, 70);
      let state: AssistantState = startSalah("fajr", { pace: "normal" });
      const visited = new Set<string>();
      for (const [frame, pose] of frames.entries()) {
        const reading = classifyPose(classifier, pose, state.index === 0);
        ({ classifier } = reading);
        state = observe(state, {
          kind: "sensed",
          position: reading.position,
          at: frame * POSE_FRAME_MS,
        });
        if (!state.completed) {
          const step = currentStep(state);
          visited.add(`${step.rakah}:${step.position}`);
        }
      }
      expect(state.completed).toBeTruthy();
      expect([...visited]).toStrictEqual([
        "1:qiyam",
        "1:ruku",
        "1:itidal",
        "1:sujud",
        "1:jalsa",
        "2:qiyam",
        "2:ruku",
        "2:itidal",
        "2:sujud",
        "2:jalsa",
        "2:tashahhud",
      ]);
    }
  );
});

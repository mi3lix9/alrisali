import type { Keypoint, KeypointName, Pose } from "./pose";
import type { Position } from "./rakah-machine";
import { BOW_SENSITIVITY_LIMITS } from "./settings";

/**
 * How a camera Recognition Mode reads the Position from a Pose:
 *
 * - `camera`: the whole body's height against the calibrated stand, with the
 *   torso's shortening as the bow.
 * - `head-height`: how high the head sits against the calibrated stand,
 *   with the torso and the head dropping to the shoulders as the bow.
 *
 * Both calibrate themselves to the Believer's stand, so the phone can stand
 * on the floor or at chest height.
 */
export type PoseEngine = "camera" | "head-height";

/** The sensor reads about ten frames a second; the holds below assume it. */
export const POSE_FRAME_MS = 100;

/**
 * Keypoints below this confidence count as not seen. The old app used 0.25,
 * which loses the shoulders in the recorded sujud (0.24 and 0.27).
 */
const MIN_SCORE = 0.2;

/** Frames of steady standing that set the standing reference. */
const CALIBRATION_FRAMES = 8;
const CALIBRATION_STEADY_FLOOR = 0.025;
const CALIBRATION_STEADY_SHARE = 0.06;
const CALIBRATION_MIN_HEIGHT = 0.12;
const CALIBRATION_MIN_TORSO = 0.02;
const CALIBRATION_MIN_UPRIGHT = 0.5;
const CALIBRATION_MIN_HEAD_ABOVE_SHOULDERS = 0.05;
/** How far the torso's share of the body may move from the stand's. */
const CALIBRATION_SHARE_TOLERANCE = 0.15;

/** Frames before any reading, and the smallest trustworthy references. */
const WARM_UP_FRAMES = 3;
const MIN_REFERENCE_HEIGHT = 0.05;
const MIN_REFERENCE_TORSO = 0.02;

/** During the Salah the stand slowly forgets a taller reading. */
const REFERENCE_DRIFT = 0.001;
/** Smoothing weights on the new reading: faster while rising. */
const RISING_WEIGHT = 0.6;
const SETTLING_WEIGHT = 0.4;
const TORSO_WEIGHT = 0.4;
/** Height gain per frame that counts as getting up. */
const RISE_PER_FRAME = 0.01;
const RISING_FRAMES = 3;

/** Knees bent under this angle (degrees) mean sitting. */
const KNEES_FOLDED_BELOW = 125;
const STRAIGHT_KNEES = 180;

/** Bands of height against the stand, per engine. */
const BANDS = {
  camera: { standing: 0.75, sujud: 0.42 },
  "head-height": { standing: 0.72, sujud: 0.38 },
} as const satisfies Record<PoseEngine, { standing: number; sujud: number }>;
/** How much easier standing is to keep, or to reach while getting up. */
const KEEP_STANDING = 0.08;
const RISE_FROM_BOW = 0.06;
const RISE_FROM_SITTING = 0.03;

interface Calibration {
  heights: readonly number[];
  torsos: readonly number[];
}

/** A camera Recognition Mode's memory of the Believer between frames. */
export interface PoseClassifier {
  engine: PoseEngine;
  /** A torso shorter than this share of the stand is bowing. */
  bowRatio: number;
  /** A head closer than this to the shoulders (torso lengths) is bowing. */
  headBow: number;
  referenceHeight: number;
  referenceTorso: number;
  height: number | null;
  torso: number | null;
  risingFrames: number;
  frames: number;
  /** Standing next reads as I'tidal: the Believer bowed. */
  pendingItidal: boolean;
  lastPosition: Position | null;
  /** The standing frames so far, until the Salah moves on; then null. */
  calibration: Calibration | null;
}

/**
 * The bow thresholds for a bow sensitivity: 0 needs a deep bow, 100 takes a
 * shallow one. The torso threshold stays under an upright sitting's (about
 * 0.9) so a sitting never reads as Ruku.
 */
const bowThresholds = (
  sensitivity: number
): { bowRatio: number; headBow: number } => {
  const clamped = Math.min(
    BOW_SENSITIVITY_LIMITS.max,
    Math.max(BOW_SENSITIVITY_LIMITS.min, sensitivity)
  );
  const share = clamped / BOW_SENSITIVITY_LIMITS.max;
  return { bowRatio: 0.6 + share * 0.2, headBow: 0.08 + share * 0.1 };
};

/** A classifier with no standing reference yet, for one Salah. */
export const startPoseClassifier = (
  engine: PoseEngine,
  bowSensitivity: number
): PoseClassifier => ({
  engine,
  ...bowThresholds(bowSensitivity),
  referenceHeight: 0,
  referenceTorso: 0,
  height: null,
  torso: null,
  risingFrames: 0,
  frames: 0,
  pendingItidal: false,
  lastPosition: null,
  calibration: { heights: [], torsos: [] },
});

interface Features {
  /** From the top of the head to the lowest leg joint seen. */
  height: number;
  /** How far the hips sit below the shoulders. */
  torso: number;
  /** 1 with the torso vertical, 0 horizontal. */
  upright: number;
  /** The head's height above the shoulders, in torso lengths. */
  headAboveShoulders: number;
  /** A head keypoint was seen, not stood in for by the shoulders. */
  headSeen: boolean;
  kneeAngle: number;
}

const seen = (pose: Pose, name: KeypointName): Keypoint | null =>
  pose[name].score >= MIN_SCORE ? pose[name] : null;

const presentYs = (points: readonly (Keypoint | null)[]): number[] =>
  points.flatMap((point) => (point ? [point.y] : []));

const average = (values: readonly number[]): number => {
  let sum = 0;
  for (const value of values) {
    sum += value;
  }
  return sum / values.length;
};

/** The knee's angle (degrees) between thigh and shin: 180 is straight. */
const jointAngle = (hip: Keypoint, knee: Keypoint, ankle: Keypoint): number => {
  const thigh = { y: hip.y - knee.y, x: hip.x - knee.x };
  const shin = { y: ankle.y - knee.y, x: ankle.x - knee.x };
  const lengths = Math.hypot(thigh.y, thigh.x) * Math.hypot(shin.y, shin.x);
  if (lengths === 0) {
    return STRAIGHT_KNEES;
  }
  const cosine = (thigh.y * shin.y + thigh.x * shin.x) / lengths;
  return (Math.acos(Math.min(1, Math.max(-1, cosine))) * 180) / Math.PI;
};

const kneeAngle = (pose: Pose): number => {
  const legs = [
    [seen(pose, "left_hip"), seen(pose, "left_knee"), seen(pose, "left_ankle")],
    [
      seen(pose, "right_hip"),
      seen(pose, "right_knee"),
      seen(pose, "right_ankle"),
    ],
  ].flatMap(([hip, knee, ankle]) =>
    hip && knee && ankle ? [jointAngle(hip, knee, ankle)] : []
  );
  return legs.length > 0 ? average(legs) : STRAIGHT_KNEES;
};

/** Torso lengths never shrink under this when measuring the head. */
const MIN_TORSO_LENGTH = 0.08;

/** What one frame shows, or null without both shoulders and hips. */
const featuresOf = (pose: Pose): Features | null => {
  const leftShoulder = seen(pose, "left_shoulder");
  const rightShoulder = seen(pose, "right_shoulder");
  const leftHip = seen(pose, "left_hip");
  const rightHip = seen(pose, "right_hip");
  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) {
    return null;
  }
  const shoulders = {
    y: (leftShoulder.y + rightShoulder.y) / 2,
    x: (leftShoulder.x + rightShoulder.x) / 2,
  };
  const hips = {
    y: (leftHip.y + rightHip.y) / 2,
    x: (leftHip.x + rightHip.x) / 2,
  };
  const head = presentYs(
    (["nose", "left_eye", "right_eye", "left_ear", "right_ear"] as const).map(
      (name) => seen(pose, name)
    )
  );
  const headSeen = head.length > 0;
  const headY = headSeen ? Math.min(...head) : shoulders.y;
  const legs = presentYs(
    (
      [
        "left_ankle",
        "right_ankle",
        "left_knee",
        "right_knee",
        "left_hip",
        "right_hip",
      ] as const
    ).map((name) => seen(pose, name))
  );
  const bottomY = Math.max(...legs);
  const torsoLength = Math.hypot(hips.y - shoulders.y, hips.x - shoulders.x);

  return {
    height: Math.max(bottomY - headY, 0.001),
    torso: Math.max(hips.y - shoulders.y, 0),
    upright:
      torsoLength > 0.001 ? Math.max(0, hips.y - shoulders.y) / torsoLength : 1,
    headAboveShoulders:
      (shoulders.y - headY) / Math.max(torsoLength, MIN_TORSO_LENGTH),
    headSeen,
    kneeAngle: kneeAngle(pose),
  };
};

/**
 * Whether a frame may be a stand: tall enough, torso upright, head above the
 * shoulders and knees straight (when seen). Once there is a reference, the
 * torso must keep its share of the body: from the front a bow shortens the
 * torso more than the body and sitting shortens the body but not the torso,
 * while stepping back shrinks both alike.
 */
const mayBeStanding = (
  classifier: PoseClassifier,
  features: Features
): boolean => {
  const share =
    classifier.referenceHeight === 0
      ? 1
      : features.torso /
        features.height /
        (classifier.referenceTorso / classifier.referenceHeight);
  const proportionsKept =
    share >= 1 - CALIBRATION_SHARE_TOLERANCE &&
    share <= 1 / (1 - CALIBRATION_SHARE_TOLERANCE);
  return (
    proportionsKept &&
    features.height >= CALIBRATION_MIN_HEIGHT &&
    features.torso >= CALIBRATION_MIN_TORSO &&
    features.upright > CALIBRATION_MIN_UPRIGHT &&
    features.kneeAngle >= KNEES_FOLDED_BELOW &&
    (!features.headSeen ||
      features.headAboveShoulders > CALIBRATION_MIN_HEAD_ABOVE_SHOULDERS)
  );
};

/**
 * Adds a frame to the calibration; returns the stand it proves once the
 * Believer has stood still long enough, else null. Any frame that may not be
 * a stand starts the count again.
 */
const calibrate = (
  calibration: Calibration,
  features: Features,
  standing: boolean
): { calibration: Calibration; stand: Calibration | null } => {
  if (!standing) {
    return { calibration: { heights: [], torsos: [] }, stand: null };
  }
  const next = {
    heights: [...calibration.heights, features.height].slice(
      -CALIBRATION_FRAMES
    ),
    torsos: [...calibration.torsos, features.torso].slice(-CALIBRATION_FRAMES),
  };
  if (next.heights.length < CALIBRATION_FRAMES) {
    return { calibration: next, stand: null };
  }
  const height = average(next.heights);
  const steady =
    Math.max(...next.heights) - Math.min(...next.heights) <
    Math.max(CALIBRATION_STEADY_FLOOR, height * CALIBRATION_STEADY_SHARE);
  return { calibration: next, stand: steady ? next : null };
};

/** The reference keeps the tallest reading, slowly drifting to the current. */
const track = (reference: number, current: number): number =>
  current > reference
    ? current
    : reference * (1 - REFERENCE_DRIFT) + current * REFERENCE_DRIFT;

/** Smooths the frame into the classifier and updates its references. */
const measure = (
  classifier: PoseClassifier,
  features: Features
): PoseClassifier => {
  const previous = classifier.height;
  const weight =
    previous !== null && features.height > previous
      ? RISING_WEIGHT
      : SETTLING_WEIGHT;
  const height =
    previous === null
      ? features.height
      : previous * (1 - weight) + features.height * weight;
  const torso =
    classifier.torso === null
      ? features.torso
      : classifier.torso * (1 - TORSO_WEIGHT) + features.torso * TORSO_WEIGHT;
  const rising = previous !== null && height - previous > RISE_PER_FRAME;
  const next: PoseClassifier = {
    ...classifier,
    height,
    torso,
    risingFrames: rising ? classifier.risingFrames + 1 : 0,
    frames: classifier.frames + 1,
  };

  if (!classifier.calibration) {
    return {
      ...next,
      referenceHeight: track(classifier.referenceHeight, height),
      referenceTorso: track(classifier.referenceTorso, torso),
    };
  }
  const { calibration, stand } = calibrate(
    classifier.calibration,
    features,
    mayBeStanding(classifier, features)
  );
  return stand
    ? {
        ...next,
        calibration,
        referenceHeight: average(stand.heights),
        referenceTorso: average(stand.torsos),
        pendingItidal: false,
      }
    : { ...next, calibration };
};

interface Reading {
  classifier: PoseClassifier;
  position: Position | null;
}

const standingThreshold = (
  classifier: PoseClassifier,
  standing: number
): number => {
  const wasStanding =
    classifier.lastPosition === "qiyam" || classifier.lastPosition === "itidal";
  const gettingUp = classifier.risingFrames >= RISING_FRAMES;
  if (wasStanding) {
    return standing - KEEP_STANDING;
  }
  if (
    classifier.engine === "head-height" &&
    classifier.pendingItidal &&
    gettingUp
  ) {
    return standing - RISE_FROM_BOW;
  }
  if (classifier.lastPosition === "jalsa" && gettingUp) {
    return standing - RISE_FROM_SITTING;
  }
  return standing;
};

const standOrSit = (classifier: PoseClassifier, ratio: number): Reading => {
  const standing = standingThreshold(
    classifier,
    BANDS[classifier.engine].standing
  );
  if (ratio >= standing) {
    return {
      classifier,
      position: classifier.pendingItidal ? "itidal" : "qiyam",
    };
  }
  // Getting up from Ruku passes through sitting height in Head Height, so
  // only the camera engine forgets the bow here.
  return {
    classifier:
      classifier.engine === "camera"
        ? { ...classifier, pendingItidal: false }
        : classifier,
    position: "jalsa",
  };
};

/**
 * Ruku. Only a bow reached from standing makes the next stand I'tidal:
 * getting up from sujud looks bowed for a moment.
 */
const bow = (classifier: PoseClassifier): Reading => {
  const fromStanding =
    classifier.lastPosition === "qiyam" ||
    classifier.lastPosition === "itidal" ||
    classifier.lastPosition === "ruku";
  const armsItidal = classifier.risingFrames === 0 && fromStanding;
  return {
    classifier: armsItidal
      ? { ...classifier, pendingItidal: true }
      : classifier,
    position: "ruku",
  };
};

/**
 * The whole body against the stand: low is sujud, a shortened torso on
 * straight legs is Ruku, then standing or sitting by height.
 */
const cameraPosition = (
  classifier: PoseClassifier,
  features: Features,
  ratio: number,
  torsoRatio: number
): Reading => {
  if (ratio < BANDS.camera.sujud) {
    return {
      classifier: { ...classifier, pendingItidal: false },
      position: "sujud",
    };
  }
  if (
    torsoRatio < classifier.bowRatio &&
    features.kneeAngle >= KNEES_FOLDED_BELOW
  ) {
    return bow(classifier);
  }
  return standOrSit(classifier, ratio);
};

/**
 * The head against the stand: low is sujud. In between, a bow (torso
 * shortened, or the head dropped to the shoulders, on straight legs) is
 * Ruku and folded legs are sitting, before height decides.
 */
const headHeightPosition = (
  classifier: PoseClassifier,
  features: Features,
  ratio: number,
  torsoRatio: number
): Reading => {
  if (ratio < BANDS["head-height"].sujud) {
    return {
      classifier: { ...classifier, pendingItidal: false },
      position: "sujud",
    };
  }
  const kneesFolded = features.kneeAngle < KNEES_FOLDED_BELOW;
  const bowed =
    (torsoRatio < classifier.bowRatio ||
      (features.headSeen &&
        features.headAboveShoulders < classifier.headBow)) &&
    !kneesFolded;
  if (bowed) {
    return bow(classifier);
  }
  if (kneesFolded && classifier.risingFrames === 0) {
    return { classifier, position: "jalsa" };
  }
  return standOrSit(classifier, ratio);
};

/**
 * Reads one frame's Pose (null: no body found) as a Position, or null when
 * none is recognised yet. While `calibrating` (the Believer is still in the
 * first Qiyam) a steady stand sets the standing reference; once false, the
 * reference found is kept for the rest of the Salah.
 */
export const classifyPose = (
  classifier: PoseClassifier,
  pose: Pose | null,
  calibrating: boolean
): Reading => {
  // Keep calibrating until a stand was found, even if the Salah moved on.
  const freeze =
    !calibrating &&
    classifier.calibration !== null &&
    classifier.referenceHeight > 0;
  const current = freeze ? { ...classifier, calibration: null } : classifier;
  const features = pose ? featuresOf(pose) : null;
  if (!features) {
    return { classifier: current, position: null };
  }
  const measured = measure(current, features);
  const { height, torso, referenceHeight, referenceTorso } = measured;
  if (
    measured.frames < WARM_UP_FRAMES ||
    referenceHeight < MIN_REFERENCE_HEIGHT ||
    referenceTorso < MIN_REFERENCE_TORSO ||
    height === null ||
    torso === null
  ) {
    return { classifier: measured, position: null };
  }
  const ratio = height / referenceHeight;
  const torsoRatio = torso / referenceTorso;
  const reading =
    measured.engine === "camera"
      ? cameraPosition(measured, features, ratio, torsoRatio)
      : headHeightPosition(measured, features, ratio, torsoRatio);
  return {
    classifier: { ...reading.classifier, lastPosition: reading.position },
    position: reading.position,
  };
};

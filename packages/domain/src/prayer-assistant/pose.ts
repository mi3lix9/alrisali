/** The 17 COCO keypoints, in the order MoveNet outputs them. */
export const KEYPOINTS = [
  "nose",
  "left_eye",
  "right_eye",
  "left_ear",
  "right_ear",
  "left_shoulder",
  "right_shoulder",
  "left_elbow",
  "right_elbow",
  "left_wrist",
  "right_wrist",
  "left_hip",
  "right_hip",
  "left_knee",
  "right_knee",
  "left_ankle",
  "right_ankle",
] as const;

export type KeypointName = (typeof KEYPOINTS)[number];

/** A body point, normalised 0–1 from the frame's top-left, with confidence. */
export interface Keypoint {
  y: number;
  x: number;
  score: number;
}

/** Where the Believer's body is in one camera frame, upright. */
export type Pose = Readonly<Record<KeypointName, Keypoint>>;

/**
 * How the camera's pixel data is turned from upright: `right` means the top
 * of the scene lies on the right of the buffer (turned +90°).
 */
export type FrameOrientation = "up" | "right" | "down" | "left";

/** MoveNet Lightning takes a 192×192 RGB square. */
export const MOVENET_INPUT_SIZE = 192;

const VALUES_PER_KEYPOINT = 3;
const MOVENET_OUTPUT_LENGTH = KEYPOINTS.length * VALUES_PER_KEYPOINT;

/** Turns a point in the buffer back to where it is in the upright scene. */
const upright = (
  y: number,
  x: number,
  orientation: FrameOrientation
): { y: number; x: number } => {
  switch (orientation) {
    case "right": {
      return { y: 1 - x, x: y };
    }
    case "left": {
      return { y: x, x: 1 - y };
    }
    case "down": {
      return { y: 1 - y, x: 1 - x };
    }
    default: {
      return { y, x };
    }
  }
};

/**
 * Reads MoveNet's output tensor (`[1,1,17,3]`: y, x, score per keypoint) as
 * an upright Pose, undoing the frame's orientation.
 */
export const decodeMoveNet = (
  output: ArrayLike<number>,
  orientation: FrameOrientation
): Pose => {
  if (output.length !== MOVENET_OUTPUT_LENGTH) {
    throw new Error(
      `MoveNet output must hold ${MOVENET_OUTPUT_LENGTH} values, got ${output.length}`
    );
  }
  const entries = KEYPOINTS.map((name, index): [KeypointName, Keypoint] => {
    const at = index * VALUES_PER_KEYPOINT;
    const point = upright(output[at] ?? 0, output[at + 1] ?? 0, orientation);
    return [name, { ...point, score: output[at + 2] ?? 0 }];
  });
  return Object.fromEntries(entries) as Record<KeypointName, Keypoint>;
};

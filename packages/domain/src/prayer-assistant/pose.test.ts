import { describe, expect, it } from "vitest";

import { decodeMoveNet, KEYPOINTS } from "./pose";
import { NAMOZ_MOVENET } from "./pose-fixtures";

const VALUES_PER_KEYPOINT = 3;

/** The recorded output as the camera would send it, turned by `turn`. */
const turned = (
  output: readonly number[],
  turn: (y: number, x: number) => [number, number]
): number[] =>
  KEYPOINTS.flatMap((_, index) => {
    const at = index * VALUES_PER_KEYPOINT;
    const [y, x] = turn(output[at] ?? 0, output[at + 1] ?? 0);
    return [y, x, output[at + 2] ?? 0];
  });

describe(decodeMoveNet, () => {
  it("names the 17 keypoints of an upright frame in COCO order", () => {
    const pose = decodeMoveNet(NAMOZ_MOVENET.standing, "up");
    expect(pose.nose).toStrictEqual({ y: 0.1739, x: 0.4182, score: 0.6323 });
    expect(pose.right_ankle).toStrictEqual({
      y: 0.7926,
      x: 0.3613,
      score: 0.7283,
    });
  });

  it.each([
    // Pixel data turned +90°: the top of the scene is on the right.
    ["right", (y: number, x: number): [number, number] => [x, 1 - y]],
    // Turned -90°: the top of the scene is on the left.
    ["left", (y: number, x: number): [number, number] => [1 - x, y]],
    ["down", (y: number, x: number): [number, number] => [1 - y, 1 - x]],
  ] as const)(
    "turns a frame whose pixels are %s back upright",
    (orientation, turn) => {
      const upright = decodeMoveNet(NAMOZ_MOVENET.standing, "up");
      const pose = decodeMoveNet(
        turned(NAMOZ_MOVENET.standing, turn),
        orientation
      );
      for (const name of KEYPOINTS) {
        expect(pose[name].y).toBeCloseTo(upright[name].y, 6);
        expect(pose[name].x).toBeCloseTo(upright[name].x, 6);
        expect(pose[name].score).toBe(upright[name].score);
      }
    }
  );

  it("refuses an output that is not MoveNet's 17 keypoints", () => {
    expect(() => decodeMoveNet([0.1, 0.2, 0.3], "up")).toThrow(
      "51 values, got 3"
    );
  });
});

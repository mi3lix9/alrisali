export {
  MAT_EXPOSURE_LOCK_MS,
  readMat,
  recalibrateMat,
  startMatSensor,
} from "./mat";
export type { LumaFrame, MatReading, MatSensor } from "./mat";
export {
  defaultThresholds,
  PROXIMITY_MIN_MS,
  readProximity,
  startProximitySensor,
  thresholdsFromDistance,
} from "./proximity";
export type {
  ProximityReading,
  ProximitySample,
  ProximitySensor,
  ProximityThresholds,
} from "./proximity";
export {
  CUSTOM_PACE_LIMITS,
  customPaceSchema,
  PACE_PRESETS,
  PACES,
  paceHolds,
  paceSchema,
} from "./pace";
export type { CustomPace, Pace, PaceChoice, PaceHolds } from "./pace";
export { decodeMoveNet, KEYPOINTS, MOVENET_INPUT_SIZE } from "./pose";
export type { FrameOrientation, Keypoint, KeypointName, Pose } from "./pose";
export {
  classifyPose,
  POSE_FRAME_MS,
  startPoseClassifier,
} from "./pose-classifier";
export type { PoseClassifier, PoseEngine } from "./pose-classifier";
export {
  completesAt,
  currentStep,
  HASTE_WARNING_MS,
  observe,
  POSITIONS,
  salahSteps,
  startSalah,
  stepPlace,
} from "./rakah-machine";
export type {
  AssistantState,
  Observation,
  Position,
  Sighting,
  Step,
  StepPlace,
} from "./rakah-machine";
export {
  CUSTOM_RAKAH_LIMITS,
  customSalah,
  SALAH_DEFINITIONS,
  SALAH_TYPES,
  SEGMENT_PARTS,
  withNafila,
} from "./salah-definition";
export type {
  Segment,
  SalahDefinition,
  SalahType,
  SegmentPart,
} from "./salah-definition";
export {
  BOW_SENSITIVITY_LIMITS,
  bowSensitivitySchema,
  DEFAULT_BOW_SENSITIVITY,
  DEFAULT_PRAYER_ASSISTANT_SETTINGS,
  DEFAULT_RECOGNITION_MODE,
  paceChoice,
  prayerAssistantSettingsSchema,
  RECOGNITION_MODES,
  recognitionModeSchema,
} from "./settings";
export type { PrayerAssistantSettings, RecognitionMode } from "./settings";
export { countTakbirs, createTakbirDetector, TAKBIR_REPEAT_MS } from "./takbir";
export type { TakbirDetector } from "./takbir";

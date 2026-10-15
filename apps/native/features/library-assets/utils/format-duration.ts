const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;

const twoDigits = (value: number): string => String(value).padStart(2, "0");

/** A playback time as `m:ss`, or `h:mm:ss` from an hour. */
export const formatDuration = (seconds: number): string => {
  const whole = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const hours = Math.floor(whole / SECONDS_PER_HOUR);
  const minutes = Math.floor((whole % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  const rest = whole % SECONDS_PER_MINUTE;
  return hours > 0
    ? `${hours}:${twoDigits(minutes)}:${twoDigits(rest)}`
    : `${minutes}:${twoDigits(rest)}`;
};

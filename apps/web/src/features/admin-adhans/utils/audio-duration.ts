/** Reads an audio file's duration in seconds, in the browser. */
export const readAudioDuration = (file: File): Promise<number> => {
  const { promise, resolve, reject } = Promise.withResolvers<number>();
  const url = URL.createObjectURL(file);
  const audio = new Audio();
  const release = () => {
    audio.removeAttribute("src");
    URL.revokeObjectURL(url);
  };
  audio.preload = "metadata";
  audio.addEventListener(
    "loadedmetadata",
    () => {
      const { duration } = audio;
      release();
      resolve(duration);
    },
    { once: true }
  );
  audio.addEventListener(
    "error",
    () => {
      release();
      reject(new Error(`${file.name} could not be read as audio.`));
    },
    { once: true }
  );
  audio.src = url;
  return promise;
};

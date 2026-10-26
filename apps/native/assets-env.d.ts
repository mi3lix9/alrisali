// Metro turns an imported font into an asset id for expo-font.
declare module "*.ttf" {
  const asset: number;
  export default asset;
}

// Metro turns a TensorFlow Lite model into an asset id for fast-tflite.
declare module "*.tflite" {
  const asset: number;
  export default asset;
}

// Metro turns a sound file into an asset id for expo-audio.
declare module "*.wav" {
  const asset: number;
  export default asset;
}

declare module "*.ogg" {
  const asset: number;
  export default asset;
}

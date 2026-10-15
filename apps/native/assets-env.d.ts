// Metro turns an imported font into an asset id for expo-font.
declare module "*.ttf" {
  const asset: number;
  export default asset;
}

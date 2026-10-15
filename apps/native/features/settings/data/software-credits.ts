/** The software the app is built with that its licences ask us to credit. */
export const SOFTWARE_CREDITS = [
  {
    id: "panel-ui",
    name: "Panel UI",
    url: "https://panelui.dev",
    licence: "MIT",
  },
  {
    id: "open-source",
    name: "Expo, React Native",
    url: "https://expo.dev",
    licence: "MIT, Apache 2.0, BSD and others",
  },
] as const;

export type SoftwareCreditId = (typeof SOFTWARE_CREDITS)[number]["id"];

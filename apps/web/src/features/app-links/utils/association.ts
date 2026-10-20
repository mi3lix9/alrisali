import { LINK_PATH_ROOTS } from "@alrisali/domain/shared";

/** The production app's identifiers (`apps/native/app.config.ts`). */
export const APP_BUNDLE_ID = "com.alrisali.app";

const SHA256_FINGERPRINT = /^[0-9A-F]{2}(?::[0-9A-F]{2}){31}$/u;

/**
 * Apple's `apple-app-site-association`: hands the app's link paths to the app
 * with the given Apple Team ID. Null while there is no Team ID, so the file
 * is not served half-made.
 */
export const appleAppSiteAssociation = (teamId?: string) => {
  const team = teamId?.trim();
  if (!team) {
    return null;
  }
  return {
    applinks: {
      details: [
        {
          appIDs: [`${team}.${APP_BUNDLE_ID}`],
          components: LINK_PATH_ROOTS.map((root) => ({ "/": `/${root}*` })),
        },
      ],
    },
  };
};

/**
 * Android's `assetlinks.json`, from the comma-separated SHA-256 fingerprints
 * of the signing certificates (`AA:BB:…`, Play Console > App signing). Null
 * while there are none, or when one is malformed.
 */
export const assetLinks = (fingerprints?: string) => {
  const list = (fingerprints ?? "")
    .split(",")
    .map((fingerprint) => fingerprint.trim().toUpperCase())
    .filter((fingerprint) => fingerprint !== "");
  if (list.length === 0 || !list.every((f) => SHA256_FINGERPRINT.test(f))) {
    return null;
  }
  return [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: APP_BUNDLE_ID,
        sha256_cert_fingerprints: list,
      },
    },
  ];
};

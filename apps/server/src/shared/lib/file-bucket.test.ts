import { describe, expect, it } from "vitest";

import { createFileBucket, readFilesConfig } from "./file-bucket";

const COMPLETE = {
  FILES_BUCKET: "alrisali-files",
  FILES_BUCKET_ENDPOINT: "https://t3.storageapi.dev",
  FILES_BUCKET_REGION: "auto",
  FILES_BUCKET_ACCESS_KEY_ID: "tid_access",
  FILES_BUCKET_SECRET_ACCESS_KEY: "tsec_secret",
};

describe("the files bucket's configuration", () => {
  it("reads the Railway bucket's variables", () => {
    expect(readFilesConfig(COMPLETE)).toStrictEqual({
      bucket: "alrisali-files",
      endpoint: "https://t3.storageapi.dev",
      region: "auto",
      accessKeyId: "tid_access",
      secretAccessKey: "tsec_secret",
      pathStyle: false,
    });
  });

  it("names every missing variable", () => {
    expect(() => readFilesConfig({ FILES_BUCKET: "alrisali-files" })).toThrow(
      "Missing FILES_BUCKET_ENDPOINT, FILES_BUCKET_REGION, FILES_BUCKET_ACCESS_KEY_ID, FILES_BUCKET_SECRET_ACCESS_KEY"
    );
  });

  it("refuses to start in production without it", () => {
    expect(() => createFileBucket({ NODE_ENV: "production" })).toThrow(
      "Missing FILES_BUCKET"
    );
  });

  it("answers uploads as unavailable in development until it is set", async () => {
    const files = createFileBucket({ NODE_ENV: "development" });

    await expect(
      files.presignUpload({ key: "k", contentType: "image/png", size: 1 })
    ).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
  });
});

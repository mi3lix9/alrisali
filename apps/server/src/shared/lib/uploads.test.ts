import { Hono } from "hono";
import { describe, expect, it } from "vitest";

import { FAKE_S3_CREDENTIALS, startFakeS3 } from "./fake-s3.test-helper";
import { createS3FileBucket } from "./file-bucket";
import { mountFiles } from "./uploads";

const KEY = "speaker-photo/0b6f9a52-3d2e-4c1a-9f8e-2a1b3c4d5e6f.png";

describe("published files", () => {
  it("redirects to a short-lived URL of the file in the private bucket", async () => {
    const bucket = await startFakeS3();
    const files = createS3FileBucket({
      bucket: "alrisali-files",
      endpoint: bucket.endpoint,
      ...FAKE_S3_CREDENTIALS,
      pathStyle: true,
    });
    const app = new Hono();
    mountFiles(app, files);
    const upload = await files.presignUpload({
      key: KEY,
      contentType: "image/png",
      size: 3,
    });
    await fetch(upload.url, {
      method: "PUT",
      headers: upload.headers,
      body: "png",
    });

    const response = await app.request(`/files/${KEY}`);
    const location = response.headers.get("location") ?? "";
    const file = await fetch(location);

    expect(response.status).toBe(302);
    expect(response.headers.get("cache-control")).toBe("public, max-age=1800");
    expect(location).toContain("X-Amz-Expires=3600");
    await expect(file.text()).resolves.toBe("png");
    await expect(
      fetch(location.replace(/X-Amz-Signature=\w+/u, "X-Amz-Signature=0"))
    ).resolves.toMatchObject({ status: 403 });
    await bucket.stop();
  });

  it("serves only keys of uploaded files", async () => {
    const app = new Hono();
    mountFiles(
      app,
      createS3FileBucket({
        bucket: "b",
        endpoint: "http://127.0.0.1:9",
        region: "auto",
        accessKeyId: "a",
        secretAccessKey: "s",
        pathStyle: true,
      })
    );

    const response = await app.request("/files/../secrets.txt");

    expect(response.status).toBe(404);
  });
});

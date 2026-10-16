import {
  GetObjectCommand,
  PutBucketCorsCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ORPCError } from "@orpc/server";

/**
 * The Railway bucket Admins' files live in (Speaker photos, Slides, Library
 * Assets). Railway buckets are private: the server hands out presigned URLs
 * to upload and to read.
 */
export interface FileBucket {
  /** A URL the file's bytes can be PUT to, with exactly `headers`. */
  presignUpload: (file: {
    key: string;
    contentType: string;
    size: number;
  }) => Promise<{
    url: string;
    headers: Record<string, string>;
    expiresAt: number;
  }>;
  /** A short-lived URL to read the file at `key`. */
  presignDownload: (key: string) => Promise<string>;
  /** Lets the admin web PUT to presigned URLs from the browser. */
  allowBrowserUploads: (origins: readonly string[]) => Promise<void>;
}

export interface FilesConfig {
  bucket: string;
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  /** Older Railway buckets want the bucket in the path, not the host. */
  pathStyle: boolean;
}

/** The server's environment variables that configure the files bucket. */
export interface FilesEnv {
  FILES_BUCKET?: string;
  FILES_BUCKET_ENDPOINT?: string;
  FILES_BUCKET_REGION?: string;
  FILES_BUCKET_ACCESS_KEY_ID?: string;
  FILES_BUCKET_SECRET_ACCESS_KEY?: string;
  FILES_BUCKET_PATH_STYLE?: boolean;
}

const REQUIRED = {
  bucket: "FILES_BUCKET",
  endpoint: "FILES_BUCKET_ENDPOINT",
  region: "FILES_BUCKET_REGION",
  accessKeyId: "FILES_BUCKET_ACCESS_KEY_ID",
  secretAccessKey: "FILES_BUCKET_SECRET_ACCESS_KEY",
} as const satisfies Record<Exclude<keyof FilesConfig, "pathStyle">, string>;

/** Long enough for a slow connection to send a large Library Asset. */
const UPLOAD_EXPIRY_SECONDS = 15 * 60;
/** Readers follow the redirect at once; the server's redirect is cached less. */
export const DOWNLOAD_EXPIRY_SECONDS = 60 * 60;

/**
 * Reads the files bucket's configuration. Throws naming every missing
 * variable when it is incomplete.
 */
export const readFilesConfig = (env: FilesEnv): FilesConfig => {
  const missing = Object.values(REQUIRED).filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing ${missing.join(", ")}: uploads need the files bucket (a Railway bucket).`
    );
  }
  return {
    bucket: env.FILES_BUCKET ?? "",
    endpoint: env.FILES_BUCKET_ENDPOINT ?? "",
    region: env.FILES_BUCKET_REGION ?? "",
    accessKeyId: env.FILES_BUCKET_ACCESS_KEY_ID ?? "",
    secretAccessKey: env.FILES_BUCKET_SECRET_ACCESS_KEY ?? "",
    pathStyle: env.FILES_BUCKET_PATH_STYLE ?? false,
  };
};

export const createS3FileBucket = (config: FilesConfig): FileBucket => {
  const client = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    forcePathStyle: config.pathStyle,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    // Otherwise the SDK signs a CRC32 checksum header the browser cannot
    // compute for the presigned PUT.
    requestChecksumCalculation: "WHEN_REQUIRED",
  });
  return {
    presignUpload: async ({ key, contentType, size }) => {
      const expiresAt = Date.now() + UPLOAD_EXPIRY_SECONDS * 1000;
      const url = await getSignedUrl(
        client,
        new PutObjectCommand({
          Bucket: config.bucket,
          Key: key,
          ContentType: contentType,
          ContentLength: size,
        }),
        {
          expiresIn: UPLOAD_EXPIRY_SECONDS,
          // Signed, so the bucket refuses another type or size than asked.
          signableHeaders: new Set(["content-type", "content-length"]),
        }
      );
      return {
        url,
        // Browsers set Content-Length from the body themselves.
        headers: { "content-type": contentType },
        expiresAt,
      };
    },
    presignDownload: (key) =>
      getSignedUrl(
        client,
        new GetObjectCommand({ Bucket: config.bucket, Key: key }),
        { expiresIn: DOWNLOAD_EXPIRY_SECONDS }
      ),
    allowBrowserUploads: async (origins) => {
      await client.send(
        new PutBucketCorsCommand({
          Bucket: config.bucket,
          CORSConfiguration: {
            CORSRules: [
              {
                AllowedOrigins: [...origins],
                AllowedMethods: ["PUT"],
                AllowedHeaders: ["content-type"],
                MaxAgeSeconds: 3000,
              },
            ],
          },
        })
      );
    },
  };
};

/**
 * The files bucket, from the environment. Production refuses to start
 * without it (the env schema requires it there); elsewhere uploads answer
 * "unavailable" until it is configured.
 */
export const createFileBucket = (
  env: FilesEnv & { NODE_ENV?: string }
): FileBucket => {
  try {
    return createS3FileBucket(readFilesConfig(env));
  } catch (error) {
    if (env.NODE_ENV === "production" || !(error instanceof Error)) {
      throw error;
    }
    const unavailable = () =>
      Promise.reject(
        new ORPCError("SERVICE_UNAVAILABLE", { message: error.message })
      );
    return {
      presignUpload: unavailable,
      presignDownload: unavailable,
      allowBrowserUploads: unavailable,
    };
  }
};

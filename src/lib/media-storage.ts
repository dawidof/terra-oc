import { createReadStream, existsSync } from "fs";
import { mkdir, stat, unlink, writeFile } from "fs/promises";
import path from "path";
import { Readable } from "stream";

export interface MediaRange {
  start: number;
  end: number;
}

export interface MediaGetResult {
  body: Readable;
  contentLength: number;
  contentRange?: string;
}

export interface MediaStorage {
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  get(key: string, range?: MediaRange): Promise<MediaGetResult | null>;
  delete(key: string): Promise<void>;
}

class LocalDiskStorage implements MediaStorage {
  private root = path.join(process.cwd(), "uploads");

  private resolve(key: string): string {
    const full = path.resolve(this.root, key);
    if (!full.startsWith(this.root)) {
      throw new Error("Invalid storage key");
    }
    return full;
  }

  async put(key: string, body: Buffer): Promise<void> {
    const full = this.resolve(key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, body);
  }

  async get(key: string, range?: MediaRange): Promise<MediaGetResult | null> {
    const full = this.resolve(key);
    if (!existsSync(full)) return null;

    const info = await stat(full);
    const start = range?.start ?? 0;
    const end = range?.end ?? info.size - 1;

    return {
      body: createReadStream(full, { start, end }),
      contentLength: end - start + 1,
      contentRange: range
        ? `bytes ${start}-${end}/${info.size}`
        : undefined,
    };
  }

  async delete(key: string): Promise<void> {
    const full = this.resolve(key);
    if (existsSync(full)) {
      await unlink(full);
    }
  }
}

class NeonStorage implements MediaStorage {
  private bucket = process.env.NEON_STORAGE_BUCKET || "media";

  private async client() {
    const endpoint = process.env.AWS_ENDPOINT_URL_S3;
    if (!endpoint || !process.env.AWS_ACCESS_KEY_ID) {
      throw new Error(
        "Neon storage is not configured. Set MEDIA_STORAGE=local or provide AWS_* env vars from `neon env pull`."
      );
    }
    const { S3Client } = await import("@aws-sdk/client-s3");
    return new S3Client({
      forcePathStyle: true,
      endpoint,
      region: process.env.AWS_REGION || "us-east-2",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });
  }

  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const s3 = await this.client();
    await s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      })
    );
  }

  async get(key: string, range?: MediaRange): Promise<MediaGetResult | null> {
    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    const s3 = await this.client();
    try {
      const res = await s3.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
          ...(range
            ? { Range: `bytes=${range.start}-${range.end}` }
            : {}),
        })
      );
      const contentRange = res.ContentRange;
      return {
        body: res.Body as Readable,
        contentLength: res.ContentLength ?? 0,
        contentRange: typeof contentRange === "string" ? contentRange : undefined,
      };
    } catch (error) {
      const name = (error as { name?: string }).name;
      if (name === "NoSuchKey" || name === "404") return null;
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    const s3 = await this.client();
    await s3.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key })
    );
  }
}

export function getMediaStorage(): MediaStorage {
  const driver = process.env.MEDIA_STORAGE || "local";
  if (driver === "neon") {
    return new NeonStorage();
  }
  return new LocalDiskStorage();
}

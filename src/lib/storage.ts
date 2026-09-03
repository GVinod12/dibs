import { promises as fs } from "node:fs";
import path from "node:path";
import { nanoid } from "nanoid";

/**
 * Image storage. Two backends, chosen by env:
 *
 *   - BLOB_READ_WRITE_TOKEN set  →  Vercel Blob (public bucket). Use in prod;
 *     serverless hosts have a read-only filesystem.
 *   - not set                    →  public/uploads/ on local disk.
 *
 * Either way `saveImage` returns a URL you can drop straight into an <img>.
 */

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const USE_BLOB = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

export async function saveImage(bytes: ArrayBuffer, mediaType: string): Promise<{ url: string }> {
  const ext = EXT[mediaType] ?? "bin";
  const name = `${Date.now()}-${nanoid(8)}.${ext}`;

  if (USE_BLOB) {
    const { put } = await import("@vercel/blob");
    const { url } = await put(`items/${name}`, Buffer.from(bytes), {
      access: "public",
      contentType: mediaType,
      addRandomSuffix: false,
    });
    return { url };
  }

  const dir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), Buffer.from(bytes));
  return { url: `/uploads/${name}` };
}

export const STORAGE_BACKEND = USE_BLOB ? "vercel-blob" : "local";

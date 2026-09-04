import { promises as fs } from "node:fs";
import path from "node:path";
import { nanoid } from "nanoid";
import { processImage } from "./images";

/**
 * Image storage. Two backends, chosen by env:
 *
 *   - BLOB_READ_WRITE_TOKEN set  →  Vercel Blob (public bucket). Use in prod;
 *     serverless hosts have a read-only filesystem.
 *   - not set                    →  public/uploads/ on local disk.
 *
 * Every image is normalised to JPEG first (see processImage) — so HEIC from an
 * iPhone, oversized PNGs, etc. all come out as something a browser can render.
 * The returned width/height are the real, post-processing pixel dimensions.
 */

const USE_BLOB = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

export type SavedImage = { url: string; width: number; height: number };

export async function saveImage(bytes: ArrayBuffer | Buffer): Promise<SavedImage> {
  const img = await processImage(bytes);
  const name = `${Date.now()}-${nanoid(8)}.${img.ext}`;

  if (USE_BLOB) {
    const { put } = await import("@vercel/blob");
    const { url } = await put(`items/${name}`, img.buffer, {
      access: "public",
      contentType: img.contentType,
      addRandomSuffix: false,
    });
    return { url, width: img.width, height: img.height };
  }

  const dir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), img.buffer);
  return { url: `/uploads/${name}`, width: img.width, height: img.height };
}

export const STORAGE_BACKEND = USE_BLOB ? "vercel-blob" : "local";

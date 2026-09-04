import sharp from "sharp";

/**
 * Normalise any uploaded photo to a web-safe JPEG:
 *   - decodes HEIC/HEIF (iPhone default) via heic-convert — sharp's prebuilt
 *     libheif has no HEVC codec, so it can't do this itself
 *   - decodes PNG / WebP / JPEG / AVIF via sharp
 *   - applies EXIF rotation, strips metadata, caps the long edge at 1800px
 *
 * Returns the encoded buffer plus its real pixel size, so callers never trust a
 * browser-reported dimension (which is 0 for formats the browser can't decode).
 */
export type ProcessedImage = {
  buffer: Buffer;
  width: number;
  height: number;
  contentType: "image/jpeg";
  ext: "jpg";
};

const MAX_EDGE = 1800;

export function isHeic(buf: Buffer): boolean {
  // ....ftyp<brand> at offset 4; HEIF brands below
  if (buf.length < 12 || buf.toString("ascii", 4, 8) !== "ftyp") return false;
  const brand = buf.toString("ascii", 8, 12);
  return ["heic", "heix", "hevc", "hevx", "mif1", "msf1", "heim", "heis"].includes(brand);
}

export async function processImage(input: ArrayBuffer | Buffer): Promise<ProcessedImage> {
  let src = Buffer.isBuffer(input) ? input : Buffer.from(input);

  if (isHeic(src)) {
    const convert = (await import("heic-convert")).default;
    const jpeg = await convert({ buffer: src, format: "JPEG", quality: 0.92 });
    src = Buffer.from(jpeg);
  }

  const { data, info } = await sharp(src, { failOn: "none" })
    .rotate()
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: data,
    width: info.width,
    height: info.height,
    contentType: "image/jpeg",
    ext: "jpg",
  };
}

import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getDb, mutate } from "@/lib/db/store";
import { saveImage } from "@/lib/storage";
import { isHeic } from "@/lib/images";
import sharp from "sharp";

/**
 * One-off repair: find any stored photo whose bytes a browser can't render
 * (HEIC uploaded before conversion existed, or an unreadable file) and
 * re-encode it to JPEG, then point the record at the new URL.
 *
 * POST, owner only. Safe to run repeatedly — a photo that already decodes is
 * left alone.
 */
export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }

  // Relative photo URLs (/uploads/..) are files baked into a deployment. Pass
  // ?from=<origin> to resolve them against a deployment that still serves them,
  // which is how they get migrated into blob storage.
  const from = new URL(request.url).searchParams.get("from") || new URL(request.url).origin;

  const db = await getDb();
  const urls = new Set<string>();
  for (const it of db.items) for (const p of it.photos) if (p.url) urls.add(p.url);
  for (const lk of db.looks) if (lk.photo?.url) urls.add(lk.photo.url);

  const replace = new Map<string, { url: string; width: number; height: number }>();
  const report: Array<{ url: string; action: string }> = [];

  for (const url of urls) {
    try {
      const absolute = url.startsWith("http") ? url : new URL(url, from).toString();
      const res = await fetch(absolute, { cache: "no-store" });
      if (!res.ok) {
        report.push({ url, action: `skip (fetch ${res.status})` });
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      // a relative URL always needs moving into blob storage, even if it decodes
      let needsFix = isHeic(buf) || !url.startsWith("http");
      if (!needsFix) {
        try {
          const meta = await sharp(buf).metadata();
          needsFix = !meta.width || meta.format === "heif";
        } catch {
          needsFix = true;
        }
      }
      if (!needsFix) {
        report.push({ url, action: "ok" });
        continue;
      }
      const saved = await saveImage(buf);
      replace.set(url, saved);
      report.push({ url, action: `reprocessed → ${saved.url}` });
    } catch (e) {
      report.push({ url, action: `error: ${e instanceof Error ? e.message : "unknown"}` });
    }
  }

  if (replace.size > 0) {
    await mutate((d) => {
      for (const it of d.items) {
        for (const p of it.photos) {
          const r = replace.get(p.url);
          if (r) Object.assign(p, r);
        }
      }
      for (const lk of d.looks) {
        const r = lk.photo && replace.get(lk.photo.url);
        if (r) Object.assign(lk.photo, r);
      }
      return null;
    });
  }

  return NextResponse.json({ ok: true, fixed: replace.size, report });
}

export const GET = POST;

import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { catalogueFromImage, aiConfigured } from "@/lib/ai/catalogue";

/**
 * POST /api/catalogue  (owner only)
 * multipart/form-data: photo=<file>, intent=GIFT|SELL, notes=<string?>
 * Returns the structured catalogue draft, or a clear "not configured" 501.
 * Mirrors the admin server action — handy for scripts / bulk cataloguing later.
 */
export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }
  if (!aiConfigured()) {
    return NextResponse.json(
      { error: "not-configured", message: "Set ANTHROPIC_API_KEY to enable AI cataloguing." },
      { status: 501 },
    );
  }

  const form = await request.formData();
  const photo = form.get("photo");
  if (!(photo instanceof File) || photo.size === 0) {
    return NextResponse.json({ error: "bad-request", message: "photo file required" }, { status: 400 });
  }
  const intent = String(form.get("intent")) === "SELL" ? "SELL" : "GIFT";
  const notes = String(form.get("notes") ?? "") || undefined;

  const outcome = await catalogueFromImage({
    base64: Buffer.from(await photo.arrayBuffer()).toString("base64"),
    mediaType: photo.type,
    intent,
    notes,
  });

  if (!outcome.ok) {
    const code = outcome.reason === "not-configured" ? 501 : outcome.reason === "bad-image" ? 400 : 502;
    return NextResponse.json({ error: outcome.reason, message: outcome.message }, { status: code });
  }
  return NextResponse.json({ draft: outcome.draft, model: outcome.model });
}

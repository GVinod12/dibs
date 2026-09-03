import { NextResponse } from "next/server";
import { resetDb } from "@/lib/db/store";
import { isAdmin } from "@/lib/admin-auth";

/**
 * Wipe the store back to the seed wardrobe.
 * Allowed in dev, or in any environment for a signed-in owner.
 * (Deleting data/db.json by hand also works, but the running server keeps an
 *  in-memory copy until it restarts — this clears that too.)
 */
export async function POST() {
  if (process.env.NODE_ENV === "production" && !(await isAdmin())) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }
  await resetDb();
  return NextResponse.json({ ok: true, reset: true });
}

export const GET = POST;

import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { getPrimaryCloset, listItems } from "@/lib/repo";
import { LookEditor } from "@/components/admin/LookEditor";

export const dynamic = "force-dynamic";
export const metadata = { title: "New look", robots: { index: false } };

export default async function NewLookPage() {
  if (!(await isAdmin())) redirect("/admin");
  const closet = await getPrimaryCloset();
  const items = await listItems(closet.slug);
  return (
    <div className="paper-grid min-h-dvh">
      <LookEditor items={items.map((i) => ({ id: i.id, name: i.name, photoUrl: i.photos[0]?.url ?? null }))} />
    </div>
  );
}

import { notFound, redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { getLookById, getPrimaryCloset, listItems } from "@/lib/repo";
import { LookEditor } from "@/components/admin/LookEditor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit look", robots: { index: false } };

export default async function EditLookPage({ params }: PageProps<"/admin/looks/[id]">) {
  if (!(await isAdmin())) redirect("/admin");
  const { id } = await params;
  const [look, closet] = await Promise.all([getLookById(id), getPrimaryCloset()]);
  if (!look) notFound();
  const items = await listItems(closet.slug);
  return (
    <div className="paper-grid min-h-dvh">
      <LookEditor look={look} items={items.map((i) => ({ id: i.id, name: i.name, photoUrl: i.photos[0]?.url ?? null }))} />
    </div>
  );
}

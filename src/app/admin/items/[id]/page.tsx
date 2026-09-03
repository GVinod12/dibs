import { notFound, redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { aiConfigured } from "@/lib/ai/catalogue";
import { getItemById } from "@/lib/repo";
import { ItemEditor } from "@/components/admin/ItemEditor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit piece", robots: { index: false } };

export default async function EditItemPage({ params }: PageProps<"/admin/items/[id]">) {
  if (!(await isAdmin())) redirect("/admin");
  const { id } = await params;
  const item = await getItemById(id);
  if (!item) notFound();
  return (
    <div className="paper-grid min-h-dvh">
      <ItemEditor item={item} aiOn={aiConfigured()} />
    </div>
  );
}

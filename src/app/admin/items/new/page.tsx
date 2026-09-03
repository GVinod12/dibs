import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { aiConfigured } from "@/lib/ai/catalogue";
import { ItemEditor } from "@/components/admin/ItemEditor";

export const dynamic = "force-dynamic";
export const metadata = { title: "New piece", robots: { index: false } };

export default async function NewItemPage() {
  if (!(await isAdmin())) redirect("/admin");
  return (
    <div className="paper-grid min-h-dvh">
      <ItemEditor aiOn={aiConfigured()} />
    </div>
  );
}

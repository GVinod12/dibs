import { notFound } from "next/navigation";
import { getCloset, getClosetStats } from "@/lib/repo";
import { StickerProvider } from "@/components/stickers";
import { Nav } from "@/components/site/Nav";
import { SiteFooter } from "@/components/site/SiteFooter";

export default async function ClosetLayout({
  children,
  params,
}: LayoutProps<"/closet/[slug]">) {
  const { slug } = await params;
  const closet = await getCloset(slug);
  if (!closet) notFound();
  const stats = await getClosetStats(slug);

  return (
    <StickerProvider>
      <div className="flex min-h-dvh flex-col">
        <Nav slug={slug} friends={stats.friends} />
        <main className="bleed-clip flex-1">{children}</main>
        <SiteFooter closetTitle={closet.title} ownerName={closet.ownerName} />
      </div>
    </StickerProvider>
  );
}

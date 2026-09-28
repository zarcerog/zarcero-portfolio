// Legacy URL. Case studies from the previous production now live in the
// archive; keep old links (and search results) working with a permanent redirect.
import { permanentRedirect } from "next/navigation";
import { PROJECTS } from "@/archive/one/lib/projects";

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

export default async function LegacyProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  permanentRedirect(`/archive/1/project/${slug}`);
}

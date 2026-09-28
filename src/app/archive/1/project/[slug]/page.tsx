// Server component — exports generateStaticParams, renders the client page
import { PROJECTS } from "@/archive/one/lib/projects";
import ProjectPageClient from "./ProjectPageClient";

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

export default async function ArchiveProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return <ProjectPageClient slug={slug} />;
}

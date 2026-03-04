// Server component — exports generateStaticParams, renders the client page
import { PROJECTS } from "@/lib/projects";
import ProjectPageClient from "./ProjectPageClient";

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

export default function ProjectPage({ params }: { params: { slug: string } }) {
  return <ProjectPageClient slug={params.slug} />;
}

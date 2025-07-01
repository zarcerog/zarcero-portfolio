import React from 'react';
import { ExternalLink } from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import ProjectPreview from '../ui/ProjectPreview';

const ProjectsSection: React.FC = () => {
  const { 
    projects, 
    sectionsRef, 
    setHoveredProject, 
    setSelectedProject 
  } = usePortfolio();

  return (
    <section ref={(el) => { sectionsRef.current.projects = el; }} id="projects" className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-6xl font-black mb-16 text-center border-4 border-white px-8 py-4 transform rotate-1">
          STUFF I BUILT
        </h2>

        <div className="space-y-8">
          {projects.map((project, index) => (
            <div
              key={project.id}
              className={`group border-2 border-white p-6 hover:bg-white hover:text-black transition-all duration-300 cursor-pointer transform hover:scale-105 ${
                index % 2 === 0 ? "rotate-1" : "-rotate-1"
              } hover:rotate-0`}
              onMouseEnter={() => setHoveredProject(project)}
              onMouseLeave={() => setHoveredProject(null)}
              onClick={() => setSelectedProject(project)}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-2xl md:text-4xl font-black mb-2 group-hover:animate-pulse">{project.title}</h3>
                  <p className="text-sm md:text-base mb-2">{project.description}</p>
                  <p className="text-xs font-bold tracking-widest">{project.tech}</p>
                </div>
                <div className="mt-4 md:mt-0">
                  <ExternalLink className="group-hover:rotate-45 transition-transform duration-300" size={24} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ProjectPreview />
    </section>
  );
};

export default ProjectsSection;
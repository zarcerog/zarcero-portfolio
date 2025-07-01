import React from 'react';
import { usePortfolio } from '../../context/PortfolioContext';

const ProjectModal: React.FC = () => {
  const { selectedProject, setSelectedProject } = usePortfolio();

  if (!selectedProject) return null;

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
      <div className="bg-black border-4 border-white max-w-4xl w-full max-h-[90vh] overflow-y-auto transform -rotate-1">
        {/* Close Button */}
        <button
          onClick={() => setSelectedProject(null)}
          className="absolute top-4 right-4 text-white hover:text-red-500 text-2xl font-black z-10"
        >
          ✕
        </button>

        <div className="p-8">
          {/* Project Header */}
          <div className="mb-8">
            <h2 className="text-3xl md:text-6xl font-black mb-4 border-4 border-white px-4 py-2 inline-block transform rotate-1">
              {selectedProject.title}
            </h2>
            <p className="text-lg mb-4">{selectedProject.description}</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {selectedProject.features.map((feature, idx) => (
                <span
                  key={idx}
                  className="bg-white text-black px-3 py-1 text-xs font-bold transform rotate-1 hover:rotate-0 transition-transform"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>

          {/* Project Content */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <img
                src={selectedProject.image ?? "/placeholder.svg"}
                alt={selectedProject.title}
                className="w-full border-4 border-white transform -rotate-1"
              />
              <div className="bg-gray-900 border-2 border-white p-4 transform rotate-1">
                <h4 className="text-white font-bold mb-2">TECH STACK</h4>
                <p className="text-gray-300 text-sm">{selectedProject.tech}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="border-2 border-white p-4 transform rotate-1">
                <h4 className="text-xl font-black mb-4 border-b-2 border-white pb-2">THE STORY</h4>
                <p className="text-sm leading-relaxed">{selectedProject.longDescription}</p>
              </div>

              <div className="border-2 border-white p-4 transform -rotate-1">
                <h4 className="text-xl font-black mb-4 border-b-2 border-white pb-2">FEATURES</h4>
                <ul className="space-y-2">
                  {selectedProject.features.map((feature, idx) => (
                    <li key={idx} className="text-sm flex items-center">
                      <span className="text-white mr-2">▶</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Project Year */}
          <div className="mt-8 text-center">
            <span className="text-4xl font-black text-white transform rotate-12 inline-block">
              {selectedProject.year}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectModal;
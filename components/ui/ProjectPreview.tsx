import React from 'react';
import { usePortfolio } from '../../context/PortfolioContext';

const ProjectPreview: React.FC = () => {
  const { hoveredProject, mousePosition } = usePortfolio();

  if (!hoveredProject) return null;

  return (
    <div
      className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2"
      style={{
        left: mousePosition.x + 100,
        top: mousePosition.y,
      }}
    >
      <div className="bg-black border-4 border-white p-4 shadow-2xl transform rotate-2 max-w-xs">
        <img
          src={hoveredProject.gif || "/placeholder.svg"}
          alt={hoveredProject.title}
          className="w-full h-32 object-cover border-2 border-white mb-2"
        />
        <h4 className="text-white font-black text-sm mb-1">{hoveredProject.title}</h4>
        <p className="text-gray-300 text-xs">{hoveredProject.year}</p>
      </div>
    </div>
  );
};

export default ProjectPreview;
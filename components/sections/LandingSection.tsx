import React from 'react';
import { ChevronDown } from 'lucide-react';
import { usePortfolio } from '@/context/PortfolioContext';

const LandingSection: React.FC = () => {
  const { scrollY, isVisible, sectionsRef } = usePortfolio();

  return (
    <section
      ref={(el) => { sectionsRef.current.landing = el; }}
      id="landing"
      className="min-h-screen flex flex-col justify-center items-center relative px-4"
    >
      <div
        className={`text-center transform transition-all duration-1000 ${
          isVisible.landing ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
        }`}
        style={{ transform: `translateY(${scrollY * 0.1}px)` }}
      >
        <h1 className="text-4xl md:text-8xl font-black mb-4 tracking-wider">
          <span className="block border-4 border-white px-4 py-2 mb-2 transform -rotate-1">NICOLÁS</span>
          <span className="block border-4 border-white px-4 py-2 transform rotate-1">ZARCERO</span>
        </h1>

        <div className="space-y-4 mt-8">
          <p className="text-xl md:text-3xl font-bold tracking-widest border-l-4 border-white pl-4">CREATIVE DEV</p>
          <p className="text-sm md:text-lg max-w-2xl mx-auto leading-relaxed">
            LOVER OF CODE, FASHION, AND STRANGENESS
          </p>
        </div>
      </div>

      <div className="absolute bottom-8 animate-bounce flex flex-col items-center text-center">
        <ChevronDown size={32} />
        <p className="text-xs mt-2 tracking-widest">SCROLL DOWN</p>
      </div>
    </section>
  );
};

export default LandingSection;
import React from 'react';
import { usePortfolio } from '../../context/PortfolioContext';

const AboutSection: React.FC = () => {
  const { isVisible, sectionsRef } = usePortfolio();

  return (
    <section ref={(el) => { sectionsRef.current.about = el; }} id="about" className="min-h-screen py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-6xl font-black mb-16 text-center transform -rotate-1 border-4 border-white inline-block px-8 py-4">
          WHO AM I?
        </h2>

        <div className="grid md:grid-cols-2 gap-12 md:gap-20">
          {/* Code Side */}
          <div
            className={`transform transition-all duration-1000 delay-200 ${
              isVisible.about ? "translate-x-0 opacity-100" : "-translate-x-10 opacity-0"
            }`}
          >
            <div className="border-2 border-white p-6 transform rotate-1 bg-black">
              <h3 className="text-2xl font-bold mb-6 border-b-2 border-white pb-2">THE CODE SIDE</h3>
              <div className="space-y-4 text-sm leading-relaxed">
                <p>Started coding at 14 with a crappy laptop and a dream.</p>
                <p> Taught myself everything from building websites to fixing bugs I didn't understand (yet).</p>
                <p>At 19, I joined my first real dev job — juggling React, React Native, and Python.</p>
                <p>Now I create digital experiences that don't bore people to death.</p>
                <p className="font-bold">CURRENT STACK: React, Node, Swift, Kotlin, Whatever Works</p>
              </div>
            </div>
          </div>

          {/* Human Side */}
          <div
            className={`transform transition-all duration-1000 delay-400 ${
              isVisible.about ? "translate-x-0 opacity-100" : "translate-x-10 opacity-0"
            }`}
          >
            <div className="border-2 border-white p-6 transform -rotate-1 bg-black">
              <h3 className="text-2xl font-bold mb-6 border-b-2 border-white pb-2">THE HUMAN SIDE</h3>
              <div className="space-y-4 text-sm leading-relaxed">
                <p>Fashion enthusiast since I could dress myself (badly, but with style).</p>
                <p>Lived and breathed electronics and computers before I even learned how to talk.</p>
                <p>Hooked on jazz bars, street photography, late-night ideas, and underrated films.</p>
                <p>The best convos I've had? Usually after midnight and totally unplanned.</p>
                <p className="font-bold">LIFE MOTTO: Make it feel. Make it mean something. Keep it raw.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
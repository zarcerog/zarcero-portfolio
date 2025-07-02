import React from 'react';
import { usePortfolio } from '../../context/PortfolioContext';

const NowSection: React.FC = () => {
  const { sectionsRef, peeledStickers, handleStickerPeel } = usePortfolio();

  const stickers = ["mezzanine", "celica", "amsterdam", "mountain"];

  return (
    <section ref={(el) => { sectionsRef.current.now = el }} id="now" className="py-20 px-4 relative">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-6xl font-black mb-16 text-center transform -rotate-1 border-4 border-white px-8 py-4">
          RIGHT NOW
        </h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto h-64 w-full items-center justify-between px-6 rounded-sm">
        {stickers.map((sticker, index) => (
          <div
            key={index}
            className={`relative group cursor-pointer ${
              peeledStickers.has(sticker) ? "sticker-peel" : "sticker-hover"
            }`}
            onClick={() => handleStickerPeel(sticker)}
          >
            <img
              src={`/stickers/${sticker}.png`}
              alt={`${index + 1}`}
              className="w-full h-52 object-cover transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="text-white font-bold text-lg">PEEL ME</span>
            </div>
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-black/10 pointer-events-none"></div>
    </section>
  );
};

export default NowSection;
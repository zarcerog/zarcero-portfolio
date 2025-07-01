import React from 'react';

const GlobalStyles: React.FC = () => {
  return (
    <style jsx global>{`
      .sticker-peel {
        animation: peelAndFall 2.5s ease-in forwards;
        transform-origin: bottom left;
      }

      @keyframes peelAndFall {
        0% {
          transform: rotate(0deg) scale(1);
          opacity: 1;
        }
        30% {
          transform: rotate(10deg) scale(1) translateY(15px);
          opacity: 0.9;
        }
        60% {
          transform: rotate(15deg) scale(0.9) translateY(20px);
          opacity: 0.8;
        }
        100% {
          transform: rotate(0deg) scale(1) translateY(110vh);
          opacity: 0;
        }
      }

      .sticker-hover {
        transition: all 0.3s ease;
      }

      .sticker-hover:hover {
        transform: scale(1.05) rotate(2deg);
        filter: brightness(1.1);
      }
    `}</style>
  );
};

export default GlobalStyles;
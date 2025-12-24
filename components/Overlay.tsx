import React from 'react';
import { TreeState } from '../types';

interface OverlayProps {
  treeState: TreeState;
  onToggle: () => void;
}

export const Overlay: React.FC<OverlayProps> = ({ treeState, onToggle }) => {
  const isTree = treeState === TreeState.TREE_SHAPE;

  return (
    <div className="w-full h-full flex flex-col justify-between p-8 md:p-12 pointer-events-none">
      {/* Header */}
      <header className="flex flex-col items-start space-y-2 animate-fade-in-down">
        <h1 className="font-['Cinzel'] text-5xl md:text-7xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]">
          KK
        </h1>
        <div className="h-[1px] w-24 bg-yellow-500/50" />
        <h2 className="font-['Playfair_Display'] text-2xl md:text-4xl text-emerald-100 tracking-widest uppercase text-opacity-90">
          Christmas Tree
        </h2>
      </header>

      {/* Footer / Controls */}
      <footer className="flex flex-col md:flex-row items-end md:items-center justify-between pointer-events-auto">
        <div className="mb-6 md:mb-0 max-w-md text-right md:text-left">
          <p className="font-['Playfair_Display'] text-sm text-emerald-200/60 italic">
            "Experience the convergence of luxury and digital art. <br/>
            Witness the particles assemble into the symbol of the season."
          </p>
        </div>

        <button
          onClick={onToggle}
          className={`
            group relative px-8 py-4 overflow-hidden rounded-full 
            border border-yellow-500/30 bg-black/40 backdrop-blur-md 
            transition-all duration-700 ease-out hover:border-yellow-400/80 hover:bg-emerald-950/50
          `}
        >
          <span className={`
            absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-yellow-400/10 to-transparent 
            -translate-x-full group-hover:animate-shimmer
          `} />
          
          <span className="relative flex items-center space-x-3">
            <span className={`w-2 h-2 rounded-full transition-colors duration-500 ${isTree ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-yellow-400 shadow-[0_0_8px_#facc15]'}`} />
            <span className="font-['Cinzel'] text-lg text-yellow-100 tracking-wider">
              {isTree ? 'SCATTER ESSENCE' : 'ASSEMBLE FORM'}
            </span>
          </span>
        </button>
      </footer>

      {/* Tailwind Custom Animation styles injection if needed, though simple logic handles it */}
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </div>
  );
};
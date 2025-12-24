import React, { useState, Suspense } from 'react';
import { Scene } from './components/Scene';
import { Overlay } from './components/Overlay';
import { TreeState } from './types';

export default function App() {
  const [treeState, setTreeState] = useState<TreeState>(TreeState.SCATTERED);

  const toggleState = () => {
    setTreeState((prev) => 
      prev === TreeState.SCATTERED ? TreeState.TREE_SHAPE : TreeState.SCATTERED
    );
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <Suspense fallback={<div className="flex items-center justify-center h-full text-gold-500 font-serif">Loading Arix Experience...</div>}>
          <Scene treeState={treeState} />
        </Suspense>
      </div>

      {/* UI Overlay Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <Overlay treeState={treeState} onToggle={toggleState} />
      </div>
    </div>
  );
}
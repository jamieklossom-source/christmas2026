import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Stars, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { ChristmasTree } from './ChristmasTree';
import { TreeState } from '../types';

interface SceneProps {
  treeState: TreeState;
}

export const Scene: React.FC<SceneProps> = ({ treeState }) => {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: false, toneMappingExposure: 1.5 }}
      shadows
    >
      <PerspectiveCamera makeDefault position={[0, 2, 18]} fov={45} />
      
      {/* Controls */}
      <OrbitControls 
        enablePan={false} 
        enableZoom={true} 
        minDistance={8} 
        maxDistance={30}
        autoRotate={treeState === TreeState.TREE_SHAPE}
        autoRotateSpeed={0.5}
        maxPolarAngle={Math.PI / 1.5}
      />

      {/* Lighting - Dramatic & Warm */}
      <ambientLight intensity={0.2} color="#001a10" />
      <spotLight 
        position={[10, 20, 10]} 
        angle={0.2} 
        penumbra={1} 
        intensity={200} 
        color="#fffaee" 
        castShadow 
      />
      <pointLight position={[-10, 5, -10]} intensity={50} color="#059669" />
      <pointLight position={[0, -5, 5]} intensity={30} color="#d97706" />

      {/* Environment for reflections */}
      <Environment preset="city" />

      {/* Background Elements */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <Sparkles count={200} scale={15} size={3} speed={0.4} opacity={0.5} color="#fbbf24" />

      {/* Main Content */}
      <ChristmasTree state={treeState} />

      {/* Post Processing for the "Cinematic Glow" */}
      <EffectComposer enableNormalPass={false}>
        <Bloom 
          luminanceThreshold={1.2} 
          mipmapBlur 
          intensity={1.8} 
          radius={0.6}
        />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
        <Noise opacity={0.02} />
      </EffectComposer>
    </Canvas>
  );
};
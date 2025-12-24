import React, { useMemo, useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { easing } from 'maath';
import { TreeState } from '../types';

interface ChristmasTreeProps {
  state: TreeState;
}

// --- Configuration ---
const CONFIG = {
  FOLIAGE_COUNT: 50000, 
  BAUBLE_COUNT: 600,    // Increased slightly to replace bulk of boxes
  GIFT_COUNT: 35,       // Reduced significantly (Accents only)
  LIGHT_COUNT: 1500,    
  TREE_HEIGHT: 16,
  TREE_RADIUS: 6.5,
  SCATTER_RADIUS: 35,
};

// --- Shaders for Foliage ---

const foliageVertexShader = `
uniform float uTime;
uniform float uProgress;
attribute vec3 aTreePos;
attribute vec3 aScatterPos;
attribute float aRandom;
attribute float aSize;

varying vec3 vColor;
varying float vProg;

// Cubic easing for smooth transition
float ease(float t) {
  return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
}

void main() {
  float t = ease(uProgress);
  vProg = t;

  // Interpolate position
  vec3 pos = mix(aScatterPos, aTreePos, t);

  // Breathing & Floating Effect
  float breathSpeed = 0.5 + aRandom;
  float breathAmp = mix(0.5, 0.05, t); 
  
  pos.x += sin(uTime * breathSpeed + aRandom * 100.0) * breathAmp;
  pos.y += cos(uTime * breathSpeed * 0.8 + aRandom * 50.0) * breathAmp;
  pos.z += sin(uTime * breathSpeed * 1.2 + aRandom * 25.0) * breathAmp;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  
  // Size attenuation
  float baseSize = mix(aSize * 0.6, aSize, t); 
  gl_PointSize = baseSize * (150.0 / -mvPosition.z); 
  gl_Position = projectionMatrix * mvPosition;

  // Color logic: Richer Emerald gradients
  vec3 emeraldDark = vec3(0.01, 0.15, 0.05);
  vec3 emeraldLight = vec3(0.02, 0.4, 0.15);
  vColor = mix(emeraldDark, emeraldLight, aRandom);
}
`;

const foliageFragmentShader = `
varying vec3 vColor;
varying float vProg;

void main() {
  vec2 xy = gl_PointCoord.xy - vec2(0.5);
  float dist = length(xy);
  if (dist > 0.5) discard;

  float strength = 1.0 - (dist * 2.0);
  strength = pow(strength, 1.5);

  // Gold rim effect logic
  float edge = smoothstep(0.35, 0.5, dist);
  vec3 gold = vec3(1.0, 0.9, 0.4);
  
  // More intense gold when formed
  vec3 finalColor = mix(vColor, gold, edge * (0.2 + 0.5 * vProg));
  
  gl_FragColor = vec4(finalColor * 2.0, 1.0); // HDR Intensity
}
`;

// --- Helpers ---

const getSpherePoint = (r: number) => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const rad = Math.cbrt(Math.random()) * r;
  const sinPhi = Math.sin(phi);
  return new THREE.Vector3(
    rad * sinPhi * Math.cos(theta),
    rad * sinPhi * Math.sin(theta),
    rad * Math.cos(phi)
  );
};

// Golden Spiral Cone distribution
const getConePoint = (idx: number, total: number, height: number, radiusBase: number) => {
  const y = (idx / total) * height; // 0 to height
  const r = (1 - y / height) * radiusBase;
  const phi = idx * 2.39996; // Golden angle approx in rads
  
  const x = r * Math.cos(phi);
  const z = r * Math.sin(phi);
  
  return new THREE.Vector3(x, y - height / 2, z);
};

// --- Components ---

const Foliage = ({ state }: { state: TreeState }) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const progressRef = useRef(0);

  const attributes = useMemo(() => {
    const count = CONFIG.FOLIAGE_COUNT;
    const treePosArray = new Float32Array(count * 3);
    const scatterPosArray = new Float32Array(count * 3);
    const randomArray = new Float32Array(count);
    const sizeArray = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Tree Shape
      const treeP = getConePoint(i, count, CONFIG.TREE_HEIGHT, CONFIG.TREE_RADIUS);
      // More jitter for fluffier tree
      treeP.x += (Math.random() - 0.5) * 1.5; 
      treeP.y += (Math.random() - 0.5) * 1.5;
      treeP.z += (Math.random() - 0.5) * 1.5;

      treePosArray[i * 3] = treeP.x;
      treePosArray[i * 3 + 1] = treeP.y;
      treePosArray[i * 3 + 2] = treeP.z;

      // Scatter Shape
      const scatterP = getSpherePoint(CONFIG.SCATTER_RADIUS);
      scatterPosArray[i * 3] = scatterP.x;
      scatterPosArray[i * 3 + 1] = scatterP.y;
      scatterPosArray[i * 3 + 2] = scatterP.z;

      randomArray[i] = Math.random();
      sizeArray[i] = 0.5 + Math.random() * 2.0; // Varied sizes
    }

    return {
      treePos: new THREE.BufferAttribute(treePosArray, 3),
      scatterPos: new THREE.BufferAttribute(scatterPosArray, 3),
      random: new THREE.BufferAttribute(randomArray, 1),
      size: new THREE.BufferAttribute(sizeArray, 1),
    };
  }, []);

  useFrame((ctx, delta) => {
    const target = state === TreeState.TREE_SHAPE ? 1 : 0;
    easing.damp(progressRef, 'current', target, 1.2, delta);

    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = ctx.clock.elapsedTime;
      materialRef.current.uniforms.uProgress.value = progressRef.current;
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-aTreePos" {...attributes.treePos} />
        <bufferAttribute attach="attributes-aScatterPos" {...attributes.scatterPos} />
        <bufferAttribute attach="attributes-aRandom" {...attributes.random} />
        <bufferAttribute attach="attributes-aSize" {...attributes.size} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={foliageVertexShader}
        fragmentShader={foliageFragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{
          uTime: { value: 0 },
          uProgress: { value: 0 },
        }}
        toneMapped={false}
      />
    </points>
  );
};

const FairyLights = ({ state }: { state: TreeState }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const progressRef = useRef(0);

  const attributes = useMemo(() => {
    const count = CONFIG.LIGHT_COUNT;
    const treePosArray = new Float32Array(count * 3);
    const scatterPosArray = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Spiral Logic
      const t = i / count;
      const h = t * CONFIG.TREE_HEIGHT;
      const r = (1 - t) * (CONFIG.TREE_RADIUS + 0.2); // Slightly outside foliage
      const angle = t * 50.0; // Many turns

      const x = r * Math.cos(angle);
      const z = r * Math.sin(angle);
      const y = h - CONFIG.TREE_HEIGHT / 2;

      treePosArray[i * 3] = x;
      treePosArray[i * 3 + 1] = y;
      treePosArray[i * 3 + 2] = z;

      const sp = getSpherePoint(CONFIG.SCATTER_RADIUS * 1.1);
      scatterPosArray[i * 3] = sp.x;
      scatterPosArray[i * 3 + 1] = sp.y;
      scatterPosArray[i * 3 + 2] = sp.z;
    }
    return {
      treePos: new THREE.BufferAttribute(treePosArray, 3),
      scatterPos: new THREE.BufferAttribute(scatterPosArray, 3),
    };
  }, []);

  useFrame((ctx, delta) => {
    const target = state === TreeState.TREE_SHAPE ? 1 : 0;
    easing.damp(progressRef, 'current', target, 1.0, delta); // Slightly slower than foliage

    if (pointsRef.current) {
      const positions = pointsRef.current.geometry.attributes.position;
      const t = progressRef.current;
      const easeT = t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;

      for (let i = 0; i < CONFIG.LIGHT_COUNT; i++) {
        const tx = attributes.treePos.getX(i);
        const ty = attributes.treePos.getY(i);
        const tz = attributes.treePos.getZ(i);

        const sx = attributes.scatterPos.getX(i);
        const sy = attributes.scatterPos.getY(i);
        const sz = attributes.scatterPos.getZ(i);

        positions.setXYZ(
          i,
          sx + (tx - sx) * easeT,
          sy + (ty - sy) * easeT,
          sz + (tz - sz) * easeT
        );
      }
      positions.needsUpdate = true;
    }
  });

  // Helper for easing inside loop
  const pow = Math.pow;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={CONFIG.LIGHT_COUNT} itemSize={3} array={new Float32Array(CONFIG.LIGHT_COUNT * 3)} />
      </bufferGeometry>
      <pointsMaterial 
        size={0.15} 
        color="#fffae0" 
        transparent 
        opacity={0.8} 
        sizeAttenuation 
        blending={THREE.AdditiveBlending} 
      />
    </points>
  );
};

const Ornaments = ({ state }: { state: TreeState }) => {
  const baublesRef = useRef<THREE.InstancedMesh>(null);
  const giftsRef = useRef<THREE.InstancedMesh>(null);
  
  const { baubles, gifts } = useMemo(() => {
    // Baubles (Spheres)
    const bData = [];
    
    // Updated Palette: Gold, Champagne, Emerald, Metallic Green
    const palette = [
      new THREE.Color('#fcd34d'), // Gold
      new THREE.Color('#fae8b0'), // Champagne
      new THREE.Color('#10b981'), // Emerald Green (Metallic)
      new THREE.Color('#059669'), // Deep Green
      new THREE.Color('#d1fae5'), // Ice/Pale Green
    ];

    for (let i = 0; i < CONFIG.BAUBLE_COUNT; i++) {
      const p = getConePoint(i, CONFIG.BAUBLE_COUNT, CONFIG.TREE_HEIGHT, CONFIG.TREE_RADIUS * 0.9); // Inside/On foliage
      const s = getSpherePoint(CONFIG.SCATTER_RADIUS * 1.2);
      
      // Randomize color
      const color = palette[Math.floor(Math.random() * palette.length)];
      
      bData.push({
        treePos: p,
        scatterPos: s,
        rotOffset: [Math.random() * Math.PI, Math.random() * Math.PI, 0],
        scale: 0.3 + Math.random() * 0.3,
        speed: 1.0 + Math.random() * 0.5,
        color,
      });
    }

    // Gifts (Boxes) - Small Red Accents
    const gData = [];
    for (let i = 0; i < CONFIG.GIFT_COUNT; i++) {
      const yBias = Math.pow(Math.random(), 2.0); // Bias slightly
      const h = yBias * (CONFIG.TREE_HEIGHT - 2); 
      const r = (1 - h / CONFIG.TREE_HEIGHT) * (CONFIG.TREE_RADIUS + 1.2); 
      const angle = i * 137.5;
      
      const p = new THREE.Vector3(r * Math.cos(angle), h - CONFIG.TREE_HEIGHT / 2 + 0.5, r * Math.sin(angle));
      const s = getSpherePoint(CONFIG.SCATTER_RADIUS * 0.8);
      
      gData.push({
        treePos: p,
        scatterPos: s,
        rotOffset: [Math.random(), Math.random(), Math.random()],
        // Make gifts smaller: 0.25 to 0.45 size
        scale: 0.25 + Math.random() * 0.2,
        speed: 0.4 + Math.random() * 0.3,
      });
    }

    return { baubles: bData, gifts: gData };
  }, []);

  // Apply colors once
  useLayoutEffect(() => {
    if (baublesRef.current) {
      baubles.forEach((d, i) => {
        baublesRef.current!.setColorAt(i, d.color);
      });
      baublesRef.current.instanceMatrix.needsUpdate = true;
      if (baublesRef.current.instanceColor) baublesRef.current.instanceColor.needsUpdate = true;
    }
  }, [baubles]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  useFrame((ctx, delta) => {
    const target = state === TreeState.TREE_SHAPE ? 1 : 0;
    
    if (typeof ctx.camera.userData.ornamentProgress !== 'number') ctx.camera.userData.ornamentProgress = 0;
    easing.damp(ctx.camera.userData, 'ornamentProgress', target, 1.2, delta);
    const t = ctx.camera.userData.ornamentProgress;
    
    if (baublesRef.current) {
      baubles.forEach((d, i) => {
        const float = Math.sin(ctx.clock.elapsedTime * d.speed + i) * 0.2 * (1 - t);
        const pos = new THREE.Vector3().lerpVectors(d.scatterPos, d.treePos, t);
        pos.y += float;

        dummy.position.copy(pos);
        dummy.rotation.set(
          d.rotOffset[0] + ctx.clock.elapsedTime * 0.2, 
          d.rotOffset[1] + ctx.clock.elapsedTime * 0.2, 
          d.rotOffset[2]
        );
        dummy.scale.setScalar(d.scale * (0.2 + 0.8 * t)); 
        dummy.updateMatrix();
        baublesRef.current!.setMatrixAt(i, dummy.matrix);
      });
      baublesRef.current.instanceMatrix.needsUpdate = true;
    }

    if (giftsRef.current) {
      gifts.forEach((d, i) => {
        const float = Math.sin(ctx.clock.elapsedTime * d.speed * 0.5 + i) * 0.1 * (1 - t);
        const pos = new THREE.Vector3().lerpVectors(d.scatterPos, d.treePos, t);
        pos.y += float;

        dummy.position.copy(pos);
        dummy.rotation.set(
          d.rotOffset[0] + ctx.clock.elapsedTime * 0.1, 
          d.rotOffset[1] + ctx.clock.elapsedTime * 0.1, 
          d.rotOffset[2]
        );
        dummy.scale.setScalar(d.scale * t); 
        dummy.updateMatrix();
        giftsRef.current!.setMatrixAt(i, dummy.matrix);
      });
      giftsRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      <instancedMesh ref={baublesRef} args={[undefined, undefined, CONFIG.BAUBLE_COUNT]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial 
          metalness={1.0} 
          roughness={0.15} 
          envMapIntensity={1.5}
        />
      </instancedMesh>

      <instancedMesh ref={giftsRef} args={[undefined, undefined, CONFIG.GIFT_COUNT]}>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <meshStandardMaterial 
          color="#dc2626" 
          metalness={0.4} 
          roughness={0.2} 
        />
      </instancedMesh>
    </group>
  );
};

export const ChristmasTree: React.FC<ChristmasTreeProps> = ({ state }) => {
  return (
    <group>
      <Foliage state={state} />
      <Ornaments state={state} />
      <FairyLights state={state} />
      <Topper visible={state === TreeState.TREE_SHAPE} />
    </group>
  );
};

const Topper = ({ visible }: { visible: boolean }) => {
  const mesh = useRef<THREE.Mesh>(null);
  useFrame((state, delta) => {
      if(!mesh.current) return;
      mesh.current.rotation.y += delta * 0.5;
      
      const targetScale = visible ? 1.0 : 0;
      easing.damp3(mesh.current.scale, [targetScale, targetScale, targetScale], 0.5, delta);
  });

  return (
      <mesh ref={mesh} position={[0, CONFIG.TREE_HEIGHT / 2 + 0.5, 0]}>
          <octahedronGeometry args={[0.9, 0]} />
          <meshStandardMaterial 
              color="#fef9c3" 
              emissive="#fde047"
              emissiveIntensity={4}
              toneMapped={false}
          />
      </mesh>
  );
}
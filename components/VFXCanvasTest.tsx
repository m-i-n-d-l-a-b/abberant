import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import type * as THREE from 'three';

function SpinningCube() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.01;
      meshRef.current.rotation.y += 0.01;
    }
  });
  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="orange" />
    </mesh>
  );
}

export default function VFXCanvasTest() {
  return (
    <div style={{ width: '100%', height: '400px' }}>
      <Canvas camera={{ position: [3, 3, 3], fov: 75 }}>
        <ambientLight />
        <pointLight position={[10, 10, 10]} />
        <SpinningCube />
      </Canvas>
    </div>
  );
} 
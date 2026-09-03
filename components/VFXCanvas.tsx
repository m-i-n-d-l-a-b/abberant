import React, { useMemo, useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export interface VFXCanvasProps {
  enabled: boolean;
  effect: string;
  intensity: number;
  quality: 'low' | 'medium' | 'high';
  sourceCanvas?: HTMLCanvasElement | null;
}

// Error boundary for WebGL errors
class VFXErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any, info: any) {
    // Optionally log error
    // console.error('VFXCanvas WebGL error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: 'red', background: '#111', padding: 16, borderRadius: 8, textAlign: 'center' }}>
          <strong>WebGL Error:</strong> Unable to render VFX overlay.<br />
          Please check your browser&apos;s WebGL support or try refreshing the page.
        </div>
      );
    }
    return this.props.children;
  }
}

function FullscreenQuad({ sourceCanvas, effect, intensity, quality }: {
  sourceCanvas?: HTMLCanvasElement | null;
  effect: string;
  intensity: number;
  quality: 'low' | 'medium' | 'high';
}) {
  const textureRef = useRef<THREE.Texture | null>(null);
  // Memoize the texture so it only updates when the canvas changes
  const texture = useMemo(() => {
    if (sourceCanvas) {
      const tex = new THREE.Texture(sourceCanvas);
      tex.needsUpdate = true;
      textureRef.current = tex;
      return tex;
    }
    return null;
  }, [sourceCanvas]);

  // If the canvas is dynamic, update the texture on each render
  useEffect(() => {
    if (textureRef.current && sourceCanvas) {
      textureRef.current.needsUpdate = true;
    }
  });

  // Placeholder: In the future, use a custom ShaderMaterial and pass effect, intensity, quality as uniforms
  // For now, just render the texture or fallback color
  return (
    <mesh position={[0, 0, 0]}>
      <planeGeometry args={[2, 2]} />
      {texture ? (
        // TODO: Replace with <shaderMaterial ... /> and pass effect, intensity, quality as uniforms
        <meshBasicMaterial map={texture} />
      ) : (
        <meshBasicMaterial color="black" />
      )}
    </mesh>
  );
}

const VFXCanvas: React.FC<VFXCanvasProps> = ({ enabled, effect, intensity, quality, sourceCanvas }) => {
  if (!enabled) return null;
  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 10 }}>
      <VFXErrorBoundary>
        <Canvas orthographic camera={{ position: [0, 0, 1], zoom: 1, near: 0.1, far: 10 }} style={{ width: '100%', height: '100%' }}>
          <FullscreenQuad sourceCanvas={sourceCanvas} effect={effect} intensity={intensity} quality={quality} />
        </Canvas>
      </VFXErrorBoundary>
    </div>
  );
};

export default VFXCanvas; 
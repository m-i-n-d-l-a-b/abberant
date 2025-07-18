import React from 'react'
import { VFXProvider, VFXDiv } from 'react-vfx'

interface VFXOverlayProps {
  isActive: boolean
  effectType: 'glitch' | 'chromatic' | 'scanlines' | 'pulse'
  intensity?: number
}

const VFXOverlay: React.FC<VFXOverlayProps> = ({ 
  isActive, 
  effectType, 
  intensity = 1.0 
}) => {
  if (!isActive) return null

  const getEffectShader = () => {
    switch (effectType) {
      case 'glitch':
        return `
          uniform float time;
          uniform float intensity;
          uniform vec2 resolution;
          
          void mainImage(out vec4 fragColor, in vec2 fragCoord) {
            vec2 uv = fragCoord / resolution;
            
            // Glitch effect
            float glitch = sin(time * 10.0) * intensity * 0.1;
            uv.x += glitch * sin(uv.y * 10.0);
            
            vec4 color = texture2D(iChannel0, uv);
            fragColor = color;
          }
        `
      case 'chromatic':
        return `
          uniform float time;
          uniform float intensity;
          uniform vec2 resolution;
          
          void mainImage(out vec4 fragColor, in vec2 fragCoord) {
            vec2 uv = fragCoord / resolution;
            
            // Chromatic aberration
            float offset = sin(time) * intensity * 0.01;
            vec4 r = texture2D(iChannel0, uv + vec2(offset, 0.0));
            vec4 g = texture2D(iChannel0, uv);
            vec4 b = texture2D(iChannel0, uv - vec2(offset, 0.0));
            
            fragColor = vec4(r.r, g.g, b.b, 1.0);
          }
        `
      case 'scanlines':
        return `
          uniform float time;
          uniform float intensity;
          uniform vec2 resolution;
          
          void mainImage(out vec4 fragColor, in vec2 fragCoord) {
            vec2 uv = fragCoord / resolution;
            vec4 color = texture2D(iChannel0, uv);
            
            // Scanlines effect
            float scanline = sin(uv.y * resolution.y * 0.5 + time) * 0.5 + 0.5;
            scanline = scanline * intensity * 0.3 + 0.7;
            
            fragColor = color * scanline;
          }
        `
      case 'pulse':
        return `
          uniform float time;
          uniform float intensity;
          uniform vec2 resolution;
          
          void mainImage(out vec4 fragColor, in vec2 fragCoord) {
            vec2 uv = fragCoord / resolution;
            vec4 color = texture2D(iChannel0, uv);
            
            // Pulsing effect
            float pulse = sin(time * 2.0) * 0.5 + 0.5;
            pulse = pulse * intensity * 0.5 + 0.5;
            
            fragColor = color * pulse;
          }
        `
      default:
        return ''
    }
  }

  return (
    <VFXProvider>
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1000
        }}
      >
        <VFXDiv
          shader={getEffectShader()}
          style={{
            width: '100%',
            height: '100%',
            opacity: 0.3 // Overlay opacity
          }}
        />
      </div>
    </VFXProvider>
  )
}

export default VFXOverlay 
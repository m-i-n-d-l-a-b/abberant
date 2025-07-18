import React, { useState, useEffect, useCallback } from 'react'
import { VFXProvider, VFXDiv } from 'react-vfx'
import { hasVFXSupport, getWebGLFallbackMessage, getPerformanceWarning, getOptimalVFXQuality } from '../lib/utils/webgl-support'

interface EnhancedVFXOverlayProps {
  isActive: boolean
  effectType: 'glitch' | 'chromatic' | 'scanlines' | 'pulse'
  intensity?: number
  quality?: 'low' | 'medium' | 'high' | 'auto'
  onError?: (error: string) => void
  onLoad?: () => void
}

interface VFXState {
  loading: boolean
  error: string | null
  webglSupported: boolean
  performanceWarning: string | null
  quality: 'low' | 'medium' | 'high'
}

const EnhancedVFXOverlay: React.FC<EnhancedVFXOverlayProps> = ({ 
  isActive, 
  effectType, 
  intensity = 1.0,
  quality = 'auto',
  onError,
  onLoad
}) => {
  const [vfxState, setVfxState] = useState<VFXState>({
    loading: true,
    error: null,
    webglSupported: false,
    performanceWarning: null,
    quality: 'low'
  })

  // Initialize VFX support detection
  useEffect(() => {
    const initializeVFX = () => {
      try {
        const webglSupported = hasVFXSupport()
        const performanceWarning = getPerformanceWarning()
        const autoQuality = getOptimalVFXQuality()
        const finalQuality = quality === 'auto' ? autoQuality : quality

        setVfxState({
          loading: false,
          error: null,
          webglSupported,
          performanceWarning,
          quality: finalQuality
        })

        if (!webglSupported) {
          const fallbackMessage = getWebGLFallbackMessage()
          setVfxState(prev => ({ ...prev, error: fallbackMessage }))
          onError?.(fallbackMessage)
        } else {
          onLoad?.()
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to initialize VFX'
        setVfxState(prev => ({ ...prev, loading: false, error: errorMessage }))
        onError?.(errorMessage)
      }
    }

    // Small delay to ensure DOM is ready
    const timer = setTimeout(initializeVFX, 100)
    return () => clearTimeout(timer)
  }, [quality, onError, onLoad])

  const getOptimizedShader = useCallback(() => {
    const { quality: currentQuality } = vfxState
    
    // Adjust shader complexity based on quality setting
    const complexity = currentQuality === 'high' ? 1.0 : currentQuality === 'medium' ? 0.7 : 0.4
    
    switch (effectType) {
      case 'glitch':
        return `
          uniform float time;
          uniform float intensity;
          uniform vec2 resolution;
          
          void mainImage(out vec4 fragColor, in vec2 fragCoord) {
            vec2 uv = fragCoord / resolution;
            
            // Optimized glitch effect
            float glitch = sin(time * ${8.0 * complexity}) * intensity * ${0.1 * complexity};
            uv.x += glitch * sin(uv.y * ${8.0 * complexity});
            
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
            
            // Optimized chromatic aberration
            float offset = sin(time) * intensity * ${0.008 * complexity};
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
            
            // Optimized scanlines effect
            float scanline = sin(uv.y * resolution.y * ${0.3 * complexity} + time) * 0.5 + 0.5;
            scanline = scanline * intensity * ${0.25 * complexity} + 0.75;
            
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
            
            // Optimized pulsing effect
            float pulse = sin(time * ${1.5 * complexity}) * 0.5 + 0.5;
            pulse = pulse * intensity * ${0.4 * complexity} + 0.6;
            
            fragColor = color * pulse;
          }
        `
      default:
        return ''
    }
  }, [effectType, vfxState.quality])

  // Don't render if not active or if there's an error
  if (!isActive || vfxState.error) {
    return null
  }

  // Show loading state
  if (vfxState.loading) {
    return (
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.1)',
          zIndex: 1000
        }}
      >
        <div style={{ 
          color: 'white', 
          fontSize: '14px',
          textAlign: 'center'
        }}>
          Loading VFX...
        </div>
      </div>
    )
  }

  // Don't render VFX if WebGL is not supported
  if (!vfxState.webglSupported) {
    return null
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
          shader={getOptimizedShader()}
          style={{
            width: '100%',
            height: '100%',
            opacity: vfxState.quality === 'low' ? 0.2 : vfxState.quality === 'medium' ? 0.3 : 0.4
          }}
        />
        
        {/* Performance warning overlay */}
        {vfxState.performanceWarning && (
          <div 
            style={{
              position: 'absolute',
              bottom: '10px',
              left: '10px',
              background: 'rgba(255, 165, 0, 0.9)',
              color: 'white',
              padding: '8px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              maxWidth: '200px',
              pointerEvents: 'auto'
            }}
          >
            ⚠️ {vfxState.performanceWarning}
          </div>
        )}
      </div>
    </VFXProvider>
  )
}

export default EnhancedVFXOverlay 
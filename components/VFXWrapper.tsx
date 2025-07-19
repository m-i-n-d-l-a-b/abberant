import React, { useState, useEffect, useCallback, useRef } from 'react'
import { VFXProvider, VFXDiv } from 'react-vfx'
import { GameRef } from '../types/game-ref'
import UnifiedVFXControl, { VisualEffectSettings, VFXPreset } from './UnifiedVFXControl'
import { hasVFXSupport, getOptimalVFXQuality } from '../lib/utils/webgl-support'

interface VFXWrapperProps {
  gameRef: React.RefObject<GameRef>;
  children: React.ReactNode;
  className?: string;
  onVFXError?: (error: string) => void;
  onVFXLoad?: () => void;
}

const VFXWrapper: React.FC<VFXWrapperProps> = ({
  gameRef,
  children,
  className = '',
  onVFXError,
  onVFXLoad
}) => {
  // State management
  const [vfxEnabled, setVfxEnabled] = useState(false)
  const [visualEffects, setVisualEffects] = useState<VisualEffectSettings>({
    glitch: { enabled: false, intensity: 1.0, frequency: 0.1, xOffset: 10, yOffset: 10 },
    chromatic: { enabled: false, intensity: 1.0, speed: 0.01, saturation: 100, brightness: 50 },
    pulsing: { enabled: false, intensity: 1.0, speed: 0.005, minAlpha: 0.7, maxAlpha: 1.0 },
    scanlines: { enabled: false, spacing: 4, opacity: 0.25, speed: 0.001 }
  })
  
  const [canvasEffects, setCanvasEffects] = useState<any>({})
  const [vfxError, setVfxError] = useState<string | null>(null)
  const [vfxLoaded, setVfxLoaded] = useState(false)
  const [showControls, setShowControls] = useState(false)
  
  // WebGL support check
  const webglSupported = hasVFXSupport()
  const optimalQuality = getOptimalVFXQuality()
  
  // Handle VFX errors
  const handleVFXError = useCallback((error: string) => {
    setVfxError(error)
    onVFXError?.(error)
    console.warn('VFX Error:', error)
  }, [onVFXError])
  
  // Handle VFX load
  const handleVFXLoad = useCallback(() => {
    setVfxLoaded(true)
    onVFXLoad?.()
  }, [onVFXLoad])
  
  // Auto-disable VFX if there's an error
  useEffect(() => {
    if (vfxError) {
      setVfxEnabled(false)
    }
  }, [vfxError])
  
  // Generate combined shader based on active effects
  const getCombinedShader = useCallback(() => {
    if (!vfxEnabled || !webglSupported) return ''
    
    const activeEffects = Object.entries(visualEffects).filter(([_, config]) => config.enabled)
    
    if (activeEffects.length === 0) return ''
    
    return `
      uniform float time;
      uniform vec2 resolution;
      uniform float glitchIntensity;
      uniform float glitchFrequency;
      uniform float glitchXOffset;
      uniform float glitchYOffset;
      uniform float chromaticIntensity;
      uniform float chromaticSpeed;
      uniform float chromaticSaturation;
      uniform float chromaticBrightness;
      uniform float pulsingIntensity;
      uniform float pulsingSpeed;
      uniform float pulsingMinAlpha;
      uniform float pulsingMaxAlpha;
      uniform float scanlinesSpacing;
      uniform float scanlinesOpacity;
      uniform float scanlinesSpeed;
      
      void mainImage(out vec4 fragColor, in vec2 fragCoord) {
        vec2 uv = fragCoord / resolution;
        vec4 color = texture2D(iChannel0, uv);
        
        // Apply glitch effect
        if (glitchIntensity > 0.0) {
          float glitch = sin(time * glitchFrequency * 10.0) * glitchIntensity * 0.1;
          vec2 glitchOffset = vec2(
            glitch * sin(uv.y * 10.0) * glitchXOffset * 0.01,
            glitch * cos(uv.x * 10.0) * glitchYOffset * 0.01
          );
          uv += glitchOffset;
          color = texture2D(iChannel0, uv);
        }
        
        // Apply chromatic aberration
        if (chromaticIntensity > 0.0) {
          float offset = sin(time * chromaticSpeed) * chromaticIntensity * 0.01;
          vec4 r = texture2D(iChannel0, uv + vec2(offset, 0.0));
          vec4 g = texture2D(iChannel0, uv);
          vec4 b = texture2D(iChannel0, uv - vec2(offset, 0.0));
          
          // Apply saturation and brightness
          vec3 rgb = vec3(r.r, g.g, b.b);
          float luminance = dot(rgb, vec3(0.299, 0.587, 0.114));
          rgb = mix(vec3(luminance), rgb, chromaticSaturation * 0.01);
          rgb *= chromaticBrightness * 0.01;
          
          color = vec4(rgb, color.a);
        }
        
        // Apply scanlines
        if (scanlinesOpacity > 0.0) {
          float scanline = sin(uv.y * resolution.y * scanlinesSpacing * 0.1 + time * scanlinesSpeed) * 0.5 + 0.5;
          scanline = scanline * scanlinesOpacity + (1.0 - scanlinesOpacity);
          color *= scanline;
        }
        
        // Apply pulsing
        if (pulsingIntensity > 0.0) {
          float pulse = sin(time * pulsingSpeed) * 0.5 + 0.5;
          pulse = pulse * pulsingIntensity * (pulsingMaxAlpha - pulsingMinAlpha) + pulsingMinAlpha;
          color *= pulse;
        }
        
        fragColor = color;
      }
    `
  }, [vfxEnabled, webglSupported, visualEffects])
  
  // Update visual effects
  const handleVisualEffectsChange = useCallback((newSettings: VisualEffectSettings) => {
    setVisualEffects(newSettings)
    
    // Check if any effects are enabled
    const hasActiveEffects = Object.values(newSettings).some(effect => effect.enabled)
    setVfxEnabled(hasActiveEffects)
  }, [])
  
  // Update canvas effects
  const handleCanvasEffectsChange = useCallback((newSettings: any) => {
    setCanvasEffects(newSettings)
  }, [])
  
  // Apply preset
  const handlePresetChange = useCallback((preset: VFXPreset) => {
    if (preset.visualEffects) {
      setVisualEffects(prev => ({ ...prev, ...preset.visualEffects }))
      
      // Check if any visual effects are enabled
      const hasActiveVisualEffects = Object.values(preset.visualEffects).some(
        effect => effect && typeof effect === 'object' && 'enabled' in effect && effect.enabled
      )
      setVfxEnabled(hasActiveVisualEffects)
    }
    
    if (preset.canvasEffects) {
      setCanvasEffects(prev => ({ ...prev, ...preset.canvasEffects }))
    }
  }, [])
  
  // Toggle controls visibility
  const toggleControls = useCallback(() => {
    setShowControls(prev => !prev)
  }, [])
  
  // Don't render VFX if WebGL is not supported
  if (!webglSupported) {
    return (
      <div className={`vfx-wrapper ${className}`} style={{ position: 'relative' }}>
        {children}
        <div 
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'rgba(255, 0, 0, 0.9)',
            color: 'white',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '12px',
            maxWidth: '250px',
            zIndex: 1000
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            ⚠️ WebGL Not Supported
          </div>
          <div style={{ fontSize: '11px', opacity: 0.9 }}>
            VFX effects are disabled because your device doesn't support WebGL.
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className={`vfx-wrapper ${className}`} style={{ position: 'relative' }}>
      {/* Game content */}
      {children}
      
      {/* VFX Overlay */}
      {vfxEnabled && (
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
              shader={getCombinedShader()}
              style={{
                width: '100%',
                height: '100%',
                opacity: optimalQuality === 'low' ? 0.2 : optimalQuality === 'medium' ? 0.3 : 0.4
              }}
            />
          </div>
        </VFXProvider>
      )}
      
      {/* VFX Controls */}
      {showControls && (
        <UnifiedVFXControl
          gameRef={gameRef}
          onVisualEffectsChange={handleVisualEffectsChange}
          onCanvasEffectsChange={handleCanvasEffectsChange}
          onPresetChange={handlePresetChange}
        />
      )}
      
      {/* Toggle Controls Button */}
      <button
        onClick={toggleControls}
        style={{
          position: 'absolute',
          top: '10px',
          right: showControls ? '300px' : '10px',
          background: 'rgba(0, 0, 0, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          color: 'white',
          cursor: 'pointer',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          zIndex: 1001,
          transition: 'right 0.3s ease'
        }}
      >
        {showControls ? 'Hide VFX' : 'Show VFX'}
      </button>
      
      {/* Error Display */}
      {vfxError && (
        <div 
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            background: 'rgba(255, 0, 0, 0.9)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            maxWidth: '300px',
            zIndex: 1002
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            ⚠️ VFX Error
          </div>
          <div style={{ fontSize: '11px' }}>
            {vfxError}
          </div>
        </div>
      )}
      
      {/* Loading Indicator */}
      {vfxEnabled && !vfxLoaded && !vfxError && (
        <div 
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '6px',
            fontSize: '14px',
            zIndex: 1003
          }}
        >
          Loading VFX...
        </div>
      )}
    </div>
  )
}

export default VFXWrapper 
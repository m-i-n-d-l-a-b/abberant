"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { VFXProvider, VFXDiv } from 'react-vfx'
import Game, { GameRef } from './Game'
import VFXControls from './VFXControls'

interface OptimizedGameWithVFXProps {
  initialVFXEnabled?: boolean
  initialEffect?: 'glitch' | 'chromatic' | 'scanlines' | 'pulse'
  initialIntensity?: number
  initialQuality?: 'low' | 'medium' | 'high' | 'auto'
  onVFXError?: (error: string) => void
  onVFXLoad?: () => void
}

const OptimizedGameWithVFX: React.FC<OptimizedGameWithVFXProps> = ({
  initialVFXEnabled = false,
  initialEffect = 'glitch',
  initialIntensity = 1.0,
  initialQuality = 'auto',
  onVFXError,
  onVFXLoad
}) => {
  const [vfxEnabled, setVfxEnabled] = useState(initialVFXEnabled)
  const [currentEffect, setCurrentEffect] = useState(initialEffect)
  const [effectIntensity, setEffectIntensity] = useState(initialIntensity)
  const [quality, setQuality] = useState(initialQuality)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [vfxError, setVfxError] = useState<string | null>(null)
  const [vfxLoaded, setVfxLoaded] = useState(false)
  const gameRef = useRef<GameRef>(null)

  // Handle VFX errors
  const handleVFXError = useCallback((error: string) => {
    setVfxError(error)
    onVFXError?.(error)
    console.warn('VFX Error:', error)
  }, [onVFXError])

  // Handle VFX toggle
  const handleVFXToggle = useCallback((enabled: boolean) => {
    console.log('VFX: Toggle requested:', enabled)
    setVfxEnabled(enabled)
    
    if (enabled) {
      console.log('VFX: Enabling VFX effects')
    } else {
      console.log('VFX: Disabling VFX effects')
    }
  }, [])

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

  // Performance optimization: Debounce intensity changes
  const [debouncedIntensity, setDebouncedIntensity] = useState(effectIntensity)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedIntensity(effectIntensity)
    }, 100)
    return () => clearTimeout(timer)
  }, [effectIntensity])

  // Map custom effects to React-VFX shader presets
  const getShaderPreset = useCallback(() => {
    switch (currentEffect) {
      case 'glitch':
        return 'glitch'
      case 'chromatic':
        return 'chromatic'
      case 'scanlines':
        return 'sinewave' // Using sinewave as closest to scanlines
      case 'pulse':
        return 'blink'
      default:
        return 'none'
    }
  }, [currentEffect])

  // Create custom uniforms for intensity control
  const getCustomUniforms = useCallback(() => {
    const intensity = debouncedIntensity
    
    // For now, return empty object to avoid TypeScript issues
    // Custom uniforms can be added later when needed
    return {}
  }, [currentEffect, debouncedIntensity])

  // Get appropriate blend mode for each effect
  const getBlendMode = useCallback(() => {
    switch (currentEffect) {
      case 'glitch':
        return 'screen' // Good for glitch effects
      case 'chromatic':
        return 'overlay' // Good for color effects
      case 'scanlines':
        return 'multiply' // Good for dark line effects
      case 'pulse':
        return 'soft-light' // Good for brightness effects
      default:
        return 'overlay'
    }
  }, [currentEffect])

  // Save settings to localStorage
  useEffect(() => {
    if (vfxLoaded) {
      try {
        localStorage.setItem('vfx-settings', JSON.stringify({
          enabled: vfxEnabled,
          effect: currentEffect,
          intensity: effectIntensity,
          quality
        }))
      } catch (error) {
        console.warn('Failed to save VFX settings:', error)
      }
    }
  }, [vfxEnabled, currentEffect, effectIntensity, quality, vfxLoaded])

  // Load settings from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('vfx-settings')
      if (saved) {
        const settings = JSON.parse(saved)
        setVfxEnabled(settings.enabled ?? initialVFXEnabled)
        setCurrentEffect(settings.effect ?? initialEffect)
        setEffectIntensity(settings.intensity ?? initialIntensity)
        setQuality(settings.quality ?? initialQuality)
      }
    } catch (error) {
      console.warn('Failed to load VFX settings:', error)
    }
  }, [initialVFXEnabled, initialEffect, initialIntensity, initialQuality])

  // Mark VFX as loaded when component mounts
  useEffect(() => {
    handleVFXLoad()
  }, [handleVFXLoad])

  return (
    <VFXProvider>
      <div style={{ position: 'relative', width: '800px', height: '600px' }}>
        {/* Main Game Canvas */}
        <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}>
          <Game ref={gameRef} />
        </div>

        {/* VFX Overlay - Apply effects as overlay */}
        {vfxEnabled && (
          <VFXDiv
            shader={getShaderPreset()}
            uniforms={getCustomUniforms()}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: Math.min(0.6 * debouncedIntensity, 0.8), // Intensity-based opacity
              mixBlendMode: getBlendMode(), // Dynamic blend mode per effect
              pointerEvents: 'none', // Don't block game interactions
              zIndex: 2
            }}
          />
        )}

        {/* VFX Controls */}
        <VFXControls
          vfxEnabled={vfxEnabled}
          onVFXToggle={handleVFXToggle}
          effectType={currentEffect}
          onEffectChange={setCurrentEffect}
          intensity={effectIntensity}
          onIntensityChange={setEffectIntensity}
          quality={quality}
          onQualityChange={setQuality}
          showAdvanced={showAdvanced}
          onShowAdvancedToggle={setShowAdvanced}
        />

        {/* Error Display */}
        {vfxError && (
          <div 
            style={{
              position: 'absolute',
              bottom: '10px',
              left: '10px',
              background: 'rgba(255, 0, 0, 0.9)',
              color: 'white',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '12px',
              maxWidth: '300px',
              zIndex: 1001
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
              ⚠️ VFX Error
            </div>
            <div style={{ fontSize: '11px', opacity: 0.9 }}>
              {vfxError}
            </div>
            <button
              onClick={() => setVfxError(null)}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                cursor: 'pointer',
                marginTop: '8px'
              }}
            >
              Dismiss
            </button>
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
              padding: '16px',
              borderRadius: '8px',
              fontSize: '14px',
              zIndex: 1002
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: '8px' }}>🎨</div>
              <div>Initializing VFX...</div>
            </div>
          </div>
        )}

        {/* Performance Monitor (Advanced) */}
        {showAdvanced && vfxEnabled && (
          <div 
            style={{
              position: 'absolute',
              bottom: '10px',
              right: '10px',
              background: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              padding: '8px',
              borderRadius: '6px',
              fontSize: '10px',
              zIndex: 1000
            }}
          >
            <div>VFX: {vfxLoaded ? 'Active' : 'Loading'}</div>
            <div>Effect: {currentEffect}</div>
            <div>Shader: {getShaderPreset()}</div>
            <div>Quality: {quality}</div>
            <div>Intensity: {effectIntensity.toFixed(1)}</div>
          </div>
        )}
      </div>
    </VFXProvider>
  )
}

export default OptimizedGameWithVFX 
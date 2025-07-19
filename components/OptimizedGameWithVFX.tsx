"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { VFXProvider } from 'react-vfx'
import Game, { GameRef } from './Game'
import EnhancedVFXOverlay from './EnhancedVFXOverlay'
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

  // Handle VFX toggle with debugging
  const handleVFXToggle = useCallback((enabled: boolean) => {
    console.log('VFX: Toggle requested:', enabled)
    setVfxEnabled(enabled)
    
    if (enabled) {
      console.log('VFX: Enabling VFX effects')
    } else {
      console.log('VFX: Disabling VFX effects')
      // Clear any active effects when disabling
      if (gameRef.current) {
        try {
          gameRef.current.setActiveCustomEffects(null)
          console.log('VFX: Cleared game effects')
        } catch (error) {
          console.error('VFX: Error clearing game effects:', error)
        }
      }
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

  // Convert VFX settings to game effects format
  // Only pass canvas-specific effects to the Game component
  // Visual effects (glitch, chromatic, pulse, scanlines) are handled by VFX wrapper
  const convertVFXToGameEffects = useCallback(() => {
    if (!vfxEnabled) return null

    // Only include canvas effects that the Game component can handle
    const gameEffects: any = {
      wobble: { enabled: false },
      upsideDown: { enabled: false },
      invert: { enabled: false },
      backwards: { enabled: false },
      melting: { enabled: false },
      dataBleed: { enabled: false }
    }

    // Map VFX effects to canvas effects only
    switch (currentEffect) {
      case 'glitch':
        // Glitch effect is handled by VFX wrapper, not canvas
        // No canvas effects needed for glitch
        break
      case 'chromatic':
        // Chromatic effect is handled by VFX wrapper, not canvas
        // No canvas effects needed for chromatic
        break
      case 'pulse':
        // Pulse effect is handled by VFX wrapper, not canvas
        // No canvas effects needed for pulse
        break
      case 'scanlines':
        // Scanlines effect is handled by VFX wrapper, not canvas
        // No canvas effects needed for scanlines
        break
    }

    return gameEffects
  }, [vfxEnabled, currentEffect, debouncedIntensity])

  // Apply effects to game when settings change
  useEffect(() => {
    const gameEffects = convertVFXToGameEffects()
    
    if (gameRef.current) {
      try {
        gameRef.current.setActiveCustomEffects(gameEffects)
        console.log('VFX: Applied game effects:', gameEffects)
      } catch (error) {
        console.error('VFX: Error applying game effects:', error)
        handleVFXError(`Failed to apply game effects: ${error}`)
      }
    }
  }, [convertVFXToGameEffects])

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

  return (
    <VFXProvider>
      <div style={{ position: 'relative', width: '800px', height: '600px' }}>
        {/* Main Game Canvas */}
        <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}>
          <Game ref={gameRef} />
        </div>

        {/* Enhanced VFX Overlay - Only for additional effects not handled by the game */}
        {vfxEnabled && (
          <EnhancedVFXOverlay
            isActive={vfxEnabled && !vfxError}
            effectType={currentEffect}
            intensity={debouncedIntensity}
            quality={quality}
            onError={handleVFXError}
            onLoad={handleVFXLoad}
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
            <div>Quality: {quality}</div>
            <div>Intensity: {effectIntensity.toFixed(1)}</div>
          </div>
        )}
      </div>
    </VFXProvider>
  )
}

export default OptimizedGameWithVFX 
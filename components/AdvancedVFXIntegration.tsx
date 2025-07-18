import React, { useState, useEffect } from 'react'
import { VFXProvider, VFXDiv } from 'react-vfx'
import Game from './Game'

interface AdvancedVFXIntegrationProps {}

const AdvancedVFXIntegration: React.FC<AdvancedVFXIntegrationProps> = () => {
  const [vfxSettings, setVfxSettings] = useState({
    enabled: false,
    effects: {
      glitch: { enabled: false, intensity: 1.0 },
      chromatic: { enabled: false, intensity: 1.0 },
      scanlines: { enabled: false, intensity: 1.0 },
      pulse: { enabled: false, intensity: 1.0 }
    }
  })

  const [gameState, setGameState] = useState('start')

  // Sync with game's existing effects
  useEffect(() => {
    const syncWithGame = () => {
      // For now, we'll use a simpler approach since we can't directly access game state
      // In a real implementation, you'd need to expose game state through props or context
      const gameElement = document.getElementById('gameCanvas')
      if (gameElement) {
        // This is a simplified example - in practice you'd need to communicate with the game
        setVfxSettings(prev => ({
          ...prev,
          effects: {
            glitch: { enabled: true, intensity: 1.0 },
            chromatic: { enabled: true, intensity: 1.0 },
            scanlines: { enabled: false, intensity: 1.0 },
            pulse: { enabled: false, intensity: 1.0 }
          }
        }))
      }
    }

    // Sync every frame
    const interval = setInterval(syncWithGame, 16) // ~60fps
    return () => clearInterval(interval)
  }, [])

  const getCombinedShader = () => {
    const { effects } = vfxSettings
    const activeEffects = Object.entries(effects).filter(([_, config]) => config.enabled)
    
    if (activeEffects.length === 0) return ''

    return `
      uniform float time;
      uniform vec2 resolution;
      uniform float glitchIntensity;
      uniform float chromaticIntensity;
      uniform float scanlinesIntensity;
      uniform float pulseIntensity;
      
      void mainImage(out vec4 fragColor, in vec2 fragCoord) {
        vec2 uv = fragCoord / resolution;
        vec4 color = texture2D(iChannel0, uv);
        
        // Apply glitch effect
        if (glitchIntensity > 0.0) {
          float glitch = sin(time * 10.0) * glitchIntensity * 0.1;
          uv.x += glitch * sin(uv.y * 10.0);
          color = texture2D(iChannel0, uv);
        }
        
        // Apply chromatic aberration
        if (chromaticIntensity > 0.0) {
          float offset = sin(time) * chromaticIntensity * 0.01;
          vec4 r = texture2D(iChannel0, uv + vec2(offset, 0.0));
          vec4 g = texture2D(iChannel0, uv);
          vec4 b = texture2D(iChannel0, uv - vec2(offset, 0.0));
          color = vec4(r.r, g.g, b.b, color.a);
        }
        
        // Apply scanlines
        if (scanlinesIntensity > 0.0) {
          float scanline = sin(uv.y * resolution.y * 0.5 + time) * 0.5 + 0.5;
          scanline = scanline * scanlinesIntensity * 0.3 + 0.7;
          color *= scanline;
        }
        
        // Apply pulse
        if (pulseIntensity > 0.0) {
          float pulse = sin(time * 2.0) * 0.5 + 0.5;
          pulse = pulse * pulseIntensity * 0.5 + 0.5;
          color *= pulse;
        }
        
        fragColor = color;
      }
    `
  }

  const hasActiveEffects = Object.values(vfxSettings.effects).some(effect => effect.enabled)

  return (
    <VFXProvider>
      <div style={{ position: 'relative', width: '800px', height: '600px' }}>
        {/* Main Game */}
        <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}>
          <Game />
        </div>

        {/* VFX Overlay */}
        {vfxSettings.enabled && hasActiveEffects && (
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 2
            }}
          >
            <VFXDiv
              shader={getCombinedShader()}
              style={{
                width: '100%',
                height: '100%',
                opacity: 0.4
              }}
            />
          </div>
        )}

        {/* VFX Settings Panel */}
        <div 
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'rgba(0, 0, 0, 0.9)',
            padding: '15px',
            borderRadius: '8px',
            color: 'white',
            zIndex: 3,
            minWidth: '200px'
          }}
        >
          <h4 style={{ margin: '0 0 10px 0' }}>VFX Integration</h4>
          
          <label style={{ display: 'block', marginBottom: '10px' }}>
            <input
              type="checkbox"
              checked={vfxSettings.enabled}
              onChange={(e) => setVfxSettings(prev => ({ ...prev, enabled: e.target.checked }))}
            />
            Enable VFX Overlay
          </label>

          {vfxSettings.enabled && (
            <div>
              <p style={{ fontSize: '12px', marginBottom: '10px', opacity: 0.8 }}>
                VFX effects will sync with your game's Effects Lab settings
              </p>
              
              {Object.entries(vfxSettings.effects).map(([effectName, config]) => (
                <div key={effectName} style={{ marginBottom: '8px' }}>
                  <label style={{ display: 'block', fontSize: '12px' }}>
                    <input
                      type="checkbox"
                      checked={config.enabled}
                      onChange={(e) => setVfxSettings(prev => ({
                        ...prev,
                        effects: {
                          ...prev.effects,
                          [effectName]: { ...config, enabled: e.target.checked }
                        }
                      }))}
                    />
                    {effectName.charAt(0).toUpperCase() + effectName.slice(1)}
                  </label>
                  
                  {config.enabled && (
                    <div style={{ marginLeft: '20px' }}>
                      <label style={{ fontSize: '10px' }}>
                        Intensity: {config.intensity.toFixed(1)}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={config.intensity}
                        onChange={(e) => setVfxSettings(prev => ({
                          ...prev,
                          effects: {
                            ...prev.effects,
                            [effectName]: { ...config, intensity: parseFloat(e.target.value) }
                          }
                        }))}
                        style={{ width: '100%' }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </VFXProvider>
  )
}

export default AdvancedVFXIntegration 
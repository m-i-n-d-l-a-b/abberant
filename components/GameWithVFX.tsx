import React, { useState, useEffect } from 'react'
import { VFXProvider, VFXDiv } from 'react-vfx'
import Game from './Game'

interface GameWithVFXProps {
  // Add any props you want to pass to the game
}

const GameWithVFX: React.FC<GameWithVFXProps> = () => {
  const [vfxEnabled, setVfxEnabled] = useState(false)
  const [currentEffect, setCurrentEffect] = useState<'glitch' | 'chromatic' | 'scanlines' | 'pulse'>('glitch')
  const [effectIntensity, setEffectIntensity] = useState(1.0)

  // Example of how to sync VFX with game state
  const [gameState, setGameState] = useState('start')

  const getEffectShader = () => {
    switch (currentEffect) {
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
      <div style={{ position: 'relative', width: '800px', height: '600px' }}>
        {/* Main Game Canvas */}
        <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}>
          <Game />
        </div>

        {/* VFX Overlay */}
        {vfxEnabled && (
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
              shader={getEffectShader()}
              style={{
                width: '100%',
                height: '100%',
                opacity: 0.3
              }}
            />
          </div>
        )}

        {/* VFX Controls */}
        <div 
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'rgba(0, 0, 0, 0.8)',
            padding: '10px',
            borderRadius: '5px',
            color: 'white',
            zIndex: 3
          }}
        >
          <h4>VFX Controls</h4>
          <label>
            <input
              type="checkbox"
              checked={vfxEnabled}
              onChange={(e) => setVfxEnabled(e.target.checked)}
            />
            Enable VFX
          </label>
          
          {vfxEnabled && (
            <>
              <div>
                <label>Effect: </label>
                <select 
                  value={currentEffect}
                  onChange={(e) => setCurrentEffect(e.target.value as any)}
                >
                  <option value="glitch">Glitch</option>
                  <option value="chromatic">Chromatic</option>
                  <option value="scanlines">Scanlines</option>
                  <option value="pulse">Pulse</option>
                </select>
              </div>
              
              <div>
                <label>Intensity: {effectIntensity.toFixed(2)}</label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={effectIntensity}
                  onChange={(e) => setEffectIntensity(parseFloat(e.target.value))}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </VFXProvider>
  )
}

export default GameWithVFX 
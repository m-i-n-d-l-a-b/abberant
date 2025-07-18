'use client'

import React, { useState } from 'react'
import Game from '../../components/Game'
import GameWithVFX from '../../components/GameWithVFX'
import AdvancedVFXIntegration from '../../components/AdvancedVFXIntegration'
import SimpleVFXExample from '../../components/SimpleVFXExample'

export default function VFXDemoPage() {
  const [demoMode, setDemoMode] = useState<'original' | 'simple' | 'advanced' | 'examples'>('original')

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#0a0a0a', 
      color: 'white',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>
          React-VFX Integration Demo
        </h1>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '20px', 
          marginBottom: '30px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setDemoMode('original')}
            style={{
              padding: '10px 20px',
              background: demoMode === 'original' ? '#00ffff' : '#333',
              color: demoMode === 'original' ? '#000' : '#fff',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Original Game
          </button>
          <button
            onClick={() => setDemoMode('simple')}
            style={{
              padding: '10px 20px',
              background: demoMode === 'simple' ? '#00ffff' : '#333',
              color: demoMode === 'simple' ? '#000' : '#fff',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Simple VFX Overlay
          </button>
          <button
            onClick={() => setDemoMode('advanced')}
            style={{
              padding: '10px 20px',
              background: demoMode === 'advanced' ? '#00ffff' : '#333',
              color: demoMode === 'advanced' ? '#000' : '#fff',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Advanced Integration
          </button>
          <button
            onClick={() => setDemoMode('examples')}
            style={{
              padding: '10px 20px',
              background: demoMode === 'examples' ? '#00ffff' : '#333',
              color: demoMode === 'examples' ? '#000' : '#fff',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            VFX Examples
          </button>
        </div>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'center',
          marginBottom: '20px'
        }}>
          {demoMode === 'original' && (
            <div>
              <h3 style={{ textAlign: 'center', marginBottom: '10px' }}>
                Original Game (Canvas-based effects)
              </h3>
              <Game />
            </div>
          )}
          
          {demoMode === 'simple' && (
            <div>
              <h3 style={{ textAlign: 'center', marginBottom: '10px' }}>
                Simple VFX Overlay (react-vfx on top)
              </h3>
              <GameWithVFX />
            </div>
          )}
          
          {demoMode === 'advanced' && (
            <div>
              <h3 style={{ textAlign: 'center', marginBottom: '10px' }}>
                Advanced Integration (syncs with Effects Lab)
              </h3>
              <AdvancedVFXIntegration />
            </div>
          )}

          {demoMode === 'examples' && (
            <div style={{ width: '100%' }}>
              <h3 style={{ textAlign: 'center', marginBottom: '10px' }}>
                React-VFX Examples
              </h3>
              <SimpleVFXExample />
            </div>
          )}
        </div>

        <div style={{ 
          background: 'rgba(255, 255, 255, 0.1)', 
          padding: '20px', 
          borderRadius: '10px',
          marginTop: '30px'
        }}>
          <h3>Integration Comparison</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div>
              <h4>Original Game</h4>
              <ul>
                <li>Pure Canvas-based rendering</li>
                <li>Custom JavaScript effects</li>
                <li>Full control over rendering</li>
                <li>No external dependencies</li>
              </ul>
            </div>
            <div>
              <h4>Simple VFX Overlay</h4>
              <ul>
                <li>react-vfx as an overlay</li>
                <li>WebGL-accelerated effects</li>
                <li>Easy to implement</li>
                <li>Minimal code changes</li>
              </ul>
            </div>
            <div>
              <h4>Advanced Integration</h4>
              <ul>
                <li>Syncs with existing Effects Lab</li>
                <li>Combines Canvas + WebGL</li>
                <li>Best of both worlds</li>
                <li>More complex but powerful</li>
              </ul>
            </div>
            <div>
              <h4>VFX Examples</h4>
              <ul>
                <li>Built-in shader effects</li>
                <li>Custom GLSL shaders</li>
                <li>Apply to any React element</li>
                <li>Great for UI elements</li>
              </ul>
            </div>
          </div>
        </div>

        <div style={{ 
          background: 'rgba(255, 255, 255, 0.1)', 
          padding: '20px', 
          borderRadius: '10px',
          marginTop: '20px'
        }}>
          <h3>Benefits of react-vfx Integration</h3>
          <ul>
            <li><strong>Performance:</strong> WebGL-accelerated effects can be more efficient than Canvas-based effects</li>
            <li><strong>Quality:</strong> GLSL shaders can create more sophisticated visual effects</li>
            <li><strong>Flexibility:</strong> Easy to add new effects without modifying game logic</li>
            <li><strong>Compatibility:</strong> Works alongside existing Canvas rendering</li>
            <li><strong>Modularity:</strong> Effects can be enabled/disabled independently</li>
            <li><strong>UI Integration:</strong> Perfect for applying effects to UI elements, text, and images</li>
          </ul>
        </div>

        <div style={{ 
          background: 'rgba(255, 255, 255, 0.1)', 
          padding: '20px', 
          borderRadius: '10px',
          marginTop: '20px'
        }}>
          <h3>Recommendation</h3>
          <p>
            For your game, I recommend the <strong>Simple VFX Overlay</strong> approach because:
          </p>
          <ul>
            <li>It keeps your existing game logic intact</li>
            <li>Provides WebGL acceleration for certain effects</li>
            <li>Easy to implement and maintain</li>
            <li>Can be used for UI elements, transitions, and special effects</li>
            <li>Doesn't interfere with your current Canvas-based rendering</li>
          </ul>
          <p>
            You can use react-vfx for:
          </p>
          <ul>
            <li>UI elements with effects (buttons, text, panels)</li>
            <li>Transition effects between levels</li>
            <li>Special event effects (combo multipliers, power-ups)</li>
            <li>Menu backgrounds and overlays</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 
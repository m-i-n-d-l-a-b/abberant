"use client"

import React, { useState, useRef } from 'react'
import { VFXProvider } from 'react-vfx'
import Game, { GameRef } from './Game'
import TestVFXOverlay from './TestVFXOverlay'

interface SimpleGameWithOverlayProps {
  initialVFXEnabled?: boolean
}

const SimpleGameWithOverlay: React.FC<SimpleGameWithOverlayProps> = ({
  initialVFXEnabled = false
}) => {
  const [vfxEnabled, setVfxEnabled] = useState(initialVFXEnabled)
  const gameRef = useRef<GameRef>(null)

  const handleVFXToggle = (enabled: boolean) => {
    console.log('VFX: Toggle requested:', enabled)
    setVfxEnabled(enabled)
  }

  return (
    <VFXProvider>
      <div style={{ position: 'relative', width: '800px', height: '600px' }}>
        {/* Main Game Canvas */}
        <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}>
          <Game ref={gameRef} />
        </div>

        {/* Simple Test Overlay */}
        <TestVFXOverlay isActive={vfxEnabled} />

        {/* Simple VFX Toggle */}
        <div 
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            padding: '16px',
            borderRadius: '12px',
            fontSize: '13px',
            zIndex: 1000
          }}
        >
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            cursor: 'pointer',
            fontSize: '14px'
          }}>
            <input
              type="checkbox"
              checked={vfxEnabled}
              onChange={(e) => handleVFXToggle(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            Enable VFX Test
          </label>
        </div>
      </div>
    </VFXProvider>
  )
}

export default SimpleGameWithOverlay 
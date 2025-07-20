/**
 * Mobile Controls Component
 * 
 * Provides touch-based controls for mobile devices.
 * Extracted from Game.tsx for better modularity and reusability.
 */

import React from 'react'

// Import CSS Modules
import styles from '../styles/common.module.css'
import mobileStyles from '../styles/mobile.module.css'

interface MobileControlsProps {
  className?: string
}

export default function MobileControls({ className = '' }: MobileControlsProps) {
  return (
    <div id="mobileControls" className="mobile-controls">
      <div className="dpad" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: 'repeat(3, 1fr)',
        gap: '5px',
        width: '120px',
        height: '120px'
      }}>
        <div className="dpad-center" style={{
          gridColumn: '2',
          gridRow: '2',
          width: '40px',
          height: '40px',
          backgroundColor: 'rgba(0, 255, 255, 0.3)',
          border: '2px solid #00ffff',
          borderRadius: '50%'
        }}></div>
        <div className="mobile-button dpad-up" data-action="up" style={{
          gridColumn: '2',
          gridRow: '1',
          width: '40px',
          height: '40px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          border: '2px solid #00ffff',
          color: '#00ffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '20px',
          userSelect: 'none'
        }}>↑</div>
        <div className="mobile-button dpad-down" data-action="down" style={{
          gridColumn: '2',
          gridRow: '3',
          width: '40px',
          height: '40px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          border: '2px solid #00ffff',
          color: '#00ffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '20px',
          userSelect: 'none'
        }}>↓</div>
        <div className="mobile-button dpad-left" data-action="left" style={{
          gridColumn: '1',
          gridRow: '2',
          width: '40px',
          height: '40px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          border: '2px solid #00ffff',
          color: '#00ffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '20px',
          userSelect: 'none'
        }}>←</div>
        <div className="mobile-button dpad-right" data-action="right" style={{
          gridColumn: '3',
          gridRow: '2',
          width: '40px',
          height: '40px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          border: '2px solid #00ffff',
          color: '#00ffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '20px',
          userSelect: 'none'
        }}>→</div>
      </div>

      <div className="action-buttons" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div className="mobile-button jump-button" data-action="jump" style={{
          width: '80px',
          height: '40px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          border: '2px solid #00ffff',
          color: '#00ffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '14px',
          fontFamily: 'Courier New, monospace',
          userSelect: 'none'
        }}>JUMP</div>
        <div className="mobile-button dash-button" data-action="dash" style={{
          width: '80px',
          height: '40px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          border: '2px solid #00ffff',
          color: '#00ffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '14px',
          fontFamily: 'Courier New, monospace',
          userSelect: 'none'
        }}>DASH</div>
        <div className="mobile-button pause-button" data-action="pause" style={{
          width: '80px',
          height: '40px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          border: '2px solid #00ffff',
          color: '#00ffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '20px',
          userSelect: 'none'
        }}>⏸</div>
      </div>
    </div>
  )
} 
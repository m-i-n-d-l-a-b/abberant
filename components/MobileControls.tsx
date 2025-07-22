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
    <div id="mobileControls">
      <div className="dpad">
        <div className="dpad-center"></div>
        <div className="mobile-button dpad-up" data-action="up">↑</div>
        <div className="mobile-button dpad-down" data-action="down">↓</div>
        <div className="mobile-button dpad-left" data-action="left">←</div>
        <div className="mobile-button dpad-right" data-action="right">→</div>
      </div>

      <div className="action-buttons">
        <div className="mobile-button jump-button" data-action="jump">JUMP</div>
        <div className="mobile-button dash-button" data-action="dash">DASH</div>
        <div className="mobile-button pause-button" data-action="pause">⏸</div>
      </div>
    </div>
  )
} 
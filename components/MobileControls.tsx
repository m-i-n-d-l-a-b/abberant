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
    <div id="mobileControls" className={`${mobileStyles.mobileControls} ${className}`}>
      <div className={mobileStyles.dpad}>
        <div className={mobileStyles.dpadCenter}></div>
        <div className={`${mobileStyles.mobileButton} ${mobileStyles.dpadUp}`} data-action="up">↑</div>
        <div className={`${mobileStyles.mobileButton} ${mobileStyles.dpadDown}`} data-action="down">↓</div>
        <div className={`${mobileStyles.mobileButton} ${mobileStyles.dpadLeft}`} data-action="left">←</div>
        <div className={`${mobileStyles.mobileButton} ${mobileStyles.dpadRight}`} data-action="right">→</div>
      </div>

      <div className={mobileStyles.actionButtons}>
        <div className={`${mobileStyles.mobileButton} ${mobileStyles.jumpButton}`} data-action="jump">JUMP</div>
        <div className={`${mobileStyles.mobileButton} ${mobileStyles.dashButton}`} data-action="dash">DASH</div>
        <div className={`${mobileStyles.mobileButton} ${mobileStyles.pauseButton}`} data-action="pause">⏸</div>
      </div>
    </div>
  )
} 
/**
 * Mobile Controls Component
 *
 * Provides touch-based controls for mobile devices.
 * Extracted from Game.tsx for better modularity and reusability.
 */

import React from 'react'

import { GameMode } from '../lib/game/ArcadeEngine'

interface MobileControlsProps {
  className?: string
  /** Which mode's action buttons to show. */
  mode?: GameMode
}

export default function MobileControls({
  className = '',
  mode = 'abberant'
}: MobileControlsProps) {
  // Snake turns with the d-pad alone, so its action column is pause only -
  // a jump button that does nothing reads as a broken control.
  const showPlatformerActions = mode !== 'snake'

  return (
    <div id="mobileControls" className={`mobile-controls ${className}`}>
      <div className="dpad">
        <div className="dpad-center"></div>
        <div className="mobile-button dpad-up" data-action="up">↑</div>
        <div className="mobile-button dpad-down" data-action="down">↓</div>
        <div className="mobile-button dpad-left" data-action="left">←</div>
        <div className="mobile-button dpad-right" data-action="right">→</div>
      </div>

      <div className="action-buttons">
        {showPlatformerActions && (
          <>
            <div className="mobile-button jump-button" data-action="jump">JUMP</div>
            <div className="mobile-button dash-button" data-action="dash">DASH</div>
          </>
        )}
        <div className="mobile-button pause-button" data-action="pause">⏸</div>
      </div>
    </div>
  )
}

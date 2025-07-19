/**
 * Mobile Controls Component
 * 
 * Provides touch-based controls for mobile devices.
 * Extracted from Game.tsx for better modularity and reusability.
 */

import React from 'react'

interface MobileControlsProps {
  className?: string
}

export default function MobileControls({ className = '' }: MobileControlsProps) {
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
        <div className="mobile-button jump-button" data-action="jump">JUMP</div>
        <div className="mobile-button dash-button" data-action="dash">DASH</div>
        <div className="mobile-button pause-button" data-action="pause">⏸</div>
      </div>

      <style jsx>{`
        .mobile-controls {
          position: absolute;
          bottom: 20px;
          left: 20px;
          display: none;
          z-index: 15;
        }

        .dpad {
          position: relative;
          width: 120px;
          height: 120px;
          margin-bottom: 20px;
        }

        .dpad-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 40px;
          height: 40px;
          background: rgba(0, 255, 255, 0.3);
          border: 2px solid #00ffff;
        }

        .mobile-button {
          position: absolute;
          width: 40px;
          height: 40px;
          background: rgba(0, 0, 0, 0.8);
          border: 2px solid #00ffff;
          color: #00ffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          cursor: pointer;
          user-select: none;
          transition: all 0.2s ease;
        }

        .mobile-button:active {
          background: rgba(0, 255, 255, 0.3);
        }

        .dpad-up { top: 0; left: 50%; transform: translateX(-50%); }
        .dpad-down { bottom: 0; left: 50%; transform: translateX(-50%); }
        .dpad-left { left: 0; top: 50%; transform: translateY(-50%); }
        .dpad-right { right: 0; top: 50%; transform: translateY(-50%); }

        .action-buttons {
          display: flex;
          gap: 10px;
        }

        .jump-button, .dash-button, .pause-button {
          position: static;
          width: 60px;
          height: 40px;
          font-size: 12px;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .mobile-controls {
            display: block;
          }
        }
      `}</style>
    </div>
  )
} 
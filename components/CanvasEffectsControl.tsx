import React, { useState, useEffect, useCallback } from 'react'
import { GameRef, CanvasEffectSettings } from '../types/game-ref'

interface CanvasEffectsControlProps {
  gameRef: React.RefObject<GameRef>;
  onEffectsChange?: (settings: CanvasEffectSettings) => void;
  className?: string;
}

const CanvasEffectsControl: React.FC<CanvasEffectsControlProps> = ({
  gameRef,
  onEffectsChange,
  className = ''
}) => {
  // State management
  const [canvasEffects, setCanvasEffects] = useState<CanvasEffectSettings>({
    wobble: { enabled: false, amplitude: 5, frequency: 0.05, speed: 0.005 },
    upsideDown: { enabled: false },
    invert: { enabled: false },
    backwards: { enabled: false },
    melting: { enabled: false, intensity: 1, speed: 0.01 },
    dataBleed: { enabled: false, intensity: 1, duration: 20 }
  })
  
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<number>(Date.now())
  
  // Sync with game on mount and when game ref changes
  useEffect(() => {
    if (gameRef.current) {
      const gameSettings = gameRef.current.getCanvasEffectSettings()
      setCanvasEffects(gameSettings)
      setLastSyncTime(Date.now())
    }
  }, [gameRef])
  
  // Update canvas effects and sync with game
  const updateCanvasEffects = useCallback((newSettings: Partial<CanvasEffectSettings>) => {
    const updated = { ...canvasEffects, ...newSettings }
    setCanvasEffects(updated)
    
    // Apply to game via ref
    if (gameRef.current) {
      gameRef.current.setCanvasEffectSettings(updated)
    }
    
    onEffectsChange?.(updated)
    setLastSyncTime(Date.now())
  }, [canvasEffects, gameRef, onEffectsChange])
  
  // Reset all effects
  const resetAllEffects = useCallback(() => {
    const defaultSettings: CanvasEffectSettings = {
      wobble: { enabled: false, amplitude: 5, frequency: 0.05, speed: 0.005 },
      upsideDown: { enabled: false },
      invert: { enabled: false },
      backwards: { enabled: false },
      melting: { enabled: false, intensity: 1, speed: 0.01 },
      dataBleed: { enabled: false, intensity: 1, duration: 20 }
    }
    
    updateCanvasEffects(defaultSettings)
  }, [updateCanvasEffects])
  
  // Get game state for context
  const gameState = gameRef.current?.getGameState()
  const performanceMetrics = gameRef.current?.getPerformanceMetrics()
  
  // Check if any effects are currently active
  const hasActiveEffects = Object.values(canvasEffects).some(effect => 
    effect && typeof effect === 'object' && 'enabled' in effect && effect.enabled
  )
  
  return (
    <div className={`canvas-effects-control ${className}`} style={{
      position: 'absolute',
      top: '10px',
      left: '10px',
      background: 'rgba(0, 0, 0, 0.9)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '8px',
      padding: '12px',
      color: 'white',
      fontSize: '12px',
      minWidth: '280px',
      maxWidth: '320px',
      zIndex: 1000,
      fontFamily: 'monospace'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        paddingBottom: '8px'
      }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>
          Canvas Effects
        </h3>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '12px',
              padding: '2px 4px'
            }}
          >
            {isCollapsed ? '▼' : '▲'}
          </button>
          <button
            onClick={resetAllEffects}
            style={{
              background: 'rgba(255, 0, 0, 0.3)',
              border: '1px solid rgba(255, 0, 0, 0.5)',
              color: 'white',
              cursor: 'pointer',
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '3px'
            }}
          >
            Reset
          </button>
        </div>
      </div>
      
      {!isCollapsed && (
        <>
          {/* Game State Info */}
          {gameState && (
            <div style={{
              background: 'rgba(0, 255, 0, 0.1)',
              border: '1px solid rgba(0, 255, 0, 0.3)',
              borderRadius: '4px',
              padding: '6px 8px',
              marginBottom: '12px',
              fontSize: '10px'
            }}>
              <div>Level: {gameState.currentLevel}</div>
              <div>State: {gameState.gameState}</div>
              <div>Score: {gameState.score}</div>
              {hasActiveEffects && (
                <div style={{ color: 'yellow', fontWeight: 'bold' }}>
                  ⚠️ Effects Active
                </div>
              )}
            </div>
          )}
          
          {/* Performance Warning */}
          {performanceMetrics && performanceMetrics.fps < 30 && (
            <div style={{
              background: 'rgba(255, 165, 0, 0.2)',
              border: '1px solid rgba(255, 165, 0, 0.4)',
              borderRadius: '4px',
              padding: '6px 8px',
              marginBottom: '12px',
              fontSize: '10px'
            }}>
              <div style={{ color: 'orange', fontWeight: 'bold' }}>
                ⚠️ Low FPS: {performanceMetrics.fps.toFixed(1)}
              </div>
              <div style={{ fontSize: '9px', opacity: 0.8 }}>
                Consider disabling some effects
              </div>
            </div>
          )}
          
          {/* Effects Controls */}
          <div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '12px' }}>Game Logic Effects</h4>
            
            {/* Wobble Effect */}
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="checkbox"
                  checked={canvasEffects.wobble.enabled}
                  onChange={(e) => updateCanvasEffects({
                    wobble: { ...canvasEffects.wobble, enabled: e.target.checked }
                  })}
                />
                <span>Wobble</span>
                <span style={{ fontSize: '9px', opacity: 0.6 }}>(Object movement)</span>
              </label>
              {canvasEffects.wobble.enabled && (
                <div style={{ marginLeft: '20px', marginTop: '4px' }}>
                  <div>Amplitude: {canvasEffects.wobble.amplitude}</div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="1"
                    value={canvasEffects.wobble.amplitude}
                    onChange={(e) => updateCanvasEffects({
                      wobble: { ...canvasEffects.wobble, amplitude: parseInt(e.target.value) }
                    })}
                    style={{ width: '100%' }}
                  />
                  <div>Frequency: {canvasEffects.wobble.frequency.toFixed(3)}</div>
                  <input
                    type="range"
                    min="0.01"
                    max="0.2"
                    step="0.01"
                    value={canvasEffects.wobble.frequency}
                    onChange={(e) => updateCanvasEffects({
                      wobble: { ...canvasEffects.wobble, frequency: parseFloat(e.target.value) }
                    })}
                    style={{ width: '100%' }}
                  />
                </div>
              )}
            </div>
            
            {/* Upside Down Effect */}
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="checkbox"
                  checked={canvasEffects.upsideDown.enabled}
                  onChange={(e) => updateCanvasEffects({
                    upsideDown: { enabled: e.target.checked }
                  })}
                />
                <span>Upside Down</span>
                <span style={{ fontSize: '9px', opacity: 0.6 }}>(Flip vertically)</span>
              </label>
            </div>
            
            {/* Invert Effect */}
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="checkbox"
                  checked={canvasEffects.invert.enabled}
                  onChange={(e) => updateCanvasEffects({
                    invert: { enabled: e.target.checked }
                  })}
                />
                <span>Invert</span>
                <span style={{ fontSize: '9px', opacity: 0.6 }}>(Color inversion)</span>
              </label>
            </div>
            
            {/* Backwards Effect */}
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="checkbox"
                  checked={canvasEffects.backwards.enabled}
                  onChange={(e) => updateCanvasEffects({
                    backwards: { enabled: e.target.checked }
                  })}
                />
                <span>Backwards</span>
                <span style={{ fontSize: '9px', opacity: 0.6 }}>(Reverse controls)</span>
              </label>
            </div>
            
            {/* Melting Effect */}
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="checkbox"
                  checked={canvasEffects.melting.enabled}
                  onChange={(e) => updateCanvasEffects({
                    melting: { ...canvasEffects.melting, enabled: e.target.checked }
                  })}
                />
                <span>Melting</span>
                <span style={{ fontSize: '9px', opacity: 0.6 }}>(Object distortion)</span>
              </label>
              {canvasEffects.melting.enabled && (
                <div style={{ marginLeft: '20px', marginTop: '4px' }}>
                  <div>Intensity: {canvasEffects.melting.intensity.toFixed(1)}</div>
                  <input
                    type="range"
                    min="0.1"
                    max="5"
                    step="0.1"
                    value={canvasEffects.melting.intensity}
                    onChange={(e) => updateCanvasEffects({
                      melting: { ...canvasEffects.melting, intensity: parseFloat(e.target.value) }
                    })}
                    style={{ width: '100%' }}
                  />
                  <div>Speed: {canvasEffects.melting.speed.toFixed(3)}</div>
                  <input
                    type="range"
                    min="0.001"
                    max="0.05"
                    step="0.001"
                    value={canvasEffects.melting.speed}
                    onChange={(e) => updateCanvasEffects({
                      melting: { ...canvasEffects.melting, speed: parseFloat(e.target.value) }
                    })}
                    style={{ width: '100%' }}
                  />
                </div>
              )}
            </div>
            
            {/* Data Bleed Effect */}
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="checkbox"
                  checked={canvasEffects.dataBleed.enabled}
                  onChange={(e) => updateCanvasEffects({
                    dataBleed: { ...canvasEffects.dataBleed, enabled: e.target.checked }
                  })}
                />
                <span>Data Bleed</span>
                <span style={{ fontSize: '9px', opacity: 0.6 }}>(Screen artifacts)</span>
              </label>
              {canvasEffects.dataBleed.enabled && (
                <div style={{ marginLeft: '20px', marginTop: '4px' }}>
                  <div>Intensity: {canvasEffects.dataBleed.intensity.toFixed(1)}</div>
                  <input
                    type="range"
                    min="0.1"
                    max="3"
                    step="0.1"
                    value={canvasEffects.dataBleed.intensity}
                    onChange={(e) => updateCanvasEffects({
                      dataBleed: { ...canvasEffects.dataBleed, intensity: parseFloat(e.target.value) }
                    })}
                    style={{ width: '100%' }}
                  />
                  <div>Duration: {canvasEffects.dataBleed.duration} frames</div>
                  <input
                    type="range"
                    min="10"
                    max="120"
                    step="5"
                    value={canvasEffects.dataBleed.duration}
                    onChange={(e) => updateCanvasEffects({
                      dataBleed: { ...canvasEffects.dataBleed, duration: parseInt(e.target.value) }
                    })}
                    style={{ width: '100%' }}
                  />
                </div>
              )}
            </div>
          </div>
          
          {/* Sync Status */}
          <div style={{
            marginTop: '12px',
            padding: '6px 8px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
            fontSize: '10px',
            opacity: 0.8
          }}>
            <div>Last sync: {new Date(lastSyncTime).toLocaleTimeString()}</div>
            <div>Active effects: {Object.values(canvasEffects).filter(e => e && typeof e === 'object' && 'enabled' in e && e.enabled).length}</div>
          </div>
        </>
      )}
    </div>
  )
}

export default CanvasEffectsControl 
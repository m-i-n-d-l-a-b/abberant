import React, { useState, useEffect, useCallback } from 'react'
import { GameRef, CanvasEffectSettings } from '../types/game-ref'

// Visual effect types
export type VisualEffectType = 'glitch' | 'chromatic' | 'pulsing' | 'scanlines'

// Visual effect settings interface
export interface VisualEffectSettings {
  glitch: {
    enabled: boolean;
    intensity: number;
    frequency: number;
    xOffset: number;
    yOffset: number;
  };
  chromatic: {
    enabled: boolean;
    intensity: number;
    speed: number;
    saturation: number;
    brightness: number;
  };
  pulsing: {
    enabled: boolean;
    intensity: number;
    speed: number;
    minAlpha: number;
    maxAlpha: number;
  };
  scanlines: {
    enabled: boolean;
    spacing: number;
    opacity: number;
    speed: number;
  };
}

// Combined preset interface
export interface VFXPreset {
  name: string;
  description: string;
  visualEffects: Partial<VisualEffectSettings>;
  canvasEffects: Partial<CanvasEffectSettings>;
  category: 'visual' | 'canvas' | 'combined';
}

interface UnifiedVFXControlProps {
  gameRef: React.RefObject<GameRef>;
  onVisualEffectsChange?: (settings: VisualEffectSettings) => void;
  onCanvasEffectsChange?: (settings: CanvasEffectSettings) => void;
  onPresetChange?: (preset: VFXPreset) => void;
  className?: string;
}

const UnifiedVFXControl: React.FC<UnifiedVFXControlProps> = ({
  gameRef,
  onVisualEffectsChange,
  onCanvasEffectsChange,
  onPresetChange,
  className = ''
}) => {
  // State management
  const [activeTab, setActiveTab] = useState<'visual' | 'canvas' | 'presets'>('visual')
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  // Visual effects state
  const [visualEffects, setVisualEffects] = useState<VisualEffectSettings>({
    glitch: { enabled: false, intensity: 1.0, frequency: 0.1, xOffset: 10, yOffset: 10 },
    chromatic: { enabled: false, intensity: 1.0, speed: 0.01, saturation: 100, brightness: 50 },
    pulsing: { enabled: false, intensity: 1.0, speed: 0.005, minAlpha: 0.7, maxAlpha: 1.0 },
    scanlines: { enabled: false, spacing: 4, opacity: 0.25, speed: 0.001 }
  })
  
  // Canvas effects state (synced with game)
  const [canvasEffects, setCanvasEffects] = useState<CanvasEffectSettings>({
    wobble: { enabled: false, amplitude: 5, frequency: 0.05, speed: 0.005 },
    upsideDown: { enabled: false },
    invert: { enabled: false },
    backwards: { enabled: false },
    melting: { enabled: false, intensity: 1, speed: 0.01 },
    dataBleed: { enabled: false, intensity: 1, duration: 20 }
  })
  
  // Presets
  const [presets] = useState<VFXPreset[]>([
    {
      name: 'Glitch Horror',
      description: 'Intense glitch with chromatic aberration',
      category: 'combined',
      visualEffects: {
        glitch: { enabled: true, intensity: 1.5, frequency: 0.15, xOffset: 15, yOffset: 15 },
        chromatic: { enabled: true, intensity: 1.2, speed: 0.02, saturation: 120, brightness: 40 }
      },
      canvasEffects: {
        wobble: { enabled: true, amplitude: 8, frequency: 0.08, speed: 0.008 },
        dataBleed: { enabled: true, intensity: 1.5, duration: 30 }
      }
    },
    {
      name: 'Retro CRT',
      description: 'Classic scanlines with pulsing',
      category: 'visual',
      visualEffects: {
        scanlines: { enabled: true, spacing: 3, opacity: 0.3, speed: 0.002 },
        pulsing: { enabled: true, intensity: 0.8, speed: 0.003, minAlpha: 0.8, maxAlpha: 1.0 }
      }
    },
    {
      name: 'Upside Down Chaos',
      description: 'Canvas effects for disorienting gameplay',
      category: 'canvas',
      canvasEffects: {
        upsideDown: { enabled: true },
        backwards: { enabled: true },
        wobble: { enabled: true, amplitude: 12, frequency: 0.12, speed: 0.01 }
      }
    },
    {
      name: 'Melting Reality',
      description: 'Melting effect with chromatic distortion',
      category: 'combined',
      visualEffects: {
        chromatic: { enabled: true, intensity: 0.8, speed: 0.015, saturation: 90, brightness: 60 }
      },
      canvasEffects: {
        melting: { enabled: true, intensity: 2.5, speed: 0.02 },
        dataBleed: { enabled: true, intensity: 1.2, duration: 25 }
      }
    }
  ])
  
  const [selectedPreset, setSelectedPreset] = useState<string>('')
  
  // Sync canvas effects with game
  useEffect(() => {
    if (gameRef.current) {
      const gameCanvasEffects = gameRef.current.getCanvasEffectSettings()
      setCanvasEffects(gameCanvasEffects)
    }
  }, [gameRef])
  
  // Update visual effects
  const updateVisualEffects = useCallback((newSettings: Partial<VisualEffectSettings>) => {
    const updated = { ...visualEffects, ...newSettings }
    setVisualEffects(updated)
    onVisualEffectsChange?.(updated)
  }, [visualEffects, onVisualEffectsChange])
  
  // Update canvas effects
  const updateCanvasEffects = useCallback((newSettings: Partial<CanvasEffectSettings>) => {
    const updated = { ...canvasEffects, ...newSettings }
    setCanvasEffects(updated)
    
    // Apply to game via ref
    if (gameRef.current) {
      gameRef.current.setCanvasEffectSettings(updated)
    }
    
    onCanvasEffectsChange?.(updated)
  }, [canvasEffects, gameRef, onCanvasEffectsChange])
  
  // Apply preset
  const applyPreset = useCallback((preset: VFXPreset) => {
    if (preset.visualEffects) {
      updateVisualEffects(preset.visualEffects)
    }
    if (preset.canvasEffects) {
      updateCanvasEffects(preset.canvasEffects)
    }
    setSelectedPreset(preset.name)
    onPresetChange?.(preset)
  }, [updateVisualEffects, updateCanvasEffects, onPresetChange])
  
  // Reset all effects
  const resetAllEffects = useCallback(() => {
    const defaultVisual: VisualEffectSettings = {
      glitch: { enabled: false, intensity: 1.0, frequency: 0.1, xOffset: 10, yOffset: 10 },
      chromatic: { enabled: false, intensity: 1.0, speed: 0.01, saturation: 100, brightness: 50 },
      pulsing: { enabled: false, intensity: 1.0, speed: 0.005, minAlpha: 0.7, maxAlpha: 1.0 },
      scanlines: { enabled: false, spacing: 4, opacity: 0.25, speed: 0.001 }
    }
    
    const defaultCanvas: CanvasEffectSettings = {
      wobble: { enabled: false, amplitude: 5, frequency: 0.05, speed: 0.005 },
      upsideDown: { enabled: false },
      invert: { enabled: false },
      backwards: { enabled: false },
      melting: { enabled: false, intensity: 1, speed: 0.01 },
      dataBleed: { enabled: false, intensity: 1, duration: 20 }
    }
    
    updateVisualEffects(defaultVisual)
    updateCanvasEffects(defaultCanvas)
    setSelectedPreset('')
  }, [updateVisualEffects, updateCanvasEffects])
  
  // Get performance metrics
  const performanceMetrics = gameRef.current?.getPerformanceMetrics()
  
  return (
    <div className={`unified-vfx-control ${className}`} style={{
      position: 'absolute',
      top: '10px',
      right: '10px',
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
          VFX Control Panel
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
          {/* Performance indicator */}
          {performanceMetrics && (
            <div style={{
              background: 'rgba(0, 255, 0, 0.1)',
              border: '1px solid rgba(0, 255, 0, 0.3)',
              borderRadius: '4px',
              padding: '6px 8px',
              marginBottom: '12px',
              fontSize: '10px'
            }}>
              <div>FPS: {performanceMetrics.fps.toFixed(1)}</div>
              <div>Effects Lab: {performanceMetrics.isEffectsLabUnlocked ? 'Unlocked' : 'Locked'}</div>
            </div>
          )}
          
          {/* Tab navigation */}
          <div style={{
            display: 'flex',
            marginBottom: '12px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            {(['visual', 'canvas', 'presets'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: activeTab === tab ? 'rgba(255, 255, 255, 0.2)' : 'none',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  padding: '6px 12px',
                  fontSize: '11px',
                  textTransform: 'capitalize',
                  flex: 1
                }}
              >
                {tab}
              </button>
            ))}
          </div>
          
          {/* Tab content */}
          {activeTab === 'visual' && (
            <div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '12px' }}>Visual Effects (React-VFX)</h4>
              
              {/* Glitch Effect */}
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="checkbox"
                    checked={visualEffects.glitch.enabled}
                    onChange={(e) => updateVisualEffects({
                      glitch: { ...visualEffects.glitch, enabled: e.target.checked }
                    })}
                  />
                  <span>Glitch</span>
                </label>
                {visualEffects.glitch.enabled && (
                  <div style={{ marginLeft: '20px', marginTop: '4px' }}>
                    <div>Intensity: {visualEffects.glitch.intensity.toFixed(2)}</div>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={visualEffects.glitch.intensity}
                      onChange={(e) => updateVisualEffects({
                        glitch: { ...visualEffects.glitch, intensity: parseFloat(e.target.value) }
                      })}
                      style={{ width: '100%' }}
                    />
                  </div>
                )}
              </div>
              
              {/* Chromatic Effect */}
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="checkbox"
                    checked={visualEffects.chromatic.enabled}
                    onChange={(e) => updateVisualEffects({
                      chromatic: { ...visualEffects.chromatic, enabled: e.target.checked }
                    })}
                  />
                  <span>Chromatic</span>
                </label>
                {visualEffects.chromatic.enabled && (
                  <div style={{ marginLeft: '20px', marginTop: '4px' }}>
                    <div>Intensity: {visualEffects.chromatic.intensity.toFixed(2)}</div>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={visualEffects.chromatic.intensity}
                      onChange={(e) => updateVisualEffects({
                        chromatic: { ...visualEffects.chromatic, intensity: parseFloat(e.target.value) }
                      })}
                      style={{ width: '100%' }}
                    />
                  </div>
                )}
              </div>
              
              {/* Pulsing Effect */}
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="checkbox"
                    checked={visualEffects.pulsing.enabled}
                    onChange={(e) => updateVisualEffects({
                      pulsing: { ...visualEffects.pulsing, enabled: e.target.checked }
                    })}
                  />
                  <span>Pulsing</span>
                </label>
                {visualEffects.pulsing.enabled && (
                  <div style={{ marginLeft: '20px', marginTop: '4px' }}>
                    <div>Intensity: {visualEffects.pulsing.intensity.toFixed(2)}</div>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={visualEffects.pulsing.intensity}
                      onChange={(e) => updateVisualEffects({
                        pulsing: { ...visualEffects.pulsing, intensity: parseFloat(e.target.value) }
                      })}
                      style={{ width: '100%' }}
                    />
                  </div>
                )}
              </div>
              
              {/* Scanlines Effect */}
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="checkbox"
                    checked={visualEffects.scanlines.enabled}
                    onChange={(e) => updateVisualEffects({
                      scanlines: { ...visualEffects.scanlines, enabled: e.target.checked }
                    })}
                  />
                  <span>Scanlines</span>
                </label>
                {visualEffects.scanlines.enabled && (
                  <div style={{ marginLeft: '20px', marginTop: '4px' }}>
                    <div>Opacity: {visualEffects.scanlines.opacity.toFixed(2)}</div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={visualEffects.scanlines.opacity}
                      onChange={(e) => updateVisualEffects({
                        scanlines: { ...visualEffects.scanlines, opacity: parseFloat(e.target.value) }
                      })}
                      style={{ width: '100%' }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'canvas' && (
            <div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '12px' }}>Canvas Effects (Game Logic)</h4>
              
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
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'presets' && (
            <div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '12px' }}>Effect Presets</h4>
              
              {presets.map((preset) => (
                <div key={preset.name} style={{
                  marginBottom: '8px',
                  padding: '8px',
                  border: selectedPreset === preset.name ? '1px solid rgba(0, 255, 255, 0.5)' : '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '4px',
                  background: selectedPreset === preset.name ? 'rgba(0, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)'
                }}>
                  <div style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '2px' }}>
                    {preset.name}
                  </div>
                  <div style={{ fontSize: '10px', opacity: 0.8, marginBottom: '6px' }}>
                    {preset.description}
                  </div>
                  <div style={{ fontSize: '9px', opacity: 0.6, marginBottom: '6px' }}>
                    Category: {preset.category}
                  </div>
                  <button
                    onClick={() => applyPreset(preset)}
                    style={{
                      background: 'rgba(0, 255, 0, 0.2)',
                      border: '1px solid rgba(0, 255, 0, 0.4)',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '10px',
                      padding: '4px 8px',
                      borderRadius: '3px',
                      width: '100%'
                    }}
                  >
                    Apply
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default UnifiedVFXControl 
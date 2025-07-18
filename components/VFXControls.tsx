import React, { useState } from 'react'
import { hasVFXSupport, getOptimalVFXQuality } from '../lib/utils/webgl-support'

interface VFXControlsProps {
  vfxEnabled: boolean
  onVFXToggle: (enabled: boolean) => void
  effectType: 'glitch' | 'chromatic' | 'scanlines' | 'pulse'
  onEffectChange: (effect: 'glitch' | 'chromatic' | 'scanlines' | 'pulse') => void
  intensity: number
  onIntensityChange: (intensity: number) => void
  quality?: 'low' | 'medium' | 'high' | 'auto'
  onQualityChange?: (quality: 'low' | 'medium' | 'high' | 'auto') => void
  showAdvanced?: boolean
  onShowAdvancedToggle?: (show: boolean) => void
}

const VFXControls: React.FC<VFXControlsProps> = ({
  vfxEnabled,
  onVFXToggle,
  effectType,
  onEffectChange,
  intensity,
  onIntensityChange,
  quality = 'auto',
  onQualityChange,
  showAdvanced = false,
  onShowAdvancedToggle
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showTooltip, setShowTooltip] = useState<string | null>(null)

  const webglSupported = hasVFXSupport()
  const autoQuality = getOptimalVFXQuality()

  const effectOptions = [
    { value: 'glitch', label: 'Glitch', description: 'Digital distortion effect' },
    { value: 'chromatic', label: 'Chromatic', description: 'Color separation effect' },
    { value: 'scanlines', label: 'Scanlines', description: 'CRT monitor effect' },
    { value: 'pulse', label: 'Pulse', description: 'Rhythmic brightness effect' }
  ]

  const qualityOptions = [
    { value: 'auto', label: 'Auto', description: 'Automatic quality based on device' },
    { value: 'low', label: 'Low', description: 'Better performance' },
    { value: 'medium', label: 'Medium', description: 'Balanced quality and performance' },
    { value: 'high', label: 'High', description: 'Best visual quality' }
  ]

  if (!webglSupported) {
    return (
      <div 
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'rgba(255, 0, 0, 0.9)',
          color: 'white',
          padding: '12px',
          borderRadius: '8px',
          fontSize: '12px',
          maxWidth: '250px',
          zIndex: 1000
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
          ⚠️ WebGL Not Supported
        </div>
        <div style={{ fontSize: '11px', opacity: 0.9 }}>
          VFX effects are disabled because your device doesn't support WebGL.
        </div>
      </div>
    )
  }

  return (
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
        minWidth: '280px',
        zIndex: 1000,
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}
    >
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '12px'
      }}>
        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
          🎨 VFX Controls
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '16px',
            padding: '4px'
          }}
          aria-label={isCollapsed ? 'Expand controls' : 'Collapse controls'}
        >
          {isCollapsed ? '▼' : '▲'}
        </button>
      </div>

      {!isCollapsed && (
        <>
          {/* Main VFX Toggle */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              cursor: 'pointer',
              fontSize: '14px'
            }}>
              <input
                type="checkbox"
                checked={vfxEnabled}
                onChange={(e) => onVFXToggle(e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              Enable VFX Effects
            </label>
          </div>

          {vfxEnabled && (
            <>
              {/* Effect Selection */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  fontSize: '13px',
                  fontWeight: 'bold'
                }}>
                  Effect Type
                </label>
                <select
                  value={effectType}
                  onChange={(e) => onEffectChange(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    fontSize: '12px'
                  }}
                >
                  {effectOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div style={{ 
                  fontSize: '11px', 
                  opacity: 0.7, 
                  marginTop: '4px',
                  fontStyle: 'italic'
                }}>
                  {effectOptions.find(opt => opt.value === effectType)?.description}
                </div>
              </div>

              {/* Intensity Control */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <label style={{ 
                    fontSize: '13px',
                    fontWeight: 'bold'
                  }}>
                    Intensity
                  </label>
                  <span style={{ 
                    fontSize: '12px',
                    opacity: 0.8
                  }}>
                    {intensity.toFixed(1)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={intensity}
                  onChange={(e) => onIntensityChange(parseFloat(e.target.value))}
                  style={{
                    width: '100%',
                    height: '6px',
                    borderRadius: '3px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  fontSize: '10px',
                  opacity: 0.6,
                  marginTop: '4px'
                }}>
                  <span>Subtle</span>
                  <span>Intense</span>
                </div>
              </div>

              {/* Quality Settings */}
              {onQualityChange && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px',
                    fontSize: '13px',
                    fontWeight: 'bold'
                  }}>
                    Quality
                  </label>
                  <select
                    value={quality}
                    onChange={(e) => onQualityChange(e.target.value as any)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      fontSize: '12px'
                    }}
                  >
                    {qualityOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label} {option.value === 'auto' && `(${autoQuality})`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Advanced Toggle */}
              {onShowAdvancedToggle && (
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    cursor: 'pointer',
                    fontSize: '12px',
                    opacity: 0.8
                  }}>
                    <input
                      type="checkbox"
                      checked={showAdvanced}
                      onChange={(e) => onShowAdvancedToggle(e.target.checked)}
                      style={{ marginRight: '6px' }}
                    />
                    Show Advanced Options
                  </label>
                </div>
              )}

              {/* Device Info */}
              <div style={{ 
                fontSize: '11px', 
                opacity: 0.6,
                padding: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '6px',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div>Device Quality: {autoQuality}</div>
                <div>WebGL: Supported</div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

export default VFXControls 
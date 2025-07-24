'use client'

import React, { useState, useEffect } from 'react'
import { saveToStorage, getFromStorage } from '../lib/utils/storage'

// Canvas effect settings interface
export interface CanvasEffectSettings {
  wobble: { 
    enabled: boolean;
    amplitude: number;
    frequency: number;
    speed: number;
  };
  upsideDown: { enabled: boolean };
  invert: { enabled: boolean };
  mirrored: { enabled: boolean };
  melting: { 
    enabled: boolean;
    intensity: number;
    speed: number;
  };
  dataBleed: { 
    enabled: boolean;
    intensity: number;
    duration: number;
  };
}

interface EffectsLabProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyEffects: (effects: CanvasEffectSettings) => void;
  onResetToDefault: () => void;
  onClearAllEffects: () => void;
  gameRef: React.RefObject<any>;
}

export default function EffectsLab({ 
  isOpen, 
  onClose, 
  onApplyEffects, 
  onResetToDefault, 
  onClearAllEffects,
  gameRef 
}: EffectsLabProps) {
  const [effectsLabSettings, setEffectsLabSettings] = useState<CanvasEffectSettings>({
    wobble: { 
      enabled: false,
      amplitude: 5,
      frequency: 0.05,
      speed: 0.002
    },
    upsideDown: { enabled: false },
    invert: { enabled: false },
    mirrored: { enabled: false },
    melting: { 
      enabled: false,
      intensity: 1,
      speed: 0.01
    },
    dataBleed: { 
      enabled: false,
      intensity: 1,
      duration: 20
    }
  })
  const [effectsLabPresets, setEffectsLabPresets] = useState<Array<{ name: string; settings: any }>>([])
  const [selectedPresetName, setSelectedPresetName] = useState('')

  // Load presets from localStorage on mount
  useEffect(() => {
    const savedPresets = getFromStorage<Array<{ name: string; settings: any }>>('effectsLabPresets') || []
    setEffectsLabPresets(savedPresets)
  }, [])

  // Load current settings from game when opened
  useEffect(() => {
    if (isOpen && gameRef.current) {
      const currentSettings = gameRef.current.getCanvasEffectSettings?.() || effectsLabSettings
      setEffectsLabSettings(currentSettings)
    }
  }, [isOpen, gameRef, effectsLabSettings])

  const saveEffectsLabPreset = (presetName: string) => {
    const settingsCopy = JSON.parse(JSON.stringify(effectsLabSettings))
    const existingIndex = effectsLabPresets.findIndex(preset => preset.name === presetName)
    
    let newPresets
    if (existingIndex >= 0) {
      newPresets = [...effectsLabPresets]
      newPresets[existingIndex].settings = settingsCopy
    } else {
      newPresets = [...effectsLabPresets, { name: presetName, settings: settingsCopy }]
    }
    
    setEffectsLabPresets(newPresets)
    saveToStorage('effectsLabPresets', newPresets)
  }

  const loadEffectsLabPreset = (presetName: string) => {
    const preset = effectsLabPresets.find(p => p.name === presetName)
    if (preset) {
      const newSettings = JSON.parse(JSON.stringify(preset.settings))
      setEffectsLabSettings(newSettings)
      setSelectedPresetName(presetName)
    }
  }

  const deleteEffectsLabPreset = (presetName: string) => {
    const newPresets = effectsLabPresets.filter(preset => preset.name !== presetName)
    setEffectsLabPresets(newPresets)
    saveToStorage('effectsLabPresets', newPresets)
    
    if (selectedPresetName === presetName) {
      setSelectedPresetName('')
    }
  }

  if (!isOpen) return null

  return (
    <div id="effectsLabPanel" style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '600px',
      maxHeight: '80vh',
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      border: '2px solid #00ffff',
      borderRadius: '10px',
      padding: '20px',
      zIndex: 1000,
      overflowY: 'auto',
      color: 'white',
      fontFamily: 'Courier New, monospace'
    }}>
      <div className="effects-lab-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        borderBottom: '1px solid #00ffff',
        paddingBottom: '10px'
      }}>
        <h3 style={{ color: '#00ffff', margin: 0 }}>Effects Lab</h3>
        <button 
          className="close-button" 
          onClick={onClose}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'white', 
            fontSize: '20px', 
            cursor: 'pointer',
            padding: '5px 10px'
          }}
        >
          ×
        </button>
      </div>

      <div className="effects-controls">
        {/* Wobble Effect - Canvas Effect */}
        <div className="effect-control" style={{ marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <input 
              type="checkbox" 
              checked={effectsLabSettings.wobble.enabled}
              onChange={(e) => {
                const newSettings = {...effectsLabSettings}
                newSettings.wobble.enabled = e.target.checked
                setEffectsLabSettings(newSettings)
              }}
              style={{ marginRight: '10px' }}
            />
            Wobble (Canvas)
          </label>
          <div className="slider-group" style={{ marginLeft: '25px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Amplitude: {effectsLabSettings.wobble.amplitude}
            </label>
            <input 
              type="range" 
              min="1" max="20" step="1" 
              value={effectsLabSettings.wobble.amplitude}
              onChange={(e) => {
                const newSettings = {...effectsLabSettings}
                newSettings.wobble.amplitude = parseInt(e.target.value)
                setEffectsLabSettings(newSettings)
              }}
              disabled={!effectsLabSettings.wobble.enabled}
              style={{ width: '100%', marginBottom: '10px' }}
            />
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Frequency: {effectsLabSettings.wobble.frequency}
            </label>
            <input 
              type="range" 
              min="0.01" max="0.2" step="0.01" 
              value={effectsLabSettings.wobble.frequency}
              onChange={(e) => {
                const newSettings = {...effectsLabSettings}
                newSettings.wobble.frequency = parseFloat(e.target.value)
                setEffectsLabSettings(newSettings)
              }}
              disabled={!effectsLabSettings.wobble.enabled}
              style={{ width: '100%', marginBottom: '10px' }}
            />
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Speed: {effectsLabSettings.wobble.speed}
            </label>
            <input 
              type="range" 
              min="0.001" max="0.01" step="0.001" 
              value={effectsLabSettings.wobble.speed}
              onChange={(e) => {
                const newSettings = {...effectsLabSettings}
                newSettings.wobble.speed = parseFloat(e.target.value)
                setEffectsLabSettings(newSettings)
              }}
              disabled={!effectsLabSettings.wobble.enabled}
              style={{ width: '100%', marginBottom: '10px' }}
            />
          </div>
        </div>

        {/* Melting Effect - Canvas Effect */}
        <div className="effect-control" style={{ marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <input 
              type="checkbox" 
              checked={effectsLabSettings.melting.enabled}
              onChange={(e) => {
                const newSettings = {...effectsLabSettings}
                newSettings.melting.enabled = e.target.checked
                setEffectsLabSettings(newSettings)
              }}
              style={{ marginRight: '10px' }}
            />
            Melting (Canvas)
          </label>
          <div className="slider-group" style={{ marginLeft: '25px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Intensity: {effectsLabSettings.melting.intensity}
            </label>
            <input 
              type="range" 
              min="0.1" max="5" step="0.1" 
              value={effectsLabSettings.melting.intensity}
              onChange={(e) => {
                const newSettings = {...effectsLabSettings}
                newSettings.melting.intensity = parseFloat(e.target.value)
                setEffectsLabSettings(newSettings)
              }}
              disabled={!effectsLabSettings.melting.enabled}
              style={{ width: '100%', marginBottom: '10px' }}
            />
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Speed: {effectsLabSettings.melting.speed}
            </label>
            <input 
              type="range" 
              min="0.001" max="0.05" step="0.001" 
              value={effectsLabSettings.melting.speed}
              onChange={(e) => {
                const newSettings = {...effectsLabSettings}
                newSettings.melting.speed = parseFloat(e.target.value)
                setEffectsLabSettings(newSettings)
              }}
              disabled={!effectsLabSettings.melting.enabled}
              style={{ width: '100%', marginBottom: '10px' }}
            />
          </div>
        </div>

        {/* Data Bleed Effect - Canvas Effect */}
        <div className="effect-control" style={{ marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <input 
              type="checkbox" 
              checked={effectsLabSettings.dataBleed.enabled}
              onChange={(e) => {
                const newSettings = {...effectsLabSettings}
                newSettings.dataBleed.enabled = e.target.checked
                setEffectsLabSettings(newSettings)
              }}
              style={{ marginRight: '10px' }}
            />
            Data Bleed (Canvas)
          </label>
          <div className="slider-group" style={{ marginLeft: '25px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Intensity: {effectsLabSettings.dataBleed.intensity}
            </label>
            <input 
              type="range" 
              min="0.1" max="3" step="0.1" 
              value={effectsLabSettings.dataBleed.intensity}
              onChange={(e) => {
                const newSettings = {...effectsLabSettings}
                newSettings.dataBleed.intensity = parseFloat(e.target.value)
                setEffectsLabSettings(newSettings)
              }}
              disabled={!effectsLabSettings.dataBleed.enabled}
              style={{ width: '100%', marginBottom: '10px' }}
            />
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Duration: {effectsLabSettings.dataBleed.duration}
            </label>
            <input 
              type="range" 
              min="10" max="120" step="5" 
              value={effectsLabSettings.dataBleed.duration}
              onChange={(e) => {
                const newSettings = {...effectsLabSettings}
                newSettings.dataBleed.duration = parseInt(e.target.value)
                setEffectsLabSettings(newSettings)
              }}
              disabled={!effectsLabSettings.dataBleed.enabled}
              style={{ width: '100%', marginBottom: '10px' }}
            />
          </div>
        </div>

        {/* Upside Down Effect - Canvas Effect */}
        <div className="effect-control" style={{ marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center' }}>
            <input 
              type="checkbox" 
              checked={effectsLabSettings.upsideDown.enabled}
              onChange={(e) => {
                const newSettings = {...effectsLabSettings}
                newSettings.upsideDown.enabled = e.target.checked
                setEffectsLabSettings(newSettings)
              }}
              style={{ marginRight: '10px' }}
            />
            Upside Down (Canvas)
          </label>
        </div>

        {/* Invert Effect - Canvas Effect */}
        <div className="effect-control" style={{ marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center' }}>
            <input 
              type="checkbox" 
              checked={effectsLabSettings.invert.enabled}
              onChange={(e) => {
                const newSettings = {...effectsLabSettings}
                newSettings.invert.enabled = e.target.checked
                setEffectsLabSettings(newSettings)
              }}
              style={{ marginRight: '10px' }}
            />
            Invert (Canvas + Controls)
          </label>
        </div>

        {/* Mirrored Effect - Canvas Effect */}
        <div className="effect-control" style={{ marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center' }}>
            <input 
              type="checkbox" 
              checked={effectsLabSettings.mirrored.enabled}
              onChange={(e) => {
                const newSettings = {...effectsLabSettings}
                newSettings.mirrored.enabled = e.target.checked
                setEffectsLabSettings(newSettings)
              }}
              style={{ marginRight: '10px' }}
            />
            Mirrored (Canvas)
          </label>
        </div>
      </div>
      
      {/* Preset Management */}
      <div className="preset-management" style={{ marginTop: '30px' }}>
        <h4 style={{ color: '#00ffff', marginBottom: '15px' }}>Canvas Effect Presets</h4>
        <div className="preset-controls" style={{ marginBottom: '20px' }}>
          <input 
            type="text" 
            id="presetNameInput"
            placeholder="Preset name"
            defaultValue=""
            style={{
              padding: '8px',
              marginRight: '10px',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              border: '1px solid #00ffff',
              color: 'white',
              borderRadius: '4px'
            }}
          />
          <button onClick={() => {
            const input = document.getElementById('presetNameInput') as HTMLInputElement
            if (input && input.value.trim()) {
              saveEffectsLabPreset(input.value.trim())
              input.value = ''
            }
          }} style={{
            padding: '8px 16px',
            backgroundColor: 'rgba(0, 255, 255, 0.2)',
            border: '1px solid #00ffff',
            color: '#00ffff',
            cursor: 'pointer',
            borderRadius: '4px'
          }}>
            Save Preset
          </button>
        </div>
        
        {/* Quick Preset Buttons */}
        <div className="quick-presets" style={{ marginBottom: '20px' }}>
          <h5 style={{ color: '#00ffff', marginBottom: '10px' }}>Quick Presets</h5>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={() => {
              const newSettings = {
                wobble: { enabled: true, amplitude: 8, frequency: 0.08, speed: 0.003 },
                upsideDown: { enabled: false },
                invert: { enabled: false },
                mirrored: { enabled: false },
                melting: { enabled: false, intensity: 1, speed: 0.01 },
                dataBleed: { enabled: false, intensity: 1, duration: 20 }
              }
              setEffectsLabSettings(newSettings)
            }} style={{
              padding: '8px 16px',
              backgroundColor: 'rgba(0, 255, 255, 0.2)',
              border: '1px solid #00ffff',
              color: '#00ffff',
              cursor: 'pointer',
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              Gentle Wobble
            </button>
            <button onClick={() => {
              const newSettings = {
                wobble: { enabled: true, amplitude: 15, frequency: 0.12, speed: 0.005 },
                upsideDown: { enabled: true },
                invert: { enabled: false },
                mirrored: { enabled: false },
                melting: { enabled: false, intensity: 1, speed: 0.01 },
                dataBleed: { enabled: false, intensity: 1, duration: 20 }
              }
              setEffectsLabSettings(newSettings)
            }} style={{
              padding: '8px 16px',
              backgroundColor: 'rgba(0, 255, 255, 0.2)',
              border: '1px solid #00ffff',
              color: '#00ffff',
              cursor: 'pointer',
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              Disorienting
            </button>
            <button onClick={() => {
              const newSettings = {
                wobble: { enabled: false, amplitude: 5, frequency: 0.05, speed: 0.002 },
                upsideDown: { enabled: false },
                invert: { enabled: true },
                mirrored: { enabled: true },
                melting: { enabled: true, intensity: 2, speed: 0.02 },
                dataBleed: { enabled: true, intensity: 2, duration: 40 }
              }
              setEffectsLabSettings(newSettings)
            }} style={{
              padding: '8px 16px',
              backgroundColor: 'rgba(0, 255, 255, 0.2)',
              border: '1px solid #00ffff',
              color: '#00ffff',
              cursor: 'pointer',
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              Chaos Mode
            </button>
          </div>
        </div>
        
        <div className="preset-loading" style={{ marginBottom: '20px' }}>
          <select 
            value={selectedPresetName}
            onChange={(e) => {
              if (e.target.value) {
                loadEffectsLabPreset(e.target.value)
              }
            }}
            style={{
              padding: '8px',
              marginRight: '10px',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              border: '1px solid #00ffff',
              color: 'white',
              borderRadius: '4px'
            }}
          >
            <option value="">Select a preset...</option>
            {effectsLabPresets.map((preset: any) => (
              <option key={preset.name} value={preset.name}>
                {preset.name}
              </option>
            ))}
          </select>
          <button 
            onClick={() => {
              if (selectedPresetName) {
                loadEffectsLabPreset(selectedPresetName)
                onClose()
              }
            }}
            disabled={!selectedPresetName}
            style={{
              padding: '8px 16px',
              backgroundColor: 'rgba(0, 255, 255, 0.2)',
              border: '1px solid #00ffff',
              color: '#00ffff',
              cursor: 'pointer',
              borderRadius: '4px',
              marginRight: '10px',
              opacity: selectedPresetName ? 1 : 0.5
            }}
          >
            Load Preset
          </button>
          <button 
            onClick={() => {
              if (selectedPresetName) {
                deleteEffectsLabPreset(selectedPresetName)
              }
            }}
            disabled={!selectedPresetName}
            style={{
              padding: '8px 16px',
              backgroundColor: 'rgba(255, 0, 0, 0.2)',
              border: '1px solid #ff0000',
              color: '#ff0000',
              cursor: 'pointer',
              borderRadius: '4px',
              opacity: selectedPresetName ? 1 : 0.5
            }}
          >
            Delete Preset
          </button>
        </div>
      </div>
      
      <div className="effects-buttons" style={{ 
        display: 'flex', 
        gap: '10px', 
        justifyContent: 'center',
        borderTop: '1px solid #00ffff',
        paddingTop: '20px'
      }}>
        <button onClick={() => {
          onApplyEffects(effectsLabSettings)
          onClose()
        }} style={{
          padding: '10px 20px',
          backgroundColor: 'rgba(0, 255, 0, 0.2)',
          border: '1px solid #00ff00',
          color: '#00ff00',
          cursor: 'pointer',
          borderRadius: '4px'
        }}>
          Apply & Close
        </button>
        <button onClick={() => {
          onResetToDefault()
        }} style={{
          padding: '10px 20px',
          backgroundColor: 'rgba(0, 255, 255, 0.2)',
          border: '1px solid #00ffff',
          color: '#00ffff',
          cursor: 'pointer',
          borderRadius: '4px'
        }}>
          Reset to Level Default
        </button>
        <button onClick={() => {
          onClearAllEffects()
          onClose()
        }} style={{
          padding: '10px 20px',
          backgroundColor: 'rgba(255, 0, 0, 0.2)',
          border: '1px solid #ff0000',
          color: '#ff0000',
          cursor: 'pointer',
          borderRadius: '4px'
        }}>
          Clear All Effects
        </button>
      </div>
    </div>
  )
} 
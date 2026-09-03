import React, { useState, useEffect } from 'react';

export interface VFXEffectState {
  enabled: boolean;
  intensity: number;
}

export interface VFXControlsProps {
  initialEffects?: {
    glitch: VFXEffectState;
    chromatic: VFXEffectState;
    scanlines: VFXEffectState;
    pulse: VFXEffectState;
  };
  onChange?: (effects: {
    glitch: VFXEffectState;
    chromatic: VFXEffectState;
    scanlines: VFXEffectState;
    pulse: VFXEffectState;
  }) => void;
}

export const defaultVFXEffects = {
  glitch: { enabled: false, intensity: 0.5 },
  chromatic: { enabled: false, intensity: 0.5 },
  scanlines: { enabled: false, intensity: 0.5 },
  pulse: { enabled: false, intensity: 0.5 },
};

const STORAGE_KEY = 'vfxControlsSettings';

const controlGroupStyle: React.CSSProperties = {
  marginBottom: 24,
  padding: 16,
  borderRadius: 8,
  background: '#222',
  color: '#fff',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  maxWidth: 320,
};
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontWeight: 600,
  marginBottom: 4,
};
const sliderStyle: React.CSSProperties = {
  width: '100%',
  marginTop: 4,
};
const headingStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  marginBottom: 20,
  color: '#fff',
};

const VFXControls: React.FC<VFXControlsProps> = ({ initialEffects = defaultVFXEffects, onChange }) => {
  const [effects, setEffects] = useState(initialEffects);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          setEffects(JSON.parse(saved));
        } catch {}
      }
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(effects));
    }
  }, [effects]);

  const handleEffectChange = (effect: string, state: VFXEffectState) => {
    const newEffects = { ...effects, [effect]: state };
    setEffects(newEffects);
    if (onChange) onChange(newEffects);
  };

  return (
    <form aria-label="VFX Controls" style={{ background: 'transparent', color: '#fff' }}>
      <h3 style={headingStyle}>VFX Controls</h3>
      {Object.entries(effects).map(([effect, state]) => (
        <fieldset key={effect} style={controlGroupStyle} aria-labelledby={`label-${effect}`}> 
          <legend id={`label-${effect}`} style={labelStyle} tabIndex={0}>{effect.charAt(0).toUpperCase() + effect.slice(1)}</legend>
          <label htmlFor={`toggle-${effect}`} style={labelStyle}>
            <input
              id={`toggle-${effect}`}
              type="checkbox"
              checked={state.enabled}
              onChange={e => handleEffectChange(effect, { ...state, enabled: e.target.checked })}
              aria-checked={state.enabled}
              aria-label={`Enable ${effect.charAt(0).toUpperCase() + effect.slice(1)} effect`}
              style={{ marginRight: 8 }}
            />
            Enable
          </label>
          <label htmlFor={`slider-${effect}`} style={labelStyle}>
            Intensity:
            <input
              id={`slider-${effect}`}
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={state.intensity}
              onChange={e => handleEffectChange(effect, { ...state, intensity: parseFloat(e.target.value) })}
              disabled={!state.enabled}
              style={sliderStyle}
              aria-valuenow={state.intensity}
              aria-valuemin={0}
              aria-valuemax={1}
              aria-label={`${effect} intensity`}
            />
            <span style={{ marginLeft: 8 }}>{state.intensity}</span>
          </label>
        </fieldset>
      ))}
    </form>
  );
};

export default VFXControls; 
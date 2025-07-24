import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import VFXControls, { defaultVFXEffects } from './VFXControls';

describe('VFXControls', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders all effect controls', () => {
    render(<VFXControls />);
    expect(screen.getByText(/Glitch/i)).toBeInTheDocument();
    expect(screen.getByText(/Chromatic/i)).toBeInTheDocument();
    expect(screen.getByText(/Scanlines/i)).toBeInTheDocument();
    expect(screen.getByText(/Pulse/i)).toBeInTheDocument();
  });

  it('toggles and sliders update state and call onChange', () => {
    const onChange = jest.fn();
    render(<VFXControls onChange={onChange} />);
    const glitchToggle = screen.getByLabelText('Enable Glitch effect');
    fireEvent.click(glitchToggle);
    expect(onChange).toHaveBeenCalled();
    const glitchSlider = screen.getByLabelText('glitch intensity');
    fireEvent.change(glitchSlider, { target: { value: '0.8' } });
    expect(onChange).toHaveBeenCalled();
  });

  it('persists state to localStorage', () => {
    render(<VFXControls />);
    const glitchToggle = screen.getByLabelText('Enable Glitch effect');
    fireEvent.click(glitchToggle);
    // Should be saved in localStorage
    const saved = localStorage.getItem('vfxControlsSettings');
    expect(saved).toContain('glitch');
  });

  it('loads state from localStorage on mount', () => {
    localStorage.setItem('vfxControlsSettings', JSON.stringify({
      ...defaultVFXEffects,
      glitch: { enabled: true, intensity: 0.9 },
    }));
    render(<VFXControls />);
    const glitchToggle = screen.getByLabelText('Enable Glitch effect');
    expect(glitchToggle).toBeChecked();
  });
}); 
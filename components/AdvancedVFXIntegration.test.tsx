import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import AdvancedVFXIntegration from './AdvancedVFXIntegration'

// Mock the Game component
jest.mock('./Game', () => {
  return function MockGame() {
    return <div data-testid="game-component">Mock Game Component</div>
  }
})

describe('AdvancedVFXIntegration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the game component', () => {
    render(<AdvancedVFXIntegration />)
    expect(screen.getByTestId('game-component')).toBeInTheDocument()
  })

  it('renders VFX settings panel', () => {
    render(<AdvancedVFXIntegration />)
    expect(screen.getByText('VFX Integration')).toBeInTheDocument()
    expect(screen.getByText('Enable VFX Overlay')).toBeInTheDocument()
  })

  it('starts with VFX disabled', () => {
    render(<AdvancedVFXIntegration />)
    const vfxCheckbox = screen.getByRole('checkbox', { name: /Enable VFX Overlay/i })
    expect(vfxCheckbox).not.toBeChecked()
  })

  it('enables VFX overlay when checkbox is checked', () => {
    render(<AdvancedVFXIntegration />)
    const vfxCheckbox = screen.getByRole('checkbox', { name: /Enable VFX Overlay/i })
    fireEvent.click(vfxCheckbox)
    expect(vfxCheckbox).toBeChecked()
  })

  it('shows effect controls when VFX is enabled', () => {
    render(<AdvancedVFXIntegration />)
    const vfxCheckbox = screen.getByRole('checkbox', { name: /Enable VFX Overlay/i })
    fireEvent.click(vfxCheckbox)
    expect(screen.getByText('VFX effects will sync with your game\'s Effects Lab settings')).toBeInTheDocument()
    expect(screen.getByText('Glitch')).toBeInTheDocument()
    expect(screen.getByText('Chromatic')).toBeInTheDocument()
    expect(screen.getByText('Scanlines')).toBeInTheDocument()
    expect(screen.getByText('Pulse')).toBeInTheDocument()
  })

  it('enables and disables individual effects', () => {
    render(<AdvancedVFXIntegration />)
    const vfxCheckbox = screen.getByRole('checkbox', { name: /Enable VFX Overlay/i })
    fireEvent.click(vfxCheckbox)
    const effectCheckboxes = screen.getAllByRole('checkbox')
    // The first is the main VFX toggle, the rest are effect toggles
    effectCheckboxes.slice(1).forEach((checkbox) => {
      expect(checkbox).not.toBeChecked()
      fireEvent.click(checkbox)
      expect(checkbox).toBeChecked()
      fireEvent.click(checkbox)
      expect(checkbox).not.toBeChecked()
    })
  })

  it('changes intensity for enabled effects', () => {
    render(<AdvancedVFXIntegration />)
    const vfxCheckbox = screen.getByRole('checkbox', { name: /Enable VFX Overlay/i })
    fireEvent.click(vfxCheckbox)
    // Enable Glitch effect
    const glitchCheckbox = screen.getByLabelText('Glitch')
    fireEvent.click(glitchCheckbox)
    // Find the intensity slider for Glitch
    const intensitySlider = screen.getByDisplayValue('1')
    fireEvent.change(intensitySlider, { target: { value: '1.5' } })
    expect(intensitySlider).toHaveValue('1.5')
  })

  it('renders VFX overlay when enabled and at least one effect is active', () => {
    render(<AdvancedVFXIntegration />)
    const vfxCheckbox = screen.getByRole('checkbox', { name: /Enable VFX Overlay/i })
    fireEvent.click(vfxCheckbox)
    // Enable Glitch effect
    const glitchCheckbox = screen.getByLabelText('Glitch')
    fireEvent.click(glitchCheckbox)
    // VFX overlay should be present
    expect(screen.getByTestId('vfx-div')).toBeInTheDocument()
  })

  it('does not render VFX overlay if no effects are enabled', () => {
    render(<AdvancedVFXIntegration />)
    const vfxCheckbox = screen.getByRole('checkbox', { name: /Enable VFX Overlay/i })
    fireEvent.click(vfxCheckbox)
    // All effect checkboxes are unchecked by default
    expect(screen.queryByTestId('vfx-div')).not.toBeInTheDocument()
  })

  it('handles all effect types without errors', () => {
    render(<AdvancedVFXIntegration />)
    const vfxCheckbox = screen.getByRole('checkbox', { name: /Enable VFX Overlay/i })
    fireEvent.click(vfxCheckbox)
    const effectNames = ['Glitch', 'Chromatic', 'Scanlines', 'Pulse']
    effectNames.forEach(name => {
      const effectCheckbox = screen.getByLabelText(name)
      fireEvent.click(effectCheckbox)
      expect(effectCheckbox).toBeChecked()
      // VFX overlay should be present
      expect(screen.getByTestId('vfx-div')).toBeInTheDocument()
      fireEvent.click(effectCheckbox)
      expect(effectCheckbox).not.toBeChecked()
    })
  })
}) 
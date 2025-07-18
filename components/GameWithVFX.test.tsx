import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import GameWithVFX from './GameWithVFX'

// Mock the Game component
jest.mock('./Game', () => {
  return function MockGame() {
    return <div data-testid="game-component">Mock Game Component</div>
  }
})

describe('GameWithVFX', () => {
  beforeEach(() => {
    // Clear any previous renders
    jest.clearAllMocks()
  })

  it('renders the game component', () => {
    render(<GameWithVFX />)
    
    expect(screen.getByTestId('game-component')).toBeInTheDocument()
  })

  it('renders VFX controls panel', () => {
    render(<GameWithVFX />)
    
    expect(screen.getByText('VFX Controls')).toBeInTheDocument()
  })

  it('starts with VFX disabled by default', () => {
    render(<GameWithVFX />)
    
    const vfxCheckbox = screen.getByRole('checkbox')
    expect(vfxCheckbox).not.toBeChecked()
  })

  it('starts with glitch effect selected by default', () => {
    render(<GameWithVFX />)
    
    const effectSelect = screen.getByRole('combobox')
    expect(effectSelect).toHaveValue('glitch')
  })

  it('starts with intensity at 1.0 by default', () => {
    render(<GameWithVFX />)
    
    const intensityLabel = screen.getByText('Intensity: 1.00')
    expect(intensityLabel).toBeInTheDocument()
  })

  it('enables VFX when checkbox is checked', () => {
    render(<GameWithVFX />)
    
    const vfxCheckbox = screen.getByRole('checkbox')
    fireEvent.click(vfxCheckbox)
    
    expect(vfxCheckbox).toBeChecked()
  })

  it('shows effect controls when VFX is enabled', () => {
    render(<GameWithVFX />)
    
    const vfxCheckbox = screen.getByRole('checkbox')
    fireEvent.click(vfxCheckbox)
    
    expect(screen.getByText('Effect:')).toBeInTheDocument()
    expect(screen.getByText('Intensity: 1.00')).toBeInTheDocument()
  })

  it('changes effect when select value changes', () => {
    render(<GameWithVFX />)
    
    const vfxCheckbox = screen.getByRole('checkbox')
    fireEvent.click(vfxCheckbox)
    
    const effectSelect = screen.getByRole('combobox')
    fireEvent.change(effectSelect, { target: { value: 'chromatic' } })
    
    expect(effectSelect).toHaveValue('chromatic')
  })

  it('changes intensity when slider is moved', () => {
    render(<GameWithVFX />)
    
    const vfxCheckbox = screen.getByRole('checkbox')
    fireEvent.click(vfxCheckbox)
    
    const intensitySlider = screen.getByRole('slider')
    fireEvent.change(intensitySlider, { target: { value: '1.5' } })
    
    expect(screen.getByText('Intensity: 1.50')).toBeInTheDocument()
  })

  it('renders VFX overlay when enabled', () => {
    render(<GameWithVFX />)
    
    const vfxCheckbox = screen.getByRole('checkbox')
    fireEvent.click(vfxCheckbox)
    
    const vfxDiv = screen.getByTestId('vfx-div')
    expect(vfxDiv).toBeInTheDocument()
  })

  it('does not render VFX overlay when disabled', () => {
    render(<GameWithVFX />)
    
    expect(screen.queryByTestId('vfx-div')).not.toBeInTheDocument()
  })

  it('applies correct shader based on selected effect', () => {
    render(<GameWithVFX />)
    
    const vfxCheckbox = screen.getByRole('checkbox')
    fireEvent.click(vfxCheckbox)
    
    const effectSelect = screen.getByRole('combobox')
    
    // Test glitch effect
    fireEvent.change(effectSelect, { target: { value: 'glitch' } })
    let vfxDiv = screen.getByTestId('vfx-div')
    expect(vfxDiv.getAttribute('data-shader')).toContain('glitch')
    
    // Test chromatic effect
    fireEvent.change(effectSelect, { target: { value: 'chromatic' } })
    vfxDiv = screen.getByTestId('vfx-div')
    expect(vfxDiv.getAttribute('data-shader')).toContain('chromatic')
    
    // Test scanlines effect
    fireEvent.change(effectSelect, { target: { value: 'scanlines' } })
    vfxDiv = screen.getByTestId('vfx-div')
    expect(vfxDiv.getAttribute('data-shader')).toContain('scanlines')
    
    // Test pulse effect
    fireEvent.change(effectSelect, { target: { value: 'pulse' } })
    vfxDiv = screen.getByTestId('vfx-div')
    expect(vfxDiv.getAttribute('data-shader')).toContain('pulse')
  })

  it('has correct container styling', () => {
    render(<GameWithVFX />)
    
    const container = screen.getByTestId('game-component').parentElement
    expect(container).toHaveStyle({
      position: 'relative',
      width: '800px',
      height: '600px'
    })
  })

  it('has correct VFX overlay positioning', () => {
    render(<GameWithVFX />)
    
    const vfxCheckbox = screen.getByRole('checkbox')
    fireEvent.click(vfxCheckbox)
    
    const vfxContainer = screen.getByTestId('vfx-div').parentElement
    expect(vfxContainer).toHaveStyle({
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: '2'
    })
  })

  it('has correct controls panel styling', () => {
    render(<GameWithVFX />)
    
    const controlsPanel = screen.getByText('VFX Controls').parentElement
    expect(controlsPanel).toHaveStyle({
      position: 'absolute',
      top: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      padding: '10px',
      borderRadius: '5px',
      color: 'white',
      zIndex: '3'
    })
  })

  it('handles all effect types without errors', () => {
    render(<GameWithVFX />)
    
    const vfxCheckbox = screen.getByRole('checkbox')
    fireEvent.click(vfxCheckbox)
    
    const effectSelect = screen.getByRole('combobox')
    const effectTypes = ['glitch', 'chromatic', 'scanlines', 'pulse']
    
    effectTypes.forEach(effectType => {
      fireEvent.change(effectSelect, { target: { value: effectType } })
      const vfxDiv = screen.getByTestId('vfx-div')
      expect(vfxDiv).toBeInTheDocument()
      expect(vfxDiv).toHaveAttribute('data-shader')
    })
  })

  it('handles intensity range values correctly', () => {
    render(<GameWithVFX />)
    
    const vfxCheckbox = screen.getByRole('checkbox')
    fireEvent.click(vfxCheckbox)
    
    const intensitySlider = screen.getByRole('slider')
    const testValues = ['0', '0.5', '1.0', '1.5', '2.0']
    
    testValues.forEach(value => {
      fireEvent.change(intensitySlider, { target: { value } })
      expect(screen.getByText(`Intensity: ${parseFloat(value).toFixed(2)}`)).toBeInTheDocument()
    })
  })

  it('maintains game state when VFX settings change', () => {
    render(<GameWithVFX />)
    
    const gameComponent = screen.getByTestId('game-component')
    expect(gameComponent).toBeInTheDocument()
    
    // Change VFX settings
    const vfxCheckbox = screen.getByRole('checkbox')
    fireEvent.click(vfxCheckbox)
    
    const effectSelect = screen.getByRole('combobox')
    fireEvent.change(effectSelect, { target: { value: 'chromatic' } })
    
    // Game component should still be present
    expect(screen.getByTestId('game-component')).toBeInTheDocument()
  })
}) 
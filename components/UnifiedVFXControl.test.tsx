import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import UnifiedVFXControl from './UnifiedVFXControl'
import { GameRef, CanvasEffectSettings } from '../types/game-ref'

// Mock GameRef
const mockGameRef = {
  current: {
    getCanvasEffectSettings: jest.fn(() => ({
      wobble: { enabled: false, amplitude: 5, frequency: 0.05, speed: 0.005 },
      upsideDown: { enabled: false },
      invert: { enabled: false },
      backwards: { enabled: false },
      melting: { enabled: false, intensity: 1, speed: 0.01 },
      dataBleed: { enabled: false, intensity: 1, duration: 20 }
    })),
    setCanvasEffectSettings: jest.fn(),
    getPerformanceMetrics: jest.fn(() => ({
      fps: 60.0,
      frameCount: 1000,
      lastTime: Date.now(),
      isEffectsLabUnlocked: true,
      activeCustomEffects: {}
    }))
  }
} as React.RefObject<GameRef>

describe('UnifiedVFXControl', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the control panel with header', () => {
    render(<UnifiedVFXControl gameRef={mockGameRef} />)
    
    expect(screen.getByText('VFX Control Panel')).toBeInTheDocument()
    expect(screen.getByText('Reset')).toBeInTheDocument()
  })

  it('shows performance metrics when available', () => {
    render(<UnifiedVFXControl gameRef={mockGameRef} />)
    
    expect(screen.getByText('FPS: 60.0')).toBeInTheDocument()
    expect(screen.getByText('Effects Lab: Unlocked')).toBeInTheDocument()
  })

  it('starts with visual effects tab active', () => {
    render(<UnifiedVFXControl gameRef={mockGameRef} />)
    
    expect(screen.getByText('Visual Effects (React-VFX)')).toBeInTheDocument()
    expect(screen.queryByText('Canvas Effects (Game Logic)')).not.toBeInTheDocument()
    expect(screen.queryByText('Effect Presets')).not.toBeInTheDocument()
  })

  it('switches to canvas effects tab when clicked', () => {
    render(<UnifiedVFXControl gameRef={mockGameRef} />)
    
    const canvasTab = screen.getByText('canvas')
    fireEvent.click(canvasTab)
    
    expect(screen.getByText('Canvas Effects (Game Logic)')).toBeInTheDocument()
    expect(screen.queryByText('Visual Effects (React-VFX)')).not.toBeInTheDocument()
  })

  it('switches to presets tab when clicked', () => {
    render(<UnifiedVFXControl gameRef={mockGameRef} />)
    
    const presetsTab = screen.getByText('presets')
    fireEvent.click(presetsTab)
    
    expect(screen.getByText('Effect Presets')).toBeInTheDocument()
    expect(screen.getByText('Glitch Horror')).toBeInTheDocument()
    expect(screen.getByText('Retro CRT')).toBeInTheDocument()
  })

  it('toggles visual effects when checkbox is clicked', () => {
    const onVisualEffectsChange = jest.fn()
    render(<UnifiedVFXControl gameRef={mockGameRef} onVisualEffectsChange={onVisualEffectsChange} />)
    
    const glitchCheckbox = screen.getByLabelText('Glitch')
    fireEvent.click(glitchCheckbox)
    
    expect(glitchCheckbox).toBeChecked()
    expect(onVisualEffectsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        glitch: expect.objectContaining({ enabled: true })
      })
    )
  })

  it('shows intensity slider when visual effect is enabled', () => {
    render(<UnifiedVFXControl gameRef={mockGameRef} />)
    
    const glitchCheckbox = screen.getByLabelText('Glitch')
    fireEvent.click(glitchCheckbox)
    
    expect(screen.getByText('Intensity: 1.00')).toBeInTheDocument()
    expect(screen.getByRole('slider')).toBeInTheDocument()
  })

  it('updates visual effect intensity when slider is moved', () => {
    const onVisualEffectsChange = jest.fn()
    render(<UnifiedVFXControl gameRef={mockGameRef} onVisualEffectsChange={onVisualEffectsChange} />)
    
    const glitchCheckbox = screen.getByLabelText('Glitch')
    fireEvent.click(glitchCheckbox)
    
    const intensitySlider = screen.getByRole('slider')
    fireEvent.change(intensitySlider, { target: { value: '1.5' } })
    
    expect(screen.getByText('Intensity: 1.50')).toBeInTheDocument()
    expect(onVisualEffectsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        glitch: expect.objectContaining({ intensity: 1.5 })
      })
    )
  })

  it('toggles canvas effects when checkbox is clicked', () => {
    const onCanvasEffectsChange = jest.fn()
    render(<UnifiedVFXControl gameRef={mockGameRef} onCanvasEffectsChange={onCanvasEffectsChange} />)
    
    // Switch to canvas tab
    const canvasTab = screen.getByText('canvas')
    fireEvent.click(canvasTab)
    
    const wobbleCheckbox = screen.getByLabelText('Wobble')
    fireEvent.click(wobbleCheckbox)
    
    expect(wobbleCheckbox).toBeChecked()
    expect(mockGameRef.current?.setCanvasEffectSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        wobble: expect.objectContaining({ enabled: true })
      })
    )
    expect(onCanvasEffectsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        wobble: expect.objectContaining({ enabled: true })
      })
    )
  })

  it('shows canvas effect controls when enabled', () => {
    render(<UnifiedVFXControl gameRef={mockGameRef} />)
    
    // Switch to canvas tab
    const canvasTab = screen.getByText('canvas')
    fireEvent.click(canvasTab)
    
    const wobbleCheckbox = screen.getByLabelText('Wobble')
    fireEvent.click(wobbleCheckbox)
    
    expect(screen.getByText('Amplitude: 5')).toBeInTheDocument()
    expect(screen.getByRole('slider')).toBeInTheDocument()
  })

  it('updates canvas effect parameters when slider is moved', () => {
    const onCanvasEffectsChange = jest.fn()
    render(<UnifiedVFXControl gameRef={mockGameRef} onCanvasEffectsChange={onCanvasEffectsChange} />)
    
    // Switch to canvas tab
    const canvasTab = screen.getByText('canvas')
    fireEvent.click(canvasTab)
    
    const wobbleCheckbox = screen.getByLabelText('Wobble')
    fireEvent.click(wobbleCheckbox)
    
    const amplitudeSlider = screen.getByRole('slider')
    fireEvent.change(amplitudeSlider, { target: { value: '10' } })
    
    expect(screen.getByText('Amplitude: 10')).toBeInTheDocument()
    expect(mockGameRef.current?.setCanvasEffectSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        wobble: expect.objectContaining({ amplitude: 10 })
      })
    )
  })

  it('applies preset when preset button is clicked', () => {
    const onPresetChange = jest.fn()
    render(<UnifiedVFXControl gameRef={mockGameRef} onPresetChange={onPresetChange} />)
    
    // Switch to presets tab
    const presetsTab = screen.getByText('presets')
    fireEvent.click(presetsTab)
    
    // Get the first Apply button (Glitch Horror preset)
    const applyButtons = screen.getAllByText('Apply')
    fireEvent.click(applyButtons[0])
    
    expect(onPresetChange).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Glitch Horror',
        category: 'combined'
      })
    )
  })

  it('resets all effects when reset button is clicked', () => {
    const onVisualEffectsChange = jest.fn()
    const onCanvasEffectsChange = jest.fn()
    render(
      <UnifiedVFXControl 
        gameRef={mockGameRef} 
        onVisualEffectsChange={onVisualEffectsChange}
        onCanvasEffectsChange={onCanvasEffectsChange}
      />
    )
    
    // Enable a visual effect first
    const glitchCheckbox = screen.getByLabelText('Glitch')
    fireEvent.click(glitchCheckbox)
    
    // Click reset
    const resetButton = screen.getByText('Reset')
    fireEvent.click(resetButton)
    
    expect(glitchCheckbox).not.toBeChecked()
    expect(onVisualEffectsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        glitch: expect.objectContaining({ enabled: false })
      })
    )
    expect(onCanvasEffectsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        wobble: expect.objectContaining({ enabled: false })
      })
    )
  })

  it('collapses and expands when collapse button is clicked', () => {
    render(<UnifiedVFXControl gameRef={mockGameRef} />)
    
    // Initially expanded
    expect(screen.getByText('Visual Effects (React-VFX)')).toBeInTheDocument()
    
    // Click collapse
    const collapseButton = screen.getByText('▲')
    fireEvent.click(collapseButton)
    
    // Should be collapsed
    expect(screen.queryByText('Visual Effects (React-VFX)')).not.toBeInTheDocument()
    expect(screen.getByText('▼')).toBeInTheDocument()
    
    // Click expand
    const expandButton = screen.getByText('▼')
    fireEvent.click(expandButton)
    
    // Should be expanded again
    expect(screen.getByText('Visual Effects (React-VFX)')).toBeInTheDocument()
  })

  it('syncs canvas effects with game on mount', () => {
    render(<UnifiedVFXControl gameRef={mockGameRef} />)
    
    expect(mockGameRef.current?.getCanvasEffectSettings).toHaveBeenCalled()
  })

  it('handles missing game ref gracefully', () => {
    const nullGameRef = { current: null } as React.RefObject<GameRef>
    render(<UnifiedVFXControl gameRef={nullGameRef} />)
    
    // Should render without errors
    expect(screen.getByText('VFX Control Panel')).toBeInTheDocument()
  })

  it('handles missing performance metrics gracefully', () => {
    const mockGameRefWithoutMetrics = {
      current: {
        getCanvasEffectSettings: jest.fn(() => ({
          wobble: { enabled: false, amplitude: 5, frequency: 0.05, speed: 0.005 },
          upsideDown: { enabled: false },
          invert: { enabled: false },
          backwards: { enabled: false },
          melting: { enabled: false, intensity: 1, speed: 0.01 },
          dataBleed: { enabled: false, intensity: 1, duration: 20 }
        })),
        setCanvasEffectSettings: jest.fn(),
        getPerformanceMetrics: jest.fn(() => null)
      }
    } as React.RefObject<GameRef>
    
    render(<UnifiedVFXControl gameRef={mockGameRefWithoutMetrics} />)
    
    // Should render without performance metrics
    expect(screen.getByText('VFX Control Panel')).toBeInTheDocument()
    expect(screen.queryByText('FPS:')).not.toBeInTheDocument()
  })

  it('displays all visual effect types', () => {
    render(<UnifiedVFXControl gameRef={mockGameRef} />)
    
    expect(screen.getByLabelText('Glitch')).toBeInTheDocument()
    expect(screen.getByLabelText('Chromatic')).toBeInTheDocument()
    expect(screen.getByLabelText('Pulsing')).toBeInTheDocument()
    expect(screen.getByLabelText('Scanlines')).toBeInTheDocument()
  })

  it('displays all canvas effect types', () => {
    render(<UnifiedVFXControl gameRef={mockGameRef} />)
    
    // Switch to canvas tab
    const canvasTab = screen.getByText('canvas')
    fireEvent.click(canvasTab)
    
    expect(screen.getByLabelText('Wobble')).toBeInTheDocument()
    expect(screen.getByLabelText('Upside Down')).toBeInTheDocument()
    expect(screen.getByLabelText('Invert')).toBeInTheDocument()
    expect(screen.getByLabelText('Backwards')).toBeInTheDocument()
    expect(screen.getByLabelText('Melting')).toBeInTheDocument()
    expect(screen.getByLabelText('Data Bleed')).toBeInTheDocument()
  })

  it('displays all preset categories', () => {
    render(<UnifiedVFXControl gameRef={mockGameRef} />)
    
    // Switch to presets tab
    const presetsTab = screen.getByText('presets')
    fireEvent.click(presetsTab)
    
    const categoryElements = screen.getAllByText(/Category:/)
    expect(categoryElements).toHaveLength(4) // 4 presets total
    
    // Check that all categories are present
    const categoryTexts = categoryElements.map(el => el.textContent)
    expect(categoryTexts).toContain('Category: combined')
    expect(categoryTexts).toContain('Category: visual')
    expect(categoryTexts).toContain('Category: canvas')
  })
}) 
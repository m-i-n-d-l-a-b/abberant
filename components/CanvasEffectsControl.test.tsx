import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import CanvasEffectsControl from './CanvasEffectsControl'
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
    getGameState: jest.fn(() => ({
      gameState: 'playing',
      currentLevel: 1,
      lives: 3,
      score: 1000,
      combo: 5,
      bestCombo: 10,
      paused: false,
      isReversed: false,
      levelProgress: 50,
      levelTarget: 100,
      levelEffects: []
    })),
    getPerformanceMetrics: jest.fn(() => ({
      fps: 60.0,
      frameCount: 1000,
      lastTime: Date.now(),
      isEffectsLabUnlocked: true,
      activeCustomEffects: {}
    }))
  }
} as React.RefObject<GameRef>

describe('CanvasEffectsControl', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the control panel with header', () => {
    render(<CanvasEffectsControl gameRef={mockGameRef} />)
    
    expect(screen.getByText('Canvas Effects')).toBeInTheDocument()
    expect(screen.getByText('Reset')).toBeInTheDocument()
  })

  it('shows game state information when available', () => {
    render(<CanvasEffectsControl gameRef={mockGameRef} />)
    
    expect(screen.getByText('Level: 1')).toBeInTheDocument()
    expect(screen.getByText('State: playing')).toBeInTheDocument()
    expect(screen.getByText('Score: 1000')).toBeInTheDocument()
  })

  it('shows performance warning when FPS is low', () => {
    // Mock low FPS
    const lowFpsGameRef = {
      current: {
        ...mockGameRef.current,
        getPerformanceMetrics: jest.fn(() => ({
          fps: 25.0,
          frameCount: 1000,
          lastTime: Date.now(),
          isEffectsLabUnlocked: true,
          activeCustomEffects: {}
        }))
      }
    } as React.RefObject<GameRef>
    
    render(<CanvasEffectsControl gameRef={lowFpsGameRef} />)
    
    expect(screen.getByText('⚠️ Low FPS: 25.0')).toBeInTheDocument()
    expect(screen.getByText('Consider disabling some effects')).toBeInTheDocument()
  })

  it('shows effects active warning when effects are enabled', () => {
    // Mock effects enabled
    const effectsEnabledGameRef = {
      current: {
        ...mockGameRef.current,
        getCanvasEffectSettings: jest.fn(() => ({
          wobble: { enabled: true, amplitude: 5, frequency: 0.05, speed: 0.005 },
          upsideDown: { enabled: false },
          invert: { enabled: false },
          backwards: { enabled: false },
          melting: { enabled: false, intensity: 1, speed: 0.01 },
          dataBleed: { enabled: false, intensity: 1, duration: 20 }
        }))
      }
    } as React.RefObject<GameRef>
    
    render(<CanvasEffectsControl gameRef={effectsEnabledGameRef} />)
    
    expect(screen.getByText('⚠️ Effects Active')).toBeInTheDocument()
  })

  it('toggles wobble effect when checkbox is clicked', () => {
    const onEffectsChange = jest.fn()
    render(<CanvasEffectsControl gameRef={mockGameRef} onEffectsChange={onEffectsChange} />)
    
    const wobbleCheckbox = screen.getByLabelText(/Wobble/)
    fireEvent.click(wobbleCheckbox)
    
    expect(wobbleCheckbox).toBeChecked()
    expect(mockGameRef.current?.setCanvasEffectSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        wobble: expect.objectContaining({ enabled: true })
      })
    )
    expect(onEffectsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        wobble: expect.objectContaining({ enabled: true })
      })
    )
  })

  it('shows wobble controls when enabled', () => {
    render(<CanvasEffectsControl gameRef={mockGameRef} />)
    
    const wobbleCheckbox = screen.getByLabelText(/Wobble/)
    fireEvent.click(wobbleCheckbox)
    
    expect(screen.getByText('Amplitude: 5')).toBeInTheDocument()
    expect(screen.getByText('Frequency: 0.050')).toBeInTheDocument()
    expect(screen.getAllByRole('slider')).toHaveLength(2)
  })

  it('updates wobble amplitude when slider is moved', () => {
    const onEffectsChange = jest.fn()
    render(<CanvasEffectsControl gameRef={mockGameRef} onEffectsChange={onEffectsChange} />)
    
    const wobbleCheckbox = screen.getByLabelText(/Wobble/)
    fireEvent.click(wobbleCheckbox)
    
    const amplitudeSlider = screen.getAllByRole('slider')[0]
    fireEvent.change(amplitudeSlider, { target: { value: '10' } })
    
    expect(screen.getByText('Amplitude: 10')).toBeInTheDocument()
    expect(mockGameRef.current?.setCanvasEffectSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        wobble: expect.objectContaining({ amplitude: 10 })
      })
    )
  })

  it('toggles upside down effect when checkbox is clicked', () => {
    const onEffectsChange = jest.fn()
    render(<CanvasEffectsControl gameRef={mockGameRef} onEffectsChange={onEffectsChange} />)
    
    const upsideDownCheckbox = screen.getByLabelText(/Upside Down/)
    fireEvent.click(upsideDownCheckbox)
    
    expect(upsideDownCheckbox).toBeChecked()
    expect(mockGameRef.current?.setCanvasEffectSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        upsideDown: expect.objectContaining({ enabled: true })
      })
    )
  })

  it('toggles invert effect when checkbox is clicked', () => {
    const onEffectsChange = jest.fn()
    render(<CanvasEffectsControl gameRef={mockGameRef} onEffectsChange={onEffectsChange} />)
    
    const invertCheckbox = screen.getByLabelText(/Invert/)
    fireEvent.click(invertCheckbox)
    
    expect(invertCheckbox).toBeChecked()
    expect(mockGameRef.current?.setCanvasEffectSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        invert: expect.objectContaining({ enabled: true })
      })
    )
  })

  it('toggles backwards effect when checkbox is clicked', () => {
    const onEffectsChange = jest.fn()
    render(<CanvasEffectsControl gameRef={mockGameRef} onEffectsChange={onEffectsChange} />)
    
    const backwardsCheckbox = screen.getByLabelText(/Backwards/)
    fireEvent.click(backwardsCheckbox)
    
    expect(backwardsCheckbox).toBeChecked()
    expect(mockGameRef.current?.setCanvasEffectSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        backwards: expect.objectContaining({ enabled: true })
      })
    )
  })

  it('toggles melting effect when checkbox is clicked', () => {
    const onEffectsChange = jest.fn()
    render(<CanvasEffectsControl gameRef={mockGameRef} onEffectsChange={onEffectsChange} />)
    
    const meltingCheckbox = screen.getByLabelText(/Melting/)
    fireEvent.click(meltingCheckbox)
    
    expect(meltingCheckbox).toBeChecked()
    expect(mockGameRef.current?.setCanvasEffectSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        melting: expect.objectContaining({ enabled: true })
      })
    )
  })

  it('shows melting controls when enabled', () => {
    render(<CanvasEffectsControl gameRef={mockGameRef} />)
    
    const meltingCheckbox = screen.getByLabelText(/Melting/)
    fireEvent.click(meltingCheckbox)
    
    expect(screen.getByText('Intensity: 1.0')).toBeInTheDocument()
    expect(screen.getByText('Speed: 0.010')).toBeInTheDocument()
    expect(screen.getAllByRole('slider')).toHaveLength(2)
  })

  it('updates melting intensity when slider is moved', () => {
    const onEffectsChange = jest.fn()
    render(<CanvasEffectsControl gameRef={mockGameRef} onEffectsChange={onEffectsChange} />)
    
    const meltingCheckbox = screen.getByLabelText(/Melting/)
    fireEvent.click(meltingCheckbox)
    
    const intensitySlider = screen.getAllByRole('slider')[0]
    fireEvent.change(intensitySlider, { target: { value: '2.5' } })
    
    expect(screen.getByText('Intensity: 2.5')).toBeInTheDocument()
    expect(mockGameRef.current?.setCanvasEffectSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        melting: expect.objectContaining({ intensity: 2.5 })
      })
    )
  })

  it('toggles data bleed effect when checkbox is clicked', () => {
    const onEffectsChange = jest.fn()
    render(<CanvasEffectsControl gameRef={mockGameRef} onEffectsChange={onEffectsChange} />)
    
    const dataBleedCheckbox = screen.getByLabelText(/Data Bleed/)
    fireEvent.click(dataBleedCheckbox)
    
    expect(dataBleedCheckbox).toBeChecked()
    expect(mockGameRef.current?.setCanvasEffectSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        dataBleed: expect.objectContaining({ enabled: true })
      })
    )
  })

  it('shows data bleed controls when enabled', () => {
    render(<CanvasEffectsControl gameRef={mockGameRef} />)
    
    const dataBleedCheckbox = screen.getByLabelText(/Data Bleed/)
    fireEvent.click(dataBleedCheckbox)
    
    expect(screen.getByText('Intensity: 1.0')).toBeInTheDocument()
    expect(screen.getByText('Duration: 20 frames')).toBeInTheDocument()
    expect(screen.getAllByRole('slider')).toHaveLength(2)
  })

  it('updates data bleed duration when slider is moved', () => {
    const onEffectsChange = jest.fn()
    render(<CanvasEffectsControl gameRef={mockGameRef} onEffectsChange={onEffectsChange} />)
    
    const dataBleedCheckbox = screen.getByLabelText(/Data Bleed/)
    fireEvent.click(dataBleedCheckbox)
    
    const durationSlider = screen.getAllByRole('slider')[1]
    fireEvent.change(durationSlider, { target: { value: '50' } })
    
    expect(screen.getByText('Duration: 50 frames')).toBeInTheDocument()
    expect(mockGameRef.current?.setCanvasEffectSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        dataBleed: expect.objectContaining({ duration: 50 })
      })
    )
  })

  it('resets all effects when reset button is clicked', () => {
    const onEffectsChange = jest.fn()
    render(<CanvasEffectsControl gameRef={mockGameRef} onEffectsChange={onEffectsChange} />)
    
    // Enable an effect first
    const wobbleCheckbox = screen.getByLabelText(/Wobble/)
    fireEvent.click(wobbleCheckbox)
    
    // Click reset
    const resetButton = screen.getByText('Reset')
    fireEvent.click(resetButton)
    
    expect(wobbleCheckbox).not.toBeChecked()
    expect(mockGameRef.current?.setCanvasEffectSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        wobble: expect.objectContaining({ enabled: false }),
        upsideDown: expect.objectContaining({ enabled: false }),
        invert: expect.objectContaining({ enabled: false }),
        backwards: expect.objectContaining({ enabled: false }),
        melting: expect.objectContaining({ enabled: false }),
        dataBleed: expect.objectContaining({ enabled: false })
      })
    )
  })

  it('collapses and expands when collapse button is clicked', () => {
    render(<CanvasEffectsControl gameRef={mockGameRef} />)
    
    // Initially expanded
    expect(screen.getByText('Game Logic Effects')).toBeInTheDocument()
    
    // Click collapse
    const collapseButton = screen.getByText('▲')
    fireEvent.click(collapseButton)
    
    // Should be collapsed
    expect(screen.queryByText('Game Logic Effects')).not.toBeInTheDocument()
    expect(screen.getByText('▼')).toBeInTheDocument()
    
    // Click expand
    const expandButton = screen.getByText('▼')
    fireEvent.click(expandButton)
    
    // Should be expanded again
    expect(screen.getByText('Game Logic Effects')).toBeInTheDocument()
  })

  it('syncs with game on mount', () => {
    render(<CanvasEffectsControl gameRef={mockGameRef} />)
    
    expect(mockGameRef.current?.getCanvasEffectSettings).toHaveBeenCalled()
  })

  it('shows sync status information', () => {
    render(<CanvasEffectsControl gameRef={mockGameRef} />)
    
    expect(screen.getByText(/Last sync:/)).toBeInTheDocument()
    expect(screen.getByText('Active effects: 0')).toBeInTheDocument()
  })

  it('updates active effects count when effects are enabled', () => {
    render(<CanvasEffectsControl gameRef={mockGameRef} />)
    
    const wobbleCheckbox = screen.getByLabelText(/Wobble/)
    fireEvent.click(wobbleCheckbox)
    
    expect(screen.getByText('Active effects: 1')).toBeInTheDocument()
  })

  it('handles missing game ref gracefully', () => {
    const nullGameRef = { current: null } as React.RefObject<GameRef>
    render(<CanvasEffectsControl gameRef={nullGameRef} />)
    
    // Should render without errors
    expect(screen.getByText('Canvas Effects')).toBeInTheDocument()
  })

  it('handles missing game state gracefully', () => {
    const noStateGameRef = {
      current: {
        ...mockGameRef.current,
        getGameState: jest.fn(() => null)
      }
    } as React.RefObject<GameRef>
    
    render(<CanvasEffectsControl gameRef={noStateGameRef} />)
    
    // Should render without game state info
    expect(screen.getByText('Canvas Effects')).toBeInTheDocument()
    expect(screen.queryByText('Level:')).not.toBeInTheDocument()
  })

  it('handles missing performance metrics gracefully', () => {
    const noMetricsGameRef = {
      current: {
        ...mockGameRef.current,
        getPerformanceMetrics: jest.fn(() => null)
      }
    } as React.RefObject<GameRef>
    
    render(<CanvasEffectsControl gameRef={noMetricsGameRef} />)
    
    // Should render without performance warning
    expect(screen.getByText('Canvas Effects')).toBeInTheDocument()
    expect(screen.queryByText('⚠️ Low FPS:')).not.toBeInTheDocument()
  })

  it('displays all effect types with descriptions', () => {
    render(<CanvasEffectsControl gameRef={mockGameRef} />)
    
    expect(screen.getByLabelText(/Wobble/)).toBeInTheDocument()
    expect(screen.getByText('(Object movement)')).toBeInTheDocument()
    
    expect(screen.getByLabelText(/Upside Down/)).toBeInTheDocument()
    expect(screen.getByText('(Flip vertically)')).toBeInTheDocument()
    
    expect(screen.getByLabelText(/Invert/)).toBeInTheDocument()
    expect(screen.getByText('(Color inversion)')).toBeInTheDocument()
    
    expect(screen.getByLabelText(/Backwards/)).toBeInTheDocument()
    expect(screen.getByText('(Reverse controls)')).toBeInTheDocument()
    
    expect(screen.getByLabelText(/Melting/)).toBeInTheDocument()
    expect(screen.getByText('(Object distortion)')).toBeInTheDocument()
    
    expect(screen.getByLabelText(/Data Bleed/)).toBeInTheDocument()
    expect(screen.getByText('(Screen artifacts)')).toBeInTheDocument()
  })

  it('renders with custom className', () => {
    render(<CanvasEffectsControl gameRef={mockGameRef} className="custom-canvas-control" />)
    
    const control = screen.getByText('Canvas Effects').closest('.canvas-effects-control')
    expect(control).toHaveClass('canvas-effects-control', 'custom-canvas-control')
  })
}) 
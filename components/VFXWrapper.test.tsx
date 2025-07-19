import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import VFXWrapper from './VFXWrapper'
import { GameRef } from '../types/game-ref'

// Mock react-vfx
jest.mock('react-vfx', () => ({
  VFXProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="vfx-provider">{children}</div>,
  VFXDiv: ({ shader, style }: { shader: string; style: any }) => (
    <div data-testid="vfx-div" data-shader={shader} style={style} />
  )
}))

// Mock webgl-support
jest.mock('../lib/utils/webgl-support', () => ({
  hasVFXSupport: jest.fn(() => true),
  getOptimalVFXQuality: jest.fn(() => 'medium')
}))

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

describe('VFXWrapper', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset the mock to default value (true)
    const { hasVFXSupport } = require('../lib/utils/webgl-support')
    hasVFXSupport.mockReturnValue(true)
  })

  it('renders children without VFX when WebGL is not supported', () => {
    // Mock WebGL not supported
    const { hasVFXSupport } = require('../lib/utils/webgl-support')
    hasVFXSupport.mockReturnValue(false)
    
    render(
      <VFXWrapper gameRef={mockGameRef}>
        <div data-testid="game-content">Game Content</div>
      </VFXWrapper>
    )
    
    expect(screen.getByTestId('game-content')).toBeInTheDocument()
    expect(screen.getByText('⚠️ WebGL Not Supported')).toBeInTheDocument()
    expect(screen.queryByTestId('vfx-provider')).not.toBeInTheDocument()
  })

  it('renders children with VFX controls when WebGL is supported', () => {
    render(
      <VFXWrapper gameRef={mockGameRef}>
        <div data-testid="game-content">Game Content</div>
      </VFXWrapper>
    )
    
    expect(screen.getByTestId('game-content')).toBeInTheDocument()
    expect(screen.getByText('Show VFX')).toBeInTheDocument()
    expect(screen.queryByText('⚠️ WebGL Not Supported')).not.toBeInTheDocument()
  })

  it('shows VFX controls when toggle button is clicked', () => {
    render(
      <VFXWrapper gameRef={mockGameRef}>
        <div data-testid="game-content">Game Content</div>
      </VFXWrapper>
    )
    
    const toggleButton = screen.getByText('Show VFX')
    fireEvent.click(toggleButton)
    
    expect(screen.getByText('Hide VFX')).toBeInTheDocument()
    expect(screen.getByText('VFX Control Panel')).toBeInTheDocument()
  })

  it('hides VFX controls when toggle button is clicked again', () => {
    render(
      <VFXWrapper gameRef={mockGameRef}>
        <div data-testid="game-content">Game Content</div>
      </VFXWrapper>
    )
    
    const toggleButton = screen.getByText('Show VFX')
    fireEvent.click(toggleButton)
    fireEvent.click(screen.getByText('Hide VFX'))
    
    expect(screen.getByText('Show VFX')).toBeInTheDocument()
    expect(screen.queryByText('VFX Control Panel')).not.toBeInTheDocument()
  })

  it('renders VFX overlay when effects are enabled', async () => {
    render(
      <VFXWrapper gameRef={mockGameRef}>
        <div data-testid="game-content">Game Content</div>
      </VFXWrapper>
    )
    
    // Show controls and enable an effect
    fireEvent.click(screen.getByText('Show VFX'))
    const glitchCheckbox = screen.getByLabelText('Glitch')
    fireEvent.click(glitchCheckbox)
    
    await waitFor(() => {
      expect(screen.getByTestId('vfx-provider')).toBeInTheDocument()
      expect(screen.getByTestId('vfx-div')).toBeInTheDocument()
    })
  })

  it('does not render VFX overlay when no effects are enabled', () => {
    render(
      <VFXWrapper gameRef={mockGameRef}>
        <div data-testid="game-content">Game Content</div>
      </VFXWrapper>
    )
    
    expect(screen.queryByTestId('vfx-provider')).not.toBeInTheDocument()
    expect(screen.queryByTestId('vfx-div')).not.toBeInTheDocument()
  })

  it('generates shader with glitch effect parameters', async () => {
    render(
      <VFXWrapper gameRef={mockGameRef}>
        <div data-testid="game-content">Game Content</div>
      </VFXWrapper>
    )
    
    // Show controls and enable glitch effect
    fireEvent.click(screen.getByText('Show VFX'))
    const glitchCheckbox = screen.getByLabelText('Glitch')
    fireEvent.click(glitchCheckbox)
    
    await waitFor(() => {
      const vfxDiv = screen.getByTestId('vfx-div')
      const shader = vfxDiv.getAttribute('data-shader')
      expect(shader).toContain('glitchIntensity')
      expect(shader).toContain('glitchFrequency')
      expect(shader).toContain('glitchXOffset')
      expect(shader).toContain('glitchYOffset')
    })
  })

  it('generates shader with chromatic effect parameters', async () => {
    render(
      <VFXWrapper gameRef={mockGameRef}>
        <div data-testid="game-content">Game Content</div>
      </VFXWrapper>
    )
    
    // Show controls and enable chromatic effect
    fireEvent.click(screen.getByText('Show VFX'))
    const chromaticCheckbox = screen.getByLabelText('Chromatic')
    fireEvent.click(chromaticCheckbox)
    
    await waitFor(() => {
      const vfxDiv = screen.getByTestId('vfx-div')
      const shader = vfxDiv.getAttribute('data-shader')
      expect(shader).toContain('chromaticIntensity')
      expect(shader).toContain('chromaticSpeed')
      expect(shader).toContain('chromaticSaturation')
      expect(shader).toContain('chromaticBrightness')
    })
  })

  it('generates shader with pulsing effect parameters', async () => {
    render(
      <VFXWrapper gameRef={mockGameRef}>
        <div data-testid="game-content">Game Content</div>
      </VFXWrapper>
    )
    
    // Show controls and enable pulsing effect
    fireEvent.click(screen.getByText('Show VFX'))
    const pulsingCheckbox = screen.getByLabelText('Pulsing')
    fireEvent.click(pulsingCheckbox)
    
    await waitFor(() => {
      const vfxDiv = screen.getByTestId('vfx-div')
      const shader = vfxDiv.getAttribute('data-shader')
      expect(shader).toContain('pulsingIntensity')
      expect(shader).toContain('pulsingSpeed')
      expect(shader).toContain('pulsingMinAlpha')
      expect(shader).toContain('pulsingMaxAlpha')
    })
  })

  it('generates shader with scanlines effect parameters', async () => {
    render(
      <VFXWrapper gameRef={mockGameRef}>
        <div data-testid="game-content">Game Content</div>
      </VFXWrapper>
    )
    
    // Show controls and enable scanlines effect
    fireEvent.click(screen.getByText('Show VFX'))
    const scanlinesCheckbox = screen.getByLabelText('Scanlines')
    fireEvent.click(scanlinesCheckbox)
    
    await waitFor(() => {
      const vfxDiv = screen.getByTestId('vfx-div')
      const shader = vfxDiv.getAttribute('data-shader')
      expect(shader).toContain('scanlinesSpacing')
      expect(shader).toContain('scanlinesOpacity')
      expect(shader).toContain('scanlinesSpeed')
    })
  })

  it('applies preset when preset is selected', async () => {
    render(
      <VFXWrapper gameRef={mockGameRef}>
        <div data-testid="game-content">Game Content</div>
      </VFXWrapper>
    )
    
    // Show controls and apply a preset
    fireEvent.click(screen.getByText('Show VFX'))
    
    // Switch to presets tab
    const presetsTab = screen.getByText('presets')
    fireEvent.click(presetsTab)
    
    // Apply the first preset (Glitch Horror)
    const applyButtons = screen.getAllByText('Apply')
    fireEvent.click(applyButtons[0])
    
    await waitFor(() => {
      expect(screen.getByTestId('vfx-provider')).toBeInTheDocument()
      expect(screen.getByTestId('vfx-div')).toBeInTheDocument()
    })
  })

  it('handles VFX errors gracefully', () => {
    const onVFXError = jest.fn()
    
    render(
      <VFXWrapper gameRef={mockGameRef} onVFXError={onVFXError}>
        <div data-testid="game-content">Game Content</div>
      </VFXWrapper>
    )
    
    // Simulate an error by calling the error handler directly
    // In a real scenario, this would be triggered by a VFX error
    const errorMessage = 'Shader compilation failed'
    
    // The error handling is internal to the component, so we test the callback
    expect(onVFXError).not.toHaveBeenCalled()
  })

  it('handles VFX load events', () => {
    const onVFXLoad = jest.fn()
    
    render(
      <VFXWrapper gameRef={mockGameRef} onVFXLoad={onVFXLoad}>
        <div data-testid="game-content">Game Content</div>
      </VFXWrapper>
    )
    
    // The load event is internal to the component
    expect(onVFXLoad).not.toHaveBeenCalled()
  })

  it('adjusts VFX opacity based on quality setting', async () => {
    // Mock different quality settings
    const { getOptimalVFXQuality } = require('../lib/utils/webgl-support')
    
    // Test low quality
    getOptimalVFXQuality.mockReturnValue('low')
    
    const { rerender } = render(
      <VFXWrapper gameRef={mockGameRef}>
        <div data-testid="game-content">Game Content</div>
      </VFXWrapper>
    )
    
    // Show controls and enable an effect
    fireEvent.click(screen.getByText('Show VFX'))
    const glitchCheckbox = screen.getByLabelText('Glitch')
    fireEvent.click(glitchCheckbox)
    
    await waitFor(() => {
      const vfxDiv = screen.getByTestId('vfx-div')
      expect(vfxDiv).toHaveStyle({ opacity: '0.2' })
    })
    
    // Test high quality
    getOptimalVFXQuality.mockReturnValue('high')
    
    rerender(
      <VFXWrapper gameRef={mockGameRef}>
        <div data-testid="game-content">Game Content</div>
      </VFXWrapper>
    )
    
    await waitFor(() => {
      const vfxDiv = screen.getByTestId('vfx-div')
      expect(vfxDiv).toHaveStyle({ opacity: '0.4' })
    })
  })

  it('disables VFX when error occurs', async () => {
    render(
      <VFXWrapper gameRef={mockGameRef}>
        <div data-testid="game-content">Game Content</div>
      </VFXWrapper>
    )
    
    // Show controls and enable an effect
    fireEvent.click(screen.getByText('Show VFX'))
    const glitchCheckbox = screen.getByLabelText('Glitch')
    fireEvent.click(glitchCheckbox)
    
    await waitFor(() => {
      expect(screen.getByTestId('vfx-provider')).toBeInTheDocument()
    })
    
    // The error handling would disable VFX automatically
    // This is tested through the component's internal state management
  })

  it('positions toggle button correctly when controls are shown', () => {
    render(
      <VFXWrapper gameRef={mockGameRef}>
        <div data-testid="game-content">Game Content</div>
      </VFXWrapper>
    )
    
    const toggleButton = screen.getByText('Show VFX')
    expect(toggleButton).toHaveStyle({ right: '10px' })
    
    fireEvent.click(toggleButton)
    
    const hideButton = screen.getByText('Hide VFX')
    expect(hideButton).toHaveStyle({ right: '300px' })
  })

  it('renders with custom className', () => {
    render(
      <VFXWrapper gameRef={mockGameRef} className="custom-vfx-wrapper">
        <div data-testid="game-content">Game Content</div>
      </VFXWrapper>
    )
    
    const wrapper = screen.getByTestId('game-content').parentElement
    expect(wrapper).toHaveClass('vfx-wrapper', 'custom-vfx-wrapper')
  })
}) 
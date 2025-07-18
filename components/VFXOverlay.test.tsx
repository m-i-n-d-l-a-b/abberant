import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import VFXOverlay from './VFXOverlay'

describe('VFXOverlay', () => {
  it('renders nothing when isActive is false', () => {
    render(
      <VFXOverlay 
        isActive={false} 
        effectType="glitch" 
        intensity={1.0} 
      />
    )
    
    expect(screen.queryByTestId('vfx-div')).not.toBeInTheDocument()
  })

  it('renders VFX overlay when isActive is true', () => {
    render(
      <VFXOverlay 
        isActive={true} 
        effectType="glitch" 
        intensity={1.0} 
      />
    )
    
    const vfxDiv = screen.getByTestId('vfx-div')
    expect(vfxDiv).toBeInTheDocument()
    expect(vfxDiv).toHaveStyle({
      width: '100%',
      height: '100%',
      opacity: '0.3'
    })
  })

  it('applies glitch shader when effectType is glitch', () => {
    render(
      <VFXOverlay 
        isActive={true} 
        effectType="glitch" 
        intensity={1.0} 
      />
    )
    
    const vfxDiv = screen.getByTestId('vfx-div')
    expect(vfxDiv).toHaveAttribute('data-shader')
    expect(vfxDiv.getAttribute('data-shader')).toContain('glitch')
  })

  it('applies chromatic shader when effectType is chromatic', () => {
    render(
      <VFXOverlay 
        isActive={true} 
        effectType="chromatic" 
        intensity={1.0} 
      />
    )
    
    const vfxDiv = screen.getByTestId('vfx-div')
    expect(vfxDiv.getAttribute('data-shader')).toContain('chromatic')
  })

  it('applies scanlines shader when effectType is scanlines', () => {
    render(
      <VFXOverlay 
        isActive={true} 
        effectType="scanlines" 
        intensity={1.0} 
      />
    )
    
    const vfxDiv = screen.getByTestId('vfx-div')
    expect(vfxDiv.getAttribute('data-shader')).toContain('scanlines')
  })

  it('applies pulse shader when effectType is pulse', () => {
    render(
      <VFXOverlay 
        isActive={true} 
        effectType="pulse" 
        intensity={1.0} 
      />
    )
    
    const vfxDiv = screen.getByTestId('vfx-div')
    expect(vfxDiv.getAttribute('data-shader')).toContain('pulse')
  })

  it('uses default intensity of 1.0 when not provided', () => {
    render(
      <VFXOverlay 
        isActive={true} 
        effectType="glitch" 
      />
    )
    
    const vfxDiv = screen.getByTestId('vfx-div')
    expect(vfxDiv).toBeInTheDocument()
  })

  it('applies custom intensity value', () => {
    render(
      <VFXOverlay 
        isActive={true} 
        effectType="glitch" 
        intensity={2.0} 
      />
    )
    
    const vfxDiv = screen.getByTestId('vfx-div')
    expect(vfxDiv).toBeInTheDocument()
  })

  it('has correct positioning styles', () => {
    render(
      <VFXOverlay 
        isActive={true} 
        effectType="glitch" 
        intensity={1.0} 
      />
    )
    
    const container = screen.getByTestId('vfx-div').parentElement
    expect(container).toHaveStyle({
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: '1000'
    })
  })

  it('handles all effect types without errors', () => {
    const effectTypes = ['glitch', 'chromatic', 'scanlines', 'pulse'] as const
    
    effectTypes.forEach(effectType => {
      const { unmount } = render(
        <VFXOverlay 
          isActive={true} 
          effectType={effectType} 
          intensity={1.0} 
        />
      )
      
      const vfxDiv = screen.getByTestId('vfx-div')
      expect(vfxDiv).toBeInTheDocument()
      expect(vfxDiv).toHaveAttribute('data-shader')
      
      unmount()
    })
  })

  it('handles edge case intensity values', () => {
    const edgeCases = [0, 0.1, 5.0, 10.0]
    
    edgeCases.forEach(intensity => {
      const { unmount } = render(
        <VFXOverlay 
          isActive={true} 
          effectType="glitch" 
          intensity={intensity} 
        />
      )
      
      const vfxDiv = screen.getByTestId('vfx-div')
      expect(vfxDiv).toBeInTheDocument()
      
      unmount()
    })
  })
}) 
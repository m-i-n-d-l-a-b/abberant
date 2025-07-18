import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import VFXDemoPage from './page'

jest.mock('../../components/Game', () => () => <div data-testid="game">Game</div>)
jest.mock('../../components/GameWithVFX', () => () => <div data-testid="game-with-vfx">GameWithVFX</div>)
jest.mock('../../components/AdvancedVFXIntegration', () => () => <div data-testid="advanced-vfx">AdvancedVFXIntegration</div>)
jest.mock('../../components/SimpleVFXExample', () => () => <div data-testid="simple-vfx-example">SimpleVFXExample</div>)

describe('VFXDemoPage', () => {
  it('renders the main heading and navigation buttons', () => {
    render(<VFXDemoPage />)
    expect(screen.getByText('React-VFX Integration Demo')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Original Game' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Simple VFX Overlay' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Advanced Integration' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'VFX Examples' })).toBeInTheDocument()
  })

  it('shows the original game by default', () => {
    render(<VFXDemoPage />)
    expect(screen.getByTestId('game')).toBeInTheDocument()
    expect(screen.getByText('Original Game (Canvas-based effects)')).toBeInTheDocument()
  })

  it('switches to Simple VFX Overlay mode', () => {
    render(<VFXDemoPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Simple VFX Overlay' }))
    expect(screen.getByTestId('game-with-vfx')).toBeInTheDocument()
    expect(screen.getByText('Simple VFX Overlay (react-vfx on top)')).toBeInTheDocument()
  })

  it('switches to Advanced Integration mode', () => {
    render(<VFXDemoPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Advanced Integration' }))
    expect(screen.getByTestId('advanced-vfx')).toBeInTheDocument()
    expect(screen.getByText('Advanced Integration (syncs with Effects Lab)')).toBeInTheDocument()
  })

  it('switches to VFX Examples mode', () => {
    render(<VFXDemoPage />)
    fireEvent.click(screen.getByRole('button', { name: 'VFX Examples' }))
    expect(screen.getByTestId('simple-vfx-example')).toBeInTheDocument()
    expect(screen.getByText('React-VFX Examples')).toBeInTheDocument()
  })

  it('renders the integration comparison section', () => {
    render(<VFXDemoPage />)
    expect(screen.getByText('Integration Comparison')).toBeInTheDocument()
    expect(screen.getByText('Original Game', { selector: 'h4' })).toBeInTheDocument()
    expect(screen.getByText('Simple VFX Overlay', { selector: 'h4' })).toBeInTheDocument()
    expect(screen.getByText('Advanced Integration', { selector: 'h4' })).toBeInTheDocument()
    expect(screen.getByText('VFX Examples', { selector: 'h4' })).toBeInTheDocument()
  })

  it('renders the recommendation section', () => {
    render(<VFXDemoPage />)
    expect(screen.getByText('Recommendation')).toBeInTheDocument()
    expect(screen.getByText(/For your game, I recommend the/)).toBeInTheDocument()
    expect(screen.getByText(/You can use react-vfx for:/)).toBeInTheDocument()
  })
}) 
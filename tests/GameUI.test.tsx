/**
 * GameUI Component Tests
 * 
 * Tests for the GameUI component to ensure proper rendering and interaction handling.
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import GameUI, { GameUIProps } from '../components/GameUI'

describe('GameUI', () => {
  const defaultProps: GameUIProps = {
    lives: 3,
    score: 1500,
    level: 2,
    combo: 0,
    soundEnabled: true,
    onSoundToggle: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    test('should render all UI elements with correct values', () => {
      render(<GameUI {...defaultProps} />)

      // Check lives display
      expect(screen.getByText('LIVES')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()

      // Check score display
      expect(screen.getByText('SCORE')).toBeInTheDocument()
      expect(screen.getByText('1500')).toBeInTheDocument()

      // Check level display
      expect(screen.getByText('LEVEL')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()

      // Check combo display
      expect(screen.getByText('COMBO')).toBeInTheDocument()
      expect(screen.getByTestId('combo')).toHaveTextContent('0')

      // Check sound toggle
      expect(screen.getByText('🔊 SOUND: ON')).toBeInTheDocument()
    })

    test('should render sound toggle with correct state when disabled', () => {
      render(<GameUI {...defaultProps} soundEnabled={false} />)
      expect(screen.getByText('🔇 SOUND: OFF')).toBeInTheDocument()
    })

    test('should apply custom className when provided', () => {
      const { container } = render(<GameUI {...defaultProps} className="custom-class" />)
      const gameUI = container.querySelector('.game-ui')
      expect(gameUI).toHaveClass('custom-class')
    })
  })

  describe('Accessibility', () => {
    test('should have proper aria-label for sound toggle when enabled', () => {
      render(<GameUI {...defaultProps} soundEnabled={true} />)
      const soundToggle = screen.getByRole('button', { name: /disable sound/i })
      expect(soundToggle).toBeInTheDocument()
    })

    test('should have proper aria-label for sound toggle when disabled', () => {
      render(<GameUI {...defaultProps} soundEnabled={false} />)
      const soundToggle = screen.getByRole('button', { name: /enable sound/i })
      expect(soundToggle).toBeInTheDocument()
    })
  })

  describe('Interactions', () => {
    test('should call onSoundToggle when sound button is clicked', () => {
      const onSoundToggle = jest.fn()
      render(<GameUI {...defaultProps} onSoundToggle={onSoundToggle} />)

      const soundToggle = screen.getByRole('button', { name: /disable sound/i })
      fireEvent.click(soundToggle)

      expect(onSoundToggle).toHaveBeenCalledTimes(1)
    })

    test('should handle multiple sound toggle clicks', () => {
      const onSoundToggle = jest.fn()
      render(<GameUI {...defaultProps} onSoundToggle={onSoundToggle} />)

      const soundToggle = screen.getByRole('button', { name: /disable sound/i })
      fireEvent.click(soundToggle)
      fireEvent.click(soundToggle)

      expect(onSoundToggle).toHaveBeenCalledTimes(2)
    })
  })

  describe('DOM Structure', () => {
    test('should have correct element IDs', () => {
      render(<GameUI {...defaultProps} />)

      expect(screen.getByText('3')).toHaveAttribute('id', 'lives')
      expect(screen.getByText('1500')).toHaveAttribute('id', 'score')
      expect(screen.getByText('2')).toHaveAttribute('id', 'level')
      expect(screen.getByRole('button', { name: /disable sound/i })).toHaveAttribute('id', 'soundToggle')
    })

    test('should have correct CSS classes', () => {
      const { container } = render(<GameUI {...defaultProps} />)

      // Check main UI container
      const gameUI = container.querySelector('.game-ui')
      expect(gameUI).toBeInTheDocument()

      // Check UI items: lives, score, level, combo
      const uiItems = container.querySelectorAll('.ui-item')
      expect(uiItems).toHaveLength(4)

      // Check labels and values
      const labels = container.querySelectorAll('.ui-label')
      const values = container.querySelectorAll('.ui-value')
      expect(labels).toHaveLength(4)
      expect(values).toHaveLength(4)

      // Check sound toggle
      const soundToggle = container.querySelector('.sound-toggle')
      expect(soundToggle).toBeInTheDocument()
    })
  })

  describe('Props Validation', () => {
    test('should handle zero values correctly', () => {
      render(<GameUI {...defaultProps} lives={0} score={0} level={1} />)

      expect(screen.getByTestId('lives')).toHaveTextContent('0')
      expect(screen.getByTestId('score')).toHaveTextContent('0')
      expect(screen.getByTestId('level')).toHaveTextContent('1')
    })

    test('should handle large numbers correctly', () => {
      render(<GameUI {...defaultProps} lives={99} score={999999} level={100} />)

      expect(screen.getByText('99')).toBeInTheDocument()
      expect(screen.getByText('999999')).toBeInTheDocument()
      expect(screen.getByText('100')).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    // See the note in GameOverScreen.test.tsx: CSS Modules are stubbed by
    // identity-obj-proxy under jsdom, so the layout declarations in
    // styles/ui.module.css are not observable via getComputedStyle here.
    test('should apply CSS Module and global hook classes to the container', () => {
      const { container } = render(<GameUI {...defaultProps} />)

      const gameUI = container.querySelector('.game-ui')
      expect(gameUI).toBeInTheDocument()
      expect(gameUI?.className).toMatch(/gameUi/)
    })
  })
}) 
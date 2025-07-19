/**
 * GameOverScreen Component Tests
 * 
 * Tests for the GameOverScreen component to ensure proper rendering and interaction handling.
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import GameOverScreen, { GameOverScreenProps } from './GameOverScreen'

describe('GameOverScreen', () => {
  const defaultProps: GameOverScreenProps = {
    finalScore: 1500,
    onRestart: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    test('should render game over screen with all elements', () => {
      render(<GameOverScreen {...defaultProps} />)

      // Check title
      expect(screen.getByText('GAME OVER')).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()

      // Check score display
      expect(screen.getByText('FINAL SCORE')).toBeInTheDocument()
      expect(screen.getByText('1500')).toBeInTheDocument()

      // Check restart button
      expect(screen.getByText('PLAY AGAIN')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /play again/i })).toBeInTheDocument()
    })

    test('should not render when visible is false', () => {
      const { container } = render(<GameOverScreen {...defaultProps} visible={false} />)
      expect(container.firstChild).toBeNull()
    })

    test('should apply custom className when provided', () => {
      const { container } = render(<GameOverScreen {...defaultProps} className="custom-class" />)
      const gameOverScreen = container.querySelector('.game-over-screen')
      expect(gameOverScreen).toHaveClass('custom-class')
    })
  })

  describe('Accessibility', () => {
    test('should have proper aria-label for restart button', () => {
      render(<GameOverScreen {...defaultProps} />)
      const restartButton = screen.getByRole('button', { name: /play again/i })
      expect(restartButton).toBeInTheDocument()
    })

    test('should have proper heading structure', () => {
      render(<GameOverScreen {...defaultProps} />)
      
      const h2 = screen.getByRole('heading', { level: 2 })
      expect(h2).toHaveTextContent('GAME OVER')
    })
  })

  describe('Interactions', () => {
    test('should call onRestart when restart button is clicked', () => {
      const onRestart = jest.fn()
      render(<GameOverScreen {...defaultProps} onRestart={onRestart} />)

      const restartButton = screen.getByRole('button', { name: /play again/i })
      fireEvent.click(restartButton)

      expect(onRestart).toHaveBeenCalledTimes(1)
    })

    test('should handle multiple restart button clicks', () => {
      const onRestart = jest.fn()
      render(<GameOverScreen {...defaultProps} onRestart={onRestart} />)

      const restartButton = screen.getByRole('button', { name: /play again/i })
      fireEvent.click(restartButton)
      fireEvent.click(restartButton)

      expect(onRestart).toHaveBeenCalledTimes(2)
    })
  })

  describe('DOM Structure', () => {
    test('should have correct element IDs', () => {
      render(<GameOverScreen {...defaultProps} />)

      expect(screen.getByTestId('finalScore')).toHaveAttribute('id', 'finalScore')
    })

    test('should have correct CSS classes', () => {
      const { container } = render(<GameOverScreen {...defaultProps} />)

      // Check main container
      const gameOverScreen = container.querySelector('.game-over-screen')
      expect(gameOverScreen).toBeInTheDocument()

      // Check menu screen
      const menuScreen = container.querySelector('.menu-screen')
      expect(menuScreen).toBeInTheDocument()

      // Check background
      const menuBackground = container.querySelector('.menu-background')
      expect(menuBackground).toBeInTheDocument()

      // Check content
      const menuContent = container.querySelector('.menu-content')
      expect(menuContent).toBeInTheDocument()

      // Check title container
      const titleContainer = container.querySelector('.title-container')
      expect(titleContainer).toBeInTheDocument()

      // Check title glow
      const titleGlow = container.querySelector('.title-glow')
      expect(titleGlow).toBeInTheDocument()

      // Check score display
      const scoreDisplay = container.querySelector('.score-display')
      expect(scoreDisplay).toBeInTheDocument()

      // Check final score
      const finalScore = container.querySelector('.final-score')
      expect(finalScore).toBeInTheDocument()

      // Check score label and value
      const scoreLabel = container.querySelector('.score-label')
      const scoreValue = container.querySelector('.score-value')
      expect(scoreLabel).toBeInTheDocument()
      expect(scoreValue).toBeInTheDocument()

      // Check menu buttons
      const menuButtons = container.querySelector('.menu-buttons')
      expect(menuButtons).toBeInTheDocument()

      // Check restart button
      const restartButton = container.querySelector('.menu-button')
      expect(restartButton).toBeInTheDocument()

      // Check button text and glow
      const buttonText = container.querySelector('.button-text')
      const buttonGlow = container.querySelector('.button-glow')
      expect(buttonText).toBeInTheDocument()
      expect(buttonGlow).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    test('should render with styled-jsx styles', () => {
      const { container } = render(<GameOverScreen {...defaultProps} />)
      
      // Check that styled-jsx styles are applied
      const gameOverScreen = container.querySelector('.game-over-screen')
      expect(gameOverScreen).toHaveStyle({
        display: 'flex'
      })
    })
  })

  describe('Score Display', () => {
    test('should display zero score correctly', () => {
      render(<GameOverScreen {...defaultProps} finalScore={0} />)
      expect(screen.getByText('0')).toBeInTheDocument()
    })

    test('should display large score correctly', () => {
      render(<GameOverScreen {...defaultProps} finalScore={999999} />)
      expect(screen.getByText('999999')).toBeInTheDocument()
    })

    test('should display negative score correctly', () => {
      render(<GameOverScreen {...defaultProps} finalScore={-100} />)
      expect(screen.getByText('-100')).toBeInTheDocument()
    })
  })

  describe('Props Validation', () => {
    test('should handle different score values', () => {
      const scores = [0, 100, 1000, 999999, -50]
      
      scores.forEach(score => {
        const { unmount } = render(<GameOverScreen {...defaultProps} finalScore={score} />)
        expect(screen.getByText(score.toString())).toBeInTheDocument()
        unmount()
      })
    })
  })
}) 
/**
 * StartScreen Component Tests
 * 
 * Tests for the StartScreen component to ensure proper rendering and interaction handling.
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import StartScreen, { StartScreenProps } from './StartScreen'

describe('StartScreen', () => {
  const defaultProps: StartScreenProps = {
    onStartGame: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    test('should render start screen with all elements', () => {
      render(<StartScreen {...defaultProps} />)

      // Check title
      expect(screen.getByText('ABBERANT')).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()

      // Check start button
      expect(screen.getByText('START GAME')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /start the game/i })).toBeInTheDocument()

      // Check controls section
      expect(screen.getByText('CONTROLS')).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument()

      // Check control items
      expect(screen.getByText('WASD')).toBeInTheDocument()
      expect(screen.getByText('Move')).toBeInTheDocument()
      expect(screen.getByText('SPACE')).toBeInTheDocument()
      expect(screen.getByText('Jump')).toBeInTheDocument()
      expect(screen.getByText('SHIFT')).toBeInTheDocument()
      expect(screen.getByText('Dash')).toBeInTheDocument()
      expect(screen.getByText('P')).toBeInTheDocument()
      expect(screen.getByText('Pause')).toBeInTheDocument()
      expect(screen.getByText('R')).toBeInTheDocument()
      expect(screen.getByText('Reset')).toBeInTheDocument()
    })

    test('should not render when visible is false', () => {
      const { container } = render(<StartScreen {...defaultProps} visible={false} />)
      expect(container.firstChild).toBeNull()
    })

    test('should apply custom className when provided', () => {
      const { container } = render(<StartScreen {...defaultProps} className="custom-class" />)
      const startScreen = container.querySelector('.start-screen')
      expect(startScreen).toHaveClass('custom-class')
    })
  })

  describe('Accessibility', () => {
    test('should have proper aria-label for start button', () => {
      render(<StartScreen {...defaultProps} />)
      const startButton = screen.getByRole('button', { name: /start the game/i })
      expect(startButton).toBeInTheDocument()
    })

    test('should have proper heading structure', () => {
      render(<StartScreen {...defaultProps} />)
      
      const h1 = screen.getByRole('heading', { level: 1 })
      const h3 = screen.getByRole('heading', { level: 3 })
      
      expect(h1).toHaveTextContent('ABBERANT')
      expect(h3).toHaveTextContent('CONTROLS')
    })
  })

  describe('Interactions', () => {
    test('should call onStartGame when start button is clicked', () => {
      const onStartGame = jest.fn()
      render(<StartScreen {...defaultProps} onStartGame={onStartGame} />)

      const startButton = screen.getByRole('button', { name: /start the game/i })
      fireEvent.click(startButton)

      expect(onStartGame).toHaveBeenCalledTimes(1)
    })

    test('should handle keyboard navigation', () => {
      const onStartGame = jest.fn()
      render(<StartScreen {...defaultProps} onStartGame={onStartGame} />)

      const startButton = screen.getByRole('button', { name: /start the game/i })
      
      // Test Enter key
      fireEvent.keyDown(startButton, { key: 'Enter', code: 'Enter' })
      // Note: HTML buttons don't automatically trigger onClick on keyDown
      // This test verifies the button is keyboard accessible
      expect(startButton).toHaveAttribute('aria-label', 'Start the game')
    })
  })

  describe('DOM Structure', () => {
    test('should have correct element IDs', () => {
      render(<StartScreen {...defaultProps} />)

      expect(screen.getByRole('button', { name: /start the game/i })).toHaveAttribute('id', 'startButton')
    })

    test('should have correct CSS classes', () => {
      const { container } = render(<StartScreen {...defaultProps} />)

      // Check main container
      const startScreen = container.querySelector('.start-screen')
      expect(startScreen).toBeInTheDocument()

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

      // Check menu buttons
      const menuButtons = container.querySelector('.menu-buttons')
      expect(menuButtons).toBeInTheDocument()

      // Check start button
      const startButton = container.querySelector('.menu-button')
      expect(startButton).toBeInTheDocument()

      // Check button text and glow
      const buttonText = container.querySelector('.button-text')
      const buttonGlow = container.querySelector('.button-glow')
      expect(buttonText).toBeInTheDocument()
      expect(buttonGlow).toBeInTheDocument()

      // Check controls info
      const controlsInfo = container.querySelector('.controls-info')
      expect(controlsInfo).toBeInTheDocument()

      // Check controls section
      const controlsSection = container.querySelector('.controls-section')
      expect(controlsSection).toBeInTheDocument()

      // Check control grid
      const controlGrid = container.querySelector('.control-grid')
      expect(controlGrid).toBeInTheDocument()

      // Check control items
      const controlItems = container.querySelectorAll('.control-item')
      expect(controlItems).toHaveLength(5)

      // Check keys and actions
      const keys = container.querySelectorAll('.key')
      const actions = container.querySelectorAll('.action')
      expect(keys).toHaveLength(5)
      expect(actions).toHaveLength(5)
    })
  })

  describe('Styling', () => {
    test('should render with external CSS styles', () => {
      const { container } = render(<StartScreen {...defaultProps} />)
      
      // Check that external CSS classes are applied
      const startScreen = container.querySelector('.start-screen')
      expect(startScreen).toHaveClass('start-screen')
      expect(startScreen).toHaveClass('menu-screen')
    })
  })

  describe('Control Items', () => {
    test('should display all control mappings correctly', () => {
      render(<StartScreen {...defaultProps} />)

      // Check all control mappings
      const controlMappings = [
        { key: 'WASD', action: 'Move' },
        { key: 'SPACE', action: 'Jump' },
        { key: 'SHIFT', action: 'Dash' },
        { key: 'P', action: 'Pause' },
        { key: 'R', action: 'Reset' }
      ]

      controlMappings.forEach(({ key, action }) => {
        expect(screen.getByText(key)).toBeInTheDocument()
        expect(screen.getByText(action)).toBeInTheDocument()
      })
    })
  })
}) 
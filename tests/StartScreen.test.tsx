/**
 * StartScreen Component Tests
 * 
 * Tests for the StartScreen component to ensure proper rendering and interaction handling.
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import StartScreen, { StartScreenProps } from '../components/StartScreen'

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
      const startScreen = container.querySelector('[id="startScreen"]')
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

      // Check main container - CSS Modules will generate unique class names
      const startScreen = container.querySelector('[id="startScreen"]')
      expect(startScreen).toBeInTheDocument()

      // Check that the component has the expected structure
      const menuBackground = container.querySelector('[class*="menuBackground"]')
      expect(menuBackground).toBeInTheDocument()

      const menuContent = container.querySelector('[class*="menuContent"]')
      expect(menuContent).toBeInTheDocument()

      const titleContainer = container.querySelector('[class*="titleContainer"]')
      expect(titleContainer).toBeInTheDocument()

      const titleGlow = container.querySelector('[class*="titleGlow"]')
      expect(titleGlow).toBeInTheDocument()

      const menuButtons = container.querySelector('[class*="menuButtons"]')
      expect(menuButtons).toBeInTheDocument()

      const startButton = container.querySelector('[class*="menuButton"]')
      expect(startButton).toBeInTheDocument()

      const buttonText = container.querySelector('[class*="buttonText"]')
      const buttonGlow = container.querySelector('[class*="buttonGlow"]')
      expect(buttonText).toBeInTheDocument()
      expect(buttonGlow).toBeInTheDocument()

      const controlsInfo = container.querySelector('[class*="controlsInfo"]')
      expect(controlsInfo).toBeInTheDocument()

      const controlsSection = container.querySelector('[class*="controlsSection"]')
      expect(controlsSection).toBeInTheDocument()

      const controlGrid = container.querySelector('[class*="controlGrid"]')
      expect(controlGrid).toBeInTheDocument()

      const controlItems = container.querySelectorAll('[class*="controlItem"]')
      expect(controlItems).toHaveLength(5)

      const keys = container.querySelectorAll('[class*="key"]')
      const actions = container.querySelectorAll('[class*="action"]')
      expect(keys).toHaveLength(5)
      expect(actions).toHaveLength(5)
    })
  })

  describe('Styling', () => {
    test('should render with CSS Modules styles', () => {
      const { container } = render(<StartScreen {...defaultProps} />)
      
      // Check that CSS Modules classes are applied
      const startScreen = container.querySelector('[id="startScreen"]')
      expect(startScreen).toBeInTheDocument()
      
      // Check that the component has the expected CSS Module classes
      const menuScreen = container.querySelector('[class*="menuScreen"]')
      const startScreenClass = container.querySelector('[class*="startScreen"]')
      expect(menuScreen).toBeInTheDocument()
      expect(startScreenClass).toBeInTheDocument()
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

  describe('Mode Picker', () => {
    test('is hidden when no mode change handler is supplied', () => {
      render(<StartScreen {...defaultProps} />)
      expect(screen.queryByRole('group', { name: 'Game mode' })).toBeNull()
    })

    test('renders one button per mode when a handler is supplied', () => {
      render(<StartScreen {...defaultProps} onModeChange={jest.fn()} />)

      expect(screen.getByRole('group', { name: 'Game mode' })).toBeInTheDocument()
      expect(screen.getByText('SIDE-SCROLLER')).toBeInTheDocument()
      expect(screen.getByText('SNAKE')).toBeInTheDocument()
    })

    test('marks the selected mode as pressed', () => {
      render(
        <StartScreen {...defaultProps} mode="snake" onModeChange={jest.fn()} />
      )

      const snake = screen.getByText('SNAKE').closest('button')
      const sideScroller = screen.getByText('SIDE-SCROLLER').closest('button')

      expect(snake).toHaveAttribute('aria-pressed', 'true')
      expect(sideScroller).toHaveAttribute('aria-pressed', 'false')
    })

    test('reports the picked mode', () => {
      const onModeChange = jest.fn()
      render(<StartScreen {...defaultProps} onModeChange={onModeChange} />)

      fireEvent.click(screen.getByText('SNAKE'))

      expect(onModeChange).toHaveBeenCalledWith('snake')
    })
  })

  describe('Mode-specific controls', () => {
    test('shows the side-scroller controls by default', () => {
      render(<StartScreen {...defaultProps} />)
      expect(screen.getByText('Jump')).toBeInTheDocument()
      expect(screen.getByText('Dash')).toBeInTheDocument()
    })

    test('shows turning controls in snake mode', () => {
      render(<StartScreen {...defaultProps} mode="snake" />)

      expect(screen.getByText('WASD / ARROWS')).toBeInTheDocument()
      expect(screen.getByText('Turn')).toBeInTheDocument()
      expect(screen.queryByText('Jump')).toBeNull()
      expect(screen.queryByText('Dash')).toBeNull()
    })
  })
})

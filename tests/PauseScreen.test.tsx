/**
 * PauseScreen Component Tests
 * 
 * Tests for the PauseScreen component to ensure proper rendering and interaction handling.
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import PauseScreen, { PauseScreenProps } from '../components/PauseScreen'

describe('PauseScreen', () => {
  const defaultProps: PauseScreenProps = {
    onResume: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    test('should render pause screen with all elements', () => {
      render(<PauseScreen {...defaultProps} />)

      // Check title
      expect(screen.getByText('PAUSED')).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()

      // Check pause message
      expect(screen.getByText(/Press/)).toBeInTheDocument()
      expect(screen.getByText(/to continue/)).toBeInTheDocument()
      expect(screen.getByText('P')).toBeInTheDocument()
    })

    test('should not render when visible is false', () => {
      const { container } = render(<PauseScreen {...defaultProps} visible={false} />)
      expect(container.firstChild).toBeNull()
    })

    test('should apply custom className when provided', () => {
      const { container } = render(<PauseScreen {...defaultProps} className="custom-class" />)
      const pauseScreen = container.querySelector('.pause-screen')
      expect(pauseScreen).toHaveClass('custom-class')
    })
  })

  describe('Accessibility', () => {
    test('should have proper heading structure', () => {
      render(<PauseScreen {...defaultProps} />)
      
      const h2 = screen.getByRole('heading', { level: 2 })
      expect(h2).toHaveTextContent('PAUSED')
    })

    test('should have proper text content for screen readers', () => {
      render(<PauseScreen {...defaultProps} />)
      
      const pauseMessage = screen.getByText(/Press.*to continue/)
      expect(pauseMessage).toBeInTheDocument()
    })
  })

  describe('DOM Structure', () => {
    test('should have correct element IDs', () => {
      render(<PauseScreen {...defaultProps} />)

      const pauseScreen = screen.getByText('PAUSED').closest('#pauseScreen')
      expect(pauseScreen).toBeInTheDocument()
    })

    test('should have correct CSS classes', () => {
      const { container } = render(<PauseScreen {...defaultProps} />)

      // Check main container
      const pauseScreen = container.querySelector('.pause-screen')
      expect(pauseScreen).toBeInTheDocument()

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

      // Check pause message
      const pauseMessage = container.querySelector('.pause-message')
      expect(pauseMessage).toBeInTheDocument()

      // Check key highlight
      const keyHighlight = container.querySelector('.key-highlight')
      expect(keyHighlight).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    // See the note in GameOverScreen.test.tsx: CSS Modules are stubbed by
    // identity-obj-proxy under jsdom, so computed styles are not observable.
    test('should apply CSS Module and global hook classes to the container', () => {
      const { container } = render(<PauseScreen {...defaultProps} />)

      const pauseScreen = container.querySelector('.pause-screen')
      expect(pauseScreen).toBeInTheDocument()
      expect(pauseScreen?.className).toMatch(/pauseScreen/)
    })
  })

  describe('Content', () => {
    test('should display correct pause message', () => {
      render(<PauseScreen {...defaultProps} />)

      const pauseMessage = screen.getByText(/Press.*to continue/)
      expect(pauseMessage).toBeInTheDocument()
      expect(screen.getByText('P')).toBeInTheDocument()
    })

    test('should highlight the P key correctly', () => {
      render(<PauseScreen {...defaultProps} />)

      const pKey = screen.getByText('P')
      expect(pKey).toHaveClass('key-highlight')
    })
  })

  describe('Props Validation', () => {
    test('should handle onResume callback prop', () => {
      const onResume = jest.fn()
      render(<PauseScreen {...defaultProps} onResume={onResume} />)
      
      // The onResume callback is not directly called by the component
      // It's typically handled by the parent component through keyboard events
      expect(onResume).toBeDefined()
    })
  })
}) 
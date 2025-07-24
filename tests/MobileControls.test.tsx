/**
 * MobileControls Tests
 * 
 * Tests for the MobileControls component to ensure proper rendering.
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import MobileControls from '../components/MobileControls'

describe('MobileControls', () => {
  test('should render mobile controls with all buttons', () => {
    render(<MobileControls />)
    
    // Check for dpad buttons
    expect(screen.getByText('↑')).toBeInTheDocument()
    expect(screen.getByText('↓')).toBeInTheDocument()
    expect(screen.getByText('←')).toBeInTheDocument()
    expect(screen.getByText('→')).toBeInTheDocument()
    
    // Check for action buttons
    expect(screen.getByText('JUMP')).toBeInTheDocument()
    expect(screen.getByText('DASH')).toBeInTheDocument()
    expect(screen.getByText('⏸')).toBeInTheDocument()
  })

  test('should have correct data attributes', () => {
    render(<MobileControls />)
    
    // Check dpad buttons have correct data-action attributes
    const upButton = screen.getByText('↑')
    const downButton = screen.getByText('↓')
    const leftButton = screen.getByText('←')
    const rightButton = screen.getByText('→')
    
    expect(upButton).toHaveAttribute('data-action', 'up')
    expect(downButton).toHaveAttribute('data-action', 'down')
    expect(leftButton).toHaveAttribute('data-action', 'left')
    expect(rightButton).toHaveAttribute('data-action', 'right')
    
    // Check action buttons have correct data-action attributes
    const jumpButton = screen.getByText('JUMP')
    const dashButton = screen.getByText('DASH')
    const pauseButton = screen.getByText('⏸')
    
    expect(jumpButton).toHaveAttribute('data-action', 'jump')
    expect(dashButton).toHaveAttribute('data-action', 'dash')
    expect(pauseButton).toHaveAttribute('data-action', 'pause')
  })

  test('should apply custom className', () => {
    const customClass = 'custom-mobile-controls'
    render(<MobileControls className={customClass} />)
    
    const container = screen.getByText('↑').closest('.mobile-controls')
    expect(container).toHaveClass(customClass)
  })

  test('should have correct structure', () => {
    render(<MobileControls />)
    
    // Check for main container
    const container = screen.getByText('↑').closest('#mobileControls')
    expect(container).toBeInTheDocument()
    
    // Check for dpad container
    const dpad = screen.getByText('↑').closest('.dpad')
    expect(dpad).toBeInTheDocument()
    
    // Check for action buttons container
    const actionButtons = screen.getByText('JUMP').closest('.action-buttons')
    expect(actionButtons).toBeInTheDocument()
  })
}) 
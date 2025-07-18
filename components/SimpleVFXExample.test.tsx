import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import SimpleVFXExample from './SimpleVFXExample'

describe('SimpleVFXExample', () => {
  it('renders the main heading and shader select', () => {
    render(<SimpleVFXExample />)
    expect(screen.getByText('React-VFX Examples')).toBeInTheDocument()
    expect(screen.getByText('Select Shader:')).toBeInTheDocument()
  })

  it('renders all demo sections', () => {
    render(<SimpleVFXExample />)
    expect(screen.getByText('Image with VFX')).toBeInTheDocument()
    expect(screen.getByText('Text with VFX')).toBeInTheDocument()
    expect(screen.getByText('Container with VFX')).toBeInTheDocument()
  })

  it('renders VFXImg, VFXSpan, and VFXDiv', () => {
    render(<SimpleVFXExample />)
    expect(screen.getByTestId('vfx-img')).toBeInTheDocument()
    expect(screen.getByTestId('vfx-span')).toBeInTheDocument()
    expect(screen.getByTestId('vfx-div')).toBeInTheDocument()
  })

  it('changes shader when select value changes', () => {
    render(<SimpleVFXExample />)
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'pixelate' } })
    expect(select).toHaveValue('pixelate')
    fireEvent.change(select, { target: { value: 'halftone' } })
    expect(select).toHaveValue('halftone')
    fireEvent.change(select, { target: { value: 'rainbow' } })
    expect(select).toHaveValue('rainbow')
    fireEvent.change(select, { target: { value: 'custom' } })
    expect(select).toHaveValue('custom')
  })

  it('applies selected shader to VFXImg, VFXSpan, and VFXDiv', () => {
    render(<SimpleVFXExample />)
    const select = screen.getByRole('combobox')
    const shaders = ['rgbShift', 'pixelate', 'halftone', 'rainbow', 'custom']
    shaders.forEach(shader => {
      fireEvent.change(select, { target: { value: shader } })
      expect(screen.getByTestId('vfx-img')).toHaveAttribute('data-shader')
      expect(screen.getByTestId('vfx-span')).toHaveAttribute('data-shader')
      expect(screen.getByTestId('vfx-div')).toHaveAttribute('data-shader')
    })
  })

  it('renders usage instructions', () => {
    render(<SimpleVFXExample />)
    expect(screen.getByText('How to Use react-vfx')).toBeInTheDocument()
    expect(screen.getByText(/VFXImg:/)).toBeInTheDocument()
    expect(screen.getByText(/VFXSpan:/)).toBeInTheDocument()
    expect(screen.getByText(/VFXDiv:/)).toBeInTheDocument()
    expect(screen.getByText(/Built-in shaders:/)).toBeInTheDocument()
    expect(screen.getByText(/Custom shaders:/)).toBeInTheDocument()
  })
}) 
import '@testing-library/jest-dom'

// Mock react-vfx for testing
jest.mock('react-vfx', () => ({
  VFXProvider: ({ children }) => children,
  VFXDiv: ({ children, style, shader, ...props }) => (
    <div data-testid="vfx-div" style={style} data-shader={shader} {...props}>
      {children}
    </div>
  ),
  VFXSpan: ({ children, style, shader, ...props }) => (
    <span data-testid="vfx-span" style={style} data-shader={shader} {...props}>
      {children}
    </span>
  ),
  VFXImg: ({ src, alt, style, shader, ...props }) => (
    <img 
      data-testid="vfx-img" 
      src={src} 
      alt={alt} 
      style={style} 
      data-shader={shader} 
      {...props} 
    />
  )
}))

// Mock WebGL context
Object.defineProperty(window, 'WebGLRenderingContext', {
  value: class MockWebGLRenderingContext {
    constructor() {
      this.canvas = document.createElement('canvas')
    }
  }
})

// Mock canvas getContext
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  canvas: document.createElement('canvas'),
  drawImage: jest.fn(),
  getImageData: jest.fn(() => ({ data: new Uint8ClampedArray(4) })),
  putImageData: jest.fn(),
  clearRect: jest.fn(),
  fillRect: jest.fn(),
  fillText: jest.fn(),
  measureText: jest.fn(() => ({ width: 0 })),
  setTransform: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  fill: jest.fn(),
  arc: jest.fn(),
  closePath: jest.fn(),
  strokeStyle: '',
  fillStyle: '',
  lineWidth: 1,
  font: '',
  textAlign: 'left',
  textBaseline: 'top'
}))

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(callback => setTimeout(callback, 16))
global.cancelAnimationFrame = jest.fn()

// Mock performance.now
global.performance = {
  now: jest.fn(() => Date.now())
} 
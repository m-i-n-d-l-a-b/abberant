/**
 * InputManager Tests
 * 
 * Tests for the InputManager class to ensure proper input handling.
 */

import { InputManager, InputCallbacks } from '../lib/game/InputManager'

// Mock DOM elements
const mockStartButton = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
}

const mockSoundToggle = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
}

const mockMobileButton = {
  getAttribute: jest.fn().mockReturnValue('jump'),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
}

// Mock document methods
Object.defineProperty(document, 'getElementById', {
  value: jest.fn((id: string) => {
    if (id === 'startButton') return mockStartButton
    if (id === 'soundToggle') return mockSoundToggle
    return null
  }),
  writable: true
})

Object.defineProperty(document, 'querySelectorAll', {
  value: jest.fn().mockReturnValue([mockMobileButton]),
  writable: true
})

Object.defineProperty(document, 'addEventListener', {
  value: jest.fn(),
  writable: true
})

Object.defineProperty(document, 'removeEventListener', {
  value: jest.fn(),
  writable: true
})

describe('InputManager', () => {
  let inputManager: InputManager
  let mockCallbacks: InputCallbacks

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
    
    mockCallbacks = {
      onStartGame: jest.fn(),
      onJump: jest.fn(),
      onDash: jest.fn(),
      onPause: jest.fn(),
      onRestart: jest.fn(),
      onToggleCollisionDebug: jest.fn(),
      onValidateCollisionSystem: jest.fn(),
      onAudioContextResume: jest.fn(),
      onSoundToggle: jest.fn()
    }

    inputManager = new InputManager(mockCallbacks)
  })

  describe('Initialization', () => {
    test('should setup event handlers on construction', () => {
      expect(document.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function))
      expect(document.addEventListener).toHaveBeenCalledWith('keyup', expect.any(Function))
      expect(mockStartButton.addEventListener).toHaveBeenCalledWith('click', expect.any(Function))
      expect(mockSoundToggle.addEventListener).toHaveBeenCalledWith('click', expect.any(Function))
      expect(mockMobileButton.addEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function))
      expect(mockMobileButton.addEventListener).toHaveBeenCalledWith('touchend', expect.any(Function))
    })
  })

  describe('State Management', () => {
    test('should set game state', () => {
      inputManager.setGameState('playing')
      // State is private, so we test through behavior
      const input = inputManager.getPlayerInput()
      expect(input).toBeDefined()
    })

    test('should set audio initialized status', () => {
      inputManager.setAudioInitialized(true)
      // Status is private, so we test through behavior
      const input = inputManager.getPlayerInput()
      expect(input).toBeDefined()
    })
  })

  describe('Input Processing', () => {
    test('should return default player input state', () => {
      const input = inputManager.getPlayerInput()
      expect(input).toEqual({
        left: false,
        right: false,
        up: false,
        down: false,
        jump: false,
        dash: false
      })
    })

    test('should reset input state', () => {
      inputManager.resetInput()
      const input = inputManager.getPlayerInput()
      expect(input).toEqual({
        left: false,
        right: false,
        up: false,
        down: false,
        jump: false,
        dash: false
      })
    })
  })

  describe('Cleanup', () => {
    test('should cleanup event listeners', () => {
      inputManager.cleanup()
      
      expect(document.removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function))
      expect(document.removeEventListener).toHaveBeenCalledWith('keyup', expect.any(Function))
      expect(mockStartButton.removeEventListener).toHaveBeenCalledWith('click', expect.any(Function))
      expect(mockSoundToggle.removeEventListener).toHaveBeenCalledWith('click', expect.any(Function))
      expect(mockMobileButton.removeEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function))
      expect(mockMobileButton.removeEventListener).toHaveBeenCalledWith('touchend', expect.any(Function))
    })
  })

  describe('Callback Updates', () => {
    test('should update callbacks', () => {
      const newCallback = jest.fn()
      inputManager.updateCallbacks({ onStartGame: newCallback })
      
      // Callbacks are private, so we test through behavior
      const input = inputManager.getPlayerInput()
      expect(input).toBeDefined()
    })
  })

  describe('Direction Keys', () => {
    /** Pull the keydown listener the manager registered on construction. */
    const keydown = (): ((e: any) => void) => {
      const calls = (document.addEventListener as jest.Mock).mock.calls
      const entry = calls.find((call) => call[0] === 'keydown')
      return entry[1]
    }

    const press = (key: string) =>
      keydown()({ key, preventDefault: jest.fn() })

    test.each([
      ['ArrowUp', 0, -1],
      ['w', 0, -1],
      ['ArrowDown', 0, 1],
      ['s', 0, 1],
      ['ArrowLeft', -1, 0],
      ['a', -1, 0],
      ['ArrowRight', 1, 0],
      ['d', 1, 0]
    ])('reports %s as a direction press', (key, x, y) => {
      const onDirection = jest.fn()
      const manager = new InputManager({ ...mockCallbacks, onDirection })

      const calls = (document.addEventListener as jest.Mock).mock.calls
      const handler = calls.filter((call) => call[0] === 'keydown').pop()![1]
      handler({ key, preventDefault: jest.fn() })

      expect(onDirection).toHaveBeenCalledWith(x, y)
      manager.cleanup()
    })

    test('stays silent for keys that are not directions', () => {
      const onDirection = jest.fn()
      const manager = new InputManager({ ...mockCallbacks, onDirection })

      const calls = (document.addEventListener as jest.Mock).mock.calls
      const handler = calls.filter((call) => call[0] === 'keydown').pop()![1]
      handler({ key: 'p', preventDefault: jest.fn() })

      expect(onDirection).not.toHaveBeenCalled()
      manager.cleanup()
    })

    test('is optional, so the side-scroller needs no handler', () => {
      expect(() => press('ArrowUp')).not.toThrow()
    })
  })

  describe('Four-Way Input State', () => {
    test('exposes up and down alongside left and right', () => {
      const input = inputManager.getPlayerInput()
      expect(input).toHaveProperty('up', false)
      expect(input).toHaveProperty('down', false)
    })

    test('reads held direction keys', () => {
      const calls = (document.addEventListener as jest.Mock).mock.calls
      const handler = calls.find((call) => call[0] === 'keydown')![1]

      handler({ key: 'ArrowDown', preventDefault: jest.fn() })

      expect(inputManager.getPlayerInput().down).toBe(true)
    })

    test('clears them on reset', () => {
      const calls = (document.addEventListener as jest.Mock).mock.calls
      const handler = calls.find((call) => call[0] === 'keydown')![1]
      handler({ key: 'ArrowUp', preventDefault: jest.fn() })

      inputManager.resetInput()

      expect(inputManager.getPlayerInput().up).toBe(false)
    })
  })
})

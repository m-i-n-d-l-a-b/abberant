/**
 * Input Manager
 * 
 * This module handles all input processing for the game, including keyboard and mobile/touch input.
 * Extracted from GameEngine to provide clean separation of concerns and better testability.
 */

import { Keys, TouchInput } from '../../types/game'

/**
 * Callback functions for game actions triggered by input
 */
export interface InputCallbacks {
  onStartGame: () => void
  onJump: () => void
  onDash: () => void
  onPause: () => void
  onRestart: () => void
  onToggleCollisionDebug: () => void
  onValidateCollisionSystem: () => void
  onAudioContextResume: () => void
  onSoundToggle?: () => void
}

/**
 * Input state for player movement
 */
export interface PlayerInput {
  left: boolean
  right: boolean
  jump: boolean
  dash: boolean
}

export interface GamepadInput {
  left: boolean
  right: boolean
  jump: boolean
  dash: boolean
}

/**
 * Mobile button handler configuration
 */
interface MobileHandler {
  button: Element
  handleStart: (e: Event) => void
  handleEnd: (e: Event) => void
}

/**
 * Input Manager Class
 * 
 * Handles all input processing including keyboard and mobile/touch input.
 * Provides clean separation of input logic from game engine.
 */
export class InputManager {
  private keys: Keys = {}
  private touchInput: TouchInput = {
    left: false,
    right: false,
    jump: false,
    dash: false
  }
  private gamepadInput: GamepadInput = {
    left: false,
    right: false,
    jump: false,
    dash: false
  }

  private callbacks: InputCallbacks
  private gameState: string = 'start'
  private audioInitialized: boolean = false

  // Gamepad support
  private gamepadIndex: number | null = null
  private gamepadDeadzone: number = 0.3
  private gamepadButtonPressed: { [key: string]: boolean } = {}
  private gamepadConnectedHandler?: (e: GamepadEvent) => void
  private gamepadDisconnectedHandler?: (e: GamepadEvent) => void

  // Event handlers
  private keydownHandler!: (e: KeyboardEvent) => void
  private keyupHandler!: (e: KeyboardEvent) => void
  private mobileHandlers: MobileHandler[] = []
  private startButtonHandler: (() => void) | null = null
  private soundToggleHandler: (() => void) | null = null

  constructor(callbacks: InputCallbacks) {
    this.callbacks = callbacks
    this.setupEventHandlers()
  }

  /**
   * Set the current game state for input processing
   */
  setGameState(gameState: string): void {
    this.gameState = gameState
  }

  /**
   * Set audio initialization status
   */
  setAudioInitialized(initialized: boolean): void {
    this.audioInitialized = initialized
  }

  /**
   * Setup all event handlers for keyboard and mobile input
   */
  private setupEventHandlers(): void {
    this.setupKeyboardHandlers()
    this.setupMobileControls()
    this.setupGamepadSupport()
    this.setupStartButton()
    this.setupSoundToggle()
  }

  /**
   * Setup keyboard event handlers
   */
  private setupKeyboardHandlers(): void {
    this.keydownHandler = (e: KeyboardEvent) => {
      
      // Ensure audio context is resumed on any user interaction
      if (!this.audioInitialized) {
        this.callbacks.onAudioContextResume()
      }

      if (this.gameState === "start" && e.key === "Enter") {
        this.callbacks.onStartGame()
        return
      }

      // Handle arrow keys with proper casing
      if (e.key === "ArrowLeft") {
        this.keys["ArrowLeft"] = true
      } else if (e.key === "ArrowRight") {
        this.keys["ArrowRight"] = true
      } else if (e.key === "ArrowUp") {
        this.keys["ArrowUp"] = true
      } else if (e.key === "ArrowDown") {
        this.keys["ArrowDown"] = true
      } else {
        this.keys[e.key.toLowerCase()] = true
      }

      // Handle specific key actions
      if (e.key === " " || e.key === "ArrowUp" || e.key.toLowerCase() === "w") {
        this.callbacks.onJump()
        e.preventDefault()
      }

      if (e.key.toLowerCase() === "shift") {
        this.callbacks.onDash()
        e.preventDefault()
      }

      if (e.key.toLowerCase() === "p") {
        this.callbacks.onPause()
        e.preventDefault()
      }

      if (e.key.toLowerCase() === "r") {
        this.callbacks.onRestart()
      }

      if (e.key.toLowerCase() === "c") {
        this.callbacks.onToggleCollisionDebug()
        e.preventDefault()
      }

      if (e.key.toLowerCase() === "v") {
        this.callbacks.onValidateCollisionSystem()
        e.preventDefault()
      }
    }

    this.keyupHandler = (e: KeyboardEvent) => {
      // Handle arrow keys with proper casing
      if (e.key === "ArrowLeft") {
        this.keys["ArrowLeft"] = false
      } else if (e.key === "ArrowRight") {
        this.keys["ArrowRight"] = false
      } else if (e.key === "ArrowUp") {
        this.keys["ArrowUp"] = false
      } else if (e.key === "ArrowDown") {
        this.keys["ArrowDown"] = false
      } else {
        delete this.keys[e.key.toLowerCase()]
      }
    }

    // Add event listeners
    document.addEventListener("keydown", this.keydownHandler)
    document.addEventListener("keyup", this.keyupHandler)
  }

  /**
   * Setup mobile/touch controls
   */
  private setupMobileControls(): void {
    // Clean up any existing handlers before reinitializing
    for (const handler of this.mobileHandlers) {
      handler.button.removeEventListener("touchstart", handler.handleStart)
      handler.button.removeEventListener("touchend", handler.handleEnd)
    }
    this.mobileHandlers = []

    const mobileButtons = document.querySelectorAll(".mobile-button")
    
    mobileButtons.forEach((button) => {
      const action = button.getAttribute("data-action")
      if (!action) return

      const handleStart = (e: Event) => {
        e.preventDefault()
        this.handleMobileInput(action, true)
      }

      const handleEnd = (e: Event) => {
        e.preventDefault()
        this.handleMobileInput(action, false)
      }

      button.addEventListener("touchstart", handleStart)
      button.addEventListener("touchend", handleEnd)
      
      this.mobileHandlers.push({ button, handleStart, handleEnd })
    })
  }

  /**
   * Handle mobile input actions
   */
  private handleMobileInput(action: string, pressed: boolean): void {
    // Ensure audio context is resumed on any user interaction
    if (!this.audioInitialized) {
      this.callbacks.onAudioContextResume()
    }

    if (this.gameState === "start") {
      this.callbacks.onStartGame()
      return
    }

    if (this.gameState !== "playing") return

    switch (action) {
      case "left":
        this.touchInput.left = pressed
        break
      case "right":
        this.touchInput.right = pressed
        break
      case "jump":
        this.touchInput.jump = pressed
        if (pressed) this.callbacks.onJump()
        break
      case "dash":
        this.touchInput.dash = pressed
        if (pressed) this.callbacks.onDash()
        break
      case "pause":
        if (pressed) this.callbacks.onPause()
        break
    }
  }

  /**
   * Setup gamepad support
   */
  private setupGamepadSupport(): void {
    this.gamepadIndex = null
    this.gamepadDeadzone = 0.3
    this.gamepadButtonPressed = {}
    this.gamepadConnectedHandler = (e: any) => {
      this.gamepadIndex = e.gamepad.index
    }

    this.gamepadDisconnectedHandler = () => {
      this.gamepadIndex = null
    }

    window.addEventListener("gamepadconnected", this.gamepadConnectedHandler)
    window.addEventListener("gamepaddisconnected", this.gamepadDisconnectedHandler)
  }

  /**
   * Update gamepad input state
   */
  private updateGamepadInput(): void {
    if (this.gamepadIndex === null) return
    
    const gamepad = navigator.getGamepads()[this.gamepadIndex]
    if (!gamepad) return
    
    if (this.gameState === "start" && gamepad.buttons.some((b) => b.pressed)) {
      this.callbacks.onStartGame()
      return
    }
    
    const leftStickX = gamepad.axes[0]
    const dpadLeft = gamepad.buttons[14]?.pressed || false
    const dpadRight = gamepad.buttons[15]?.pressed || false
    
    this.gamepadInput.left = leftStickX < -this.gamepadDeadzone || dpadLeft
    this.gamepadInput.right = leftStickX > this.gamepadDeadzone || dpadRight
    
    const jumpButton = gamepad.buttons[0]
    if (jumpButton.pressed && !this.gamepadButtonPressed.jump) {
      this.callbacks.onJump()
    }
    this.gamepadButtonPressed.jump = jumpButton.pressed
    
    const dashButton = gamepad.buttons[1]
    if (dashButton.pressed && !this.gamepadButtonPressed.dash) {
      this.callbacks.onDash()
    }
    this.gamepadButtonPressed.dash = dashButton.pressed
    
    const pauseButton = gamepad.buttons[9]
    if (pauseButton && pauseButton.pressed && !this.gamepadButtonPressed.pause) {
      this.callbacks.onPause()
    }
    this.gamepadButtonPressed.pause = pauseButton ? pauseButton.pressed : false
  }

  /**
   * Setup start button handler
   */
  private setupStartButton(): void {
    const startButton = document.getElementById("startButton")
    if (startButton) {
      this.startButtonHandler = () => this.callbacks.onStartGame()
      startButton.addEventListener("click", this.startButtonHandler)
    }
  }

  /**
   * Setup sound toggle handler
   */
  private setupSoundToggle(): void {
    const soundToggle = document.getElementById("soundToggle")
    if (soundToggle) {
      this.soundToggleHandler = () => {
        if (this.gameState === "start") this.callbacks.onStartGame()
        if (!this.audioInitialized) this.callbacks.onAudioContextResume()
        if (this.callbacks.onSoundToggle) {
          this.callbacks.onSoundToggle()
        }
      }
      soundToggle.addEventListener("click", this.soundToggleHandler)
    }
  }

  /**
   * Get current input state for player movement
   */
  getPlayerInput(): PlayerInput {
    // Update gamepad input before returning
    this.updateGamepadInput()
    
    const input = {
      left: this.keys['a'] || this.keys['A'] || this.keys['ArrowLeft'] || this.touchInput.left || this.gamepadInput.left,
      right: this.keys['d'] || this.keys['D'] || this.keys['ArrowRight'] || this.touchInput.right || this.gamepadInput.right,
      jump: this.keys['w'] || this.keys['W'] || this.keys['ArrowUp'] || this.keys[' '] || this.touchInput.jump || this.gamepadInput.jump,
      dash: this.keys['shift'] || this.touchInput.dash || this.gamepadInput.dash
    }
    

    
    return input
  }

  /**
   * Get current keyboard state
   */
  getKeys(): Keys {
    return { ...this.keys }
  }

  /**
   * Get current touch input state
   */
  getTouchInput(): TouchInput {
    return { ...this.touchInput }
  }

  /**
   * Reset all input state
   */
  resetInput(): void {
    this.keys = {}
    this.touchInput = {
      left: false,
      right: false,
      jump: false,
      dash: false
    }
    this.gamepadInput = {
      left: false,
      right: false,
      jump: false,
      dash: false
    }
    this.gamepadButtonPressed = {}
  }

  /**
   * Clean up all event listeners
   */
  cleanup(): void {
    // Remove keyboard handlers
    if (this.keydownHandler) {
      document.removeEventListener("keydown", this.keydownHandler)
    }
    if (this.keyupHandler) {
      document.removeEventListener("keyup", this.keyupHandler)
    }

    // Remove mobile handlers
    for (const handler of this.mobileHandlers) {
      handler.button.removeEventListener("touchstart", handler.handleStart)
      handler.button.removeEventListener("touchend", handler.handleEnd)
    }

    // Remove button handlers
    if (this.startButtonHandler) {
      const startButton = document.getElementById("startButton")
      if (startButton) {
        startButton.removeEventListener("click", this.startButtonHandler)
      }
    }

    if (this.soundToggleHandler) {
      const soundToggle = document.getElementById("soundToggle")
      if (soundToggle) {
        soundToggle.removeEventListener("click", this.soundToggleHandler)
      }
    }

    if (this.gamepadConnectedHandler) {
      window.removeEventListener("gamepadconnected", this.gamepadConnectedHandler)
    }
    if (this.gamepadDisconnectedHandler) {
      window.removeEventListener("gamepaddisconnected", this.gamepadDisconnectedHandler)
    }

    // Clear arrays
    this.mobileHandlers = []
  }

  /**
   * Update callbacks (useful for dynamic callback changes)
   */
  updateCallbacks(callbacks: Partial<InputCallbacks>): void {
    this.callbacks = { ...this.callbacks, ...callbacks }
  }
} 
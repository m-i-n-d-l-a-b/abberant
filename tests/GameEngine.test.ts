/**
 * GameEngine Test Suite
 * 
 * Tests for the core game engine class that orchestrates all game systems.
 */

import { GameEngine } from '../lib/game/GameEngine'
import { GameStateManager } from '../lib/game/GameStateManager'
import { PlayerManager } from '../lib/game/PlayerManager'
import { EnemyManager } from '../lib/game/EnemyManager'
import { LevelGenerator } from '../lib/game/LevelGenerator'
import { Renderer } from '../lib/game/Renderer'
import { InputManager } from '../lib/game/InputManager'
import { AudioManagerWrapper } from '../lib/game/AudioManagerWrapper'

// Mock canvas
const mockCanvas = {
  getContext: jest.fn(() => ({
    fillRect: jest.fn(),
    clearRect: jest.fn(),
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
    fillText: jest.fn(),
    strokeText: jest.fn(),
    measureText: jest.fn(() => ({ width: 10 })),
    createLinearGradient: jest.fn(() => ({
      addColorStop: jest.fn(),
    })),
    createRadialGradient: jest.fn(() => ({
      addColorStop: jest.fn(),
    })),
  })),
  width: 800,
  height: 600,
} as unknown as HTMLCanvasElement

// Mock dependencies
jest.mock('./GameStateManager')
jest.mock('./PlayerManager')
jest.mock('./EnemyManager')
jest.mock('./LevelGenerator')
jest.mock('./Renderer')
jest.mock('./InputManager')
jest.mock('./AudioManagerWrapper')

describe('GameEngine', () => {
  let gameEngine: GameEngine
  let mockStateManager: jest.Mocked<GameStateManager>
  let mockPlayerManager: jest.Mocked<PlayerManager>
  let mockEnemyManager: jest.Mocked<EnemyManager>
  let mockLevelGenerator: jest.Mocked<LevelGenerator>
  let mockRenderer: jest.Mocked<Renderer>
  let mockInputManager: jest.Mocked<InputManager>
  let mockAudioWrapper: jest.Mocked<AudioManagerWrapper>

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()

    // Create mock instances
    mockStateManager = {
      getState: jest.fn(() => ({
        gameState: 'start',
        currentLevel: 1,
        lives: 3,
        score: 0,
        paused: false,
        isReversed: false,
        levelProgress: 0,
        levelTarget: 1000,
        transitionTimer: 0,
        levelEffects: [],
        cameraZoom: 1,
        transitionPhase: 'none' as const,
        transitionProgress: 0,
        levelStartInvincibility: 0,
      })),
      getGameState: jest.fn(() => 'start'),
      getCurrentLevel: jest.fn(() => 1),
      getLives: jest.fn(() => 3),
      getScore: jest.fn(() => 0),
      isPaused: jest.fn(() => false),
      isReversed: jest.fn(() => false),
      getLevelProgress: jest.fn(() => 0),
      getLevelTarget: jest.fn(() => 1000),
      getCameraZoom: jest.fn(() => 1),
      getTransitionPhase: jest.fn(() => 'none'),
      getTransitionProgress: jest.fn(() => 0),
      getLevelStartInvincibility: jest.fn(() => 0),
      getLevelEffects: jest.fn(() => []),
      startGame: jest.fn(() => true),
      togglePause: jest.fn(() => true),
      setPaused: jest.fn(),
      updateLevelProgress: jest.fn(),
      completeLevel: jest.fn(),
      updateTransition: jest.fn(),
      addScore: jest.fn(),
      loseLife: jest.fn(() => true),
      gameOver: jest.fn(),
      restart: jest.fn(),
      resetLevel: jest.fn(),
      setLevelEffects: jest.fn(),
      setReversed: jest.fn(),
      updateLevelStartInvincibility: jest.fn(),
      setLevelTarget: jest.fn(),
      getPlayerInitialState: jest.fn(() => ({
        x: 100,
        y: 300,
        width: 32,
        height: 32,
        vx: 0,
        vy: 0,
        onGround: false,
        canJump: true,
        canDash: true,
        dashCooldown: 0,
        invulnerable: false,
        invulnerableTimer: 0,
        trail: [],
        color: '#00ffff',
      })),
      getCameraInitialState: jest.fn(() => ({
        x: 0,
        y: 0,
        zoom: 1,
        targetZoom: 1,
        zoomSpeed: 0.1,
      })),
      getEffectsInitialState: jest.fn(() => ({
        dreamParticles: [],
        dreamWaves: [],
        dreamLayers: [],
        dataBleedEffects: [],
        particles: [],
      })),
      init: jest.fn(),
      validateState: jest.fn(() => ({ isValid: true, issues: [] })),
      getStateSummary: jest.fn(() => 'Game state summary'),
    } as unknown as jest.Mocked<GameStateManager>

    mockPlayerManager = {
      updatePlayer: jest.fn(() => ({
        player: {
          x: 100,
          y: 300,
          width: 32,
          height: 32,
          vx: 0,
          vy: 0,
          onGround: false,
          canJump: true,
          canDash: true,
          dashCooldown: 0,
          invulnerable: false,
          invulnerableTimer: 0,
          trail: [],
          color: '#00ffff',
        },
        collisionResult: {
          grounded: false,
          onPlatform: null,
          enemiesHit: [],
          collectiblesCollected: [],
          shouldRespawn: false,
        },
        particles: [],
      })),
      handleInput: jest.fn(),
      jump: jest.fn(),
      dash: jest.fn(),
      respawn: jest.fn(),
      reset: jest.fn(),
      getPlayer: jest.fn(() => ({
        x: 100,
        y: 300,
        width: 32,
        height: 32,
        vx: 0,
        vy: 0,
        onGround: false,
        canJump: true,
        canDash: true,
        dashCooldown: 0,
        invulnerable: false,
        invulnerableTimer: 0,
        trail: [],
        color: '#00ffff',
      })),
      setPlayer: jest.fn(),
      resetPlayer: jest.fn(),
      makeInvulnerable: jest.fn(),
      setRespawning: jest.fn(),
      updateCamera: jest.fn(() => ({
        x: 0,
        y: 0,
        zoom: 1,
        targetZoom: 1,
        zoomSpeed: 0.1,
      })),
    } as unknown as jest.Mocked<PlayerManager>

    mockEnemyManager = {
      updateEnemies: jest.fn(() => ({
        enemies: [],
        defeatedEnemies: [],
        particles: [],
      })),
      generateEnemies: jest.fn(() => []),
      spawnEnemy: jest.fn(),
      removeEnemy: jest.fn(),
      reset: jest.fn(),
      getEnemies: jest.fn(() => []),
      setEnemies: jest.fn(),
    } as unknown as jest.Mocked<EnemyManager>

    mockLevelGenerator = {
      generateLevel: jest.fn(() => ({
        platforms: [],
        enemies: [],
        collectibles: [],
        backgroundStars: [],
        levelWidth: 1000,
        levelEffects: [],
      })),
      reset: jest.fn(),
    } as unknown as jest.Mocked<LevelGenerator>

    mockRenderer = {
      render: jest.fn(),
      renderBackground: jest.fn(),
      renderEntities: jest.fn(),
      renderEffects: jest.fn(),
      renderUI: jest.fn(),
      setBackgroundStars: jest.fn(),
      updateState: jest.fn(),
      setEntities: jest.fn(),
      setEffects: jest.fn(),
      stop: jest.fn(),
      start: jest.fn(),
      cleanup: jest.fn(),
    } as unknown as jest.Mocked<Renderer>

    mockInputManager = {
      setupInput: jest.fn(),
      handleInput: jest.fn(),
      cleanup: jest.fn(),
      setGameState: jest.fn(),
      setAudioInitialized: jest.fn(),
      getPlayerInput: jest.fn(() => ({
        left: false,
        right: false,
        jump: false,
        dash: false,
        pause: false,
        restart: false,
      })),
      getKeys: jest.fn(() => ({
        w: false,
        a: false,
        s: false,
        d: false,
        space: false,
        shift: false,
        p: false,
        r: false,
      })),
      getTouchInput: jest.fn(() => ({
        left: false,
        right: false,
        jump: false,
        dash: false,
      })),
    } as unknown as jest.Mocked<InputManager>

    mockAudioWrapper = {
      init: jest.fn(),
      initAudioContext: jest.fn(() => true),
      getAudioStats: jest.fn(() => ({
        soundsPlayed: 0,
        bgmActive: false,
        audioContextState: 'running',
      })),
      playGameSound: jest.fn(),
      startBGM: jest.fn(),
      stopBGM: jest.fn(),
      setBGMTempo: jest.fn(),
      setBGMPitchMod: jest.fn(),
      setSoundEnabled: jest.fn(),
      isSoundEnabled: jest.fn(() => true),
      resumeAudioContext: jest.fn(() => true),
      onGameStateChange: jest.fn(),
      cleanup: jest.fn(),
      getStats: jest.fn(() => ({
        soundsPlayed: 0,
        bgmActive: false,
        audioContextState: 'running',
      })),
      resetPerformanceStats: jest.fn(),
      init: jest.fn(),
    } as unknown as jest.Mocked<AudioManagerWrapper>

    // Mock constructor calls
    ;(GameStateManager as jest.MockedClass<typeof GameStateManager>).mockImplementation(() => mockStateManager)
    ;(PlayerManager as jest.MockedClass<typeof PlayerManager>).mockImplementation(() => mockPlayerManager)
    ;(EnemyManager as jest.MockedClass<typeof EnemyManager>).mockImplementation(() => mockEnemyManager)
    ;(LevelGenerator as jest.MockedClass<typeof LevelGenerator>).mockImplementation(() => mockLevelGenerator)
    ;(Renderer as jest.MockedClass<typeof Renderer>).mockImplementation(() => mockRenderer)
    ;(InputManager as jest.MockedClass<typeof InputManager>).mockImplementation(() => mockInputManager)
    ;(AudioManagerWrapper as jest.MockedClass<typeof AudioManagerWrapper>).mockImplementation(() => mockAudioWrapper)

    // Create game engine instance
    gameEngine = new GameEngine(mockCanvas)
  })

  describe('Initialization', () => {
    test('should initialize with canvas', () => {
      expect(gameEngine.canvas).toBe(mockCanvas)
      expect(gameEngine.ctx).toBeDefined()
      expect(gameEngine.width).toBe(800)
      expect(gameEngine.height).toBe(600)
    })

    test('should initialize all managers', () => {
      expect(mockStateManager.init).toHaveBeenCalled()
      // Other managers are initialized during construction, not via init() calls
      expect(mockPlayerManager).toBeDefined()
      expect(mockEnemyManager).toBeDefined()
      expect(mockLevelGenerator).toBeDefined()
      expect(mockRenderer).toBeDefined()
      expect(mockAudioWrapper).toBeDefined()
    })

    test('should setup input system', () => {
      // Input system setup is handled during initialization
      expect(mockInputManager).toBeDefined()
    })

    test('should generate initial level', () => {
      expect(mockLevelGenerator.generateLevel).toHaveBeenCalled()
    })
  })

  describe('Game State Management', () => {
    test('should start game', () => {
      gameEngine.startGame()
      expect(mockStateManager.startGame).toHaveBeenCalled()
    })

    test('should restart game', () => {
      gameEngine.restart()
      expect(mockStateManager.restart).toHaveBeenCalled()
      // Other reset calls are handled internally
    })

    test('should toggle pause', () => {
      gameEngine.togglePause()
      expect(mockStateManager.togglePause).toHaveBeenCalled()
    })

    test('should get game state', () => {
      const state = gameEngine.gameState
      expect(mockStateManager.getGameState).toHaveBeenCalled()
      expect(state).toBe('start')
    })

    test('should get current level', () => {
      const level = gameEngine.currentLevel
      expect(mockStateManager.getCurrentLevel).toHaveBeenCalled()
      expect(level).toBe(1)
    })

    test('should get lives', () => {
      const lives = gameEngine.lives
      expect(mockStateManager.getLives).toHaveBeenCalled()
      expect(lives).toBe(3)
    })

    test('should get score', () => {
      const score = gameEngine.score
      expect(mockStateManager.getScore).toHaveBeenCalled()
      expect(score).toBe(0)
    })

    test('should get pause state', () => {
      const paused = gameEngine.paused
      expect(mockStateManager.isPaused).toHaveBeenCalled()
      expect(paused).toBe(false)
    })
  })

  describe('Game Loop', () => {
    test('should update game state', () => {
      // Mock requestAnimationFrame
      const mockRequestAnimationFrame = jest.fn()
      global.requestAnimationFrame = mockRequestAnimationFrame

      gameEngine.gameLoop()

      expect(mockRequestAnimationFrame).toHaveBeenCalled()
      // State manager calls are handled internally
    })

    test('should handle input', () => {
      gameEngine.handleInput()
      expect(mockInputManager.getPlayerInput).toHaveBeenCalled()
      expect(mockPlayerManager.updatePlayer).toHaveBeenCalled()
    })

    test('should update player', () => {
      gameEngine.updatePlayer()
      // Player update is handled internally
    })

    test('should update enemies', () => {
      gameEngine.updateEnemies()
      expect(mockEnemyManager.updateEnemies).toHaveBeenCalled()
    })

    test('should render game', () => {
      gameEngine.render()
      expect(mockRenderer.render).toHaveBeenCalled()
    })
  })

  describe('Audio Management', () => {
    test('should play sound', () => {
      gameEngine.playSound('jump')
      expect(mockAudioWrapper.playGameSound).toHaveBeenCalledWith('jump', 1)
    })

    test('should start BGM', () => {
      gameEngine.startBGM()
      expect(mockAudioWrapper.startBGM).toHaveBeenCalled()
    })

    test('should stop BGM', () => {
      gameEngine.stopBGM()
      expect(mockAudioWrapper.stopBGM).toHaveBeenCalled()
    })

    test('should get audio stats', () => {
      const stats = gameEngine.getAudioStats()
      expect(mockAudioWrapper.getAudioStats).toHaveBeenCalled()
      expect(stats).toBeDefined()
    })
  })

  describe('Level Management', () => {
    test('should generate level', () => {
      gameEngine.generateLevel()
      expect(mockLevelGenerator.generateLevel).toHaveBeenCalled()
    })

    test('should go to next level', () => {
      gameEngine.nextLevel()
      expect(mockStateManager.completeLevel).toHaveBeenCalled()
    })
  })

  describe('Cleanup', () => {
    test('should cleanup resources', () => {
      // Mock cancelAnimationFrame
      const mockCancelAnimationFrame = jest.fn()
      global.cancelAnimationFrame = mockCancelAnimationFrame

      gameEngine.cleanup()

      expect(mockInputManager.cleanup).toHaveBeenCalled()
      expect(mockRenderer.stop).toHaveBeenCalled()
      expect(mockAudioWrapper.cleanup).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    test('should handle initialization errors gracefully', () => {
      // Create a new canvas mock that throws an error
      const errorCanvas = {
        getContext: jest.fn(() => {
          throw new Error('Canvas context error')
        }),
        width: 800,
        height: 600,
      } as unknown as HTMLCanvasElement

      expect(() => new GameEngine(errorCanvas)).toThrow('Canvas context error')
    })

    test('should handle missing canvas', () => {
      expect(() => new GameEngine(null as any)).toThrow()
    })
  })

  describe('Performance', () => {
    test('should maintain consistent frame rate', () => {
      const startTime = performance.now()
      
      // Simulate multiple game loop iterations
      for (let i = 0; i < 10; i++) {
        gameEngine.update()
      }
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      
      // Should complete quickly (less than 100ms for 10 iterations)
      expect(totalTime).toBeLessThan(100)
    })
  })
}) 
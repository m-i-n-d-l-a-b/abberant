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
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants/game'
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
    closePath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    fill: jest.fn(),
    arc: jest.fn(),
    rect: jest.fn(),
    strokeRect: jest.fn(),
    clip: jest.fn(),
    drawImage: jest.fn(),
    setLineDash: jest.fn(),
    transform: jest.fn(),
    resetTransform: jest.fn(),
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
jest.mock('../lib/game/GameStateManager')
jest.mock('../lib/game/PlayerManager')
jest.mock('../lib/game/EnemyManager')
jest.mock('../lib/game/LevelGenerator')
jest.mock('../lib/game/Renderer')
jest.mock('../lib/game/InputManager')
jest.mock('../lib/game/AudioManagerWrapper')

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
      expect(gameEngine.width).toBe(CANVAS_WIDTH)
      expect(gameEngine.height).toBe(CANVAS_HEIGHT)
    })

    test('should construct all managers', () => {
      // GameEngine constructs these, but does not currently drive them: the
      // game loop runs its own inline update/render/audio implementations.
      // These assertions cover what actually happens today. If the managers
      // are ever wired into the loop, the "does not delegate" assertions
      // further down will fail and should be updated together with these.
      expect(GameStateManager).toHaveBeenCalled()
      expect(PlayerManager).toHaveBeenCalled()
      expect(EnemyManager).toHaveBeenCalled()
      expect(LevelGenerator).toHaveBeenCalled()
      expect(Renderer).toHaveBeenCalled()

      // AudioManagerWrapper is not even constructed: GameEngine builds an
      // AudioManager directly and then drives a raw AudioContext instead.
      expect(AudioManagerWrapper).not.toHaveBeenCalled()
    })

    test('should setup input system', () => {
      // Input system setup is handled during initialization
      expect(mockInputManager).toBeDefined()
    })

    test('should generate an initial level during construction', () => {
      // Built by GameEngine.generateLevel(), not by the LevelGenerator instance.
      expect(gameEngine.platforms.length).toBeGreaterThan(0)
      expect(gameEngine.levelTarget).toBeGreaterThan(0)
      expect(mockLevelGenerator.generateLevel).not.toHaveBeenCalled()
    })
  })

  describe('Game State Management', () => {
    // State lives on GameEngine itself; the GameStateManager instance is not
    // consulted for any of it.
    test('should start game', () => {
      gameEngine.startGame()
      expect(gameEngine.gameState).toBe('playing')
      expect(mockStateManager.startGame).not.toHaveBeenCalled()
    })

    test('should restart game', () => {
      gameEngine.lives = 1
      gameEngine.score = 500

      gameEngine.restart()

      expect(gameEngine.gameState).toBe('playing')
      expect(gameEngine.lives).toBe(3)
      expect(gameEngine.score).toBe(0)
    })

    test('should toggle pause while playing', () => {
      gameEngine.startGame()

      gameEngine.togglePause()
      expect(gameEngine.paused).toBe(true)

      gameEngine.togglePause()
      expect(gameEngine.paused).toBe(false)
    })

    test('should ignore pause outside of play', () => {
      // togglePause() no-ops unless the game is playing or already paused.
      expect(gameEngine.gameState).toBe('start')

      gameEngine.togglePause()

      expect(gameEngine.paused).toBe(false)
    })

    test('should start in the "start" state', () => {
      expect(gameEngine.gameState).toBe('start')
    })

    test('should start on level 1 with full lives and no score', () => {
      expect(gameEngine.currentLevel).toBe(1)
      expect(gameEngine.lives).toBe(3)
      expect(gameEngine.score).toBe(0)
    })

    test('should start unpaused', () => {
      expect(gameEngine.paused).toBe(false)
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

    test('should read input through the InputManager', () => {
      // InputManager is the one collaborator the loop genuinely uses.
      gameEngine.handleInput()
      expect(mockInputManager.getPlayerInput).toHaveBeenCalled()
    })

    test('should update the player inline rather than via PlayerManager', () => {
      expect(() => gameEngine.updatePlayer()).not.toThrow()
      expect(mockPlayerManager.updatePlayer).not.toHaveBeenCalled()
    })

    test('should update enemies inline rather than via EnemyManager', () => {
      expect(() => gameEngine.updateEnemies()).not.toThrow()
      expect(Array.isArray(gameEngine.enemies)).toBe(true)
      expect(mockEnemyManager.updateEnemies).not.toHaveBeenCalled()
    })

    test('should render to its own context rather than via Renderer', () => {
      expect(() => gameEngine.render()).not.toThrow()
      expect(mockRenderer.render).not.toHaveBeenCalled()
    })
  })

  describe('Audio Management', () => {
    // Audio is driven by a raw AudioContext on GameEngine; the
    // AudioManagerWrapper instance is constructed but never called.
    // GameEngine also exposes no getAudioStats(), so there is nothing to
    // assert about wrapper statistics.
    test('should play a sound without delegating to AudioManagerWrapper', () => {
      expect(() => gameEngine.playSound('jump')).not.toThrow()
      expect(mockAudioWrapper.playGameSound).not.toHaveBeenCalled()
    })

    test('should start BGM without delegating to AudioManagerWrapper', () => {
      expect(() => gameEngine.startBGM()).not.toThrow()
      expect(mockAudioWrapper.startBGM).not.toHaveBeenCalled()
    })

    test('should stop BGM without delegating to AudioManagerWrapper', () => {
      expect(() => gameEngine.stopBGM()).not.toThrow()
      expect(mockAudioWrapper.stopBGM).not.toHaveBeenCalled()
    })
  })

  describe('Level Management', () => {
    test('should generate a level inline rather than via LevelGenerator', () => {
      gameEngine.generateLevel()

      expect(gameEngine.platforms.length).toBeGreaterThan(0)
      expect(mockLevelGenerator.generateLevel).not.toHaveBeenCalled()
    })

    test('should enter the transition state on next level', () => {
      gameEngine.nextLevel()
      expect(gameEngine.gameState).toBe('transition')
    })

    test('should ignore a repeated nextLevel call while transitioning', () => {
      // Guards the infinite-transition loop the engine warns about.
      gameEngine.nextLevel()
      const levelAfterFirst = gameEngine.currentLevel

      gameEngine.nextLevel()

      expect(gameEngine.gameState).toBe('transition')
      expect(gameEngine.currentLevel).toBe(levelAfterFirst)
    })
  })

  describe('Cleanup', () => {
    test('should cleanup resources', () => {
      // Mock cancelAnimationFrame
      const mockCancelAnimationFrame = jest.fn()
      global.cancelAnimationFrame = mockCancelAnimationFrame

      gameEngine.cleanup()

      expect(mockInputManager.cleanup).toHaveBeenCalled()
      // cleanup() currently tears down only the InputManager and BGM. It does
      // not stop the Renderer, close the AudioContext, or cancel the animation
      // frame -- hooks/useGame.ts cancels the frame itself to compensate.
      expect(mockRenderer.stop).not.toHaveBeenCalled()
      expect(mockAudioWrapper.cleanup).not.toHaveBeenCalled()
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
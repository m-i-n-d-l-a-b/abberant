/**
 * Unit tests for AudioManager class
 * 
 * Tests cover core functionality:
 * - Initialization and configuration
 * - Preset management
 * - Performance tracking
 * - Resource management
 */

import { AudioManager, AudioEffect } from '../lib/game/AudioManager'

// Simple mock for testing
const mockAudioContext = {
  state: 'running',
  currentTime: 0,
  destination: {},
  createGain: () => ({
    gain: { value: 1, setValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn() },
    connect: jest.fn(),
    disconnect: jest.fn()
  }),
  createOscillator: () => ({
    frequency: { value: 440, setValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn() },
    type: 'sine',
    connect: jest.fn(),
    disconnect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn()
  }),
  createBiquadFilter: () => ({
    frequency: { value: 1000, setValueAtTime: jest.fn() },
    Q: { value: 1, setValueAtTime: jest.fn() },
    gain: { value: 0, setValueAtTime: jest.fn() },
    type: 'lowpass',
    connect: jest.fn(),
    disconnect: jest.fn()
  }),
  createDynamicsCompressor: () => ({
    threshold: { value: -24 },
    knee: { value: 30 },
    ratio: { value: 12 },
    attack: { value: 0.003 },
    release: { value: 0.25 },
    connect: jest.fn()
  }),
  createDelay: () => ({
    delayTime: { value: 0.25 },
    connect: jest.fn()
  }),
  resume: jest.fn(),
  close: jest.fn()
}

// Mock window object
Object.defineProperty(global, 'window', {
  value: {
    AudioContext: jest.fn(() => mockAudioContext),
    webkitAudioContext: jest.fn(() => mockAudioContext)
  },
  writable: true
})

// Mock timers
jest.useFakeTimers()

describe('AudioManager', () => {
  let audioManager: AudioManager

  beforeEach(() => {
    jest.clearAllMocks()
    audioManager = new AudioManager()
  })

  afterEach(() => {
    if (audioManager) {
      audioManager.cleanup()
    }
  })

  describe('Initialization', () => {
    test('should initialize with default values', () => {
      expect(audioManager.isSoundEnabled()).toBe(true)
      
      const stats = audioManager.getPerformanceStats()
      expect(stats.nodesCreated).toBe(0)
      expect(stats.nodesReused).toBe(0)
      expect(stats.cacheHits).toBe(0)
      expect(stats.cacheMisses).toBe(0)
      expect(stats.cacheSize).toBe(0)
      expect(stats.presetCount).toBeGreaterThan(0)
    })

    test('should initialize audio context successfully', () => {
      const result = audioManager.initAudioContext()
      expect(result).toBe(true)
    })

    test('should not reinitialize if already initialized', () => {
      audioManager.initAudioContext()
      const result = audioManager.initAudioContext()
      expect(result).toBe(true)
    })
  })

  describe('Sound Control', () => {
    test('should enable and disable sound', () => {
      expect(audioManager.isSoundEnabled()).toBe(true)
      
      audioManager.setSoundEnabled(false)
      expect(audioManager.isSoundEnabled()).toBe(false)
      
      audioManager.setSoundEnabled(true)
      expect(audioManager.isSoundEnabled()).toBe(true)
    })
  })

  describe('Preset Management', () => {
    test('should have predefined presets', () => {
      const presetNames = audioManager.getPresetNames()
      expect(presetNames).toContain('jump_enhanced')
      expect(presetNames).toContain('dash_enhanced')
      expect(presetNames).toContain('collect_enhanced')
      expect(presetNames).toContain('explosion')
      expect(presetNames).toContain('stomp_enhanced')
      expect(presetNames).toContain('hit_enhanced')
    })

    test('should get preset by name', () => {
      const jumpPreset = audioManager.getPreset('jump_enhanced')
      expect(jumpPreset).toBeDefined()
      expect(jumpPreset?.name).toBe('jump_enhanced')
      expect(jumpPreset?.category).toBe('movement')
      expect(jumpPreset?.effect.type).toBe('oscillator')
    })

    test('should return undefined for non-existent preset', () => {
      const nonExistent = audioManager.getPreset('non_existent')
      expect(nonExistent).toBeUndefined()
    })

    test('should get presets by category', () => {
      const movementPresets = audioManager.getPresetsByCategory('movement')
      expect(movementPresets.length).toBeGreaterThan(0)
      expect(movementPresets.every(p => p.category === 'movement')).toBe(true)
      
      const gameplayPresets = audioManager.getPresetsByCategory('gameplay')
      expect(gameplayPresets.length).toBeGreaterThan(0)
      expect(gameplayPresets.every(p => p.category === 'gameplay')).toBe(true)
    })
  })

  describe('Sound Playback', () => {
    beforeEach(() => {
      audioManager.initAudioContext()
    })

    test('should play preset effects', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      audioManager.playPreset('jump_enhanced', 0.8)
      
      // Should not warn for valid preset
      expect(consoleSpy).not.toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })

    test('should handle non-existent presets gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      audioManager.playPreset('non_existent', 1.0)
      expect(consoleSpy).toHaveBeenCalledWith("Audio preset 'non_existent' not found")
      
      consoleSpy.mockRestore()
    })

    test('should not play sounds when disabled', () => {
      audioManager.setSoundEnabled(false)
      
      // This should not throw or cause issues
      expect(() => {
        audioManager.playPreset('jump_enhanced', 1.0)
      }).not.toThrow()
    })
  })

  describe('Effect Caching', () => {
    beforeEach(() => {
      audioManager.initAudioContext()
    })

    test('should cache new effects', () => {
      const effect: AudioEffect = {
        type: 'oscillator',
        frequency: 440,
        duration: 0.5,
        gain: 0.5,
        oscillatorType: 'sine'
      }
      
      const initialStats = audioManager.getPerformanceStats()
      expect(initialStats.cacheSize).toBe(0)
      
      audioManager.playEffect(effect, 1.0)
      
      const finalStats = audioManager.getPerformanceStats()
      expect(finalStats.cacheSize).toBe(1)
      expect(finalStats.cacheMisses).toBe(1)
    })

    test('should reuse cached effects', () => {
      const effect: AudioEffect = {
        type: 'oscillator',
        frequency: 440,
        duration: 0.5,
        gain: 0.5,
        oscillatorType: 'sine'
      }
      
      // Play effect twice
      audioManager.playEffect(effect, 1.0)
      audioManager.playEffect(effect, 1.0)
      
      const stats = audioManager.getPerformanceStats()
      expect(stats.cacheSize).toBe(1)
      expect(stats.cacheHits).toBe(1)
      expect(stats.cacheMisses).toBe(1)
    })

    test('should generate unique effect IDs', () => {
      const effect1: AudioEffect = {
        type: 'oscillator',
        frequency: 440,
        duration: 0.5,
        gain: 0.5,
        oscillatorType: 'sine'
      }
      
      const effect2: AudioEffect = {
        type: 'oscillator',
        frequency: 880, // Different frequency
        duration: 0.5,
        gain: 0.5,
        oscillatorType: 'sine'
      }
      
      audioManager.playEffect(effect1, 1.0)
      audioManager.playEffect(effect2, 1.0)
      
      const stats = audioManager.getPerformanceStats()
      expect(stats.cacheSize).toBe(2)
      expect(stats.cacheMisses).toBe(2)
    })
  })

  describe('BGM Management', () => {
    beforeEach(() => {
      audioManager.initAudioContext()
    })

    test('should start and stop BGM', () => {
      // These methods should not throw
      expect(() => {
        audioManager.startBGM()
        audioManager.stopBGM()
      }).not.toThrow()
    })

    test('should update BGM parameters', () => {
      // These methods should not throw
      expect(() => {
        audioManager.setBGMTempo(300)
        audioManager.setBGMPitchMod(1.5)
        audioManager.setBGMTempo(400)
        audioManager.setBGMPitchMod(0.8)
      }).not.toThrow()
    })
  })

  describe('Effect Sequences', () => {
    beforeEach(() => {
      audioManager.initAudioContext()
    })

    test('should play effect sequences', () => {
      const effects: AudioEffect[] = [
        {
          type: 'oscillator',
          frequency: 440,
          duration: 0.1,
          gain: 0.3,
          oscillatorType: 'sine'
        },
        {
          type: 'oscillator',
          frequency: 880,
          duration: 0.1,
          gain: 0.3,
          oscillatorType: 'sine'
        }
      ]
      
      // Should not throw
      expect(() => {
        audioManager.playEffectSequence(effects, [0, 100], 1.0)
      }).not.toThrow()
    })

    test('should play preset sequences', () => {
      const presetNames = ['jump_enhanced', 'dash_enhanced']
      
      // Should not throw
      expect(() => {
        audioManager.playPresetSequence(presetNames, [0, 200], 1.0)
      }).not.toThrow()
    })
  })

  describe('Performance Tracking', () => {
    beforeEach(() => {
      audioManager.initAudioContext()
    })

    test('should track cache performance', () => {
      const effect: AudioEffect = {
        type: 'oscillator',
        frequency: 440,
        duration: 0.5,
        gain: 0.5,
        oscillatorType: 'sine'
      }
      
      // First play (cache miss)
      audioManager.playEffect(effect, 1.0)
      let stats = audioManager.getPerformanceStats()
      expect(stats.cacheMisses).toBe(1)
      expect(stats.cacheHits).toBe(0)
      
      // Second play (cache hit)
      audioManager.playEffect(effect, 1.0)
      stats = audioManager.getPerformanceStats()
      expect(stats.cacheMisses).toBe(1)
      expect(stats.cacheHits).toBe(1)
      expect(stats.cacheHitRate).toBe(0.5)
    })

    test('should reset performance statistics', () => {
      // Generate some activity
      audioManager.playEffect({
        type: 'oscillator',
        frequency: 440,
        duration: 0.5,
        gain: 0.5,
        oscillatorType: 'sine'
      }, 1.0)
      
      const beforeStats = audioManager.getPerformanceStats()
      expect(beforeStats.cacheSize).toBeGreaterThan(0)
      
      audioManager.resetPerformanceStats()
      
      const afterStats = audioManager.getPerformanceStats()
      expect(afterStats.cacheSize).toBe(0)
      expect(afterStats.cacheHits).toBe(0)
      expect(afterStats.cacheMisses).toBe(0)
    })

    test('should provide comprehensive performance stats', () => {
      const stats = audioManager.getPerformanceStats()
      
      expect(stats).toHaveProperty('nodesCreated')
      expect(stats).toHaveProperty('nodesReused')
      expect(stats).toHaveProperty('nodesDisposed')
      expect(stats).toHaveProperty('activeNodes')
      expect(stats).toHaveProperty('cacheHits')
      expect(stats).toHaveProperty('cacheMisses')
      expect(stats).toHaveProperty('cacheSize')
      expect(stats).toHaveProperty('cacheMemoryUsage')
      expect(stats).toHaveProperty('cacheMemoryLimit')
      expect(stats).toHaveProperty('reuseRate')
      expect(stats).toHaveProperty('cacheHitRate')
      expect(stats).toHaveProperty('poolSizes')
      expect(stats).toHaveProperty('presetCount')
      
      expect(stats.poolSizes).toHaveProperty('gainNodes')
      expect(stats.poolSizes).toHaveProperty('oscillators')
      expect(stats.poolSizes).toHaveProperty('filters')
    })
  })

  describe('Resource Management', () => {
    test('should cleanup resources properly', () => {
      audioManager.initAudioContext()
      
      // Generate some activity
      audioManager.playEffect({
        type: 'oscillator',
        frequency: 440,
        duration: 0.5,
        gain: 0.5,
        oscillatorType: 'sine'
      }, 1.0)
      
      const beforeStats = audioManager.getPerformanceStats()
      expect(beforeStats.cacheSize).toBeGreaterThan(0)
      
      audioManager.cleanup()
      
      const afterStats = audioManager.getPerformanceStats()
      expect(afterStats.cacheSize).toBe(0)
      expect(afterStats.cacheMemoryUsage).toBe(0)
    })

    test('should handle cleanup when not initialized', () => {
      expect(() => {
        audioManager.cleanup()
      }).not.toThrow()
    })
  })

  describe('Integration Tests', () => {
    test('should handle full game audio workflow', () => {
      // Initialize
      const initResult = audioManager.initAudioContext()
      expect(initResult).toBe(true)
      
      // Play various sounds
      audioManager.playPreset('collect_enhanced', 1.0)
      
      // Start BGM
      audioManager.startBGM()
      
      // Update BGM parameters
      audioManager.setBGMTempo(400)
      audioManager.setBGMPitchMod(1.2)
      
      // Play effect sequences
      const effects: AudioEffect[] = [
        { type: 'oscillator', frequency: 440, duration: 0.1, gain: 0.3, oscillatorType: 'sine' },
        { type: 'oscillator', frequency: 880, duration: 0.1, gain: 0.3, oscillatorType: 'sine' }
      ]
      audioManager.playEffectSequence(effects, [0, 100], 1.0)
      
      // Check performance stats
      const stats = audioManager.getPerformanceStats()
      expect(stats.cacheSize).toBeGreaterThan(0)
      expect(stats.presetCount).toBeGreaterThan(0)
      
      // Cleanup
      audioManager.cleanup()
      
      const finalStats = audioManager.getPerformanceStats()
      expect(finalStats.cacheSize).toBe(0)
    })
  })
}) 
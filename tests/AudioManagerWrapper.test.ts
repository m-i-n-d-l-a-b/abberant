/**
 * AudioManagerWrapper Tests
 * 
 * Tests for the AudioManagerWrapper class to ensure proper audio management.
 */

import { AudioManagerWrapper, GameSoundType } from '../lib/game/AudioManagerWrapper'

// Mock AudioManager
jest.mock('../lib/game/AudioManager', () => {
  return {
    AudioManager: jest.fn().mockImplementation(() => ({
      initAudioContext: jest.fn().mockReturnValue(true),
      ensureAudioContextRunning: jest.fn().mockReturnValue(true),
      getAudioContextState: jest.fn().mockReturnValue('running'),
      playPreset: jest.fn(),
      playEffect: jest.fn(),
      playEffectSequence: jest.fn(),
      startBGM: jest.fn(),
      stopBGM: jest.fn(),
      setBGMTempo: jest.fn(),
      setBGMPitchMod: jest.fn(),
      setSoundEnabled: jest.fn(),
      isSoundEnabled: jest.fn().mockReturnValue(true),
      getPresetNames: jest.fn().mockReturnValue(['jump_enhanced', 'dash_enhanced']),
      getPreset: jest.fn(),
      getPresetsByCategory: jest.fn().mockReturnValue([]),
      getPerformanceStats: jest.fn().mockReturnValue({
        nodesCreated: 0,
        nodesReused: 0,
        nodesDisposed: 0,
        activeNodes: 0,
        cacheHits: 0,
        cacheMisses: 0,
        cacheSize: 0,
        cacheMemoryUsage: 0,
        cacheMemoryLimit: 1024 * 1024,
        reuseRate: 0,
        cacheHitRate: 0,
        poolSizes: {
          gainNodes: 0,
          oscillators: 0,
          filters: 0
        },
        presetCount: 0
      }),
      resetPerformanceStats: jest.fn(),
      cleanup: jest.fn(),
      audioContext: {
        state: 'running',
        sampleRate: 44100,
        currentTime: 0
      }
    }))
  }
})

describe('AudioManagerWrapper', () => {
  let audioWrapper: AudioManagerWrapper

  beforeEach(() => {
    audioWrapper = new AudioManagerWrapper()
  })

  afterEach(() => {
    if (audioWrapper) {
      audioWrapper.cleanup()
    }
  })

  describe('Initialization', () => {
    test('should initialize with default audio state', () => {
      const state = audioWrapper.getGameAudioState()
      expect(state.soundEnabled).toBe(true)
      expect(state.audioInitialized).toBe(false)
      expect(state.bgmPlaying).toBe(false)
      expect(state.bgmTempo).toBe(500)
      expect(state.bgmPitchMod).toBe(1.0)
    })

    test('should initialize audio context successfully', () => {
      const result = audioWrapper.initAudioContext()
      expect(result).toBe(true)
      
      const state = audioWrapper.getGameAudioState()
      expect(state.audioInitialized).toBe(true)
    })
  })

  describe('Audio Context Management', () => {
    test('should ensure audio context is running', () => {
      const result = audioWrapper.ensureAudioContextRunning()
      expect(result).toBe(true)
    })

    test('should get audio context state', () => {
      const state = audioWrapper.getAudioContextState()
      expect(state).toBe('running')
    })

    test('should resume audio context', () => {
      const result = audioWrapper.resumeAudioContext()
      expect(result).toBe(true)
    })
  })

  describe('Game Sound Playback', () => {
    beforeEach(() => {
      audioWrapper.initAudioContext()
    })

    // These previously did jest.spyOn(audioWrapper, 'audioManager') -- which
    // throws, because audioManager is an object property rather than a method --
    // and then asserted only that the spy was defined, which proves nothing.
    // Assert delegation to the mocked AudioManager instead.
    test.each([
      ['jump'],
      ['dash'],
      ['collect'],
      ['explosion']
    ])('should play the %s sound through a preset', soundType => {
      const audioManager = (audioWrapper as any).audioManager

      audioWrapper.playGameSound(soundType as GameSoundType)

      expect(audioManager.playPreset).toHaveBeenCalled()
    })

    test('should not play sounds when audio is disabled', () => {
      const audioManager = (audioWrapper as any).audioManager
      audioWrapper.setSoundEnabled(false)

      audioWrapper.playGameSound('jump')

      expect(audioManager.playPreset).not.toHaveBeenCalled()
    })
  })

  describe('BGM Management', () => {
    beforeEach(() => {
      audioWrapper.initAudioContext()
    })

    test('should start BGM', () => {
      const audioManager = (audioWrapper as any).audioManager

      audioWrapper.startBGM()

      expect(audioManager.startBGM).toHaveBeenCalled()
      expect(audioWrapper.getGameAudioState().bgmPlaying).toBe(true)
    })

    test('should stop BGM', () => {
      const audioManager = (audioWrapper as any).audioManager
      audioWrapper.startBGM()

      audioWrapper.stopBGM()

      expect(audioManager.stopBGM).toHaveBeenCalled()
      expect(audioWrapper.getGameAudioState().bgmPlaying).toBe(false)
    })

    test('should set BGM tempo', () => {
      const audioManager = (audioWrapper as any).audioManager

      audioWrapper.setBGMTempo(300)

      expect(audioManager.setBGMTempo).toHaveBeenCalledWith(300)
      expect(audioWrapper.getGameAudioState().bgmTempo).toBe(300)
    })

    test('should set BGM pitch modulation', () => {
      const audioManager = (audioWrapper as any).audioManager

      audioWrapper.setBGMPitchMod(1.5)

      expect(audioManager.setBGMPitchMod).toHaveBeenCalledWith(1.5)
      expect(audioWrapper.getGameAudioState().bgmPitchMod).toBe(1.5)
    })
  })

  describe('Sound State Management', () => {
    test('should enable and disable sound', () => {
      expect(audioWrapper.isSoundEnabled()).toBe(true)
      
      audioWrapper.setSoundEnabled(false)
      expect(audioWrapper.isSoundEnabled()).toBe(false)
      
      audioWrapper.setSoundEnabled(true)
      expect(audioWrapper.isSoundEnabled()).toBe(true)
    })
  })

  describe('Game State Handling', () => {
    beforeEach(() => {
      audioWrapper.initAudioContext()
    })

    test('should handle playing state', () => {
      const startBGMSpy = jest.spyOn(audioWrapper, 'startBGM')
      audioWrapper.onGameStateChange('playing')
      expect(startBGMSpy).toHaveBeenCalled()
    })

    test('should handle game over state', () => {
      const stopBGMSpy = jest.spyOn(audioWrapper, 'stopBGM')
      const playSoundSpy = jest.spyOn(audioWrapper, 'playGameSound')
      audioWrapper.onGameStateChange('gameOver')
      expect(stopBGMSpy).toHaveBeenCalled()
      expect(playSoundSpy).toHaveBeenCalledWith('game_over')
    })

    test('should handle level complete state', () => {
      const playSoundSpy = jest.spyOn(audioWrapper, 'playGameSound')
      audioWrapper.onGameStateChange('levelComplete')
      expect(playSoundSpy).toHaveBeenCalledWith('level_complete')
    })

    test('should handle start state', () => {
      const stopBGMSpy = jest.spyOn(audioWrapper, 'stopBGM')
      audioWrapper.onGameStateChange('start')
      expect(stopBGMSpy).toHaveBeenCalled()
    })
  })

  describe('Player Action Handling', () => {
    beforeEach(() => {
      audioWrapper.initAudioContext()
    })

    test('should handle jump action', () => {
      const playSoundSpy = jest.spyOn(audioWrapper, 'playGameSound')
      audioWrapper.onPlayerAction('jump')
      expect(playSoundSpy).toHaveBeenCalledWith('jump')
    })

    test('should handle dash action', () => {
      const playSoundSpy = jest.spyOn(audioWrapper, 'playGameSound')
      audioWrapper.onPlayerAction('dash')
      expect(playSoundSpy).toHaveBeenCalledWith('dash')
    })

    test('should handle collect action', () => {
      const playSoundSpy = jest.spyOn(audioWrapper, 'playGameSound')
      audioWrapper.onPlayerAction('collect')
      expect(playSoundSpy).toHaveBeenCalledWith('collect')
    })

    test('should handle death action', () => {
      const playSoundSpy = jest.spyOn(audioWrapper, 'playGameSound')
      audioWrapper.onPlayerAction('death')
      expect(playSoundSpy).toHaveBeenCalledWith('death')
    })
  })

  describe('UI Interaction Handling', () => {
    beforeEach(() => {
      audioWrapper.initAudioContext()
    })

    test('should handle click interaction', () => {
      const playSoundSpy = jest.spyOn(audioWrapper, 'playGameSound')
      audioWrapper.onUIInteraction('click')
      expect(playSoundSpy).toHaveBeenCalledWith('ui_click')
    })

    test('should handle hover interaction', () => {
      const playSoundSpy = jest.spyOn(audioWrapper, 'playGameSound')
      audioWrapper.onUIInteraction('hover')
      expect(playSoundSpy).toHaveBeenCalledWith('ui_hover', 0.5)
    })
  })

  describe('Audio Statistics', () => {
    test('should get audio statistics', () => {
      const stats = audioWrapper.getAudioStats()
      expect(stats).toHaveProperty('gameAudioState')
      expect(stats).toHaveProperty('audioContextState')
      expect(stats).toHaveProperty('nodesCreated')
      expect(stats).toHaveProperty('cacheHits')
    })

    test('should get performance statistics', () => {
      const stats = audioWrapper.getPerformanceStats()
      expect(stats).toHaveProperty('nodesCreated')
      expect(stats).toHaveProperty('cacheHits')
      expect(stats).toHaveProperty('poolSizes')
    })

    test('should reset performance statistics', () => {
      const audioManager = (audioWrapper as any).audioManager

      audioWrapper.resetPerformanceStats()

      expect(audioManager.resetPerformanceStats).toHaveBeenCalled()
    })
  })

  describe('Cleanup', () => {
    test('should cleanup audio resources', () => {
      const audioManager = (audioWrapper as any).audioManager

      audioWrapper.cleanup()

      expect(audioManager.cleanup).toHaveBeenCalled()
      expect(audioWrapper.getGameAudioState().bgmPlaying).toBe(false)
    })
  })
}) 
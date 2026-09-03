/**
 * ArcadeAudio Test Suite
 *
 * The WebAudio layer shared by both game modes.
 */

import { ArcadeAudio } from '../lib/game/ArcadeAudio'

/**
 * A WebAudio stub that records what was built.
 *
 * The shared jest setup mocks AudioContext without createDelay, which the
 * feedback loop needs, so this suite installs its own for the duration.
 */
function createMockAudioContext() {
  const gains: any[] = []
  const oscillators: any[] = []

  return {
    state: 'running',
    currentTime: 0,
    destination: {},
    gains,
    oscillators,
    resume: jest.fn(),
    createGain: jest.fn(() => {
      const node = {
        gain: {
          setValueAtTime: jest.fn(),
          exponentialRampToValueAtTime: jest.fn(),
          value: 0
        },
        connect: jest.fn()
      }
      gains.push(node)
      return node
    }),
    createOscillator: jest.fn(() => {
      const node = {
        type: 'sine',
        frequency: {
          setValueAtTime: jest.fn(),
          exponentialRampToValueAtTime: jest.fn()
        },
        connect: jest.fn(),
        start: jest.fn(),
        stop: jest.fn()
      }
      oscillators.push(node)
      return node
    }),
    createDelay: jest.fn(() => ({
      delayTime: { value: 0 },
      connect: jest.fn()
    }))
  }
}

describe('ArcadeAudio', () => {
  let audio: ArcadeAudio
  let mockCtx: ReturnType<typeof createMockAudioContext>
  let originalAudioContext: any

  beforeEach(() => {
    jest.useFakeTimers()
    mockCtx = createMockAudioContext()
    originalAudioContext = (window as any).AudioContext
    ;(window as any).AudioContext = jest.fn(() => mockCtx)
    audio = new ArcadeAudio()
  })

  afterEach(() => {
    audio.stopBGM()
    jest.clearAllTimers()
    jest.useRealTimers()
    ;(window as any).AudioContext = originalAudioContext
  })

  describe('Initialization', () => {
    test('starts uninitialised with sound on', () => {
      expect(audio.audioInitialized).toBe(false)
      expect(audio.soundEnabled).toBe(true)
      expect(audio.audioCtx).toBeNull()
    })

    test('builds the delay feedback graph on init', () => {
      audio.init()

      expect(audio.audioInitialized).toBe(true)
      expect(audio.audioCtx).toBe(mockCtx)
      expect(mockCtx.createDelay).toHaveBeenCalled()
      expect(audio.delayNode).not.toBeNull()
      expect(audio.feedbackGain).not.toBeNull()
      expect(audio.masterGain).not.toBeNull()
    })

    test('is idempotent', () => {
      audio.init()
      const created = (window as any).AudioContext.mock.calls.length
      audio.init()
      expect((window as any).AudioContext.mock.calls.length).toBe(created)
    })

    test('reset clears every field back to its starting value', () => {
      audio.init()
      audio.reset()

      expect(audio.audioCtx).toBeNull()
      expect(audio.audioInitialized).toBe(false)
      expect(audio.masterGain).toBeNull()
      expect(audio.bgmTempo).toBe(500)
      expect(audio.bgmPitchMod).toBe(1.0)
    })
  })

  describe('Sound effects', () => {
    test('does nothing before the context exists', () => {
      expect(() => audio.playSound('jump')).not.toThrow()
      expect(mockCtx.createOscillator).not.toHaveBeenCalled()
    })

    test('does nothing while sound is off', () => {
      audio.init()
      audio.soundEnabled = false
      const before = mockCtx.oscillators.length

      audio.playSound('collect')

      expect(mockCtx.oscillators.length).toBe(before)
    })

    test.each(['jump', 'dash', 'collect', 'stomp', 'hit', 'levelUp'])(
      'plays the %s effect',
      (name) => {
        audio.init()
        const before = mockCtx.oscillators.length

        audio.playSound(name)

        expect(mockCtx.oscillators.length).toBe(before + 1)
        const osc = mockCtx.oscillators[mockCtx.oscillators.length - 1]
        expect(osc.start).toHaveBeenCalled()
        expect(osc.stop).toHaveBeenCalled()
      }
    )

    test('an unknown effect is silent but does not throw', () => {
      audio.init()
      expect(() => audio.playSound('not-a-sound')).not.toThrow()
    })
  })

  describe('Background music', () => {
    test('init starts the loop', () => {
      audio.init()
      expect(audio.bgmTimeoutId).not.toBeNull()
    })

    test('stopBGM clears the pending note', () => {
      audio.init()
      audio.stopBGM()
      expect(audio.bgmTimeoutId).toBeNull()
    })

    test('schedules the next note at the current tempo', () => {
      audio.init()
      const before = mockCtx.oscillators.length

      jest.advanceTimersByTime(audio.bgmTempo + 1)

      expect(mockCtx.oscillators.length).toBeGreaterThan(before)
    })

    test('does not start while paused', () => {
      const paused = new ArcadeAudio(() => true)
      paused.init()
      expect(paused.bgmTimeoutId).toBeNull()
    })

    test('does not start while sound is off', () => {
      audio.soundEnabled = false
      audio.init()
      expect(audio.bgmTimeoutId).toBeNull()
    })
  })

  describe('Modulation', () => {
    test('drifts tempo and pitch over time', () => {
      audio.updateBGMEffects(0)
      expect(audio.bgmTempo).toBeCloseTo(500)
      expect(audio.bgmPitchMod).toBeCloseTo(1.0)

      audio.updateBGMEffects(Math.PI * 1000)
      expect(audio.bgmTempo).not.toBeCloseTo(500)
    })

    test('keeps tempo inside its swing range', () => {
      for (let t = 0; t < 20000; t += 137) {
        audio.updateBGMEffects(t)
        expect(audio.bgmTempo).toBeGreaterThanOrEqual(300)
        expect(audio.bgmTempo).toBeLessThanOrEqual(700)
      }
    })

    test('holds still while sound is off', () => {
      audio.soundEnabled = false
      audio.updateBGMEffects(Math.PI * 1000)
      expect(audio.bgmTempo).toBe(500)
    })
  })

  describe('setSoundEnabled', () => {
    test('stops the loop when switched off', () => {
      audio.init()
      audio.setSoundEnabled(false)
      expect(audio.soundEnabled).toBe(false)
      expect(audio.bgmTimeoutId).toBeNull()
    })

    test('restarts the loop when switched back on', () => {
      audio.init()
      audio.setSoundEnabled(false)
      audio.setSoundEnabled(true)
      expect(audio.bgmTimeoutId).not.toBeNull()
    })
  })
})

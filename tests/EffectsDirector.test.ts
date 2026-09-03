/**
 * EffectsDirector Test Suite
 *
 * Covers the layer that writes post-processing factors onto the shared Effects
 * object. EffectsRenderer gates each effect on a non-neutral factor, so these
 * tests are what stand between "wired up" and "silently rendering nothing".
 */

import { EffectsDirector, poolForLevel, PostEffectName } from '../lib/game/EffectsDirector'
import { Effects } from '../types/game'
import {
  POST_EFFECTS_BY_LEVEL,
  POST_EFFECT_MAX_CONCURRENT,
  POST_EFFECT_TUNING
} from '../constants/game'

/** A fresh Effects object with every factor at its neutral value. */
const makeEffects = (): Effects => ({
  glitchOffset: { x: 0, y: 0 },
  meltingFactor: 0,
  colorShift: 0,
  pulseFactor: 1,
  blurFactor: 0,
  noiseFactor: 0,
  rgbShiftFactor: 0,
  waveFactor: 0,
  zoomFactor: 0,
  rotationFactor: 0,
  pixelBleedFactor: 0,
  dreamFactor: 0,
  dreamWaveFactor: 0
})

describe('EffectsDirector', () => {
  let director: EffectsDirector
  let effects: Effects

  beforeEach(() => {
    director = new EffectsDirector()
    effects = makeEffects()
  })

  describe('poolForLevel', () => {
    test('returns the level 1 pool for the first level', () => {
      expect(poolForLevel(1)).toEqual(POST_EFFECTS_BY_LEVEL.LEVEL_1)
    })

    test('widens the pool as levels advance', () => {
      expect(poolForLevel(2)).toEqual(POST_EFFECTS_BY_LEVEL.LEVEL_2_3)
      expect(poolForLevel(5)).toEqual(POST_EFFECTS_BY_LEVEL.LEVEL_4_6)
      expect(poolForLevel(9)).toEqual(POST_EFFECTS_BY_LEVEL.LEVEL_7_10)
      expect(poolForLevel(11)).toEqual(POST_EFFECTS_BY_LEVEL.LEVEL_11_PLUS)
    })

    test('clamps levels below 1 to the first tier', () => {
      expect(poolForLevel(0)).toEqual(POST_EFFECTS_BY_LEVEL.LEVEL_1)
    })

    test('never auto-selects an unprofiled full-frame pixel effect', () => {
      const expensive: PostEffectName[] = ['noise', 'wave', 'pixelBleed']

      for (const level of [1, 3, 6, 10, 11, 40]) {
        for (const name of expensive) {
          expect(poolForLevel(level)).not.toContain(name)
        }
      }
    })
  })

  describe('selectForLevel', () => {
    test('picks only effects from the level pool', () => {
      director.selectForLevel(5)

      for (const name of director.getActiveEffects()) {
        expect(POST_EFFECTS_BY_LEVEL.LEVEL_4_6).toContain(name)
      }
    })

    test('never exceeds the concurrency cap', () => {
      director.selectForLevel(20)
      expect(director.getActiveEffects().length).toBeLessThanOrEqual(
        POST_EFFECT_MAX_CONCURRENT
      )
    })

    test('selects the whole pool when it is smaller than the cap', () => {
      director.selectForLevel(1)
      expect(director.getActiveEffects()).toEqual(['colorShift'])
    })

    test('uses the injected random source', () => {
      // Always picking index 0 makes Fisher-Yates fully deterministic
      director.selectForLevel(11, () => 0)
      const first = director.getActiveEffects()

      director.selectForLevel(11, () => 0)
      expect(director.getActiveEffects()).toEqual(first)
    })
  })

  describe('update', () => {
    test('drives an active effect to a non-neutral value', () => {
      director.setActiveEffects(['colorShift'])

      // Quarter period of colorShift's oscillation puts it at peak
      const quarterPeriod = Math.PI / 2 / POST_EFFECT_TUNING.colorShift.speed
      director.update(effects, quarterPeriod)

      expect(effects.colorShift).toBeGreaterThan(0)
      expect(effects.colorShift).toBeLessThanOrEqual(
        POST_EFFECT_TUNING.colorShift.intensity
      )
    })

    test('holds inactive effects at zero', () => {
      director.setActiveEffects(['colorShift'])
      director.update(effects, 1234)

      expect(effects.blurFactor).toBe(0)
      expect(effects.rgbShiftFactor).toBe(0)
      expect(effects.zoomFactor).toBe(0)
      expect(effects.rotationFactor).toBe(0)
    })

    test('holds inactive pulse at 1, not 0', () => {
      // EffectsRenderer treats pulseFactor === 1 as "off"; 0 would be a
      // full collapse, so neutral has to be 1 here.
      director.setActiveEffects(['colorShift'])
      director.update(effects, 500)

      expect(effects.pulseFactor).toBe(1)
    })

    test('oscillates active pulse around 1', () => {
      director.setActiveEffects(['pulse'])
      const { speed, intensity } = POST_EFFECT_TUNING.pulse

      const peak = Math.PI / 2 / speed
      director.update(effects, peak)
      expect(effects.pulseFactor).toBeCloseTo(1 + intensity, 5)

      const trough = (3 * Math.PI) / 2 / speed
      director.update(effects, trough)
      expect(effects.pulseFactor).toBeCloseTo(1 - intensity, 5)
    })

    test('never drives a factor past its configured intensity', () => {
      director.setActiveEffects(['blur'])

      for (let t = 0; t < 20000; t += 137) {
        director.update(effects, t)
        expect(effects.blurFactor).toBeGreaterThanOrEqual(0)
        expect(effects.blurFactor).toBeLessThanOrEqual(
          POST_EFFECT_TUNING.blur.intensity
        )
      }
    })

    test('clears a previously active effect when the set changes', () => {
      director.setActiveEffects(['blur'])
      director.update(effects, Math.PI / 2 / POST_EFFECT_TUNING.blur.speed)
      expect(effects.blurFactor).toBeGreaterThan(0)

      // A level change must not leave the old effect stuck on
      director.setActiveEffects(['colorShift'])
      director.update(effects, 999)
      expect(effects.blurFactor).toBe(0)
    })

    test('leaves unmanaged effect fields alone', () => {
      effects.meltingFactor = 0.42
      effects.dreamFactor = 0.7

      director.setActiveEffects(['colorShift'])
      director.update(effects, 300)

      // melting is a per-vertex effect owned by GameEngine, not the director
      expect(effects.meltingFactor).toBe(0.42)
      expect(effects.dreamFactor).toBe(0.7)
    })
  })

  describe('reset', () => {
    test('clears the active set and returns every factor to neutral', () => {
      director.setActiveEffects(['colorShift', 'blur'])
      director.update(effects, 800)

      director.reset(effects)

      expect(director.getActiveEffects()).toEqual([])
      expect(effects.colorShift).toBe(0)
      expect(effects.blurFactor).toBe(0)
      expect(effects.pulseFactor).toBe(1)
    })
  })

  describe('setActiveEffects', () => {
    test('caps directly-set effects at the concurrency limit', () => {
      director.setActiveEffects(['colorShift', 'blur', 'noise', 'wave'])
      expect(director.getActiveEffects().length).toBe(POST_EFFECT_MAX_CONCURRENT)
    })

    test('can enable a full-frame effect that levels never auto-select', () => {
      director.setActiveEffects(['wave'])
      director.update(effects, Math.PI / 2 / POST_EFFECT_TUNING.wave.speed)

      expect(director.getActiveEffects()).toEqual(['wave'])
      expect(effects.waveFactor).toBeGreaterThan(0)
    })
  })
})

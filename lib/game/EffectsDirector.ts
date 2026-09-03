/**
 * Effects Director
 *
 * Drives the post-processing factors on the shared Effects object.
 *
 * EffectsRenderer gates every post-processing effect on a non-zero factor, so
 * nothing renders until something writes those factors each frame. This module
 * is that writer: it picks which effects a level runs and animates their
 * intensity over time so they breathe instead of sitting at a fixed value.
 *
 * Per-vertex effects (wobble, melting) and the canvas transforms (upsideDown,
 * mirrored, invert) are handled directly by GameEngine and are deliberately not
 * managed here.
 */

import { Effects } from '../../types/game'
import {
  POST_EFFECTS_BY_LEVEL,
  POST_EFFECT_MAX_CONCURRENT,
  POST_EFFECT_TUNING
} from '../../constants/game'

export type PostEffectName = keyof typeof POST_EFFECT_TUNING

/** Maps an effect name to the Effects field EffectsRenderer reads. */
const FACTOR_KEYS: Record<PostEffectName, keyof Effects> = {
  colorShift: 'colorShift',
  pulse: 'pulseFactor',
  blur: 'blurFactor',
  noise: 'noiseFactor',
  rgbShift: 'rgbShiftFactor',
  wave: 'waveFactor',
  zoom: 'zoomFactor',
  rotation: 'rotationFactor',
  pixelBleed: 'pixelBleedFactor'
}

/**
 * pulseFactor is the odd one out: EffectsRenderer treats 1 as "off" and
 * anything else as a scale, so it oscillates around 1 rather than up from 0.
 */
const PULSE_NEUTRAL = 1

const ALL_POST_EFFECTS = Object.keys(FACTOR_KEYS) as PostEffectName[]

/**
 * Return the effect pool a level draws from.
 */
export function poolForLevel(level: number): readonly PostEffectName[] {
  if (level <= 1) return POST_EFFECTS_BY_LEVEL.LEVEL_1
  if (level <= 3) return POST_EFFECTS_BY_LEVEL.LEVEL_2_3
  if (level <= 6) return POST_EFFECTS_BY_LEVEL.LEVEL_4_6
  if (level <= 10) return POST_EFFECTS_BY_LEVEL.LEVEL_7_10
  return POST_EFFECTS_BY_LEVEL.LEVEL_11_PLUS
}

export class EffectsDirector {
  private active: PostEffectName[] = []

  /**
   * Pick this level's post-processing effects from its tier pool.
   *
   * Concurrency is capped because several of these effects are full-frame
   * pixel operations; stacking them past the cap costs more than it adds.
   */
  selectForLevel(level: number, random: () => number = Math.random): void {
    const pool = [...poolForLevel(level)]

    // Fisher-Yates shuffle so repeat plays of a level differ
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }

    const count = Math.min(POST_EFFECT_MAX_CONCURRENT, pool.length)
    this.active = pool.slice(0, count)
  }

  /**
   * Set the active effects directly, ignoring level tiers.
   */
  setActiveEffects(names: PostEffectName[]): void {
    this.active = names.slice(0, POST_EFFECT_MAX_CONCURRENT)
  }

  getActiveEffects(): PostEffectName[] {
    return [...this.active]
  }

  /**
   * Write this frame's factors onto the shared Effects object.
   *
   * Every known factor is written every frame — active ones animate, inactive
   * ones are driven back to neutral — so a level change cannot leave a stale
   * effect running.
   */
  update(effects: Effects, now: number): void {
    for (const name of ALL_POST_EFFECTS) {
      const key = FACTOR_KEYS[name]
      const neutral = name === 'pulse' ? PULSE_NEUTRAL : 0

      if (!this.active.includes(name)) {
        ;(effects as unknown as Record<string, number>)[key] = neutral
        continue
      }

      const { intensity, speed } = POST_EFFECT_TUNING[name]
      const wave = Math.sin(now * speed)

      // Oscillate 0..intensity, except pulse which swings either side of 1
      const value =
        name === 'pulse'
          ? PULSE_NEUTRAL + wave * intensity
          : intensity * (0.5 + 0.5 * wave)

      ;(effects as unknown as Record<string, number>)[key] = value
    }
  }

  /**
   * Clear every managed factor back to neutral and drop the active set.
   */
  reset(effects: Effects): void {
    this.active = []
    this.update(effects, 0)
  }
}

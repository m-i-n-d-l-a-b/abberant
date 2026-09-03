/**
 * Starfield Test Suite
 *
 * The parallax backdrop shared by both game modes.
 */

import {
  createStarfield,
  renderStarfield,
  STARFIELD_BACKDROP
} from '../lib/game/Starfield'
import { INK, PAPER, TONE, tone } from '../lib/game/palette'
import { hexToRgba } from '../lib/utils/storage'

/** Fixed generator so star placement is reproducible. */
function sequence(values: number[]): () => number {
  let i = 0
  return () => values[i++ % values.length]
}

describe('createStarfield', () => {
  test('creates the requested number of stars', () => {
    const stars = createStarfield(25, 2000, 576, () => 0.5)
    expect(stars).toHaveLength(25)
  })

  test('scatters stars across the world width and viewport height', () => {
    const stars = createStarfield(50, 2000, 576)

    for (const star of stars) {
      expect(star.x).toBeGreaterThanOrEqual(0)
      expect(star.x).toBeLessThan(2000)
      expect(star.y).toBeGreaterThanOrEqual(0)
      expect(star.y).toBeLessThan(576)
    }
  })

  test('gives every star a parallax factor between 0.1 and 0.6', () => {
    const stars = createStarfield(50, 2000, 576)

    for (const star of stars) {
      expect(star.parallax).toBeGreaterThanOrEqual(0.1)
      expect(star.parallax).toBeLessThan(0.6)
    }
  })

  test('is reproducible for a given generator', () => {
    const a = createStarfield(10, 1000, 500, sequence([0.1, 0.2, 0.3, 0.4]))
    const b = createStarfield(10, 1000, 500, sequence([0.1, 0.2, 0.3, 0.4]))
    expect(a).toEqual(b)
  })

  test('returns an empty field for a count of zero', () => {
    expect(createStarfield(0, 1000, 500)).toEqual([])
  })
})

describe('renderStarfield', () => {
  const createCtx = () =>
    ({
      fillRect: jest.fn(),
      fillStyle: ''
    }) as unknown as CanvasRenderingContext2D

  test('paints the backdrop before the stars', () => {
    const ctx = createCtx()
    const stars = createStarfield(3, 1000, 500, () => 0.5)

    const styles: string[] = []
    Object.defineProperty(ctx, 'fillStyle', {
      set(value: string) {
        styles.push(value)
      },
      get() {
        return styles[styles.length - 1]
      }
    })

    renderStarfield(ctx, stars, 0, 1024, 576)

    expect(styles[0]).toBe(STARFIELD_BACKDROP)
    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 1024, 576)
  })

  test('draws one rect per star plus the backdrop', () => {
    const ctx = createCtx()
    const stars = createStarfield(4, 1000, 500, () => 0.5)

    renderStarfield(ctx, stars, 0, 1024, 576)

    expect(ctx.fillRect).toHaveBeenCalledTimes(5)
  })

  test('wraps a star scrolled past the left edge back into view', () => {
    const ctx = createCtx()
    const stars = createStarfield(1, 1000, 500, () => 0.5)
    stars[0].x = 10
    stars[0].parallax = 1

    renderStarfield(ctx, stars, 500, 1024, 576)

    const starCall = (ctx.fillRect as jest.Mock).mock.calls[1]
    expect(starCall[0]).toBeGreaterThanOrEqual(0)
    expect(starCall[0]).toBeLessThan(1024)
  })

  test('handles an empty field', () => {
    const ctx = createCtx()
    expect(() => renderStarfield(ctx, [], 0, 1024, 576)).not.toThrow()
    expect(ctx.fillRect).toHaveBeenCalledTimes(1)
  })
})

describe('hexToRgba', () => {
  test('converts 6-digit hex', () => {
    expect(hexToRgba('#f5f5f5', 0.5)).toBe('rgba(245,245,245,0.5)')
  })

  test('converts 3-digit hex', () => {
    expect(hexToRgba('#fff')).toBe('rgba(255,255,255,1)')
  })

  test('accepts hex without a leading hash', () => {
    expect(hexToRgba('080808', 0.25)).toBe('rgba(8,8,8,0.25)')
  })

  test('passes an rgb() colour through with the requested alpha', () => {
    expect(hexToRgba('rgb(242, 242, 242)', 0.5)).toBe('rgba(242,242,242,0.5)')
  })

  test('re-alphas an rgba() colour', () => {
    expect(hexToRgba('rgba(8, 8, 8, 0.9)', 0.2)).toBe('rgba(8,8,8,0.2)')
  })

  test('accepts every colour the palette emits', () => {
    expect(() => hexToRgba(tone(TONE.PICKUP), 0.5)).not.toThrow()
    expect(() => hexToRgba(tone(TONE.PLAYER, 0.3), 0.5)).not.toThrow()
    expect(() => hexToRgba(PAPER, 0.5)).not.toThrow()
    expect(() => hexToRgba(INK, 0.5)).not.toThrow()
  })

  test('still rejects a string that is not a colour', () => {
    expect(() => hexToRgba('not-a-colour')).toThrow(/Invalid color/)
  })
})

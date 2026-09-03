/**
 * EffectsRenderer Cost Test Suite
 *
 * Guards the rule that made the game stutter: nothing a level turns on by
 * itself may read the frame back from the GPU.
 *
 * getImageData forces a pipeline flush and a full-frame copy to CPU memory.
 * applyBlurEffect used to do that plus a 3x3 kernel average over every pixel —
 * ~5.3M operations per frame at 1024x576 — and because it engaged only at the
 * peak of its oscillation it presented as an intermittent hitch rather than a
 * steady low framerate. These tests fail if any auto-selected effect goes back
 * to the readback path.
 */

import { EffectsRenderer, EffectsRenderContext } from '../lib/game/EffectsRenderer'
import { EffectsDirector, poolForLevel, PostEffectName } from '../lib/game/EffectsDirector'
import { Effects } from '../types/game'
import { POST_EFFECT_TUNING } from '../constants/game'

const WIDTH = 1024
const HEIGHT = 576

interface MockCtx {
  ctx: CanvasRenderingContext2D
  counts: { getImageData: number; putImageData: number; drawImage: number }
}

/**
 * A 2D context stub that records the calls we care about.
 *
 * jsdom ships no canvas implementation, so the alternative to a stub here is
 * no coverage of this rule at all.
 */
const makeMockCtx = (): MockCtx => {
  const counts = { getImageData: 0, putImageData: 0, drawImage: 0 }

  const gradient = { addColorStop: () => undefined }

  const ctx: Record<string, unknown> = {
    canvas: { width: WIDTH, height: HEIGHT },
    save: () => undefined,
    restore: () => undefined,
    translate: () => undefined,
    scale: () => undefined,
    rotate: () => undefined,
    beginPath: () => undefined,
    moveTo: () => undefined,
    lineTo: () => undefined,
    stroke: () => undefined,
    fill: () => undefined,
    fillRect: () => undefined,
    clearRect: () => undefined,
    arc: () => undefined,
    closePath: () => undefined,
    createRadialGradient: () => gradient,
    createLinearGradient: () => gradient,
    drawImage: () => {
      counts.drawImage++
    },
    getImageData: () => {
      counts.getImageData++
      return { data: new Uint8ClampedArray(WIDTH * HEIGHT * 4), width: WIDTH, height: HEIGHT }
    },
    putImageData: () => {
      counts.putImageData++
    },
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    filter: 'none',
    font: '',
    shadowBlur: 0,
    shadowColor: ''
  }

  return { ctx: ctx as unknown as CanvasRenderingContext2D, counts }
}

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

const makeContext = (ctx: CanvasRenderingContext2D, effects: Effects): EffectsRenderContext => ({
  ctx,
  width: WIDTH,
  height: HEIGHT,
  camera: { x: 0, y: 0, targetX: 0, targetY: 0, smoothing: 0.1, zoom: 1 },
  effects,
  frameCount: 0,
  deltaTime: 1 / 60,
  now: 1000
})

/** Every effect any level tier can auto-select. */
const autoSelectable = (): PostEffectName[] => {
  const names: PostEffectName[] = []
  for (const level of [1, 2, 3, 5, 8, 11, 25]) {
    for (const name of poolForLevel(level)) {
      if (!names.includes(name)) names.push(name)
    }
  }
  return names
}

describe('EffectsRenderer cost', () => {
  let renderer: EffectsRenderer

  beforeEach(() => {
    renderer = new EffectsRenderer(WIDTH, HEIGHT)
    renderer.setLayerVisibility('dataBleed', false)
  })

  test('no auto-selected effect reads the frame back', () => {
    const director = new EffectsDirector()

    for (const name of autoSelectable()) {
      const { ctx, counts } = makeMockCtx()
      const effects = makeEffects()

      // Drive the effect to its strongest point
      director.setActiveEffects([name])
      const peak = Math.PI / 2 / POST_EFFECT_TUNING[name].speed
      director.update(effects, peak)

      renderer.render(makeContext(ctx, effects))

      expect({ effect: name, reads: counts.getImageData, writes: counts.putImageData }).toEqual({
        effect: name,
        reads: 0,
        writes: 0
      })
    }
  })

  test('blur uses the compositor filter rather than a pixel loop', () => {
    const { ctx, counts } = makeMockCtx()
    const effects = makeEffects()
    effects.blurFactor = 1

    renderer.render(makeContext(ctx, effects))

    expect(counts.getImageData).toBe(0)
    expect(counts.drawImage).toBeGreaterThan(0)
  })

  test('blur skips the copy entirely at a subpixel radius', () => {
    const { ctx, counts } = makeMockCtx()
    const effects = makeEffects()
    effects.blurFactor = 0.001

    renderer.render(makeContext(ctx, effects))

    expect(counts.drawImage).toBe(0)
  })

  test('an idle frame touches nothing', () => {
    const { ctx, counts } = makeMockCtx()

    renderer.render(makeContext(ctx, makeEffects()))

    expect(counts.getImageData).toBe(0)
    expect(counts.drawImage).toBe(0)
  })

  test('the full-frame effects that levels never select still read back', () => {
    // Documents why they are held out of automatic selection. If one of these
    // is ever made cheap, move it into POST_EFFECTS_BY_LEVEL and this flips.
    const { ctx, counts } = makeMockCtx()
    const effects = makeEffects()
    effects.waveFactor = 0.5

    renderer.render(makeContext(ctx, effects))

    expect(counts.getImageData).toBeGreaterThan(0)
  })
})

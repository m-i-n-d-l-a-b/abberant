/**
 * Starfield
 *
 * The parallax star layer behind every mode. Stars are laid out across a world
 * strip wider than the viewport and wrapped horizontally at draw time, so a
 * fixed-size array covers any amount of scrolling.
 *
 * Shared by GameEngine and SnakeEngine; both draw the same field, they just
 * feed it a different scroll offset.
 */

import { BackgroundStar } from '../../types/game'
import { PAPER, TONE, tone } from './palette'

/** Backdrop the stars sit on. */
export const STARFIELD_BACKDROP = PAPER

/**
 * Grey for a star, derived from the hue it was generated with.
 *
 * The generator still spreads stars over a hue range; monochrome just reads
 * that spread as a value spread instead, so the field keeps its variation.
 */
function starTone(hue: number): string {
  const spread = ((hue % 60) + 60) % 60 / 60
  return tone(TONE.STARFIELD_MIN + spread * (TONE.STARFIELD_MAX - TONE.STARFIELD_MIN))
}

/**
 * Build a starfield.
 *
 * @param count      How many stars to place.
 * @param worldWidth Horizontal span to scatter them across.
 * @param height     Viewport height; stars fill it top to bottom.
 * @param random     Injectable RNG so tests can pin the layout.
 */
export function createStarfield(
  count: number,
  worldWidth: number,
  height: number,
  random: () => number = Math.random
): BackgroundStar[] {
  const stars: BackgroundStar[] = []

  for (let i = 0; i < count; i++) {
    stars.push({
      x: random() * worldWidth,
      y: random() * height,
      size: random() * 2 + 0.5,
      parallax: random() * 0.5 + 0.1,
      hue: random() * 60 + 180,
      pulseSpeed: 0.01,
      pulsePhase: random() * Math.PI * 2,
      twinkleSpeed: 0.005,
      twinklePhase: random() * Math.PI * 2,
      shape: 'circle',
      brightness: 1,
      glowRadius: 2
    })
  }

  return stars
}

/**
 * Draw the backdrop and the parallax stars over it.
 *
 * Each star's horizontal position is offset by the scroll distance scaled by
 * its own parallax factor, then wrapped into the viewport.
 */
export function renderStarfield(
  ctx: CanvasRenderingContext2D,
  stars: BackgroundStar[],
  scrollX: number,
  width: number,
  height: number
): void {
  ctx.fillStyle = STARFIELD_BACKDROP
  ctx.fillRect(0, 0, width, height)

  for (const star of stars) {
    const drawX = (star.x - scrollX * star.parallax) % width
    const wrappedX = drawX < 0 ? drawX + width : drawX
    ctx.fillStyle = starTone(star.hue)
    ctx.fillRect(wrappedX, star.y, star.size, star.size)
  }
}

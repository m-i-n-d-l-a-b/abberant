/**
 * Palette
 *
 * Both game modes draw in monochrome: one ink value on one paper value, with
 * everything between them earning its place through contrast rather than hue.
 *
 * Read shapes by value, not by colour. The hierarchy below is the whole design
 * - a thing that must be noticed is lighter than the thing it sits on.
 *
 * The other polarity (black objects on a white page) is the same palette
 * inverted, which is exactly what the `invert` canvas effect already does.
 */

/** The page. Not pure black, so the darkest ink still separates from it. */
export const PAPER = '#080808'

/** The brightest mark on the page. Not pure white, for the same reason. */
export const INK = '#f5f5f5'

/**
 * A grey between paper and ink.
 *
 * @param value 0 is black, 1 is white.
 * @param alpha Optional opacity.
 */
export function tone(value: number, alpha = 1): string {
  const channel = Math.round(Math.max(0, Math.min(1, value)) * 255)
  return alpha >= 1
    ? `rgb(${channel}, ${channel}, ${channel})`
    : `rgba(${channel}, ${channel}, ${channel}, ${alpha})`
}

/**
 * The value hierarchy, darkest to lightest.
 *
 * Background texture sits below the things you stand on, which sit below the
 * things that matter, which sit below the thing you control.
 */
export const TONE = {
  /** Parallax stars - texture, never competing with the play field. */
  STARFIELD_MIN: 0.16,
  STARFIELD_MAX: 0.44,

  /** Grid rule on the Snake board. */
  GRID: 0.55,

  /** Platforms and other standable geometry. */
  TERRAIN: 0.4,
  TERRAIN_VARIATION: 0.09,

  /** The Snake body at its tail end. */
  TRAIL: 0.42,

  /** Hazards - brighter than terrain so a threat reads at a glance. */
  HAZARD: 0.76,

  /** Pickups. */
  PICKUP: 0.95,

  /** The player, and the Snake head. The brightest thing on screen. */
  PLAYER: 1
} as const

/**
 * Snake Renderer
 *
 * Draws the Snake board: starfield, grid, food and the snake itself. Kept
 * separate from SnakeEngine so the simulation can be tested without a canvas.
 *
 * Monochrome throughout - see lib/game/palette.ts. The snake reads as a body
 * because it fades from ink at the head to a mid grey at the tail, not because
 * of any hue.
 *
 * Everything here is plain fills - no rounded rects, no per-pixel work - so the
 * frame budget stays free for the shared post-processing pass that runs over
 * the finished image.
 */

import { BackgroundStar, GridCell } from '../../types/game'
import { renderStarfield } from './Starfield'
import { TONE, tone } from './palette'
import {
  SNAKE_CELL_SIZE,
  SNAKE_COLS,
  SNAKE_ROWS,
  SNAKE_WOBBLE_AMPLITUDE,
  SNAKE_WOBBLE_SPEED
} from '../../constants/game'

/** Everything the renderer needs to draw one frame. */
export interface SnakeBoardView {
  /** Body cells, head first. */
  snake: GridCell[]
  food: GridCell
  stars: BackgroundStar[]
  /** Horizontal scroll fed to the parallax starfield. */
  scrollX: number
  now: number
  /** Whether the wobble canvas effect is active. */
  wobble: boolean
  /** Non-zero while the board is frozen after a crash. */
  crashFreeze: number
}

/** Inset applied to body squares, leaving a grid gutter. */
const CELL_INSET = 2

/** Glow square drawn under a body segment, in pixels beyond the cell. */
const BODY_GLOW_SPREAD = 3

/** Opacity of the grid rule. Present, but never competing with the play. */
const GRID_ALPHA = 0.07

export class SnakeRenderer {
  private width: number
  private height: number

  constructor(width: number, height: number) {
    this.width = width
    this.height = height
  }

  render(ctx: CanvasRenderingContext2D, view: SnakeBoardView): void {
    renderStarfield(ctx, view.stars, view.scrollX, this.width, this.height)
    this.renderGrid(ctx)
    this.renderFood(ctx, view)
    this.renderSnake(ctx, view)
  }

  /**
   * Horizontal displacement for a cell under the wobble effect.
   *
   * Phase is keyed off the cell's own coordinates so the board ripples rather
   * than sliding as one block.
   */
  private wobbleOffset(view: SnakeBoardView, cell: GridCell): number {
    if (!view.wobble) return 0
    return (
      Math.sin(view.now * SNAKE_WOBBLE_SPEED + (cell.x + cell.y) * 0.5) *
      SNAKE_WOBBLE_AMPLITUDE
    )
  }

  private renderGrid(ctx: CanvasRenderingContext2D): void {
    ctx.save()
    ctx.strokeStyle = tone(TONE.GRID, GRID_ALPHA)
    ctx.lineWidth = 1
    ctx.beginPath()

    for (let col = 1; col < SNAKE_COLS; col++) {
      const x = col * SNAKE_CELL_SIZE + 0.5
      ctx.moveTo(x, 0)
      ctx.lineTo(x, this.height)
    }
    for (let row = 1; row < SNAKE_ROWS; row++) {
      const y = row * SNAKE_CELL_SIZE + 0.5
      ctx.moveTo(0, y)
      ctx.lineTo(this.width, y)
    }

    ctx.stroke()
    ctx.restore()
  }

  private renderFood(ctx: CanvasRenderingContext2D, view: SnakeBoardView): void {
    const pulse = 0.75 + 0.25 * Math.sin(view.now * 0.006)
    const size = SNAKE_CELL_SIZE * pulse
    const dx = this.wobbleOffset(view, view.food)
    const cx = view.food.x * SNAKE_CELL_SIZE + SNAKE_CELL_SIZE / 2 + dx
    const cy = view.food.y * SNAKE_CELL_SIZE + SNAKE_CELL_SIZE / 2
    const fill = tone(TONE.PICKUP)

    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(view.now * 0.002)
    ctx.fillStyle = fill
    ctx.shadowColor = fill
    ctx.shadowBlur = 14
    ctx.fillRect(-size / 2, -size / 2, size, size)
    ctx.restore()
  }

  private renderSnake(ctx: CanvasRenderingContext2D, view: SnakeBoardView): void {
    const length = view.snake.length
    if (length === 0) return

    ctx.save()

    // Body, tail first, so each segment overlaps the one behind it.
    for (let i = length - 1; i >= 1; i--) {
      const cell = view.snake[i]
      const t = i / length
      const value = TONE.PLAYER + (TONE.TRAIL - TONE.PLAYER) * t
      const dx = this.wobbleOffset(view, cell)
      const x = cell.x * SNAKE_CELL_SIZE + dx
      const y = cell.y * SNAKE_CELL_SIZE

      // Cheap glow: an oversized low-alpha square instead of a shadow blur,
      // which would cost a full compositing pass per segment.
      ctx.fillStyle = tone(value, 0.18 * (1 - t * 0.6))
      ctx.fillRect(
        x - BODY_GLOW_SPREAD,
        y - BODY_GLOW_SPREAD,
        SNAKE_CELL_SIZE + BODY_GLOW_SPREAD * 2,
        SNAKE_CELL_SIZE + BODY_GLOW_SPREAD * 2
      )

      ctx.fillStyle = tone(value)
      ctx.fillRect(
        x + CELL_INSET,
        y + CELL_INSET,
        SNAKE_CELL_SIZE - CELL_INSET * 2,
        SNAKE_CELL_SIZE - CELL_INSET * 2
      )
    }

    // Head: full cell, glowing, and dropping to grey through the crash freeze -
    // it cannot flash brighter than ink, so it flashes darker.
    const head = view.snake[0]
    const headDx = this.wobbleOffset(view, head)
    const flashing = view.crashFreeze > 0 && Math.floor(view.now / 80) % 2 === 0
    const headFill = tone(flashing ? TONE.TRAIL : TONE.PLAYER)

    ctx.fillStyle = headFill
    ctx.shadowColor = tone(TONE.PLAYER)
    ctx.shadowBlur = 16
    ctx.fillRect(
      head.x * SNAKE_CELL_SIZE + headDx,
      head.y * SNAKE_CELL_SIZE,
      SNAKE_CELL_SIZE,
      SNAKE_CELL_SIZE
    )

    ctx.restore()
  }
}

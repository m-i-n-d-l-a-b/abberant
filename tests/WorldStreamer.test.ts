/**
 * WorldStreamer Test Suite
 *
 * The endless side-scroller's world. The properties that matter are that the
 * live entity count stays flat however far a run goes, and that a chunk which
 * gets pruned comes back exactly as it left.
 */

import { WorldStreamer } from '../lib/game/WorldStreamer'
import {
  CHUNKS_AHEAD,
  CHUNKS_BEHIND,
  CHUNK_COLLECTIBLE_COUNT,
  CHUNK_ENEMY_COUNT,
  CHUNK_PLATFORM_COUNT,
  CHUNK_WIDTH,
  PLATFORM_BAND_MAX_Y,
  PLATFORM_BAND_MIN_Y
} from '../constants/game'

/** Chunks resident once the window is full and the player is past the start. */
const WINDOW_SIZE = CHUNKS_BEHIND + CHUNKS_AHEAD + 1

describe('WorldStreamer', () => {
  let world: WorldStreamer

  beforeEach(() => {
    world = new WorldStreamer(1234)
    world.update(0)
  })

  describe('Chunk window', () => {
    test('loads the chunks around the player', () => {
      // At the origin there is nothing behind to load.
      expect(world.loadedChunkCount).toBe(CHUNKS_AHEAD + 1)
    })

    test('keeps a fixed window once the player is past the start', () => {
      world.update(CHUNK_WIDTH * 5)
      expect(world.loadedChunkCount).toBe(WINDOW_SIZE)
    })

    test('does not grow the world as a run goes on', () => {
      world.update(CHUNK_WIDTH * 5)
      const platforms = world.platforms.length
      const enemies = world.enemies.length

      world.update(CHUNK_WIDTH * 500)

      expect(world.loadedChunkCount).toBe(WINDOW_SIZE)
      expect(world.platforms.length).toBe(platforms)
      expect(world.enemies.length).toBe(enemies)
    })

    test('prunes chunks the player has left far behind', () => {
      world.update(CHUNK_WIDTH * 10)
      const far = world.platforms.some((p) => p.x < CHUNK_WIDTH * 8)
      expect(far).toBe(false)
    })

    test('always has ground ahead of the player', () => {
      for (let chunk = 0; chunk < 12; chunk++) {
        const x = chunk * CHUNK_WIDTH + 10
        world.update(x)
        const ahead = world.platforms.filter((p) => p.x > x)
        expect(ahead.length).toBeGreaterThan(0)
      }
    })

    test('repeated updates at the same place change nothing', () => {
      world.update(CHUNK_WIDTH * 3)
      const platforms = world.platforms

      world.update(CHUNK_WIDTH * 3)

      expect(world.platforms).toBe(platforms)
    })
  })

  describe('Chunk contents', () => {
    test('opens the run on a ledge', () => {
      const opening = world.platforms.filter((p) => p.x === 0)
      expect(opening).toHaveLength(1)
      expect(opening[0].width).toBeGreaterThan(200)
    })

    test('fills each chunk with the configured counts', () => {
      world.update(CHUNK_WIDTH * 5)
      expect(world.platforms.length).toBe(WINDOW_SIZE * CHUNK_PLATFORM_COUNT)
      expect(world.enemies.length).toBe(WINDOW_SIZE * CHUNK_ENEMY_COUNT)
      expect(world.collectibles.length).toBe(
        WINDOW_SIZE * CHUNK_COLLECTIBLE_COUNT
      )
    })

    test('keeps terrain inside the reachable band', () => {
      for (let chunk = 0; chunk < 20; chunk++) {
        world.update(chunk * CHUNK_WIDTH)
        for (const platform of world.platforms) {
          if (platform.x === 0) continue // the opening ledge sits by itself
          expect(platform.y).toBeGreaterThanOrEqual(PLATFORM_BAND_MIN_Y)
          expect(platform.y).toBeLessThanOrEqual(PLATFORM_BAND_MAX_Y)
        }
      }
    })

    test('stands every enemy on a platform', () => {
      world.update(CHUNK_WIDTH * 4)
      for (const enemy of world.enemies) {
        const footing = world.platforms.find(
          (p) => enemy.y + enemy.height === p.y
        )
        expect(footing).toBeDefined()
      }
    })

    test('leaves no horizontal gap wider than a jump', () => {
      world.update(CHUNK_WIDTH * 6)
      const ordered = [...world.platforms].sort((a, b) => a.x - b.x)

      for (let i = 1; i < ordered.length; i++) {
        const gap = ordered[i].x - (ordered[i - 1].x + ordered[i - 1].width)
        expect(gap).toBeLessThan(300)
      }
    })
  })

  describe('Determinism', () => {
    test('regenerates a pruned chunk identically', () => {
      world.update(0)
      const original = world.platforms
        .filter((p) => p.x >= CHUNK_WIDTH && p.x < CHUNK_WIDTH * 2)
        .map((p) => ({ x: p.x, y: p.y, width: p.width }))
      expect(original.length).toBeGreaterThan(0)

      // Walk far enough to prune it, then walk back.
      world.update(CHUNK_WIDTH * 20)
      world.update(CHUNK_WIDTH)

      const regenerated = world.platforms
        .filter((p) => p.x >= CHUNK_WIDTH && p.x < CHUNK_WIDTH * 2)
        .map((p) => ({ x: p.x, y: p.y, width: p.width }))

      expect(regenerated).toEqual(original)
    })

    test('two streamers on the same seed build the same world', () => {
      const other = new WorldStreamer(1234)
      other.update(CHUNK_WIDTH * 3)
      world.update(CHUNK_WIDTH * 3)

      expect(other.platforms.map((p) => p.x)).toEqual(
        world.platforms.map((p) => p.x)
      )
    })

    test('different seeds build different worlds', () => {
      const other = new WorldStreamer(99)
      other.update(CHUNK_WIDTH * 3)
      world.update(CHUNK_WIDTH * 3)

      expect(other.platforms.map((p) => p.x)).not.toEqual(
        world.platforms.map((p) => p.x)
      )
    })
  })

  describe('Consuming entities', () => {
    test('marks a collected pickup on the spot', () => {
      const collectible = world.collectibles[0]
      world.consumeCollectible(collectible)
      expect(collectible.collected).toBe(true)
    })

    test('does not hand a collected pickup back after a regeneration', () => {
      world.update(CHUNK_WIDTH)
      const target = world.collectibles.find((c) => c.x >= CHUNK_WIDTH)!
      world.consumeCollectible(target)

      world.update(CHUNK_WIDTH * 20)
      world.update(CHUNK_WIDTH)

      const regenerated = world.collectibles.filter(
        (c) => c.x >= CHUNK_WIDTH && c.x < CHUNK_WIDTH * 2
      )
      const uncollectedAtSameSpot = regenerated.filter(
        (c) => c.x === target.x && c.y === target.y && !c.collected
      )
      expect(uncollectedAtSameSpot).toHaveLength(0)
    })

    test('removes a stomped enemy from the live list immediately', () => {
      const enemy = world.enemies[0]
      const before = world.enemies.length

      world.removeEnemy(enemy)

      expect(world.enemies).toHaveLength(before - 1)
      expect(world.enemies).not.toContain(enemy)
    })

    test('leaves a stomped enemy gone while its chunk stays loaded', () => {
      const enemy = world.enemies[0]
      world.removeEnemy(enemy)

      world.update(CHUNK_WIDTH)

      expect(world.enemies).not.toContain(enemy)
    })

    test('ignores an enemy it does not own', () => {
      const stranger = { ...world.enemies[0] }
      const before = world.enemies.length

      expect(() => world.removeEnemy(stranger)).not.toThrow()
      expect(world.enemies).toHaveLength(before)
    })
  })

  describe('Reset', () => {
    test('drops every chunk', () => {
      world.update(CHUNK_WIDTH * 4)
      world.reset(7)
      expect(world.loadedChunkCount).toBe(0)
      expect(world.platforms).toHaveLength(0)
    })

    test('forgets which pickups were taken', () => {
      world.consumeCollectible(world.collectibles[0])
      world.reset(1234)
      world.update(0)

      expect(world.collectibles.every((c) => !c.collected)).toBe(true)
    })
  })
})

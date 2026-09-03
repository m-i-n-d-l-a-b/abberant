/**
 * World Streamer
 *
 * The endless side-scroller's world. There is no level and no end: geometry is
 * generated a chunk at a time as the player advances, and chunks that fall far
 * enough behind are dropped. The live entity count is therefore flat no matter
 * how far a run goes, which is the whole point - the previous generator built
 * an entire level up front and grew it with the level number.
 *
 * Chunks are a pure function of the run seed and their own index, so a chunk
 * that gets pruned and later regenerated comes back identical. Walking back is
 * a regeneration, not a void, and it costs nothing to remember.
 */

import { Collectible, Enemy, Platform } from '../../types/game'
import { TONE, tone } from './palette'
import {
  CHUNKS_AHEAD,
  CHUNKS_BEHIND,
  CHUNK_COLLECTIBLE_COUNT,
  CHUNK_ENEMY_COUNT,
  CHUNK_PLATFORM_COUNT,
  CHUNK_WIDTH,
  COLLECTIBLE_HEIGHT,
  COLLECTIBLE_VALUE,
  COLLECTIBLE_WIDTH,
  ENEMY_HEIGHT,
  ENEMY_WIDTH,
  PLATFORM_BAND_AMPLITUDE,
  PLATFORM_BAND_CENTER,
  PLATFORM_BAND_JITTER,
  PLATFORM_BAND_MAX_Y,
  PLATFORM_BAND_MIN_Y,
  PLATFORM_BAND_WAVELENGTH
} from '../../constants/game'

/** One screen of generated geometry. */
interface WorldChunk {
  index: number
  platforms: Platform[]
  enemies: Enemy[]
  collectibles: Collectible[]
}

/**
 * A small deterministic generator.
 *
 * Chunk contents must be reproducible from an index alone, which Math.random
 * cannot give.
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Terrain height at a world x. Continuous, so chunk seams never show. */
function bandHeight(worldX: number): number {
  return (
    PLATFORM_BAND_CENTER +
    Math.sin((worldX / PLATFORM_BAND_WAVELENGTH) * Math.PI * 2) *
      PLATFORM_BAND_AMPLITUDE
  )
}

export class WorldStreamer {
  /** Live geometry, flattened across every loaded chunk. */
  platforms: Platform[] = []
  enemies: Enemy[] = []
  collectibles: Collectible[] = []

  private chunks = new Map<number, WorldChunk>()
  private seed: number

  /**
   * Collectibles already taken, keyed by chunk and slot.
   *
   * Without this, walking back far enough to prune a chunk and returning would
   * regenerate its pickups and let a player farm the same coins forever.
   */
  private consumed = new Set<string>()

  /** Which chunk each live entity came from, for removals. */
  private enemyChunk = new WeakMap<Enemy, number>()
  private collectibleKey = new WeakMap<Collectible, string>()

  constructor(seed: number = Math.floor(Math.random() * 0xffffffff)) {
    this.seed = seed
  }

  /** Throw the world away and start a new run. */
  reset(seed: number = Math.floor(Math.random() * 0xffffffff)): void {
    this.seed = seed
    this.chunks.clear()
    this.consumed.clear()
    this.platforms = []
    this.enemies = []
    this.collectibles = []
  }

  /** Number of chunks currently resident. Bounded by the window size. */
  get loadedChunkCount(): number {
    return this.chunks.size
  }

  /** The chunk index a world x falls in. */
  static chunkIndexFor(worldX: number): number {
    return Math.floor(worldX / CHUNK_WIDTH)
  }

  /**
   * Bring the world in line with where the player is.
   *
   * Generates any missing chunk inside the window and drops everything outside
   * it. Cheap enough to call every frame: on a frame that changes nothing it
   * is a handful of map lookups.
   */
  update(playerX: number): void {
    const current = WorldStreamer.chunkIndexFor(playerX)
    const first = Math.max(0, current - CHUNKS_BEHIND)
    const last = current + CHUNKS_AHEAD

    let changed = false

    for (let index = first; index <= last; index++) {
      if (this.chunks.has(index)) continue
      this.chunks.set(index, this.generateChunk(index))
      changed = true
    }

    for (const index of Array.from(this.chunks.keys())) {
      if (index >= first && index <= last) continue
      this.chunks.delete(index)
      changed = true
    }

    if (changed) this.rebuild()
  }

  /**
   * Take a collectible out of play for the rest of the run.
   *
   * Marked on the object so this frame sees it, and recorded by key so a
   * regenerated chunk does not hand it back.
   */
  consumeCollectible(collectible: Collectible): void {
    collectible.collected = true
    const key = this.collectibleKey.get(collectible)
    if (key) this.consumed.add(key)
  }

  /** Remove a stomped enemy from its chunk and from the live list. */
  removeEnemy(enemy: Enemy): void {
    const index = this.enemyChunk.get(enemy)
    const chunk = index === undefined ? undefined : this.chunks.get(index)
    if (chunk) {
      const at = chunk.enemies.indexOf(enemy)
      if (at >= 0) chunk.enemies.splice(at, 1)
    }

    // Splice the flat list in place rather than rebuilding it, so a caller
    // iterating it this frame is not left holding a stale array.
    const live = this.enemies.indexOf(enemy)
    if (live >= 0) this.enemies.splice(live, 1)
  }

  /** Flatten the loaded chunks, in world order. */
  private rebuild(): void {
    const ordered = Array.from(this.chunks.values()).sort(
      (a, b) => a.index - b.index
    )

    this.platforms = ordered.flatMap((chunk) => chunk.platforms)
    this.enemies = ordered.flatMap((chunk) => chunk.enemies)
    this.collectibles = ordered.flatMap((chunk) => chunk.collectibles)
  }

  /**
   * Build one chunk from its index.
   *
   * Deterministic: same seed and index, same geometry, every time.
   */
  private generateChunk(index: number): WorldChunk {
    const random = mulberry32(this.seed ^ Math.imul(index + 1, 0x9e3779b9))
    const originX = index * CHUNK_WIDTH

    const platforms: Platform[] = []
    const enemies: Enemy[] = []
    const collectibles: Collectible[] = []

    // The first chunk opens with a wide ledge, so a run never starts mid-air.
    if (index === 0) {
      platforms.push(
        makePlatform(0, PLATFORM_BAND_CENTER + PLATFORM_BAND_AMPLITUDE, 260, 0)
      )
    }

    for (let i = 0; i < CHUNK_PLATFORM_COUNT; i++) {
      const spacing = CHUNK_WIDTH / CHUNK_PLATFORM_COUNT
      const x = originX + i * spacing + random() * spacing * 0.4
      const jitter = (random() - 0.5) * PLATFORM_BAND_JITTER
      const y = clamp(
        bandHeight(x) + jitter,
        PLATFORM_BAND_MIN_Y,
        PLATFORM_BAND_MAX_Y
      )
      platforms.push(makePlatform(x, y, 80 + random() * 120, i))
    }

    for (let i = 0; i < CHUNK_ENEMY_COUNT; i++) {
      const platform = platforms[Math.floor(random() * platforms.length)]
      enemies.push({
        x: platform.x + random() * Math.max(1, platform.width - ENEMY_WIDTH),
        y: platform.y - ENEMY_HEIGHT,
        width: ENEMY_WIDTH,
        height: ENEMY_HEIGHT,
        velX: random() < 0.5 ? 1 : -1,
        velY: 0,
        speed: 1 + random(),
        color: tone(TONE.HAZARD),
        movementType: 'horizontal',
        startY: platform.y - ENEMY_HEIGHT,
        moveRange: 60,
        stompZoneActive: false
      })
    }

    for (let i = 0; i < CHUNK_COLLECTIBLE_COUNT; i++) {
      const platform = platforms[Math.floor(random() * platforms.length)]
      const key = `${index}:${i}`
      collectibles.push({
        x: platform.x + random() * Math.max(1, platform.width - COLLECTIBLE_WIDTH),
        y: platform.y - 30,
        width: COLLECTIBLE_WIDTH,
        height: COLLECTIBLE_HEIGHT,
        color: tone(TONE.PICKUP),
        collected: this.consumed.has(key),
        value: COLLECTIBLE_VALUE
      })
    }

    for (const enemy of enemies) this.enemyChunk.set(enemy, index)
    collectibles.forEach((collectible, i) =>
      this.collectibleKey.set(collectible, `${index}:${i}`)
    )

    return { index, platforms, enemies, collectibles }
  }
}

/** Terrain value varies per platform so neighbours separate without hue. */
function makePlatform(x: number, y: number, width: number, ordinal: number): Platform {
  return {
    x,
    y,
    width,
    height: 20,
    color: tone(TONE.TERRAIN + Math.sin(ordinal * 0.9) * TONE.TERRAIN_VARIATION),
    type: 'normal',
    liquidPixels: [],
    distortionOffset: 0
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

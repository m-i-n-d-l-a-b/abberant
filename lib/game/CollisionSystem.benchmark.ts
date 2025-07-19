import { CollisionSystem, CollisionEntity, BoundingBox } from './CollisionSystem'

/**
 * Performance benchmark for collision detection system
 * Compares quadtree-based collision detection vs brute force O(n²) approach
 */

interface BenchmarkResult {
  entityCount: number
  quadtreeTime: number
  bruteForceTime: number
  improvement: number
  quadtreeCollisions: number
  bruteForceCollisions: number
}

class BruteForceCollisionSystem {
  private entities: CollisionEntity[] = []

  addEntity(entity: CollisionEntity): void {
    this.entities.push(entity)
  }

  clear(): void {
    this.entities = []
  }

  checkCollisions(targetBounds: BoundingBox): CollisionEntity[] {
    const collisions: CollisionEntity[] = []
    
    for (const entity of this.entities) {
      if (this.boundsIntersect(targetBounds, entity.bounds)) {
        collisions.push(entity)
      }
    }
    
    return collisions
  }

  private boundsIntersect(a: BoundingBox, b: BoundingBox): boolean {
    return !(
      a.x > b.x + b.width ||
      a.x + a.width < b.x ||
      a.y > b.y + b.height ||
      a.y + a.height < b.y
    )
  }
}

export class CollisionBenchmark {
  private quadtreeSystem: CollisionSystem
  private bruteForceSystem: BruteForceCollisionSystem
  private worldBounds: BoundingBox

  constructor() {
    this.worldBounds = { x: 0, y: 0, width: 2000, height: 1200 }
    this.quadtreeSystem = new CollisionSystem(this.worldBounds, 10, 8)
    this.bruteForceSystem = new BruteForceCollisionSystem()
  }

  /**
   * Generate random entities for testing
   */
  private generateEntities(count: number): CollisionEntity[] {
    const entities: CollisionEntity[] = []
    const types: CollisionEntity['type'][] = ['player', 'enemy', 'collectible', 'platform']

    for (let i = 0; i < count; i++) {
      const x = Math.random() * (this.worldBounds.width - 50)
      const y = Math.random() * (this.worldBounds.height - 50)
      const width = 10 + Math.random() * 40
      const height = 10 + Math.random() * 40
      const type = types[Math.floor(Math.random() * types.length)]

      entities.push({
        id: `entity_${i}`,
        bounds: { x, y, width, height },
        type,
        data: { index: i }
      })
    }

    return entities
  }

  /**
   * Run a single benchmark test
   */
  private runBenchmark(entityCount: number, iterations: number = 100): BenchmarkResult {
    // Generate test entities
    const entities = this.generateEntities(entityCount)
    
    // Setup both systems
    this.quadtreeSystem.clear()
    this.bruteForceSystem.clear()
    
    entities.forEach(entity => {
      this.quadtreeSystem.addEntity(entity)
      this.bruteForceSystem.addEntity(entity)
    })

    // Test quadtree performance
    const quadtreeStart = performance.now()
    let quadtreeCollisions = 0
    
    for (let i = 0; i < iterations; i++) {
      const testBounds: BoundingBox = {
        x: Math.random() * (this.worldBounds.width - 50),
        y: Math.random() * (this.worldBounds.height - 50),
        width: 20 + Math.random() * 30,
        height: 20 + Math.random() * 30
      }
      
      const collisions = this.quadtreeSystem.getPotentialCollisions(testBounds)
      quadtreeCollisions += collisions.length
    }
    
    const quadtreeTime = performance.now() - quadtreeStart

    // Test brute force performance
    const bruteForceStart = performance.now()
    let bruteForceCollisions = 0
    
    for (let i = 0; i < iterations; i++) {
      const testBounds: BoundingBox = {
        x: Math.random() * (this.worldBounds.width - 50),
        y: Math.random() * (this.worldBounds.height - 50),
        width: 20 + Math.random() * 30,
        height: 20 + Math.random() * 30
      }
      
      const collisions = this.bruteForceSystem.checkCollisions(testBounds)
      bruteForceCollisions += collisions.length
    }
    
    const bruteForceTime = performance.now() - bruteForceStart

    // Calculate improvement
    const improvement = ((bruteForceTime - quadtreeTime) / bruteForceTime) * 100

    return {
      entityCount,
      quadtreeTime,
      bruteForceTime,
      improvement,
      quadtreeCollisions,
      bruteForceCollisions
    }
  }

  /**
   * Run comprehensive benchmark suite
   */
  runBenchmarkSuite(): BenchmarkResult[] {
    const entityCounts = [10, 25, 50, 100, 200, 500, 1000]
    const results: BenchmarkResult[] = []

    console.log('🚀 Starting Collision Detection Performance Benchmark')
    console.log('=' .repeat(80))

    for (const count of entityCounts) {
      console.log(`\n📊 Testing with ${count} entities...`)
      
      const result = this.runBenchmark(count)
      results.push(result)
      
      console.log(`   Quadtree:     ${result.quadtreeTime.toFixed(2)}ms`)
      console.log(`   Brute Force:  ${result.bruteForceTime.toFixed(2)}ms`)
      console.log(`   Improvement:  ${result.improvement.toFixed(1)}%`)
      console.log(`   Collisions:   ${result.quadtreeCollisions} vs ${result.bruteForceCollisions}`)
    }

    this.printSummary(results)
    return results
  }

  /**
   * Print benchmark summary
   */
  private printSummary(results: BenchmarkResult[]): void {
    console.log('\n' + '='.repeat(80))
    console.log('📈 BENCHMARK SUMMARY')
    console.log('='.repeat(80))
    
    console.log('\nEntity Count | Quadtree (ms) | Brute Force (ms) | Improvement (%)')
    console.log('-'.repeat(65))
    
    results.forEach(result => {
      console.log(
        `${result.entityCount.toString().padStart(11)} | ` +
        `${result.quadtreeTime.toFixed(2).padStart(12)} | ` +
        `${result.bruteForceTime.toFixed(2).padStart(14)} | ` +
        `${result.improvement.toFixed(1).padStart(13)}`
      )
    })

    // Calculate average improvement
    const avgImprovement = results.reduce((sum, r) => sum + r.improvement, 0) / results.length
    console.log(`\n🎯 Average Improvement: ${avgImprovement.toFixed(1)}%`)

    // Find best and worst cases
    const bestCase = results.reduce((best, current) => 
      current.improvement > best.improvement ? current : best
    )
    const worstCase = results.reduce((worst, current) => 
      current.improvement < worst.improvement ? current : worst
    )

    console.log(`🏆 Best Case: ${bestCase.entityCount} entities (${bestCase.improvement.toFixed(1)}% improvement)`)
    console.log(`📉 Worst Case: ${worstCase.entityCount} entities (${worstCase.improvement.toFixed(1)}% improvement)`)
  }

  /**
   * Run game-specific collision benchmark
   */
  runGameSpecificBenchmark(): void {
    console.log('\n🎮 Game-Specific Collision Benchmark')
    console.log('='.repeat(50))

    // Simulate typical game scenario
    const playerBounds: BoundingBox = { x: 500, y: 300, width: 20, height: 20 }
    const entityCounts = [50, 100, 200, 500]

    for (const count of entityCounts) {
      console.log(`\nTesting game scenario with ${count} entities:`)
      
      // Generate realistic game entities
      const entities = this.generateGameEntities(count)
      
      this.quadtreeSystem.clear()
      this.bruteForceSystem.clear()
      
      entities.forEach(entity => {
        this.quadtreeSystem.addEntity(entity)
        this.bruteForceSystem.addEntity(entity)
      })

      // Test player-enemy collisions
      const quadtreeStart = performance.now()
      const quadtreeResult = this.quadtreeSystem.checkPlayerEnemyCollisions(playerBounds, 5)
      const quadtreeTime = performance.now() - quadtreeStart

      const bruteForceStart = performance.now()
      const bruteForceEnemies = this.bruteForceSystem.checkCollisions(playerBounds)
        .filter(e => e.type === 'enemy')
      const bruteForceTime = performance.now() - bruteForceStart

      const improvement = ((bruteForceTime - quadtreeTime) / bruteForceTime) * 100

      console.log(`   Player-Enemy Collisions:`)
      console.log(`     Quadtree: ${quadtreeTime.toFixed(3)}ms (${quadtreeResult.enemies.length} enemies, ${quadtreeResult.stompTargets.length} stomp targets)`)
      console.log(`     Brute Force: ${bruteForceTime.toFixed(3)}ms (${bruteForceEnemies.length} enemies)`)
      console.log(`     Improvement: ${improvement.toFixed(1)}%`)
    }
  }

  /**
   * Generate realistic game entities
   */
  private generateGameEntities(count: number): CollisionEntity[] {
    const entities: CollisionEntity[] = []
    
    // Add platforms (20% of entities)
    const platformCount = Math.floor(count * 0.2)
    for (let i = 0; i < platformCount; i++) {
      entities.push({
        id: `platform_${i}`,
        bounds: {
          x: Math.random() * (this.worldBounds.width - 100),
          y: 400 + Math.random() * 200,
          width: 80 + Math.random() * 120,
          height: 20
        },
        type: 'platform'
      })
    }

    // Add enemies (40% of entities)
    const enemyCount = Math.floor(count * 0.4)
    for (let i = 0; i < enemyCount; i++) {
      entities.push({
        id: `enemy_${i}`,
        bounds: {
          x: Math.random() * (this.worldBounds.width - 15),
          y: Math.random() * (this.worldBounds.height - 15),
          width: 15,
          height: 15
        },
        type: 'enemy'
      })
    }

    // Add collectibles (40% of entities)
    const collectibleCount = count - platformCount - enemyCount
    for (let i = 0; i < collectibleCount; i++) {
      entities.push({
        id: `collectible_${i}`,
        bounds: {
          x: Math.random() * (this.worldBounds.width - 12),
          y: Math.random() * (this.worldBounds.height - 12),
          width: 12,
          height: 12
        },
        type: 'collectible'
      })
    }

    return entities
  }
}

// Export for use in other files
export function runCollisionBenchmark(): void {
  const benchmark = new CollisionBenchmark()
  benchmark.runBenchmarkSuite()
  benchmark.runGameSpecificBenchmark()
}

// Auto-run if this file is executed directly
if (typeof window === 'undefined' && require.main === module) {
  runCollisionBenchmark()
} 
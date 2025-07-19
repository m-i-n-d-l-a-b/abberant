/**
 * AudioManager - Optimized audio system with node pooling and effect caching
 * 
 * This class provides efficient audio management by:
 * - Pooling audio nodes to reduce garbage collection
 * - Caching audio effects for reuse
 * - Managing audio context lifecycle
 * - Providing optimized sound playback methods
 */

export interface AudioEffect {
  type: 'oscillator' | 'noise' | 'filter'
  frequency?: number
  duration: number
  gain: number
  oscillatorType?: OscillatorType
  filterType?: BiquadFilterType
  filterFrequency?: number
  filterQ?: number
  envelope?: {
    attack: number
    decay: number
    sustain: number
    release: number
  }
}

export interface CachedSound {
  id: string
  effect: AudioEffect
  lastUsed: number
  useCount: number
  priority: number
  size: number // Estimated memory footprint
}

export interface AudioEffectPreset {
  name: string
  effect: AudioEffect
  description: string
  category: 'gameplay' | 'ambient' | 'ui' | 'explosion' | 'movement'
}

export class AudioManager {
  private audioContext: AudioContext | null = null
  private masterGain: GainNode | null = null
  private delayNode: DelayNode | null = null
  private feedbackGain: GainNode | null = null
  private compressor: DynamicsCompressorNode | null = null
  
  private soundEnabled: boolean = true
  private audioInitialized: boolean = false
  private bgmTimeoutId: NodeJS.Timeout | null = null
  private bgmTempo: number = 500
  private bgmPitchMod: number = 1.0
  
  // Node pools for different audio components
  private gainNodePool: GainNode[] = []
  private filterNodePool: BiquadFilterNode[] = []
  
  // Pool configuration
  private maxGainNodePoolSize: number = 20
  private maxFilterNodePoolSize: number = 10
  
  // Active node tracking for cleanup
  private activeNodes: Set<AudioNode> = new Set()
  private nodeCleanupTimeouts: Map<AudioNode, NodeJS.Timeout> = new Map()
  
  // Audio effect cache
  private effectCache: Map<string, CachedSound> = new Map()
  private maxCacheSize: number = 50
  private maxCacheMemory: number = 1024 * 1024 // 1MB estimated memory limit
  private cacheCleanupInterval: number = 30000 // 30 seconds
  private cacheTotalMemory: number = 0
  
  // Pre-built effect presets
  private effectPresets: Map<string, AudioEffectPreset> = new Map()
  
  // Performance tracking
  private nodesCreated: number = 0
  private nodesReused: number = 0
  private cacheHits: number = 0
  private cacheMisses: number = 0
  private nodesDisposed: number = 0
  
  constructor() {
    this.setupCacheCleanup()
    this.initializeEffectPresets()
  }

  /**
   * Initialize pre-built audio effect presets
   */
  private initializeEffectPresets(): void {
    // Gameplay effects
    this.effectPresets.set('jump_enhanced', {
      name: 'jump_enhanced',
      effect: {
        type: 'oscillator',
        frequency: 440,
        duration: 0.3,
        gain: 0.3,
        oscillatorType: 'sine',
        envelope: {
          attack: 0.01,
          decay: 0.1,
          sustain: 0.7,
          release: 0.2
        }
      },
      description: 'Enhanced jump sound with envelope',
      category: 'movement'
    })

    this.effectPresets.set('dash_enhanced', {
      name: 'dash_enhanced',
      effect: {
        type: 'oscillator',
        frequency: 100,
        duration: 0.5,
        gain: 0.4,
        oscillatorType: 'sawtooth',
        envelope: {
          attack: 0.05,
          decay: 0.2,
          sustain: 0.5,
          release: 0.3
        }
      },
      description: 'Enhanced dash sound with sawtooth wave',
      category: 'movement'
    })

    this.effectPresets.set('collect_enhanced', {
      name: 'collect_enhanced',
      effect: {
        type: 'oscillator',
        frequency: 880,
        duration: 0.2,
        gain: 0.25,
        oscillatorType: 'sine',
        envelope: {
          attack: 0.01,
          decay: 0.05,
          sustain: 0.8,
          release: 0.15
        }
      },
      description: 'Enhanced collectible pickup sound',
      category: 'gameplay'
    })

    this.effectPresets.set('explosion', {
      name: 'explosion',
      effect: {
        type: 'oscillator',
        frequency: 80,
        duration: 0.8,
        gain: 0.6,
        oscillatorType: 'sawtooth',
        envelope: {
          attack: 0.01,
          decay: 0.3,
          sustain: 0.2,
          release: 0.5
        }
      },
      description: 'Explosion sound effect',
      category: 'explosion'
    })

    this.effectPresets.set('ambient_wind', {
      name: 'ambient_wind',
      effect: {
        type: 'oscillator',
        frequency: 200,
        duration: 2.0,
        gain: 0.1,
        oscillatorType: 'sine',
        envelope: {
          attack: 0.5,
          decay: 0.5,
          sustain: 0.8,
          release: 0.5
        }
      },
      description: 'Ambient wind sound',
      category: 'ambient'
    })

    this.effectPresets.set('ui_click', {
      name: 'ui_click',
      effect: {
        type: 'oscillator',
        frequency: 800,
        duration: 0.1,
        gain: 0.2,
        oscillatorType: 'square',
        envelope: {
          attack: 0.01,
          decay: 0.05,
          sustain: 0.5,
          release: 0.05
        }
      },
      description: 'UI click sound',
      category: 'ui'
    })

    this.effectPresets.set('stomp_enhanced', {
      name: 'stomp_enhanced',
      effect: {
        type: 'oscillator',
        frequency: 400,
        duration: 0.4,
        gain: 0.5,
        oscillatorType: 'square',
        envelope: {
          attack: 0.01,
          decay: 0.1,
          sustain: 0.6,
          release: 0.3
        }
      },
      description: 'Enhanced stomp sound',
      category: 'gameplay'
    })

    this.effectPresets.set('hit_enhanced', {
      name: 'hit_enhanced',
      effect: {
        type: 'oscillator',
        frequency: 200,
        duration: 0.6,
        gain: 0.6,
        oscillatorType: 'sawtooth',
        envelope: {
          attack: 0.01,
          decay: 0.2,
          sustain: 0.3,
          release: 0.4
        }
      },
      description: 'Enhanced hit sound',
      category: 'gameplay'
    })
  }

  /**
   * Initialize audio context with proper state management
   */
  public initAudioContext(): boolean {
    if (this.audioInitialized && this.audioContext) {
      // If already initialized, ensure context is running
      return this.ensureAudioContextRunning()
    }
    
    try {
      // Create audio context with fallback for older browsers
      this.audioContext = new ((window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext)()
      
      // Resume if suspended (required for autoplay policies)
      if (this.audioContext.state === "suspended") {
        console.log('Audio context suspended, attempting to resume...')
        this.audioContext.resume()
      }
      
      // Create master gain node
      this.masterGain = this.audioContext.createGain()
      this.masterGain.gain.value = 0.8
      
      // Create compressor for dynamic range control
      this.compressor = this.audioContext.createDynamicsCompressor()
      this.compressor.threshold.value = -24
      this.compressor.knee.value = 30
      this.compressor.ratio.value = 12
      this.compressor.attack.value = 0.003
      this.compressor.release.value = 0.25
      
      // Create delay effect for BGM
      this.delayNode = this.audioContext.createDelay(1.0)
      this.delayNode.delayTime.value = 0.25
      this.feedbackGain = this.audioContext.createGain()
      this.feedbackGain.gain.value = 0.4
      
      // Connect audio processing chain
      this.masterGain.connect(this.compressor!)
      this.compressor!.connect(this.audioContext.destination)
      
      // Connect delay effect (parallel to main chain)
      this.masterGain.connect(this.delayNode!)
      this.delayNode!.connect(this.audioContext.destination)
      this.delayNode!.connect(this.feedbackGain!)
      this.feedbackGain!.connect(this.delayNode!)
      
      this.audioInitialized = true
      console.log('Audio context initialized successfully, state:', this.audioContext.state)
      return true
    } catch (error) {
      console.error('Failed to initialize audio context:', error)
      return false
    }
  }

  /**
   * Ensure audio context is running and resume if suspended
   */
  public ensureAudioContextRunning(): boolean {
    if (!this.audioContext) {
      console.warn('Audio context not available')
      return false
    }

    if (this.audioContext.state === "suspended") {
      console.log('Audio context suspended, resuming...')
      this.audioContext.resume().then(() => {
        console.log('Audio context resumed successfully, state:', this.audioContext!.state)
      }).catch((error) => {
        console.error('Failed to resume audio context:', error)
      })
      return false // Return false while resuming
    }

    if (this.audioContext.state === "closed") {
      console.warn('Audio context closed, reinitializing...')
      this.audioInitialized = false
      return this.initAudioContext()
    }

    return this.audioContext.state === "running"
  }

  /**
   * Get current audio context state for debugging
   */
  public getAudioContextState(): string {
    return this.audioContext?.state || 'not_initialized'
  }

  /**
   * Get or create a gain node from the pool
   */
  private getGainNode(): GainNode {
    if (this.gainNodePool.length > 0) {
      const node = this.gainNodePool.pop()!
      this.nodesReused++
      this.activeNodes.add(node)
      return node
    }
    
    if (!this.audioContext) {
      throw new Error('Audio context not initialized')
    }
    
    const node = this.audioContext.createGain()
    this.nodesCreated++
    this.activeNodes.add(node)
    return node
  }

  /**
   * Get or create an oscillator node
   * Note: OscillatorNode instances cannot be reused after being stopped,
   * so we always create new instances to avoid InvalidStateError
   */
  private getOscillatorNode(): OscillatorNode {
    // OscillatorNode instances cannot be reused after being stopped
    // Always create a new instance to avoid InvalidStateError
    if (!this.audioContext) {
      throw new Error('Audio context not initialized')
    }
    
    const node = this.audioContext.createOscillator()
    this.nodesCreated++
    this.activeNodes.add(node)
    return node
  }

  /**
   * Get or create a filter node from the pool
   */
  private getFilterNode(): BiquadFilterNode {
    if (this.filterNodePool.length > 0) {
      const node = this.filterNodePool.pop()!
      this.nodesReused++
      this.activeNodes.add(node)
      return node
    }
    
    if (!this.audioContext) {
      throw new Error('Audio context not initialized')
    }
    
    const node = this.audioContext.createBiquadFilter()
    this.nodesCreated++
    this.activeNodes.add(node)
    return node
  }

  /**
   * Return a gain node to the pool for reuse
   */
  private returnGainNode(node: GainNode): void {
    // Clear any existing cleanup timeout
    const existingTimeout = this.nodeCleanupTimeouts.get(node)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
      this.nodeCleanupTimeouts.delete(node)
    }
    
    // Disconnect from all connections
    node.disconnect()
    
    // Reset node state
    node.gain.cancelScheduledValues(0)
    node.gain.setValueAtTime(1, 0)
    
    // Remove from active tracking
    this.activeNodes.delete(node)
    
    // Return to pool if not at capacity
    if (this.gainNodePool.length < this.maxGainNodePoolSize) {
      this.gainNodePool.push(node)
    } else {
      // Dispose if pool is full
      this.disposeNode(node)
    }
  }

  /**
   * Return an oscillator node to the pool for reuse
   * Note: OscillatorNode instances cannot be reused after being stopped,
   * so we always dispose them
   */
  private returnOscillatorNode(node: OscillatorNode): void {
    // Clear any existing cleanup timeout
    const existingTimeout = this.nodeCleanupTimeouts.get(node)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
      this.nodeCleanupTimeouts.delete(node)
    }
    
    // Disconnect from all connections
    node.disconnect()
    
    // Stop oscillator if running
    try {
      node.stop()
    } catch (e) {
      // Oscillator might already be stopped
    }
    
    // Remove from active tracking
    this.activeNodes.delete(node)
    
    // Always dispose oscillator nodes since they cannot be reused
    this.disposeNode(node)
  }

  /**
   * Return a filter node to the pool for reuse
   */
  private returnFilterNode(node: BiquadFilterNode): void {
    // Clear any existing cleanup timeout
    const existingTimeout = this.nodeCleanupTimeouts.get(node)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
      this.nodeCleanupTimeouts.delete(node)
    }
    
    // Disconnect from all connections
    node.disconnect()
    
    // Reset filter state
    node.frequency.cancelScheduledValues(0)
    node.Q.cancelScheduledValues(0)
    node.gain.cancelScheduledValues(0)
    node.frequency.setValueAtTime(1000, 0)
    node.Q.setValueAtTime(1, 0)
    node.gain.setValueAtTime(0, 0)
    node.type = 'lowpass'
    
    // Remove from active tracking
    this.activeNodes.delete(node)
    
    // Return to pool if not at capacity
    if (this.filterNodePool.length < this.maxFilterNodePoolSize) {
      this.filterNodePool.push(node)
    } else {
      // Dispose if pool is full
      this.disposeNode(node)
    }
  }

  /**
   * Dispose of an audio node and clean up resources
   */
  private disposeNode(node: AudioNode): void {
    try {
      // Disconnect from all connections
      node.disconnect()
      
      // Stop oscillator if applicable
      if ('stop' in node && typeof (node as any).stop === 'function') {
        try {
          (node as any).stop()
        } catch (e) {
          // Node might already be stopped
        }
      }
      
      // Remove from active tracking
      this.activeNodes.delete(node)
      
      // Clear any cleanup timeout
      const timeout = this.nodeCleanupTimeouts.get(node)
      if (timeout) {
        clearTimeout(timeout)
        this.nodeCleanupTimeouts.delete(node)
      }
      
      this.nodesDisposed++
    } catch (error) {
      console.warn('Error disposing audio node:', error)
    }
  }

  /**
   * Schedule automatic cleanup of a node after a delay
   */
  private scheduleNodeCleanup(node: AudioNode, delayMs: number): void {
    // Clear any existing timeout for this node
    const existingTimeout = this.nodeCleanupTimeouts.get(node)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }
    
    // Schedule new cleanup
    const timeout = setTimeout(() => {
      this.nodeCleanupTimeouts.delete(node)
      
      if (node instanceof GainNode) {
        this.returnGainNode(node)
      } else if (node instanceof OscillatorNode) {
        this.returnOscillatorNode(node)
      } else if (node instanceof BiquadFilterNode) {
        this.returnFilterNode(node)
      }
    }, delayMs)
    
    this.nodeCleanupTimeouts.set(node, timeout)
  }

  /**
   * Play a sound effect with enhanced error handling and state checks
   */
  public playSound(type: string, volume: number = 1.0): void {
    if (!this.soundEnabled) {
      console.log('Sound disabled, skipping:', type)
      return
    }

    if (!this.ensureAudioContextRunning()) {
      console.warn('Audio context not ready, cannot play sound:', type)
      return
    }

    if (!this.audioContext || !this.audioInitialized) {
      console.warn('Audio not initialized, cannot play sound:', type)
      return
    }

    // Use enhanced presets for better sound quality
    switch (type) {
      case "jump":
        this.playPreset('jump_enhanced', volume)
        break
      case "dash":
        this.playPreset('dash_enhanced', volume)
        break
      case "collect":
        this.playPreset('collect_enhanced', volume)
        break
      case "stomp":
        this.playPreset('stomp_enhanced', volume)
        break
      case "hit":
        this.playPreset('hit_enhanced', volume)
        break
      default:
        // Fallback to basic sound if preset not found
        this.playEffect({
          type: 'oscillator',
          frequency: 440,
          duration: 0.1,
          gain: 0.3,
          oscillatorType: 'sine'
        }, volume)
        break
    }
  }

  /**
   * Play a custom audio effect with caching
   */
  public playEffect(effect: AudioEffect, volume: number = 1.0): void {
    if (!this.soundEnabled || !this.audioContext || !this.audioInitialized) return
    
    const effectId = this.generateEffectId(effect)
    const cached = this.effectCache.get(effectId)
    
    if (cached) {
      this.cacheHits++
      cached.lastUsed = Date.now()
      cached.useCount++
    } else {
      this.cacheMisses++
      this.cacheEffect(effectId, effect)
    }
    
    this.playCachedEffect(effectId, volume)
  }

  /**
   * Play a preset audio effect by name
   */
  public playPreset(presetName: string, volume: number = 1.0): void {
    const preset = this.effectPresets.get(presetName)
    if (preset) {
      this.playEffect(preset.effect, volume)
    } else {
      console.warn(`Audio preset '${presetName}' not found`)
    }
  }

  /**
   * Play multiple effects in sequence
   */
  public playEffectSequence(effects: AudioEffect[], delays: number[] = [], volume: number = 1.0): void {
    if (!this.soundEnabled || !this.audioContext || !this.audioInitialized) return
    
    effects.forEach((effect, index) => {
      const delay = delays[index] || 0
      setTimeout(() => {
        this.playEffect(effect, volume)
      }, delay)
    })
  }

  /**
   * Play multiple preset effects in sequence
   */
  public playPresetSequence(presetNames: string[], delays: number[] = [], volume: number = 1.0): void {
    if (!this.soundEnabled || !this.audioContext || !this.audioInitialized) return
    
    presetNames.forEach((presetName, index) => {
      const delay = delays[index] || 0
      setTimeout(() => {
        this.playPreset(presetName, volume)
      }, delay)
    })
  }

  /**
   * Get all available preset names
   */
  public getPresetNames(): string[] {
    return Array.from(this.effectPresets.keys())
  }

  /**
   * Get preset by name
   */
  public getPreset(presetName: string): AudioEffectPreset | undefined {
    return this.effectPresets.get(presetName)
  }

  /**
   * Get presets by category
   */
  public getPresetsByCategory(category: AudioEffectPreset['category']): AudioEffectPreset[] {
    return Array.from(this.effectPresets.values()).filter(preset => preset.category === category)
  }

  /**
   * Generate a unique ID for an audio effect
   */
  private generateEffectId(effect: AudioEffect): string {
    const envelopeStr = effect.envelope 
      ? `-${effect.envelope.attack}-${effect.envelope.decay}-${effect.envelope.sustain}-${effect.envelope.release}`
      : ''
    return `${effect.type}-${effect.frequency || 0}-${effect.duration}-${effect.gain}-${effect.oscillatorType || 'sine'}${envelopeStr}`
  }

  /**
   * Estimate memory footprint of an audio effect
   */
  private estimateEffectSize(effect: AudioEffect): number {
    let size = 64 // Base size for effect object
    
    // Add size based on complexity
    if (effect.envelope) size += 32
    if (effect.filterType) size += 16
    if (effect.oscillatorType && effect.oscillatorType !== 'sine') size += 8
    
    // Add size based on duration (longer effects use more memory)
    size += Math.floor(effect.duration * 100)
    
    return size
  }

  /**
   * Calculate priority for cache eviction (lower = higher priority to keep)
   */
  private calculateCachePriority(cached: CachedSound): number {
    const now = Date.now()
    const age = now - cached.lastUsed
    const ageScore = Math.min(age / (5 * 60 * 1000), 1) // 5 minutes max age score
    
    // Higher use count = higher priority (keep frequently used effects)
    const useScore = Math.min(cached.useCount / 10, 1)
    
    // Size penalty (larger effects get lower priority)
    const sizeScore = Math.min(cached.size / 1000, 1)
    
    // Final priority: age + size penalty - use bonus
    return ageScore + sizeScore - useScore
  }

  /**
   * Cache an audio effect for future reuse
   */
  private cacheEffect(id: string, effect: AudioEffect): void {
    const effectSize = this.estimateEffectSize(effect)
    
    // Check if we need to evict entries due to size or count limits
    while (
      (this.effectCache.size >= this.maxCacheSize || 
       this.cacheTotalMemory + effectSize > this.maxCacheMemory) &&
      this.effectCache.size > 0
    ) {
      this.evictLowestPriorityEntry()
    }
    
    // Add to cache
    this.effectCache.set(id, {
      id,
      effect,
      lastUsed: Date.now(),
      useCount: 0,
      priority: 0,
      size: effectSize
    })
    
    this.cacheTotalMemory += effectSize
  }

  /**
   * Evict the lowest priority cache entry
   */
  private evictLowestPriorityEntry(): void {
    let lowestPriority = Infinity
    let lowestPriorityId = ''
    
    for (const [id, cached] of Array.from(this.effectCache.entries())) {
      const priority = this.calculateCachePriority(cached)
      if (priority > lowestPriority) {
        lowestPriority = priority
        lowestPriorityId = id
      }
    }
    
    if (lowestPriorityId) {
      const cached = this.effectCache.get(lowestPriorityId)!
      this.cacheTotalMemory -= cached.size
      this.effectCache.delete(lowestPriorityId)
    }
  }

  /**
   * Play a cached audio effect
   */
  private playCachedEffect(effectId: string, volume: number): void {
    const cached = this.effectCache.get(effectId)
    if (!cached || !this.audioContext) return
    
    const now = this.audioContext.currentTime
    const effect = cached.effect
    
    const gainNode = this.getGainNode()
    const oscillator = this.getOscillatorNode()
    
    oscillator.connect(gainNode)
    gainNode.connect(this.masterGain!)
    
    // Apply effect configuration
    gainNode.gain.setValueAtTime(effect.gain * volume, now)
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + effect.duration)
    
    if (effect.frequency) {
      oscillator.frequency.setValueAtTime(effect.frequency, now)
    }
    
    if (effect.oscillatorType) {
      oscillator.type = effect.oscillatorType
    }
    
    // Apply envelope if specified
    if (effect.envelope) {
      const env = effect.envelope
      const attackEnd = now + env.attack
      const decayEnd = attackEnd + env.decay
      const releaseStart = now + effect.duration - env.release
      
      gainNode.gain.setValueAtTime(0, now)
      gainNode.gain.linearRampToValueAtTime(effect.gain * volume, attackEnd)
      gainNode.gain.linearRampToValueAtTime(effect.gain * volume * env.sustain, decayEnd)
      gainNode.gain.linearRampToValueAtTime(0, releaseStart)
    }
    
    // Safely start the oscillator with error handling
    try {
      oscillator.start(now)
      oscillator.stop(now + effect.duration)
    } catch (error) {
      console.warn('Failed to start oscillator:', error)
      // Clean up nodes on error
      this.disposeNode(gainNode)
      this.disposeNode(oscillator)
      return
    }
    
    // Schedule cleanup
    const cleanupDelay = (effect.duration + 0.1) * 1000
    this.scheduleNodeCleanup(gainNode, cleanupDelay)
    this.scheduleNodeCleanup(oscillator, cleanupDelay)
  }

  /**
   * Start background music with enhanced state management
   */
  public startBGM(): void {
    console.log('Starting BGM, audio context state:', this.getAudioContextState())
    
    // Stop any existing BGM first
    this.stopBGM()
    
    if (!this.soundEnabled) {
      console.log('Sound disabled, not starting BGM')
      return
    }

    if (!this.ensureAudioContextRunning()) {
      console.warn('Audio context not ready, cannot start BGM')
      return
    }

    if (!this.audioInitialized) {
      console.warn('Audio not initialized, cannot start BGM')
      return
    }

    console.log('BGM conditions met, scheduling first note...')
    this.scheduleNextNote()
  }

  /**
   * Stop background music
   */
  public stopBGM(): void {
    if (this.bgmTimeoutId) {
      clearTimeout(this.bgmTimeoutId)
      this.bgmTimeoutId = null
    }
  }

  /**
   * Schedule the next BGM note with enhanced error handling
   */
  private scheduleNextNote(): void {
    if (!this.soundEnabled) {
      console.log('Sound disabled, stopping BGM scheduling')
      return
    }

    if (!this.ensureAudioContextRunning()) {
      console.warn('Audio context not ready, stopping BGM scheduling')
      return
    }

    if (!this.audioContext) {
      console.warn('Audio context not available, stopping BGM scheduling')
      return
    }
    
    const now = this.audioContext.currentTime
    const notes = [220.0, 261.63, 329.63, 392.0]
    const note = notes[Math.floor(Math.random() * notes.length)]
    
    const gainNode = this.getGainNode()
    const oscillator = this.getOscillatorNode()
    
    gainNode.connect(this.masterGain!)
    oscillator.connect(gainNode)
    
    gainNode.gain.setValueAtTime(0.08, now)
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
    
    oscillator.type = "square"
    oscillator.frequency.setValueAtTime(note * this.bgmPitchMod, now)
    
    // Safely start the oscillator with error handling
    try {
      oscillator.start(now)
      oscillator.stop(now + 0.5)
    } catch (error) {
      console.warn('Failed to start BGM oscillator:', error)
      // Clean up nodes on error
      this.disposeNode(gainNode)
      this.disposeNode(oscillator)
      return
    }
    
    // Schedule cleanup
    this.scheduleNodeCleanup(gainNode, 600)
    this.scheduleNodeCleanup(oscillator, 600)
    
    // Schedule next note with error handling
    this.bgmTimeoutId = setTimeout(() => {
      // Check if we should continue scheduling
      if (this.soundEnabled && this.audioInitialized) {
        this.scheduleNextNote()
      } else {
        console.log('BGM scheduling stopped due to state change')
      }
    }, this.bgmTempo)
  }

  /**
   * Set BGM tempo
   */
  public setBGMTempo(tempo: number): void {
    this.bgmTempo = tempo
  }

  /**
   * Set BGM pitch modulation
   */
  public setBGMPitchMod(pitchMod: number): void {
    this.bgmPitchMod = pitchMod
  }

  /**
   * Enable or disable sound
   */
  public setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled
    if (!enabled) {
      this.stopBGM()
    } else if (this.audioInitialized) {
      this.startBGM()
    }
  }

  /**
   * Get sound enabled state
   */
  public isSoundEnabled(): boolean {
    return this.soundEnabled
  }

  /**
   * Clean up old cache entries
   */
  private cleanupCache(): void {
    const now = Date.now()
    const maxAge = 5 * 60 * 1000 // 5 minutes
    let cleanedMemory = 0
    
    for (const [id, cached] of Array.from(this.effectCache.entries())) {
      if (now - cached.lastUsed > maxAge && cached.useCount < 3) {
        cleanedMemory += cached.size
        this.effectCache.delete(id)
      }
    }
    
    this.cacheTotalMemory -= cleanedMemory
  }

  /**
   * Setup periodic cache cleanup
   */
  private setupCacheCleanup(): void {
    setInterval(() => {
      this.cleanupCache()
    }, this.cacheCleanupInterval)
  }

  /**
   * Get performance statistics
   */
  public getPerformanceStats(): {
    nodesCreated: number
    nodesReused: number
    nodesDisposed: number
    activeNodes: number
    cacheHits: number
    cacheMisses: number
    cacheSize: number
    cacheMemoryUsage: number
    cacheMemoryLimit: number
    reuseRate: number
    cacheHitRate: number
    poolSizes: {
      gainNodes: number
      oscillators: number
      filters: number
    }
    presetCount: number
  } {
    const totalNodes = this.nodesCreated + this.nodesReused
    const reuseRate = totalNodes > 0 ? this.nodesReused / totalNodes : 0
    const totalCacheAccess = this.cacheHits + this.cacheMisses
    const cacheHitRate = totalCacheAccess > 0 ? this.cacheHits / totalCacheAccess : 0
    
    return {
      nodesCreated: this.nodesCreated,
      nodesReused: this.nodesReused,
      nodesDisposed: this.nodesDisposed,
      activeNodes: this.activeNodes.size,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      cacheSize: this.effectCache.size,
      cacheMemoryUsage: this.cacheTotalMemory,
      cacheMemoryLimit: this.maxCacheMemory,
      reuseRate,
      cacheHitRate,
      poolSizes: {
        gainNodes: this.gainNodePool.length,
        oscillators: 0, // Oscillator pool removed
        filters: this.filterNodePool.length
      },
      presetCount: this.effectPresets.size
    }
  }

  /**
   * Reset performance statistics
   */
  public resetPerformanceStats(): void {
    this.nodesCreated = 0
    this.nodesReused = 0
    this.nodesDisposed = 0
    this.cacheHits = 0
    this.cacheMisses = 0
  }

  /**
   * Cleanup all resources
   */
  public cleanup(): void {
    this.stopBGM()
    
    // Clear all active nodes
    for (const node of Array.from(this.activeNodes)) {
      this.disposeNode(node)
    }
    this.activeNodes.clear()
    
    // Clear all cleanup timeouts
    for (const timeout of Array.from(this.nodeCleanupTimeouts.values())) {
      clearTimeout(timeout)
    }
    this.nodeCleanupTimeouts.clear()
    
    // Clear effect cache
    this.effectCache.clear()
    this.cacheTotalMemory = 0
    
    // Clear node pools
    this.gainNodePool.length = 0
    this.filterNodePool.length = 0
    
    // Close audio context
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
    
    this.audioInitialized = false
  }
} 
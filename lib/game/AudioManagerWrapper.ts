/**
 * Audio Manager Wrapper
 * 
 * This module provides a higher-level interface for audio management in the game.
 * It wraps the existing AudioManager to provide game-specific audio functionality
 * and coordinate audio context lifecycle and state management.
 */

import { AudioManager, AudioEffect, AudioEffectPreset } from './AudioManager'

/**
 * Game audio state interface
 */
export interface GameAudioState {
  soundEnabled: boolean
  audioInitialized: boolean
  bgmPlaying: boolean
  bgmTempo: number
  bgmPitchMod: number
}

/**
 * Audio context state interface
 */
export interface AudioContextState {
  state: string
  sampleRate: number
  currentTime: number
}

/**
 * Game-specific sound types
 */
export type GameSoundType = 
  | 'jump'
  | 'dash'
  | 'collect'
  | 'explosion'
  | 'death'
  | 'level_complete'
  | 'game_over'
  | 'ui_click'
  | 'ui_hover'

/**
 * Audio Manager Wrapper Class
 * 
 * Provides a higher-level interface for audio management in the game.
 * Wraps the existing AudioManager to provide game-specific functionality.
 */
export class AudioManagerWrapper {
  private audioManager: AudioManager
  private gameAudioState: GameAudioState
  private audioContextState: AudioContextState | null = null

  constructor() {
    this.audioManager = new AudioManager()
    this.gameAudioState = {
      soundEnabled: true,
      audioInitialized: false,
      bgmPlaying: false,
      bgmTempo: 500,
      bgmPitchMod: 1.0
    }
  }

  /**
   * Initialize the audio context
   */
  public initAudioContext(): boolean {
    const success = this.audioManager.initAudioContext()
    if (success) {
      this.gameAudioState.audioInitialized = true
      this.updateAudioContextState()
    }
    return success
  }

  /**
   * Ensure audio context is running
   */
  public ensureAudioContextRunning(): boolean {
    const success = this.audioManager.ensureAudioContextRunning()
    if (success) {
      this.updateAudioContextState()
    }
    return success
  }

  /**
   * Get current audio context state
   */
  public getAudioContextState(): string {
    return this.audioManager.getAudioContextState()
  }

  /**
   * Get detailed audio context state
   */
  public getAudioContextStateInfo(): AudioContextState | null {
    return this.audioContextState
  }

  /**
   * Update audio context state information
   */
  private updateAudioContextState(): void {
    const audioContext = this.audioManager['audioContext'] as AudioContext | null
    if (audioContext) {
      this.audioContextState = {
        state: audioContext.state,
        sampleRate: audioContext.sampleRate,
        currentTime: audioContext.currentTime
      }
    }
  }

  /**
   * Play a game sound effect
   */
  public playGameSound(soundType: GameSoundType, volume: number = 1.0): void {
    if (!this.gameAudioState.soundEnabled || !this.gameAudioState.audioInitialized) {
      console.log('Audio not ready, skipping sound:', soundType)
      return
    }

    if (!this.ensureAudioContextRunning()) {
      console.warn('Audio context not ready, cannot play sound:', soundType)
      return
    }

    // Map game sound types to audio manager presets
    const presetMap: Record<GameSoundType, string> = {
      jump: 'jump_enhanced',
      dash: 'dash_enhanced',
      collect: 'collect_enhanced',
      explosion: 'explosion',
      death: 'explosion', // Reuse explosion sound for death
      level_complete: 'collect_enhanced', // Reuse collect sound for level complete
      game_over: 'explosion', // Reuse explosion sound for game over
      ui_click: 'ui_click',
      ui_hover: 'ui_click' // Reuse click sound for hover
    }

    const presetName = presetMap[soundType]
    if (presetName) {
      console.log('Playing game sound:', soundType, 'using preset:', presetName)
      this.audioManager.playPreset(presetName, volume)
    } else {
      console.warn('Unknown game sound type:', soundType)
    }
  }

  /**
   * Play a custom audio effect
   */
  public playEffect(effect: AudioEffect, volume: number = 1.0): void {
    if (!this.gameAudioState.soundEnabled || !this.gameAudioState.audioInitialized) {
      return
    }

    if (!this.ensureAudioContextRunning()) {
      return
    }

    this.audioManager.playEffect(effect, volume)
  }

  /**
   * Play a sequence of audio effects
   */
  public playEffectSequence(effects: AudioEffect[], delays: number[] = [], volume: number = 1.0): void {
    if (!this.gameAudioState.soundEnabled || !this.gameAudioState.audioInitialized) {
      return
    }

    if (!this.ensureAudioContextRunning()) {
      return
    }

    this.audioManager.playEffectSequence(effects, delays, volume)
  }

  /**
   * Start background music
   */
  public startBGM(): void {
    console.log('AudioWrapper: Starting BGM, audio context state:', this.getAudioContextState())
    
    if (this.gameAudioState.soundEnabled && this.gameAudioState.audioInitialized) {
      if (this.ensureAudioContextRunning()) {
        this.audioManager.startBGM()
        this.gameAudioState.bgmPlaying = true
      } else {
        console.warn('Cannot start BGM: audio context not ready')
      }
    } else {
      console.log('BGM start conditions not met:', {
        soundEnabled: this.gameAudioState.soundEnabled,
        audioInitialized: this.gameAudioState.audioInitialized
      })
    }
  }

  /**
   * Stop background music
   */
  public stopBGM(): void {
    console.log('AudioWrapper: Stopping BGM')
    this.audioManager.stopBGM()
    this.gameAudioState.bgmPlaying = false
  }

  /**
   * Set BGM tempo
   */
  public setBGMTempo(tempo: number): void {
    this.gameAudioState.bgmTempo = tempo
    this.audioManager.setBGMTempo(tempo)
  }

  /**
   * Set BGM pitch modulation
   */
  public setBGMPitchMod(pitchMod: number): void {
    this.gameAudioState.bgmPitchMod = pitchMod
    this.audioManager.setBGMPitchMod(pitchMod)
  }

  /**
   * Enable or disable sound
   */
  public setSoundEnabled(enabled: boolean): void {
    this.gameAudioState.soundEnabled = enabled
    this.audioManager.setSoundEnabled(enabled)
    
    if (enabled) {
      this.startBGM()
    } else {
      this.stopBGM()
    }
  }

  /**
   * Check if sound is enabled
   */
  public isSoundEnabled(): boolean {
    return this.gameAudioState.soundEnabled
  }

  /**
   * Get current game audio state
   */
  public getGameAudioState(): GameAudioState {
    return { ...this.gameAudioState }
  }

  /**
   * Get available preset names
   */
  public getPresetNames(): string[] {
    return this.audioManager.getPresetNames()
  }

  /**
   * Get a specific preset
   */
  public getPreset(presetName: string): AudioEffectPreset | undefined {
    return this.audioManager.getPreset(presetName)
  }

  /**
   * Get presets by category
   */
  public getPresetsByCategory(category: AudioEffectPreset['category']): AudioEffectPreset[] {
    return this.audioManager.getPresetsByCategory(category)
  }

  /**
   * Get performance statistics
   */
  public getPerformanceStats() {
    return this.audioManager.getPerformanceStats()
  }

  /**
   * Reset performance statistics
   */
  public resetPerformanceStats(): void {
    this.audioManager.resetPerformanceStats()
  }

  /**
   * Get audio statistics for debugging
   */
  public getAudioStats() {
    const perfStats = this.getPerformanceStats()
    return {
      ...perfStats,
      gameAudioState: this.getGameAudioState(),
      audioContextState: this.getAudioContextStateInfo()
    }
  }

  /**
   * Clean up audio resources
   */
  public cleanup(): void {
    this.audioManager.cleanup()
    this.gameAudioState.bgmPlaying = false
    this.audioContextState = null
  }

  /**
   * Resume audio context (for user interaction)
   */
  public resumeAudioContext(): boolean {
    if (!this.gameAudioState.audioInitialized) {
      return this.initAudioContext()
    } else {
      return this.ensureAudioContextRunning()
    }
  }

  /**
   * Handle game state changes that affect audio
   */
  public onGameStateChange(newState: string): void {
    switch (newState) {
      case 'playing':
        if (this.gameAudioState.soundEnabled && this.gameAudioState.audioInitialized) {
          this.startBGM()
        }
        break
      case 'paused':
        // Keep BGM playing but at lower volume (handled by AudioManager)
        break
      case 'gameOver':
        this.stopBGM()
        this.playGameSound('game_over')
        break
      case 'levelComplete':
        this.playGameSound('level_complete')
        break
      case 'start':
        // Stop any playing audio when returning to start screen
        this.stopBGM()
        break
    }
  }

  /**
   * Handle player actions that trigger sounds
   */
  public onPlayerAction(action: 'jump' | 'dash' | 'collect' | 'death'): void {
    switch (action) {
      case 'jump':
        this.playGameSound('jump')
        break
      case 'dash':
        this.playGameSound('dash')
        break
      case 'collect':
        this.playGameSound('collect')
        break
      case 'death':
        this.playGameSound('death')
        break
    }
  }

  /**
   * Handle UI interactions that trigger sounds
   */
  public onUIInteraction(interaction: 'click' | 'hover'): void {
    switch (interaction) {
      case 'click':
        this.playGameSound('ui_click')
        break
      case 'hover':
        this.playGameSound('ui_hover', 0.5) // Lower volume for hover
        break
    }
  }
} 
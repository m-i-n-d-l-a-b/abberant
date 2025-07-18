/**
 * Game Communication Interface Types
 * 
 * This file contains TypeScript definitions for the enhanced GameRef interface
 * and related types used for communication between the Game component and
 * parent components like VFX wrappers.
 */

// Canvas effect settings interface
export interface CanvasEffectSettings {
  /** Wobble effect - makes objects move in a wave pattern */
  wobble: { 
    enabled: boolean;
    amplitude: number;    // How far objects move (1-20)
    frequency: number;    // How often the wave repeats (0.01-0.2)
    speed: number;        // How fast the wave moves (0.001-0.01)
  };
  
  /** Upside down effect - flips the entire game vertically */
  upsideDown: { enabled: boolean };
  
  /** Invert effect - inverts all colors */
  invert: { enabled: boolean };
  
  /** Backwards effect - reverses game direction and controls */
  backwards: { enabled: boolean };
  
  /** Melting effect - makes objects appear to melt/drip */
  melting: { 
    enabled: boolean;
    intensity: number;    // How much melting occurs (0.1-5)
    speed: number;        // How fast melting happens (0.001-0.05)
  };
  
  /** Data bleed effect - creates screen capture artifacts */
  dataBleed: { 
    enabled: boolean;
    intensity: number;    // How strong the effect is (0.1-3)
    duration: number;     // How long effects last (10-120 frames)
  };
}

// Game state information interface
export interface GameStateInfo {
  /** Current game state: "start", "playing", "paused", "gameover", "transition" */
  gameState: string;
  
  /** Current level number */
  currentLevel: number;
  
  /** Remaining lives */
  lives: number;
  
  /** Current score */
  score: number;
  
  /** Current combo count */
  combo: number;
  
  /** Best combo achieved this session */
  bestCombo: number;
  
  /** Whether the game is paused */
  paused: boolean;
  
  /** Whether the game is running backwards */
  isReversed: boolean;
  
  /** Current progress through the level (0-100) */
  levelProgress: number;
  
  /** Target distance to complete the level */
  levelTarget: number;
  
  /** Array of active level effects */
  levelEffects: string[];
}

// Performance metrics interface
export interface PerformanceMetrics {
  /** Current frames per second */
  fps: number;
  
  /** Total frames rendered since start */
  frameCount: number;
  
  /** Last frame timestamp */
  lastTime: number;
  
  /** Whether the Effects Lab is unlocked */
  isEffectsLabUnlocked: boolean;
  
  /** Currently active custom effects */
  activeCustomEffects: any;
}

// Effects Lab state interface
export interface EffectsLabState {
  /** Current canvas effect settings */
  settings: CanvasEffectSettings;
  
  /** Saved effect presets */
  presets: Array<{ name: string; settings: any }>;
  
  /** Currently selected preset name */
  selectedPresetName: string;
}

/**
 * Enhanced GameRef Interface
 * 
 * This interface provides comprehensive access to the game's state,
 * canvas effects, and control methods for parent components.
 */
export interface GameRef {
  // Canvas effect management
  /** Set custom effects to override level effects */
  setActiveCustomEffects: (effects: any) => void;
  
  /** Get currently active custom effects */
  getActiveCustomEffects: () => any;
  
  /** Force an update of all canvas effects */
  updateEffects: () => void;
  
  // Canvas effect settings
  /** Get current canvas effect settings */
  getCanvasEffectSettings: () => CanvasEffectSettings;
  
  /** Set canvas effect settings */
  setCanvasEffectSettings: (settings: CanvasEffectSettings) => void;
  
  // Game state information
  /** Get comprehensive game state information */
  getGameState: () => GameStateInfo;
  
  // Performance metrics
  /** Get performance and technical metrics */
  getPerformanceMetrics: () => PerformanceMetrics;
  
  // Effects Lab state
  /** Get complete Effects Lab state */
  getEffectsLabState: () => EffectsLabState;
  
  /** Save current settings as a preset */
  saveEffectsLabPreset: (presetName: string) => void;
  
  /** Load a saved preset */
  loadEffectsLabPreset: (presetName: string) => void;
  
  /** Delete a saved preset */
  deleteEffectsLabPreset: (presetName: string) => void;
  
  // Game control methods
  /** Toggle game pause state */
  togglePause: () => void;
  
  /** Reset the current level (optionally reset score/lives) */
  resetLevel: (fullReset?: boolean) => void;
  
  /** Advance to the next level */
  nextLevel: () => void;
}

/**
 * Example usage:
 * 
 * ```typescript
 * import { GameRef, CanvasEffectSettings } from './types/game-ref';
 * 
 * const gameRef = useRef<GameRef>(null);
 * 
 * // Get game state
 * const gameState = gameRef.current?.getGameState();
 * 
 * // Set canvas effects
 * const newSettings: CanvasEffectSettings = {
 *   wobble: { enabled: true, amplitude: 10, frequency: 0.1, speed: 0.005 },
 *   upsideDown: { enabled: false },
 *   invert: { enabled: false },
 *   backwards: { enabled: false },
 *   melting: { enabled: false, intensity: 1, speed: 0.01 },
 *   dataBleed: { enabled: false, intensity: 1, duration: 20 }
 * };
 * gameRef.current?.setCanvasEffectSettings(newSettings);
 * 
 * // Get performance metrics
 * const metrics = gameRef.current?.getPerformanceMetrics();
 * console.log(`FPS: ${metrics?.fps}`);
 * ```
 */ 
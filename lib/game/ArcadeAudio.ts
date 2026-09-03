/**
 * Arcade Audio
 *
 * The procedural WebAudio layer shared by every game mode: a handful of
 * oscillator-based sound effects and a generative chiptune loop whose tempo and
 * pitch drift over time.
 *
 * Lifted out of GameEngine so a second mode can sound like the first without
 * duplicating the graph wiring. GameEngine keeps its original field and method
 * names by delegating here.
 */

/** Sound effect names the SFX table understands. */
export type ArcadeSound =
  | 'jump'
  | 'dash'
  | 'collect'
  | 'stomp'
  | 'hit'
  | 'levelUp'

/** Notes the BGM scheduler picks from, in Hz. */
const BGM_NOTES = [220.0, 261.63, 329.63, 392.0]

/** Tempo (ms between notes) at the centre of its modulation range. */
const BGM_BASE_TEMPO_MS = 500

/** How far tempo swings either side of the base, in ms. */
const BGM_TEMPO_SWING_MS = 200

/** How far pitch swings either side of unison, as a multiplier. */
const BGM_PITCH_SWING = 0.05

export class ArcadeAudio {
  audioCtx: AudioContext | null = null
  soundEnabled = true
  audioInitialized = false
  bgmTimeoutId: ReturnType<typeof setTimeout> | null = null
  bgmTempo = BGM_BASE_TEMPO_MS
  bgmPitchMod = 1.0
  masterGain: GainNode | null = null
  delayNode: DelayNode | null = null
  feedbackGain: GainNode | null = null

  /**
   * Whether the owning mode is paused. The BGM scheduler stops rather than
   * queueing notes behind a pause.
   */
  private isPaused: () => boolean

  constructor(isPaused: () => boolean = () => false) {
    this.isPaused = isPaused
  }

  /**
   * Reset every field to its pre-initialisation value.
   *
   * Does not tear down an existing AudioContext, so call stopBGM first if one
   * is running.
   */
  reset(): void {
    this.audioCtx = null
    this.soundEnabled = true
    this.audioInitialized = false
    this.bgmTimeoutId = null
    this.bgmTempo = BGM_BASE_TEMPO_MS
    this.bgmPitchMod = 1.0
    this.delayNode = null
    this.feedbackGain = null
    this.masterGain = null
  }

  /**
   * Build the audio graph and start the BGM.
   *
   * Browsers only allow this from a user gesture, so it runs on first input
   * rather than at construction.
   */
  init(): void {
    if (this.audioInitialized) return
    if (!this.audioCtx) {
      this.audioCtx = new ((window.AudioContext ||
        (window as any).webkitAudioContext) as typeof AudioContext)()
    }
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume()

    this.masterGain = this.audioCtx.createGain()
    this.delayNode = this.audioCtx.createDelay(1.0)
    this.feedbackGain = this.audioCtx.createGain()
    this.delayNode.delayTime.value = 0.25
    this.feedbackGain.gain.value = 0.4
    this.masterGain.connect(this.delayNode)
    this.masterGain.connect(this.audioCtx.destination)
    this.delayNode.connect(this.audioCtx.destination)
    this.delayNode.connect(this.feedbackGain)
    this.feedbackGain.connect(this.delayNode)

    this.audioInitialized = true
    this.startBGM()
  }

  /**
   * Play a one-shot sound effect. Unknown names are silent.
   */
  playSound(type: string): void {
    if (!this.soundEnabled || !this.audioCtx) return
    const now = this.audioCtx.currentTime
    const gainNode = this.audioCtx.createGain()
    gainNode.connect(this.audioCtx.destination)
    const oscillator = this.audioCtx.createOscillator()
    oscillator.connect(gainNode)

    switch (type) {
      case 'jump':
        gainNode.gain.setValueAtTime(0.2, now)
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.2)
        oscillator.frequency.setValueAtTime(440, now)
        oscillator.frequency.exponentialRampToValueAtTime(880, now + 0.2)
        break
      case 'dash':
        gainNode.gain.setValueAtTime(0.3, now)
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.4)
        oscillator.type = 'sawtooth'
        oscillator.frequency.setValueAtTime(100, now)
        oscillator.frequency.exponentialRampToValueAtTime(1200, now + 0.4)
        break
      case 'collect':
        gainNode.gain.setValueAtTime(0.2, now)
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
        oscillator.frequency.setValueAtTime(880, now)
        oscillator.frequency.exponentialRampToValueAtTime(1760, now + 0.15)
        break
      case 'stomp':
        gainNode.gain.setValueAtTime(0.4, now)
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
        oscillator.type = 'square'
        oscillator.frequency.setValueAtTime(400, now)
        oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.3)
        break
      case 'hit':
        gainNode.gain.setValueAtTime(0.5, now)
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
        oscillator.type = 'sawtooth'
        oscillator.frequency.setValueAtTime(200, now)
        oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.5)
        break
      case 'levelUp':
        gainNode.gain.setValueAtTime(0.25, now)
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.6)
        oscillator.type = 'triangle'
        oscillator.frequency.setValueAtTime(330, now)
        oscillator.frequency.exponentialRampToValueAtTime(1320, now + 0.6)
        break
    }

    oscillator.start(now)
    oscillator.stop(now + 1)
  }

  /**
   * Play one BGM note and queue the next at the current tempo.
   */
  scheduleNextNote(): void {
    if (!this.soundEnabled || !this.audioCtx || this.isPaused()) return
    const now = this.audioCtx.currentTime
    const note = BGM_NOTES[Math.floor(Math.random() * BGM_NOTES.length)]

    const gainNode = this.audioCtx.createGain()
    gainNode.connect(this.masterGain!)
    gainNode.gain.setValueAtTime(0.08, now)
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5)

    const oscillator = this.audioCtx.createOscillator()
    oscillator.connect(gainNode)
    oscillator.type = 'square'
    oscillator.frequency.setValueAtTime(note * this.bgmPitchMod, now)
    oscillator.start(now)
    oscillator.stop(now + 0.5)

    this.bgmTimeoutId = setTimeout(() => this.scheduleNextNote(), this.bgmTempo)
  }

  startBGM(): void {
    this.stopBGM()
    if (this.soundEnabled && this.audioInitialized && !this.isPaused()) {
      this.scheduleNextNote()
    }
  }

  stopBGM(): void {
    if (this.bgmTimeoutId) {
      clearTimeout(this.bgmTimeoutId)
      this.bgmTimeoutId = null
    }
  }

  /**
   * Drift the BGM tempo and pitch so the loop never settles.
   *
   * `now` is injectable so tests need not depend on the wall clock.
   */
  updateBGMEffects(now: number = Date.now()): void {
    if (!this.soundEnabled || this.isPaused()) return
    const time = now / 2000
    this.bgmTempo = BGM_BASE_TEMPO_MS + Math.sin(time) * BGM_TEMPO_SWING_MS
    this.bgmPitchMod = 1.0 + Math.sin(time * 4) * BGM_PITCH_SWING
  }

  /**
   * Flip sound on or off, starting or stopping the BGM to match.
   */
  setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled
    if (enabled) {
      this.startBGM()
    } else {
      this.stopBGM()
    }
  }
}

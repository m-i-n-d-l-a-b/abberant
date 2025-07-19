'use client'

import { useEffect, useRef } from 'react'

interface GameState {
  gameState: string
  currentLevel: number
  lives: number
  score: number
  paused: boolean
}

interface Player {
  x: number
  y: number
  width: number
  height: number
  velX: number
  velY: number
  speed: number
  jumpPower: number
  grounded: boolean
  doubleJump: boolean
  dashCooldown: number
  invulnerable: number
  color: string
  trail: Array<{ x: number; y: number }>
  respawning: boolean
}

interface Platform {
  x: number
  y: number
  width: number
  height: number
  color: string
  type: string
  liquidPixels: Array<{ x: number; y: number; velX: number; velY: number; opacity: number; size: number }>
  distortionOffset: number
}

interface Enemy {
  x: number
  y: number
  width: number
  height: number
  velX: number
  velY: number
  speed: number
  color: string
  movementType: 'horizontal' | 'vertical'
  startY: number
  moveRange: number
  stompZoneActive: boolean
}

interface Collectible {
  x: number
  y: number
  width: number
  height: number
  color: string
  collected: boolean
  value: number
}

interface BackgroundStar {
  x: number
  y: number
  size: number
  parallax: number
  hue: number
  pulseSpeed: number
  pulsePhase: number
  twinkleSpeed: number
  twinklePhase: number
  shape: 'circle' | 'diamond' | 'triangle'
  brightness: number
  glowRadius: number
}

interface DataBleedEffect {
  x: number
  y: number
  duration: number
  size: number
}

interface Effects {
  glitchOffset: { x: number; y: number }
  meltingFactor: number
  colorShift: number
  pulseFactor: number
  blurFactor: number
  noiseFactor: number
  rgbShiftFactor: number
  waveFactor: number
  zoomFactor: number
  rotationFactor: number
  pixelBleedFactor: number
}

interface Camera {
  x: number
  y: number
  targetX: number
  targetY: number
  smoothing: number
}

interface Keys {
  [key: string]: boolean
}

interface TouchInput {
  left: boolean
  right: boolean
  jump: boolean
  dash: boolean
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
  size: number
}

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<any>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    class PolishedTrippySideScroller {
      canvas: HTMLCanvasElement
      ctx: CanvasRenderingContext2D
      width: number
      height: number
      gameState!: string
      currentLevel!: number
      lives!: number
      score!: number
      paused!: boolean
      // isReversed is used only for level progress calculation when backwards effect is active
      isReversed!: boolean
      player!: Player
      camera!: Camera
      keys!: Keys
      touchInput!: TouchInput
      effects!: Effects
      levelProgress!: number
      levelTarget!: number
      platforms!: Platform[]
      enemies!: Enemy[]
      collectibles!: Collectible[]
      backgroundStars!: BackgroundStar[]
      dataBleedEffects!: DataBleedEffect[]
      transitionTimer!: number
      levelEffects!: string[]
      frameCount!: number
      lastTime!: number
      fps!: number
      audioCtx!: AudioContext | null
      soundEnabled!: boolean
      audioInitialized!: boolean
      bgmTimeoutId!: NodeJS.Timeout | null
      bgmTempo!: number
      bgmPitchMod!: number
      delayNode!: DelayNode | null
      feedbackGain!: GainNode | null
      masterGain!: GainNode | null
      inputSetupDone!: boolean
      animationFrameId!: number | null
      startButtonHandler!: () => void
      keydownHandler!: (e: KeyboardEvent) => void
      keyupHandler!: (e: KeyboardEvent) => void
      mobileHandlers!: Array<{ button: Element; handleStart: (e: Event) => void; handleEnd: (e: Event) => void }>
      soundToggleHandler!: () => void
      cameraZoom!: number;
      transitionPhase!: 'none' | 'zoomIn' | 'transition' | 'zoomOut';
      transitionProgress!: number;
      levelStartInvincibility!: number;
      particles!: Particle[]; // Canvas-based particles

      constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas
        this.ctx = canvas.getContext('2d')!
        this.width = 800
        this.height = 600
        this.setupAudio()
        this.init()
      }

      init() {
        this.gameState = "start"
        this.currentLevel = 1
        this.lives = 3
        this.score = 0
        this.paused = false
        this.isReversed = false
        this.cameraZoom = 1
        this.transitionPhase = 'none'
        this.transitionProgress = 0
        this.levelStartInvincibility = 2
        this.particles = []

        this.player = {
          x: 100,
          y: 400,
          width: 20,
          height: 20,
          velX: 0,
          velY: 0,
          speed: 6,
          jumpPower: 16,
          grounded: false,
          doubleJump: false,
          dashCooldown: 0,
          invulnerable: 0,
          color: "#00ffff",
          trail: [],
          respawning: false,
        }
        this.camera = { x: 0, y: 0, targetX: 0, targetY: 0, smoothing: 0.1 }
        this.keys = {}
        this.touchInput = {
          left: false,
          right: false,
          jump: false,
          dash: false,
        }

        if (!this.inputSetupDone) {
          this.setupInput()
          this.setupMobileControls()
          this.setupSoundToggle()
          this.inputSetupDone = true
        }

        this.effects = {
          glitchOffset: { x: 0, y: 0 },
          meltingFactor: 0,
          colorShift: 0,
          pulseFactor: 1,
          blurFactor: 0,
          noiseFactor: 0,
          rgbShiftFactor: 0,
          waveFactor: 0,
          zoomFactor: 0,
          rotationFactor: 0,
          pixelBleedFactor: 0,
        }
        this.levelProgress = 0
        this.levelTarget = 1800

        this.platforms = []
        this.enemies = []
        this.collectibles = []
        this.backgroundStars = []

        this.dataBleedEffects = []
        this.transitionTimer = 0
        this.levelEffects = []

        this.frameCount = 0
        this.lastTime = performance.now()
        this.fps = 60

        this.showStartScreen()
        this.generateLevel()

        if (!this.animationFrameId) {
          this.gameLoop()
        }
      }

      showStartScreen() {
        const startScreen = document.getElementById("startScreen")
        const gameOverScreen = document.getElementById("gameOverScreen")
        const pauseScreen = document.getElementById("pauseScreen")
        
        if (startScreen) startScreen.style.display = "flex"
        if (gameOverScreen) gameOverScreen.style.display = "none"
        if (pauseScreen) pauseScreen.style.display = "none"
      }

      startGame() {
        if (this.gameState !== "start") return
        this.gameState = "playing"
        const startScreen = document.getElementById("startScreen")
        if (startScreen) startScreen.style.display = "none"
        this.initAudioContext()
      }

      generateBackground() {
        this.backgroundStars = []
        const starCount = 100 // Slightly fewer for dream aesthetic
        const levelWidth = 3000 + this.currentLevel * 500
        
        // Create different types of dream elements with varying properties
        for (let i = 0; i < starCount; i++) {
          const elementType = Math.random()
          let size, hue, parallax, pulseSpeed, twinkleSpeed, brightness, glowRadius
          
          if (elementType < 0.35) {
            // Small dream sparkles (35%)
            size = Math.random() * 2.0 + 0.5
            hue = Math.random() * 120 + 200 // Purple to pink to orange
            parallax = Math.random() * 0.4 + 0.1
            pulseSpeed = Math.random() * 0.02 + 0.008
            twinkleSpeed = Math.random() * 0.01 + 0.003
            brightness = Math.random() * 0.4 + 0.6
            glowRadius = Math.random() * 2.0 + 1.0
          } else if (elementType < 0.65) {
            // Medium dream orbs (30%)
            size = Math.random() * 3.0 + 1.5
            hue = Math.random() * 100 + 180 // Blue to purple
            parallax = Math.random() * 0.3 + 0.05
            pulseSpeed = Math.random() * 0.012 + 0.005
            twinkleSpeed = Math.random() * 0.006 + 0.002
            brightness = Math.random() * 0.5 + 0.5
            glowRadius = Math.random() * 3.0 + 2.0
          } else if (elementType < 0.85) {
            // Large dream wisps (20%)
            size = Math.random() * 4.0 + 2.5
            hue = Math.random() * 80 + 160 // Green to blue
            parallax = Math.random() * 0.25 + 0.03
            pulseSpeed = Math.random() * 0.008 + 0.003
            twinkleSpeed = Math.random() * 0.004 + 0.001
            brightness = Math.random() * 0.3 + 0.7
            glowRadius = Math.random() * 4.0 + 2.5
          } else {
            // Rare dream portals (15%)
            size = Math.random() * 5.0 + 3.5
            hue = Math.random() * 60 + 140 // Yellow to green
            parallax = Math.random() * 0.2 + 0.02
            pulseSpeed = Math.random() * 0.005 + 0.002
            twinkleSpeed = Math.random() * 0.002 + 0.0005
            brightness = Math.random() * 0.2 + 0.8
            glowRadius = Math.random() * 5.0 + 3.0
          }
          
          this.backgroundStars.push({
            x: Math.random() * levelWidth,
            y: Math.random() * this.height,
            size: size,
            parallax: parallax,
            hue: hue,
            pulseSpeed: pulseSpeed,
            pulsePhase: Math.random() * Math.PI * 2,
            twinkleSpeed: twinkleSpeed,
            twinklePhase: Math.random() * Math.PI * 2,
            shape: (['circle', 'diamond', 'triangle'] as const)[Math.floor(Math.random() * 3)],
            brightness: brightness,
            glowRadius: glowRadius,
          })
        }
      }

      updateBGMEffects() {
        if (!this.soundEnabled || this.paused) return
        const time = Date.now() / 2000
        const modulation = Math.sin(time)
        this.bgmTempo = 500 + modulation * 200
        this.bgmPitchMod = 1.0 + Math.sin(time * 4) * 0.05
      }

      restart() {
        this.init()
      }

      setupAudio() {
        this.audioCtx = null
        this.soundEnabled = true
        this.audioInitialized = false
        this.bgmTimeoutId = null
        this.bgmTempo = 500
        this.bgmPitchMod = 1.0
        this.delayNode = null
        this.feedbackGain = null
        this.masterGain = null
      }

      initAudioContext() {
        if (this.audioInitialized) return
        if (!this.audioCtx) {
          this.audioCtx = new ((window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext)()
        }
        if (this.audioCtx.state === "suspended") this.audioCtx.resume()
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

      playSound(type: string) {
        if (!this.soundEnabled || !this.audioCtx) return
        const now = this.audioCtx.currentTime
        const gainNode = this.audioCtx.createGain()
        gainNode.connect(this.audioCtx.destination)
        const oscillator = this.audioCtx.createOscillator()
        oscillator.connect(gainNode)
        switch (type) {
          case "jump":
            gainNode.gain.setValueAtTime(0.2, now)
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.2)
            oscillator.frequency.setValueAtTime(440, now)
            oscillator.frequency.exponentialRampToValueAtTime(880, now + 0.2)
            break
          case "dash":
            gainNode.gain.setValueAtTime(0.3, now)
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.4)
            oscillator.type = "sawtooth"
            oscillator.frequency.setValueAtTime(100, now)
            oscillator.frequency.exponentialRampToValueAtTime(
              1200,
              now + 0.4
            )
            break
          case "collect":
            gainNode.gain.setValueAtTime(0.2, now)
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
            oscillator.frequency.setValueAtTime(880, now)
            oscillator.frequency.exponentialRampToValueAtTime(
              1760,
              now + 0.15
            )
            break
          case "stomp":
            gainNode.gain.setValueAtTime(0.4, now)
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
            oscillator.type = "square"
            oscillator.frequency.setValueAtTime(400, now)
            oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.3)
            break
          case "hit":
            gainNode.gain.setValueAtTime(0.5, now)
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
            oscillator.type = "sawtooth"
            oscillator.frequency.setValueAtTime(200, now)
            oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.5)
            break
        }
        oscillator.start(now)
        oscillator.stop(now + 1)
      }

      scheduleNextNote() {
        if (!this.soundEnabled || !this.audioCtx || this.paused) return
        const now = this.audioCtx.currentTime
        const notes = [220.0, 261.63, 329.63, 392.0]
        const note = notes[Math.floor(Math.random() * notes.length)]
        const gainNode = this.audioCtx.createGain()
        gainNode.connect(this.masterGain!)
        gainNode.gain.setValueAtTime(0.08, now)
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
        const oscillator = this.audioCtx.createOscillator()
        oscillator.connect(gainNode)
        oscillator.type = "square"
        oscillator.frequency.setValueAtTime(note * this.bgmPitchMod, now)
        oscillator.start(now)
        oscillator.stop(now + 0.5)
        this.bgmTimeoutId = setTimeout(
          () => this.scheduleNextNote(),
          this.bgmTempo
        )
      }

      startBGM() {
        this.stopBGM()
        if (this.soundEnabled && this.audioInitialized && !this.paused)
          this.scheduleNextNote()
      }

      stopBGM() {
        if (this.bgmTimeoutId) {
          clearTimeout(this.bgmTimeoutId)
          this.bgmTimeoutId = null
        }
      }

      setupInput() {
        const startButton = document.getElementById("startButton")
        if (startButton) {
          this.startButtonHandler = () => this.startGame()
          startButton.addEventListener("click", this.startButtonHandler)
        }
        
        this.keydownHandler = (e: KeyboardEvent) => {
          if (this.gameState === "start" && e.key === "Enter") {
            this.startGame()
            return
          }
          this.keys[e.key.toLowerCase()] = true
          if (
            e.key === " " ||
            e.key === "ArrowUp" ||
            e.key.toLowerCase() === "w"
          ) {
            this.jump()
            e.preventDefault()
          }
          if (e.key.toLowerCase() === "shift") {
            this.dash()
            e.preventDefault()
          }
          if (e.key.toLowerCase() === "p") {
            this.togglePause()
            e.preventDefault()
          }
          if (e.key.toLowerCase() === "r") {
            this.restart()
          }
        }
        
        this.keyupHandler = (e: KeyboardEvent) => {
          this.keys[e.key.toLowerCase()] = false
        }
        
        document.addEventListener("keydown", this.keydownHandler)
        document.addEventListener("keyup", this.keyupHandler)
      }

      setupMobileControls() {
        this.mobileHandlers = []
        const mobileButtons = document.querySelectorAll(".mobile-button")
        mobileButtons.forEach((button) => {
          const action = button.getAttribute("data-action")
          const handleStart = (e: Event) => {
            e.preventDefault()
            this.handleMobileInput(action!, true)
          }
          const handleEnd = (e: Event) => {
            e.preventDefault()
            this.handleMobileInput(action!, false)
          }
          button.addEventListener("touchstart", handleStart)
          button.addEventListener("touchend", handleEnd)
          this.mobileHandlers.push({ button, handleStart, handleEnd })
        })
      }

      handleMobileInput(action: string, pressed: boolean) {
        if (this.gameState === "start") {
          this.startGame()
          return
        }
        if (this.gameState !== "playing") return
        switch (action) {
          case "left":
            this.touchInput.left = pressed
            break
          case "right":
            this.touchInput.right = pressed
            break
          case "jump":
            if (pressed) this.jump()
            break
          case "dash":
            if (pressed) this.dash()
            break
          case "pause":
            if (pressed) this.togglePause()
            break
        }
      }

      setupSoundToggle() {
        const soundToggle = document.getElementById("soundToggle")
        if (soundToggle) {
          this.soundToggleHandler = () => {
            if (this.gameState === "start") this.startGame()
            if (!this.audioInitialized) this.initAudioContext()
            this.soundEnabled = !this.soundEnabled
            soundToggle.textContent = this.soundEnabled
              ? "🔊 Sound: ON"
              : "🔇 Sound: OFF"
            if (this.soundEnabled) {
              this.startBGM()
            } else {
              this.stopBGM()
            }
          }
          soundToggle.addEventListener("click", this.soundToggleHandler)
        }
      }

      generateLevel() {
        this.platforms = []
        this.enemies = []
        this.collectibles = []
        this.assignLevelEffects()

        const levelWidth = 3000 + this.currentLevel * 500
        this.levelTarget = levelWidth
        this.generateBackground()

        this.player.x = 100
        this.player.y = 400 // Always normal starting position

        const platformCount = 15 + this.currentLevel * 3
        this.platforms.push({
          x: 0,
          y: 550,
          width: 200,
          height: 50,
          color: "#ff00ff",
          type: "normal",
          liquidPixels: [],
          distortionOffset: 0,
        })
        for (let i = 1; i < platformCount; i++) {
          const x =
            (i * levelWidth) / platformCount + Math.random() * 100 - 50
          const y = 200 + Math.sin(i * 0.5) * 150 + Math.random() * 100
          const width = 80 + Math.random() * 120
          this.platforms.push({
            x,
            y,
            width,
            height: 20,
            color: `hsl(${(i * 30) % 360}, 70%, 50%)`,
            type: "normal",
            liquidPixels: [],
            distortionOffset: 0,
          })
        }
        for (let i = 0; i < 8 + this.currentLevel * 2; i++) { // Increased from 5 + this.currentLevel to 8 + this.currentLevel * 2
          const platform =
            this.platforms[Math.floor(Math.random() * this.platforms.length)]
          
          // Skip platforms too close to player spawn (safe zone)
          if (platform.x < 300) continue
          
          // Add vertical variety - enemies can be on different heights
          const enemyY = platform.y - 15 - (Math.random() * 50) // Random height variation
          
          this.enemies.push({
            x: platform.x + Math.random() * platform.width,
            y: enemyY,
            width: 15,
            height: 15,
            velX: Math.random() < 0.5 ? 1 : -1,
            velY: 0, // Horizontal enemies don't move vertically
            speed: 1 + Math.random(),
            color: `hsl(${Math.random() * 360}, 100%, 50%)`,
            movementType: 'horizontal',
            startY: enemyY,
            moveRange: 100,
            stompZoneActive: false,
          })
        }

        // Add vertical enemies (about 30% of total enemies, minimum 1)
        const totalEnemies = 8 + this.currentLevel * 2
        const verticalEnemyCount = Math.max(1, Math.floor(totalEnemies * 0.3))
        for (let i = 0; i < verticalEnemyCount; i++) {
          const platform =
            this.platforms[Math.floor(Math.random() * this.platforms.length)]
          
          // Skip platforms too close to player spawn (safe zone)
          if (platform.x < 300) continue
          
          // Vertical enemies start at platform level and move up/down
          const startY = platform.y - 15
          const moveRange = 60 + Math.random() * 40 // 60-100 pixel movement range
          
          this.enemies.push({
            x: platform.x + Math.random() * platform.width,
            y: startY,
            width: 15,
            height: 15,
            velX: 0, // Vertical enemies don't move horizontally
            velY: Math.random() < 0.5 ? 1 : -1,
            speed: 0.8 + Math.random() * 0.8, // Slightly slower than horizontal enemies
            color: `hsl(${Math.random() * 360}, 100%, 50%)`,
            movementType: 'vertical',
            startY: startY,
            moveRange: moveRange,
            stompZoneActive: false,
          })
        }
        for (let i = 0; i < 8 + this.currentLevel; i++) {
          const platform =
            this.platforms[Math.floor(Math.random() * this.platforms.length)]
          
          // Skip platforms too close to player spawn (safe zone)
          if (platform.x < 300) continue
          
          // Randomly choose black or white
          const color = Math.random() < 0.5 ? "#000" : "#fff"
          this.collectibles.push({
            x: platform.x + Math.random() * platform.width,
            y: platform.y - 30,
            width: 12,
            height: 12,
            color,
            collected: false,
            value: 100,
          })
        }
      }

      assignLevelEffects() {
        const effectPool = [
          "glitch",
          "melting",
          "chromatic",
          "pulsing",
          "wobble",
          "scanlines",
          "upsideDown",
          "invert",
          "backwards",
          "blur",
          "noise",
          "rgbShift",
          "wave",
          "zoom",
          "rotation",
          "pixelBleed",
        ]
        this.levelEffects = []
        this.isReversed = false

        // Filter out disorienting effects for level 1
        let availableEffects = [...effectPool]
        if (this.currentLevel === 1) {
          availableEffects = availableEffects.filter(effect => 
            effect !== "upsideDown" && 
            effect !== "backwards" && 
            effect !== "rotation" &&
            effect !== "zoom"
          )
        }

        // Shuffle the effect pool
        for (let i = availableEffects.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[availableEffects[i], availableEffects[j]] = [availableEffects[j], availableEffects[i]]
        }
        
        // Improved effect count based on level progression
        let effectCount: number
        if (this.currentLevel <= 3) {
          // Early levels: 1-2 effects (60% chance of 2)
          effectCount = Math.random() > 0.4 ? 2 : 1
        } else if (this.currentLevel <= 6) {
          // Mid levels: 2-3 effects (70% chance of 3)
          effectCount = Math.random() > 0.3 ? 3 : 2
        } else if (this.currentLevel <= 10) {
          // High levels: 2-4 effects (50% chance of 4)
          effectCount = Math.random() > 0.5 ? 4 : 2
        } else {
          // Extreme levels: 3-5 effects (always at least 3)
          effectCount = Math.random() > 0.3 ? 5 : 3
        }

        // Ensure we don't exceed available effects
        effectCount = Math.min(effectCount, availableEffects.length)

        // Add random effects
        for (let i = 0; i < effectCount; i++) {
          this.levelEffects.push(availableEffects[i])
        }

        // Set the reversed flag if 'backwards' is chosen
        if (this.levelEffects.includes("backwards")) {
          this.isReversed = true
        }
      }

      nextLevel() {
        // Prevent multiple level transitions
        if (this.gameState === "transition") return
        
        this.gameState = "transition"
        this.transitionPhase = 'zoomIn'
        this.transitionProgress = 0
        this.stopBGM()
      }



      update() {
        if (this.paused) return
        switch (this.gameState) {
          case "start":
            break
          case "playing":
            this.updateGame()
            break
          case "transition":
            this.updateTransition()
            break
          case "gameover":
            break
        }
      }

      updateTransition() {
        // 1s zoomIn, 0.5s transition, 0.5s zoomOut
        // 60fps assumed, so 60, 30, 30 frames
        if (this.transitionPhase === 'zoomIn') {
          this.transitionProgress++
          const t = Math.min(1, this.transitionProgress / 60)
          this.cameraZoom = 1 + 1.5 * t // zoom from 1 to 2.5
          if (t >= 1) {
            // Load new level after zoom in completes
            this.currentLevel++
            this.score += 1000 * this.currentLevel
            this.resetLevel(false)
            this.transitionPhase = 'transition'
            this.transitionProgress = 0
            // Keep camera zoomed in at 2.5
            this.cameraZoom = 2.5
          }
        } else if (this.transitionPhase === 'transition') {
          this.transitionProgress++
          if (this.transitionProgress >= 30) { // Reduced from 60 to 30 for faster transition
            this.transitionPhase = 'zoomOut'
            this.transitionProgress = 0
          }
        } else if (this.transitionPhase === 'zoomOut') {
          this.transitionProgress++
          const t = Math.min(1, this.transitionProgress / 30)
          this.cameraZoom = 2.5 - 1.5 * t // zoom from 2.5 to 1
          if (t >= 1) {
            this.cameraZoom = 1
            this.transitionPhase = 'none'
            this.gameState = 'playing'
            this.startBGM()
            // Reset camera to normal position
            this.camera.x = this.player.x - this.width / 3
            this.camera.y = 0
          }
        }
      }

      updateGame() {
        this.updateBGMEffects()
        if (this.player.dashCooldown > 0) this.player.dashCooldown--
        if (this.player.invulnerable > 0) this.player.invulnerable--
        if (this.levelStartInvincibility > 0) this.levelStartInvincibility--
        this.handleInput()
        this.updatePlayer()
        this.updateEnemies()
        this.updateEffects()
        this.updateDataBleed()
        this.updateCamera()
        this.checkCollisions()
        this.updateUI()
        this.updateParticles()

        if (this.isReversed) {
          this.levelProgress =
            ((this.levelTarget - this.player.x) / this.levelTarget) * 100
          if (this.player.x <= 100 && this.gameState === "playing") this.nextLevel()
        } else {
          this.levelProgress = (this.player.x / this.levelTarget) * 100
          if (this.levelProgress >= 100 && this.gameState === "playing") this.nextLevel()
        }
      }

      handleInput() {
        // Don't allow input if player is respawning
        if (this.player.respawning) {
          this.player.velX *= 0.8
          return
        }

        const leftPressed =
          this.keys["a"] ||
          this.keys["arrowleft"] ||
          this.touchInput.left
        const rightPressed =
          this.keys["d"] ||
          this.keys["arrowright"] ||
          this.touchInput.right

        if (leftPressed) {
          this.player.velX = -this.player.speed
        } else if (rightPressed) {
          this.player.velX = this.player.speed
        } else this.player.velX *= 0.8

        if (this.levelEffects.includes("invert")) this.player.velX *= -1
      }

      jump() {
        if (this.paused || this.gameState !== "playing") return
        // Always jump upwards (same as normal mode)
        const jumpDirection = -1
        if (this.player.grounded) {
          this.player.velY = jumpDirection * this.player.jumpPower
          this.player.grounded = false
          this.player.doubleJump = true
          this.playSound("jump")
        } else if (this.player.doubleJump) {
          this.player.velY = jumpDirection * this.player.jumpPower * 0.8
          this.player.doubleJump = false
          this.playSound("jump")
        }
      }

      dash() {
        if (
          this.paused ||
          this.player.dashCooldown !== 0 ||
          this.gameState !== "playing"
        )
          return
        this.playSound("dash")
        const dashPower = 15
        let direction = this.keys["a"] || this.keys["arrowleft"] ? -1 : 1
        this.player.velX = direction * dashPower
        this.player.dashCooldown = 60
      }

      updatePlayer() {
        // Clear respawning state when invincibility ends
        if (this.player.invulnerable <= 0) {
          this.player.respawning = false
        }

        // Always normal gravity (same as normal mode)
        const gravity = 0.8
        this.player.velY += gravity
        this.player.x += this.player.velX
        this.player.y += this.player.velY
        this.player.trail.push({ x: this.player.x, y: this.player.y })
        if (this.player.trail.length > 10) this.player.trail.shift()
        if (this.player.x < 0) this.player.x = 0
        if (this.player.x > this.levelTarget) this.player.x = this.levelTarget
        // Always normal death condition (same as normal mode)
        if (this.player.y > this.height + 100) this.respawn()
      }

      updateEnemies() {
        this.enemies.forEach((enemy) => {
          if (enemy.movementType === 'horizontal') {
            enemy.x += enemy.velX * enemy.speed
            const onPlatform = this.platforms.find(
              (p) =>
                enemy.x >= p.x &&
                enemy.x <= p.x + p.width &&
                enemy.y >= p.y - enemy.height &&
                enemy.y <= p.y
            )
            if (
              onPlatform &&
              (enemy.x <= onPlatform.x ||
                enemy.x + enemy.width >= onPlatform.x + onPlatform.width)
            ) {
              enemy.velX *= -1
            }
          } else { // vertical movement
            enemy.y += enemy.velY * enemy.speed
            // Check bounds for vertical movement
            if (enemy.y <= enemy.startY - enemy.moveRange) {
              enemy.velY = 1
            } else if (enemy.y >= enemy.startY + enemy.moveRange) {
              enemy.velY = -1
            }
          }
        })
      }

      updateEffects() {
        // Reset all effects to default values
        if (!this.levelEffects.includes("glitch"))
          this.effects.glitchOffset = { x: 0, y: 0 }
        if (!this.levelEffects.includes("melting"))
          this.effects.meltingFactor = 0
        if (!this.levelEffects.includes("chromatic"))
          this.effects.colorShift = 0
        if (!this.levelEffects.includes("pulsing"))
          this.effects.pulseFactor = 1
        if (!this.levelEffects.includes("blur"))
          this.effects.blurFactor = 0
        if (!this.levelEffects.includes("noise"))
          this.effects.noiseFactor = 0
        if (!this.levelEffects.includes("rgbShift"))
          this.effects.rgbShiftFactor = 0
        if (!this.levelEffects.includes("wave"))
          this.effects.waveFactor = 0
        if (!this.levelEffects.includes("zoom"))
          this.effects.zoomFactor = 0
        if (!this.levelEffects.includes("rotation"))
          this.effects.rotationFactor = 0
        if (!this.levelEffects.includes("pixelBleed"))
          this.effects.pixelBleedFactor = 0

        // Apply active effects
        if (this.levelEffects.includes("glitch"))
          this.effects.glitchOffset = {
            x: (Math.random() - 0.5) * 10,
            y: (Math.random() - 0.5) * 10,
          }
        if (this.levelEffects.includes("melting"))
          this.effects.meltingFactor = Math.sin(Date.now() * 0.01) * 0.1
        if (this.levelEffects.includes("chromatic"))
          this.effects.colorShift = (Date.now() * 0.01) % (Math.PI * 2)
        if (this.levelEffects.includes("pulsing"))
          this.effects.pulseFactor = 0.7 + Math.sin(Date.now() * 0.005) * 0.3
        if (this.levelEffects.includes("blur"))
          this.effects.blurFactor = Math.sin(Date.now() * 0.003) * 0.5 + 0.5
        if (this.levelEffects.includes("noise"))
          this.effects.noiseFactor = Math.random() * 0.3
        if (this.levelEffects.includes("rgbShift"))
          this.effects.rgbShiftFactor = Math.sin(Date.now() * 0.008) * 15
        if (this.levelEffects.includes("wave"))
          this.effects.waveFactor = Math.sin(Date.now() * 0.002) * 0.2
        if (this.levelEffects.includes("zoom"))
          this.effects.zoomFactor = Math.sin(Date.now() * 0.001) * 0.1 + 1
        if (this.levelEffects.includes("rotation"))
          this.effects.rotationFactor = Math.sin(Date.now() * 0.005) * 0.1
        if (this.levelEffects.includes("pixelBleed"))
          this.effects.pixelBleedFactor = Math.sin(Date.now() * 0.01) * 0.8 + 0.2
      }

      updateDataBleed() {
        this.dataBleedEffects = this.dataBleedEffects.filter((effect) => {
          effect.duration--
          return effect.duration > 0
        })
      }

      updateCamera() {
        this.camera.targetX = this.player.x - this.width / 3
        this.camera.x +=
          (this.camera.targetX - this.camera.x) * this.camera.smoothing
        this.camera.x = Math.max(
          0,
          Math.min(this.camera.x, this.levelTarget - this.width)
        )
      }

      checkCollisions() {
        this.player.grounded = false
        this.platforms.forEach((p) => {
          if (
            this.player.x < p.x + p.width &&
            this.player.x + this.player.width > p.x &&
            this.player.y + this.player.height > p.y &&
            this.player.y < p.y
          ) {
            // Always normal collision logic (same as normal mode)
            if (this.player.velY >= 0) {
              this.player.y = p.y - this.player.height
              this.player.velY = 0
              this.player.grounded = true
            }
          }
        })
        this.enemies.forEach((enemy, index) => {
          // Reset stomp zone indicator
          enemy.stompZoneActive = false
          
          if (
            this.player.x < enemy.x + enemy.width &&
            this.player.x + this.player.width > enemy.x &&
            this.player.y < enemy.y + enemy.height &&
            this.player.y + this.player.height > enemy.y
          ) {
            if (this.player.invulnerable > 0 || this.levelStartInvincibility > 0) return
            
            // More forgiving stomping logic
            const stompZoneHeight = 8 // Extra pixels for stomp detection
            const playerBottom = this.player.y + this.player.height
            const enemyTop = enemy.y
            const enemyBottom = enemy.y + enemy.height
            
            // Check if player is falling and within stomp zone
            const isStomping = (
              this.player.velY > 0 && // Player is falling
              playerBottom >= enemyTop - stompZoneHeight && // Player bottom is near enemy top
              playerBottom <= enemyBottom + stompZoneHeight && // Player bottom is not too far below enemy
              this.player.y < enemyTop + enemy.height * 0.7 // Player top is above most of enemy
            )
            
            if (isStomping) {
              this.triggerDataBleed(enemy.x, enemy.y)
              // Create particle explosion for enemy defeat
              this.createParticleExplosion(
                enemy.x + enemy.width / 2, 
                enemy.y + enemy.height / 2, 
                "#ff0000", // Red particles
                15
              )
              this.enemies.splice(index, 1)
              this.score += 250
              const jumpDirection = -1
              this.player.velY = jumpDirection * this.player.jumpPower * 0.6
              this.playSound("stomp")
            } else {
              this.respawn()
            }
          } else {
            // Check if player is above enemy and falling (potential stomp zone)
            const playerBottom = this.player.y + this.player.height
            const enemyTop = enemy.y
            const stompZoneHeight = 8
            
            if (
              this.player.x < enemy.x + enemy.width &&
              this.player.x + this.player.width > enemy.x &&
              this.player.velY > 0 && // Player is falling
              playerBottom >= enemyTop - stompZoneHeight && // Player bottom is near enemy top
              playerBottom <= enemyTop + stompZoneHeight && // Player bottom is within stomp range
              this.player.y < enemyTop + enemy.height * 0.8 // Player top is above most of enemy
            ) {
              enemy.stompZoneActive = true
            }
          }
        })
        this.collectibles.forEach((c) => {
          if (
            !c.collected &&
            this.player.x < c.x + c.width &&
            this.player.x + this.player.width > c.x &&
            this.player.y < c.y + c.height &&
            this.player.y + this.player.height > c.y
          ) {
            c.collected = true
            // Create particle explosion for collectible
            this.createParticleExplosion(
              c.x + c.width / 2, 
              c.y + c.height / 2, 
              c.color === "#000" ? "#ffffff" : "#000000", // White or black particles
              10
            )
            this.score += c.value
            this.playSound("collect")
          }
        })
      }

      triggerDataBleed(x: number, y: number) {
        const duration = 20 // Fixed duration instead of combo-based
        this.dataBleedEffects.push({
          x: x,
          y: y,
          duration: duration,
          size: Math.random() * 80 + 50,
        })
      }

      respawn() {
        this.lives--
        this.playSound("hit")
        if (this.lives <= 0) {
          this.gameState = "gameover"
          const finalScore = document.getElementById("finalScore")
          const gameOverScreen = document.getElementById("gameOverScreen")
          if (finalScore) finalScore.textContent = this.score.toString()
          if (gameOverScreen) gameOverScreen.style.display = "flex"
          this.stopBGM()
        } else {
          this.player.x = 100
          this.player.y = 400 // Always normal respawn position
          this.player.velX = 0
          this.player.velY = 0
          this.player.invulnerable = 30 // Reduced from 180 to 60 frames (1 second)
          this.player.respawning = true
          
          // Reset camera to player position immediately
          this.camera.x = this.player.x - this.width / 3
          this.camera.y = 0
        }
      }

      resetLevel(fullReset = true) {
        if (fullReset) {
          this.score = 0
          this.lives = 3
          this.currentLevel = 1
          this.isReversed = false
        }
        this.player.velX = 0
        this.player.velY = 0
        this.player.respawning = false // Clear respawning state
        this.generateLevel()
        // Set 0.5-second invincibility at level start (30 frames at 60fps)
        this.levelStartInvincibility = 30
      }

      togglePause() {
        if (this.gameState !== "playing" && !this.paused) return
        this.paused = !this.paused
        const pauseScreen = document.getElementById("pauseScreen")
        if (pauseScreen) {
          pauseScreen.style.display = this.paused ? "block" : "none"
        }
        if (this.paused) {
          this.stopBGM()
        } else {
          this.startBGM()
        }
      }

      renderBackground() {
        // Create dreamy gradient background with flowing colors
        const time = Date.now() * 0.001
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height)
        
        // Animated color stops that shift over time
        const hue1 = (time * 10) % 360
        const hue2 = (hue1 + 60) % 360
        const hue3 = (hue2 + 60) % 360
        
        gradient.addColorStop(0, `hsla(${hue1}, 80%, 20%, 0.8)`)
        gradient.addColorStop(0.3, `hsla(${hue2}, 70%, 25%, 0.6)`)
        gradient.addColorStop(0.7, `hsla(${hue3}, 60%, 30%, 0.7)`)
        gradient.addColorStop(1, `hsla(${hue1}, 90%, 15%, 0.9)`)
        
        this.ctx.fillStyle = gradient
        this.ctx.fillRect(0, 0, this.width, this.height)
        
        // Add dreamy flowing effects
        this.renderDreamEffects()
        
        const isChromatic = this.levelEffects.includes("chromatic")
        if (isChromatic) {
          this.ctx.globalCompositeOperation = "lighter"
          this.renderBackgroundLayer(0.06, "red")
          this.renderBackgroundLayer(0.0, "lime")
          this.renderBackgroundLayer(-0.06, "blue")
          this.ctx.globalCompositeOperation = "source-over"
        } else {
          // Render single parallax layer to avoid duplication
          this.renderBackgroundLayer(0.0)
        }
      }

      renderBackgroundLayer(parallaxOffset = 0, tint: string | null = null) {
        const camX = this.camera.x * (1 + parallaxOffset)
        const now = Date.now()
        
        this.backgroundStars.forEach((star) => {
          const drawX = (star.x - camX * star.parallax) % this.width
          const wrappedX = drawX < 0 ? drawX + this.width : drawX
          
          // Calculate animated properties
          const pulse = Math.sin(now * star.pulseSpeed + star.pulsePhase) * 0.4 + 0.6
          const twinkle = Math.sin(now * star.twinkleSpeed + star.twinklePhase) * 0.5 + 0.5
          const animatedSize = star.size * pulse
          const animatedBrightness = star.brightness * twinkle
          
          // Create base color with dreamy saturation
          const baseColor = tint || `hsl(${star.hue}, 90%, 75%)`
          
          // Draw the dream element with glow effect
          this.ctx.save()
          
          // Add outer glow
          this.ctx.globalAlpha = animatedBrightness * 0.3
          this.ctx.fillStyle = baseColor
          this.ctx.beginPath()
          this.ctx.arc(wrappedX, star.y, animatedSize * 2, 0, Math.PI * 2)
          this.ctx.fill()
          
          // Add inner glow
          this.ctx.globalAlpha = animatedBrightness * 0.6
          this.ctx.beginPath()
          this.ctx.arc(wrappedX, star.y, animatedSize * 1.5, 0, Math.PI * 2)
          this.ctx.fill()
          
          // Draw the main element
          this.ctx.globalAlpha = animatedBrightness
          this.ctx.fillStyle = baseColor
          
          switch (star.shape) {
            case 'circle':
              this.ctx.beginPath()
              this.ctx.arc(wrappedX, star.y, animatedSize, 0, Math.PI * 2)
              this.ctx.fill()
              break
              
            case 'diamond':
              this.ctx.beginPath()
              this.ctx.moveTo(wrappedX, star.y - animatedSize)
              this.ctx.lineTo(wrappedX + animatedSize, star.y)
              this.ctx.lineTo(wrappedX, star.y + animatedSize)
              this.ctx.lineTo(wrappedX - animatedSize, star.y)
              this.ctx.closePath()
              this.ctx.fill()
              break
              
            case 'triangle':
              const triangleSize = animatedSize * 0.7
              this.ctx.fillRect(wrappedX - triangleSize, star.y - triangleSize, triangleSize * 2, triangleSize * 2)
              this.ctx.fillRect(wrappedX - triangleSize * 0.3, star.y - triangleSize * 1.5, triangleSize * 0.6, triangleSize * 3)
              this.ctx.fillRect(wrappedX - triangleSize * 1.5, star.y - triangleSize * 0.3, triangleSize * 3, triangleSize * 0.6)
              break
          }
          
          this.ctx.restore()
        })
      }

      renderDreamEffects() {
        const now = Date.now()
        const camX = this.camera.x * 0.3 // Slow parallax for dream effects
        
        // Create flowing dream layers
        for (let layer = 0; layer < 4; layer++) {
          const layerOffset = layer * 0.15
          const alpha = 0.15 - layer * 0.03
          const scale = 1 + layer * 0.3
          
          this.ctx.save()
          this.ctx.globalAlpha = alpha
          this.ctx.globalCompositeOperation = "screen"
          
          // Create flowing dream gradient
          const dreamGradient = this.ctx.createRadialGradient(
            (this.width / 2 + Math.sin(now * 0.0003 + layer) * 150 - camX * layerOffset) * scale,
            this.height / 2 + Math.cos(now * 0.0002 + layer) * 80,
            0,
            (this.width / 2 + Math.sin(now * 0.0003 + layer) * 150 - camX * layerOffset) * scale,
            this.height / 2 + Math.cos(now * 0.0002 + layer) * 80,
            250 * scale
          )
          
          const hue1 = (now * 0.005 + layer * 90) % 360
          const hue2 = (now * 0.005 + layer * 90 + 45) % 360
          
          dreamGradient.addColorStop(0, `hsla(${hue1}, 80%, 60%, 0.9)`)
          dreamGradient.addColorStop(0.5, `hsla(${hue2}, 70%, 50%, 0.5)`)
          dreamGradient.addColorStop(1, 'transparent')
          
          this.ctx.fillStyle = dreamGradient
          this.ctx.fillRect(0, 0, this.width, this.height)
          
          this.ctx.restore()
        }
        
        // Add floating dream particles
        this.renderFloatingDreamParticles(now, camX)
        
        // Add dream waves
        this.renderDreamWaves(now, camX)
      }

      renderFloatingDreamParticles(now: number, camX: number) {
        // Create floating dream particles (like thoughts or memories)
        for (let i = 0; i < 25; i++) {
          const x = (Math.sin(now * 0.0002 + i * 0.7) * 120 + i * 60 - camX * 0.1) % this.width
          const y = (Math.cos(now * 0.0003 + i * 0.4) * 60 + i * 40) % this.height
          const size = Math.sin(now * 0.002 + i) * 1.5 + 1.5
          const alpha = Math.sin(now * 0.003 + i) * 0.4 + 0.5
          const hue = (now * 0.01 + i * 15) % 360
          
          this.ctx.save()
          this.ctx.globalAlpha = alpha
          this.ctx.fillStyle = `hsla(${hue}, 80%, 70%, 0.8)`
          
          // Draw dream particles as soft circles with glow
          this.ctx.beginPath()
          this.ctx.arc(x, y, size, 0, Math.PI * 2)
          this.ctx.fill()
          
          // Add glow effect
          this.ctx.globalAlpha = alpha * 0.3
          this.ctx.beginPath()
          this.ctx.arc(x, y, size * 2, 0, Math.PI * 2)
          this.ctx.fill()
          
          this.ctx.restore()
        }
      }

      renderDreamWaves(now: number, camX: number) {
        // Create flowing dream waves
        for (let i = 0; i < 3; i++) {
          const waveY = this.height * 0.3 + i * this.height * 0.2
          const amplitude = 30 + Math.sin(now * 0.001 + i) * 10
          const frequency = 0.02 + i * 0.01
          
          this.ctx.save()
          this.ctx.globalAlpha = 0.2
          this.ctx.strokeStyle = `hsla(${(now * 0.005 + i * 120) % 360}, 70%, 10%, 0.6)`
          this.ctx.lineWidth = 100
          
          this.ctx.beginPath()
          for (let x = 0; x < this.width; x += 2) {
            const y = waveY + Math.sin(x * frequency + now * 0.001 + i) * amplitude
            if (x === 0) {
              this.ctx.moveTo(x, y)
            } else {
              this.ctx.lineTo(x, y)
            }
          }
          this.ctx.stroke()
          this.ctx.restore()
        }
      }

      render() {
        if (this.gameState === "transition") {
          this.renderTransition()
          return
        }

        // Use the original canvas rendering for now
        this.ctx.save()

        // Apply global effects
        if (this.levelEffects.includes("blur")) {
          this.ctx.filter = `blur(${this.effects.blurFactor * 1}px)`
        }
        if (this.levelEffects.includes("zoom")) {
          this.ctx.translate(this.width / 2, this.height / 2)
          this.ctx.scale(this.effects.zoomFactor, this.effects.zoomFactor)
          this.ctx.translate(-this.width / 2, -this.height / 2)
        }
        if (this.levelEffects.includes("rotation")) {
          this.ctx.translate(this.width / 2, this.height / 2)
          this.ctx.rotate(this.effects.rotationFactor)
          this.ctx.translate(-this.width / 2, -this.height / 2)
        }

        // Clear the canvas
        this.ctx.fillStyle = "#0a0a0a"
        this.ctx.fillRect(0, 0, this.width, this.height)

        this.renderBackground()
        this.renderDataBleed()

        this.ctx.translate(-this.camera.x, -this.camera.y)

        const now = Date.now()
        const wobbleActive = this.levelEffects.includes("wobble")
        const pulsingActive = this.levelEffects.includes("pulsing")
        const waveActive = this.levelEffects.includes("wave")

        // Draw platforms
        this.platforms.forEach((p) => {
          let yOffset = 0
          if (wobbleActive) {
            yOffset += Math.sin(p.x * 0.05 + now * 0.002) * 15 // Increased from 5 to 15
          }
          if (waveActive) {
            yOffset += Math.sin(p.x * 0.02 + now * 0.001) * this.effects.waveFactor * 40 // Increased from 20 to 40
          }
          
          // Add liquid distortion for melting effect
          const liquidDistortion = this.levelEffects.includes("melting") ? p.distortionOffset : 0
          
          if (pulsingActive) {
            this.ctx.save()
            this.ctx.globalAlpha = this.effects.pulseFactor
          }
          
          // Apply RGB shift effect
          if (this.levelEffects.includes("rgbShift")) {
            this.ctx.save()
            this.ctx.fillStyle = `rgba(255, 0, 0, 0.5)`
            this.ctx.fillRect(p.x + this.effects.rgbShiftFactor, p.y + yOffset + liquidDistortion, p.width, p.height)
            this.ctx.fillStyle = `rgba(0, 255, 0, 0.5)`
            this.ctx.fillRect(p.x, p.y + yOffset + liquidDistortion, p.width, p.height)
            this.ctx.fillStyle = `rgba(0, 0, 255, 0.5)`
            this.ctx.fillRect(p.x - this.effects.rgbShiftFactor, p.y + yOffset + liquidDistortion, p.width, p.height)
            this.ctx.restore()
          }
          
          this.ctx.fillStyle = this.levelEffects.includes("chromatic")
            ? `hsl(${
                ((this.effects.colorShift * 180) / Math.PI) % 360
              }, 100%, 50%)`
            : p.color
          
          // Draw warped platform for liquid effect
          if (this.levelEffects.includes("melting")) {
            this.ctx.beginPath()
            this.ctx.moveTo(p.x, p.y + yOffset + liquidDistortion)
            this.ctx.lineTo(p.x + p.width, p.y + yOffset + liquidDistortion)
            this.ctx.lineTo(p.x + p.width, p.y + p.height + yOffset)
            this.ctx.lineTo(p.x, p.y + p.height + yOffset)
            this.ctx.closePath()
            this.ctx.fill()
          } else {
            this.ctx.fillRect(p.x, p.y + yOffset, p.width, p.height)
          }
          
          if (pulsingActive) {
            this.ctx.restore()
          }

          // Draw cascading liquid pixels
          if (this.levelEffects.includes("melting")) {
            p.liquidPixels.forEach(pixel => {
              this.ctx.save()
              this.ctx.globalAlpha = pixel.opacity
              this.ctx.fillStyle = p.color
              this.ctx.fillRect(pixel.x, pixel.y, pixel.size, pixel.size)
              this.ctx.restore()
            })
          }
        })

        // Draw enemies, collectibles, and player with wobble
        const drawWobbled = (obj: any) => {
          let yOffset = 0
          if (wobbleActive) {
            yOffset += Math.sin(obj.x * 0.05 + now * 0.002) * 15 // Increased from 5 to 15
          }
          if (waveActive) {
            yOffset += Math.sin(obj.x * 0.02 + now * 0.001) * this.effects.waveFactor * 15 // Increased from 20 to 40
          }
          this.ctx.fillRect(obj.x, obj.y + yOffset, obj.width, obj.height)
        }

        this.enemies.forEach((e) => {
          this.ctx.fillStyle = e.color
          drawWobbled(e)
          
          // Draw stomp zone indicator if active
          if (e.stompZoneActive) {
            this.ctx.save()
            this.ctx.globalAlpha = 0.6
            this.ctx.fillStyle = "#00ff00" // Green stomp zone
            this.ctx.fillRect(e.x - 2, e.y - 8, e.width + 4, 8) // Stomp zone above enemy
            this.ctx.restore()
          }
        })
        
        this.collectibles.forEach((c) => {
          if (!c.collected) {
            this.ctx.fillStyle = c.color
            // Draw triangle centered at (c.x + c.width/2, c.y + c.height/2)
            const cx = c.x + c.width / 2
            const cy = c.y + c.height / 2
            const size = c.width
            this.ctx.beginPath()
            this.ctx.moveTo(cx, cy - size / 2)
            this.ctx.lineTo(cx - size / 2, cy + size / 2)
            this.ctx.lineTo(cx + size / 2, cy + size / 2)
            this.ctx.closePath()
            this.ctx.fill()
          }
        })

        this.player.trail.forEach((point, index) => {
          this.ctx.fillStyle = `rgba(0, 255, 255, ${index * 0.05})`
          let yOffset = 0
          if (wobbleActive) {
            yOffset += Math.sin(point.x * 0.05 + now * 0.002) * 15
          }
          if (waveActive) {
            yOffset += Math.sin(point.x * 0.02 + now * 0.001) * this.effects.waveFactor * 40
          }
          this.ctx.fillRect(
            point.x,
            point.y + yOffset,
            this.player.width,
            this.player.height
          )
        })

        this.ctx.fillStyle =
          (this.player.invulnerable > 0 || this.levelStartInvincibility > 0) && Math.floor(now / 100) % 2 === 0
            ? "white"
            : this.player.color
        if (this.levelEffects.includes("chromatic"))
          this.ctx.fillStyle = `hsl(${
            ((this.effects.colorShift * 180) / Math.PI + 180) % 360
          }, 100%, 50%)`
        drawWobbled(this.player)
        
        this.ctx.restore()

        // Render particles
        this.renderParticles()

        // Apply noise effect as overlay
        if (this.levelEffects.includes("noise")) {
          this.renderNoise()
        }

        // Apply pixel bleed effect as overlay
        if (this.levelEffects.includes("pixelBleed")) {
          this.renderPixelBleed()
        }

        // Render overlays (UI elements) on top
        this.renderOverlays()
      }

      renderNoise() {
        this.ctx.save()
        this.ctx.globalAlpha = this.effects.noiseFactor
        for (let i = 0; i < 1000; i++) {
          const x = Math.random() * this.width
          const y = Math.random() * this.height
          const size = Math.random() * 2
          this.ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#000000'
          this.ctx.fillRect(x, y, size, size)
        }
        this.ctx.restore()
      }

      renderPixelBleed() {
        this.ctx.save()
        this.ctx.globalAlpha = this.effects.pixelBleedFactor * 0.7
        
        // Create pixel bleed effect by sampling and duplicating pixels
        const bleedIntensity = Math.floor(this.effects.pixelBleedFactor * 20) + 5
        const sampleSize = 2
        
        for (let i = 0; i < 50; i++) {
          // Sample a random area of the canvas
          const sampleX = Math.floor(Math.random() * (this.width - sampleSize))
          const sampleY = Math.floor(Math.random() * (this.height - sampleSize))
          
          // Create a small image data sample
          const imageData = this.ctx.getImageData(sampleX, sampleY, sampleSize, sampleSize)
          
          // Calculate bleed direction and distance
          const bleedDirection = Math.random() * Math.PI * 2
          const bleedDistance = Math.random() * bleedIntensity + 5
          const bleedX = sampleX + Math.cos(bleedDirection) * bleedDistance
          const bleedY = sampleY + Math.sin(bleedDirection) * bleedDistance
          
          // Draw the sampled pixels at the bleed location
          this.ctx.putImageData(imageData, bleedX, bleedY)
        }
        
        // Add horizontal line bleeds
        for (let i = 0; i < 10; i++) {
          const y = Math.floor(Math.random() * this.height)
          const height = Math.floor(Math.random() * 3) + 1
          const imageData = this.ctx.getImageData(0, y, this.width, height)
          
          // Bleed the line down
          const bleedY = y + Math.floor(Math.random() * 10) + 5
          this.ctx.putImageData(imageData, 0, bleedY)
        }
        
        // Add vertical line bleeds
        for (let i = 0; i < 10; i++) {
          const x = Math.floor(Math.random() * this.width)
          const width = Math.floor(Math.random() * 3) + 1
          const imageData = this.ctx.getImageData(x, 0, width, this.height)
          
          // Bleed the line right
          const bleedX = x + Math.floor(Math.random() * 10) + 5
          this.ctx.putImageData(imageData, bleedX, 0)
        }
        
        this.ctx.restore()
      }

      renderOverlays() {
        // Render scanlines and other overlays on top of the PixiJS output
        if (this.levelEffects.includes("scanlines")) {
          this.ctx.save()
          this.ctx.fillStyle = "rgba(0,0,0,0.25)"
          for (let y = 0; y < this.height; y += 4) {
            this.ctx.fillRect(0, y, this.width, 2)
          }
          this.ctx.restore()
        }
      }

      renderScanlines() {
        this.ctx.fillStyle = "rgba(0,0,0,0.25)"
        for (let y = 0; y < this.height; y += 4) {
          this.ctx.fillRect(0, y, this.width, 2)
        }
      }

      renderDataBleed() {
        if (this.dataBleedEffects.length === 0) return
        this.dataBleedEffects.forEach((effect) => {
          const screenX = effect.x - this.camera.x
          const screenY = effect.y - this.camera.y
          if (
            screenX > -effect.size &&
            screenX < this.width &&
            screenY > -effect.size &&
            screenY < this.height
          ) {
            const sx = Math.random() * (this.width - effect.size)
            const sy = Math.random() * (this.height - effect.size)
            const opacity = effect.duration / 20 // Fixed calculation instead of combo-based
            this.ctx.save()
            this.ctx.globalAlpha = opacity * 0.8
            this.ctx.drawImage(
              this.canvas,
              sx,
              sy,
              effect.size,
              effect.size,
              screenX,
              screenY,
              effect.size,
              effect.size
            )
            this.ctx.restore()
          }
        })
      }

      renderTransition() {
        // During transition, apply zoom and screen rotation
        let zoom = this.cameraZoom
        let rotation = 0
        
        if (this.transitionPhase === 'zoomIn') {
          const t = Math.min(1, this.transitionProgress / 60)
          zoom = 1 + 1.5 * t
        } else if (this.transitionPhase === 'transition') {
          zoom = 2.5
          const t = Math.min(1, this.transitionProgress / 30) // Match the 30 frame duration
          rotation = t * Math.PI * 2 // Full 360 degree rotation
        } else if (this.transitionPhase === 'zoomOut') {
          const t = Math.min(1, this.transitionProgress / 30)
          zoom = 2.5 - 1.5 * t
        }
        
        // Apply zoom and rotation transformation
        this.ctx.save()
        this.ctx.translate(this.width / 2, this.height / 2)
        this.ctx.scale(zoom, zoom)
        this.ctx.rotate(rotation)
        
        // Apply backwards flip if needed
        if (this.levelEffects.includes("backwards")) {
          this.ctx.scale(-1, 1)
        }
        
        // Center on player for consistent positioning
        this.ctx.translate(-this.player.x - this.player.width / 2, -this.player.y - this.player.height / 2)
        
        // Render the game world with zoom and rotation
        this.renderBackground()
        this.renderDataBleed()
        this.ctx.translate(-this.camera.x, -this.camera.y)
        
        const now = Date.now()
        const wobbleActive = this.levelEffects.includes("wobble")
        const pulsingActive = this.levelEffects.includes("pulsing")

        // Draw platforms
        this.platforms.forEach((p) => {
          const yOffset = wobbleActive
            ? Math.sin(p.x * 0.05 + now * 0.002) * 15
            : 0
          
          // Add liquid distortion for melting effect
          const liquidDistortion = this.levelEffects.includes("melting") ? p.distortionOffset : 0
          
          if (pulsingActive) {
            this.ctx.save()
            this.ctx.globalAlpha = this.effects.pulseFactor
          }
          this.ctx.fillStyle = this.levelEffects.includes("chromatic")
            ? `hsl(${
                ((this.effects.colorShift * 180) / Math.PI) % 360
              }, 100%, 50%)`
            : p.color
          
          // Draw warped platform for liquid effect
          if (this.levelEffects.includes("melting")) {
            this.ctx.beginPath()
            this.ctx.moveTo(p.x, p.y + yOffset + liquidDistortion)
            this.ctx.lineTo(p.x + p.width, p.y + yOffset + liquidDistortion)
            this.ctx.lineTo(p.x + p.width, p.y + p.height + yOffset)
            this.ctx.lineTo(p.x, p.y + p.height + yOffset)
            this.ctx.closePath()
            this.ctx.fill()
          } else {
            this.ctx.fillRect(p.x, p.y + yOffset, p.width, p.height)
          }
          
          if (pulsingActive) {
            this.ctx.restore()
          }

          // Draw cascading liquid pixels
          if (this.levelEffects.includes("melting")) {
            p.liquidPixels.forEach(pixel => {
              this.ctx.save()
              this.ctx.globalAlpha = pixel.opacity
              this.ctx.fillStyle = p.color
              this.ctx.fillRect(pixel.x, pixel.y, pixel.size, pixel.size)
              this.ctx.restore()
            })
          }
        })

        // Draw enemies, collectibles, and player with wobble
        const drawWobbled = (obj: any) => {
          const yOffset = wobbleActive
            ? Math.sin(obj.x * 0.05 + now * 0.002) * 15
            : 0
          this.ctx.fillRect(obj.x, obj.y + yOffset, obj.width, obj.height)
        }

        this.enemies.forEach((e) => {
          this.ctx.fillStyle = e.color
          drawWobbled(e)
        })
        this.collectibles.forEach((c) => {
          if (!c.collected) {
            this.ctx.fillStyle = c.color
            // Draw triangle centered at (c.x + c.width/2, c.y + c.height/2)
            const cx = c.x + c.width / 2
            const cy = c.y + c.height / 2
            const size = c.width
            this.ctx.beginPath()
            this.ctx.moveTo(cx, cy - size / 2)
            this.ctx.lineTo(cx - size / 2, cy + size / 2)
            this.ctx.lineTo(cx + size / 2, cy + size / 2)
            this.ctx.closePath()
            this.ctx.fill()
          }
        })

        this.player.trail.forEach((point, index) => {
          this.ctx.fillStyle = `rgba(0, 255, 255, ${index * 0.05})`
          const yOffset = wobbleActive
            ? Math.sin(point.x * 0.05 + now * 0.002) * 15
            : 0
          this.ctx.fillRect(
            point.x,
            point.y + yOffset,
            this.player.width,
            this.player.height
          )
        })

        this.ctx.fillStyle =
          (this.player.invulnerable > 0 || this.levelStartInvincibility > 0) && Math.floor(now / 100) % 2 === 0
            ? "white"
            : this.player.color
        if (this.levelEffects.includes("chromatic"))
          this.ctx.fillStyle = `hsl(${
            ((this.effects.colorShift * 180) / Math.PI + 180) % 360
          }, 100%, 50%)`
        drawWobbled(this.player)
        
        this.ctx.restore()
      }

      updateUI() {
        const lives = document.getElementById("lives")
        const score = document.getElementById("score")
        const level = document.getElementById("level")
        
        
        if (lives) lives.textContent = this.lives.toString()
        if (score) score.textContent = this.score.toString()
        if (level) level.textContent = this.currentLevel.toString()
        
      }

      gameLoop() {
        this.animationFrameId = requestAnimationFrame(() => this.gameLoop())
        this.update()
        this.render()
        if (this.gameState === "gameover") {
          cancelAnimationFrame(this.animationFrameId)
          this.animationFrameId = null
        }
      }

      cleanup() {
        // Remove event listeners
        const startButton = document.getElementById("startButton")
        if (startButton && this.startButtonHandler) {
          startButton.removeEventListener("click", this.startButtonHandler)
        }
        
        if (this.keydownHandler) {
          document.removeEventListener("keydown", this.keydownHandler)
        }
        if (this.keyupHandler) {
          document.removeEventListener("keyup", this.keyupHandler)
        }
        
        // Remove mobile event listeners
        if (this.mobileHandlers) {
          this.mobileHandlers.forEach(({ button, handleStart, handleEnd }) => {
            button.removeEventListener("touchstart", handleStart)
            button.removeEventListener("touchend", handleEnd)
          })
        }
        
        // Remove sound toggle listener
        const soundToggle = document.getElementById("soundToggle")
        if (soundToggle && this.soundToggleHandler) {
          soundToggle.removeEventListener("click", this.soundToggleHandler)
        }
        
        // Stop BGM
        this.stopBGM()
      }

      createParticleExplosion(x: number, y: number, color: string, count: number = 20) {
        for (let i = 0; i < count; i++) {
          this.particles.push({
            x: x,
            y: y,
            vx: Math.cos(Math.random() * Math.PI * 2) * (Math.random() * 5 + 2),
            vy: Math.sin(Math.random() * Math.PI * 2) * (Math.random() * 5 + 2),
            life: 60,
            color: color,
            size: Math.random() * 3 + 1
          })
        }
      }

      updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
          const particle = this.particles[i]
          
          // Update position
          particle.x += particle.vx
          particle.y += particle.vy
          
          // Apply gravity
          particle.vy += 0.1
          
          // Update life
          particle.life--
          
          // Remove dead particles
          if (particle.life <= 0) {
            this.particles.splice(i, 1)
          }
        }
      }

      renderParticles() {
        this.particles.forEach(particle => {
          const alpha = particle.life / 60
          this.ctx.save()
          this.ctx.globalAlpha = alpha
          this.ctx.fillStyle = particle.color
          this.ctx.beginPath()
          this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
          this.ctx.fill()
          this.ctx.restore()
        })
      }
    }

    // Initialize the game
    gameRef.current = new PolishedTrippySideScroller(canvasRef.current)

    // Cleanup function
    return () => {
      if (gameRef.current) {
        // Clean up animation frame
        if (gameRef.current.animationFrameId) {
          cancelAnimationFrame(gameRef.current.animationFrameId)
        }
        // Clean up BGM timeout
        if (gameRef.current.bgmTimeoutId) {
          clearTimeout(gameRef.current.bgmTimeoutId)
        }
        // Clean up event listeners
        gameRef.current.cleanup()
      }
    }
  }, [])

  return (
    <div id="gameContainer">
      <canvas ref={canvasRef} id="gameCanvas" width="800" height="600"></canvas>

      {/* Game UI */}
      <div id="ui">
        <div className="ui-item">
          <span className="ui-label">LIVES</span>
          <span id="lives" className="ui-value">3</span>
        </div>
        <div className="ui-item">
          <span className="ui-label">SCORE</span>
          <span id="score" className="ui-value">0</span>
        </div>
        <div className="ui-item">
          <span className="ui-label">LEVEL</span>
          <span id="level" className="ui-value">1</span>
        </div>
      </div>

      <button id="soundToggle" className="sound-toggle">🔊 SOUND: ON</button>

     

      {/* Start Screen */}
      <div id="startScreen" className="menu-screen">
        <div className="menu-background"></div>
        <div className="menu-content">
          <div className="title-container">
            <h1 className="game-title">ABBERANT</h1>
            <div className="title-glow"></div>
          </div>
          
          <div className="menu-buttons">
            <button id="startButton" className="menu-button primary-button">
              <span className="button-text">START GAME</span>
              <div className="button-glow"></div>
            </button>
          </div>
          
          <div className="controls-info">
            <div className="controls-section">
              <h3>CONTROLS</h3>
              <div className="control-grid">
                <div className="control-item">
                  <span className="key">WASD</span>
                  <span className="action">Move</span>
                </div>
                <div className="control-item">
                  <span className="key">SPACE</span>
                  <span className="action">Jump</span>
                </div>
                <div className="control-item">
                  <span className="key">SHIFT</span>
                  <span className="action">Dash</span>
                </div>
                <div className="control-item">
                  <span className="key">P</span>
                  <span className="action">Pause</span>
                </div>
                <div className="control-item">
                  <span className="key">R</span>
                  <span className="action">Reset</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Game Over Screen */}
      <div id="gameOverScreen" className="menu-screen">
        <div className="menu-background"></div>
        <div className="menu-content">
          <div className="title-container">
            <h2 className="game-title">GAME OVER</h2>
            <div className="title-glow"></div>
          </div>
          
          <div className="score-display">
            <div className="final-score">
              <span className="score-label">FINAL SCORE</span>
              <span id="finalScore" className="score-value">0</span>
            </div>
          </div>
          
          <div className="menu-buttons">
            <button onClick={() => gameRef.current?.restart()} className="menu-button primary-button">
              <span className="button-text">PLAY AGAIN</span>
              <div className="button-glow"></div>
            </button>
          </div>
        </div>
      </div>

      {/* Pause Screen */}
      <div id="pauseScreen" className="menu-screen">
        <div className="menu-background"></div>
        <div className="menu-content">
          <div className="title-container">
            <h2 className="game-title">PAUSED</h2>
            <div className="title-glow"></div>
          </div>
          
          <div className="pause-message">
            <p>Press <span className="key-highlight">P</span> to continue</p>
          </div>
        </div>
      </div>

      {/* Mobile Controls */}
      <div id="mobileControls" className="mobile-controls">
        <div className="dpad">
          <div className="dpad-center"></div>
          <div className="mobile-button dpad-up" data-action="up">↑</div>
          <div className="mobile-button dpad-down" data-action="down">↓</div>
          <div className="mobile-button dpad-left" data-action="left">←</div>
          <div className="mobile-button dpad-right" data-action="right">→</div>
        </div>

        <div className="action-buttons">
          <div className="mobile-button jump-button" data-action="jump">JUMP</div>
          <div className="mobile-button dash-button" data-action="dash">DASH</div>
          <div className="mobile-button pause-button" data-action="pause">⏸</div>
        </div>
      </div>

      <style jsx>{`
        #gameContainer {
          position: relative;
          width: 800px;
          height: 600px;
          margin: 0 auto;
          font-family: 'Courier New', monospace;
          overflow: hidden;
        }

        #gameCanvas {
          display: block;
          border: 2px solid #00ffff;
          box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
        }

        /* Game UI */
        #ui {
          position: absolute;
          top: 20px;
          left: 20px;
          display: flex;
          gap: 30px;
          z-index: 10;
        }

        .ui-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
        }

        .ui-label {
          font-size: 12px;
          color: #00ffff;
          text-shadow: 0 0 10px #00ffff;
          font-weight: bold;
          letter-spacing: 2px;
        }

        .ui-value {
          font-size: 24px;
          color: #ffffff;
          text-shadow: 0 0 15px #ffffff;
          font-weight: bold;
        }

        #soundToggle {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(0, 0, 0, 0.8);
          border: 2px solid #00ffff;
          color: #00ffff;
          padding: 10px 15px;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
          z-index: 10;
        }

        #soundToggle:hover {
          background: rgba(0, 255, 255, 0.2);
          box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
        }

        

        /* Menu Screens */
        .menu-screen {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: none;
          align-items: center;
          justify-content: center;
          z-index: 100;
        }

        .menu-background {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.95) 100%);
          backdrop-filter: blur(10px);
        }

        .menu-content {
          position: relative;
          text-align: center;
          max-width: 600px;
          padding: 40px;
        }

        .title-container {
          position: relative;
          margin-bottom: 60px;
        }

        .game-title {
          font-size: 48px;
          font-weight: bold;
          color: #00ffff;
          text-shadow: 0 0 30px #00ffff;
          letter-spacing: 8px;
          margin: 0;
          animation: titlePulse 3s ease-in-out infinite;
        }

        .title-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(0, 255, 255, 0.3) 0%, transparent 70%);
          animation: glowPulse 4s ease-in-out infinite;
          z-index: -1;
        }

        .menu-buttons {
          margin: 40px 0;
        }

        .menu-button {
          position: relative;
          background: rgba(0, 0, 0, 0.8);
          border: 3px solid #00ffff;
          color: #00ffff;
          padding: 20px 40px;
          font-family: 'Courier New', monospace;
          font-size: 18px;
          font-weight: bold;
          letter-spacing: 3px;
          cursor: pointer;
          transition: all 0.3s ease;
          overflow: hidden;
          margin: 10px;
        }

        .menu-button:hover {
          background: rgba(0, 255, 255, 0.2);
          box-shadow: 0 0 30px rgba(0, 255, 255, 0.7);
          transform: scale(1.05);
        }

        .button-glow {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.3), transparent);
          transition: left 0.5s ease;
        }

        .menu-button:hover .button-glow {
          left: 100%;
        }

        .controls-info {
          margin-top: 40px;
        }

        .controls-section h3 {
          color: #ff00ff;
          font-size: 20px;
          margin-bottom: 20px;
          text-shadow: 0 0 15px #ff00ff;
          letter-spacing: 3px;
        }

        .control-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
          margin-top: 20px;
        }

        .control-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 15px;
          background: rgba(0, 0, 0, 0.6);
          border: 1px solid #00ffff;
          border-radius: 4px;
        }

        .key {
          color: #00ffff;
          font-weight: bold;
          font-size: 14px;
        }

        .action {
          color: #ffffff;
          font-size: 14px;
        }

        .score-display {
          margin: 40px 0;
        }

        .final-score {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .score-label {
          color: #ff00ff;
          font-size: 18px;
          text-shadow: 0 0 10px #ff00ff;
          letter-spacing: 2px;
        }

        .score-value {
          color: #00ffff;
          font-size: 36px;
          font-weight: bold;
          text-shadow: 0 0 20px #00ffff;
        }

        .pause-message {
          margin: 40px 0;
        }

        .pause-message p {
          color: #ffffff;
          font-size: 18px;
          margin: 0;
        }

        .key-highlight {
          color: #00ffff;
          font-weight: bold;
          text-shadow: 0 0 10px #00ffff;
        }

        /* Mobile Controls */
        .mobile-controls {
          position: absolute;
          bottom: 20px;
          right: 20px;
          display: none;
          z-index: 10;
        }

        @media (max-width: 768px) {
          .mobile-controls {
            display: block;
          }
        }

        /* Animations */
        @keyframes titlePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        @keyframes glowPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }

        /* Responsive Design */
        @media (max-width: 800px) {
          #gameContainer {
            width: 100%;
            height: auto;
          }
          
          #gameCanvas {
            width: 100%;
            height: auto;
          }
          
          .game-title {
            font-size: 36px;
            letter-spacing: 4px;
          }
          
          .menu-content {
            padding: 20px;
          }
        }
      `}</style>
    </div>
  )
}
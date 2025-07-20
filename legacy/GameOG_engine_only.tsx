import { 
  Player, 
  Camera, 
  Keys, 
  TouchInput, 
  Effects, 
  Platform, 
  Enemy, 
  Collectible, 
  BackgroundStar, 
  DataBleedEffect 
} from '../types/game'
import { GamepadInput } from '../lib/game/InputManager'
import { getFromStorage } from '../lib/utils/storage'

    class PolishedTrippySideScroller {
      canvas: HTMLCanvasElement
      ctx: CanvasRenderingContext2D
      width: number
      height: number
      gameState!: string
      currentLevel!: number
      lives!: number
      score!: number
      combo!: number
      bestCombo!: number
      paused!: boolean
      // isReversed is used only for level progress calculation when backwards effect is active
      isReversed!: boolean
      player!: Player
      camera!: Camera
      keys!: Keys
      gamepadInput!: GamepadInput
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
      gamepadIndex!: number | null
      gamepadDeadzone!: number
      gamepadButtonPressed!: { [key: string]: boolean }
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
      isEffectsLabUnlocked!: boolean;
      activeCustomEffects!: any;
      // Development toggle - set to true for testing, false for production
      private readonly DEV_MODE = true;
      effectsLabSettings!: {
        // Canvas effects only - visual effects moved to VFX wrapper
        wobble: { 
          enabled: boolean;
          amplitude: number;
          frequency: number;
          speed: number;
        };
        upsideDown: { enabled: boolean };
        invert: { enabled: boolean };
        backwards: { enabled: boolean };
        melting: { 
          enabled: boolean;
          intensity: number;
          speed: number;
        };
        dataBleed: { 
          enabled: boolean;
          intensity: number;
          duration: number;
        };
      };
      effectsLabPresets!: Array<{ name: string; settings: any }>;
      selectedPresetName!: string;
      


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
        this.combo = 0
        this.bestCombo = 0
        this.paused = false
        this.isReversed = false
        this.cameraZoom = 1
        this.transitionPhase = 'none'
        this.transitionProgress = 0
        this.levelStartInvincibility = 0
        
        // Initialize Effects Lab state from localStorage
        this.isEffectsLabUnlocked = this.DEV_MODE || getFromStorage('effectsLabUnlocked') || false
        this.activeCustomEffects = getFromStorage('activeCustomEffects') || null
        
        // Initialize Effects Lab settings (canvas effects only)
        this.effectsLabSettings = {
          wobble: { 
            enabled: false,
            amplitude: 5,
            frequency: 0.05,
            speed: 0.002
          },
          upsideDown: { enabled: false },
          invert: { enabled: false },
          backwards: { enabled: false },
          melting: { 
            enabled: false,
            intensity: 1,
            speed: 0.01
          },
          dataBleed: { 
            enabled: false,
            intensity: 1,
            duration: 20
          }
        }
        
        // Initialize Effects Lab presets from localStorage
        this.effectsLabPresets = getFromStorage('effectsLabPresets') || []
        this.selectedPresetName = ''
        
        // Sync React state with game state
        // if (gameRef.current === this) {
        //   setEffectsLabSettings({...this.effectsLabSettings})
        //   setEffectsLabPresets([...this.effectsLabPresets])
        //   setSelectedPresetName(this.selectedPresetName)
        //   setIsGameReady(true)
        // }

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
        this.camera = { x: 0, y: 0, targetX: 0, targetY: 0, smoothing: 0.1, zoom: 1 }
        this.keys = {}
        this.gamepadInput = {
          left: false,
          right: false,
          jump: false,
          dash: false,
        }
        this.touchInput = {
          left: false,
          right: false,
          jump: false,
          dash: false,
        }

        if (!this.inputSetupDone) {
          this.setupInput()
          this.setupMobileControls()
          this.setupGamepadSupport()
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
        const starCount = 200
        const levelWidth = 2000 + this.currentLevel * 500
        for (let i = 0; i < starCount; i++) {
          this.backgroundStars.push({
            x: Math.random() * levelWidth,
            y: Math.random() * this.height,
            size: Math.random() * 2 + 0.5,
            parallax: Math.random() * 0.5 + 0.1,
            hue: Math.random() * 60 + 180,
            pulseSpeed: Math.random() * 0.02 + 0.01,
            pulsePhase: Math.random() * Math.PI * 2,
            twinkleSpeed: Math.random() * 0.03 + 0.01,
            twinklePhase: Math.random() * Math.PI * 2,
            shape: 'circle',
            brightness: Math.random() * 0.5 + 0.5,
            glowRadius: Math.random() * 2 + 1,
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

      setupGamepadSupport() {
        this.gamepadIndex = null
        this.gamepadDeadzone = 0.3
        this.gamepadButtonPressed = {}
        window.addEventListener("gamepadconnected", (e: any) => {
          this.gamepadIndex = e.gamepad.index
        })
        window.addEventListener("gamepaddisconnected", () => {
          this.gamepadIndex = null
        })
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

      updateGamepadInput() {
        if (this.gamepadIndex === null) return
        const gamepad = navigator.getGamepads()[this.gamepadIndex]
        if (!gamepad) return
        if (
          this.gameState === "start" &&
          gamepad.buttons.some((b) => b.pressed)
        ) {
          this.startGame()
          return
        }
        const leftStickX = gamepad.axes[0]
        const dpadLeft = gamepad.buttons[14].pressed
        const dpadRight = gamepad.buttons[15].pressed
        this.gamepadInput.left =
          leftStickX < -this.gamepadDeadzone || dpadLeft
        this.gamepadInput.right =
          leftStickX > this.gamepadDeadzone || dpadRight
        const jumpButton = gamepad.buttons[0]
        if (jumpButton.pressed && !this.gamepadButtonPressed.jump)
          this.jump()
        this.gamepadButtonPressed.jump = jumpButton.pressed
        const dashButton = gamepad.buttons[1]
        if (dashButton.pressed && !this.gamepadButtonPressed.dash)
          this.dash()
        this.gamepadButtonPressed.dash = dashButton.pressed
        const pauseButton = gamepad.buttons[9]
        if (
          pauseButton &&
          pauseButton.pressed &&
          !this.gamepadButtonPressed.pause
        )
          this.togglePause()
        this.gamepadButtonPressed.pause = pauseButton
          ? pauseButton.pressed
          : false
      }

      generateLevel() {
        this.platforms = []
        this.enemies = []
        this.collectibles = []
        this.assignLevelEffects()

        const levelWidth = 2000 + this.currentLevel * 500
        this.levelTarget = levelWidth
        this.generateBackground()

        // Set player starting position based on backwards mode
        if (this.isReversed) {
          this.player.x = this.levelTarget - 100 // Start near the end for backwards mode
        } else {
          this.player.x = 100 // Normal starting position
        }
        this.player.y = 400 // Always normal starting position

        const platformCount = 15 + this.currentLevel * 3
        
        // Add spawn platform based on backwards mode
        if (this.isReversed) {
          // In backwards mode, add a platform near the player spawn point (right side)
          this.platforms.push({
            x: this.levelTarget - 150,
            y: 550,
            width: 200,
            height: 50,
            color: "#ff00ff",
            type: "normal",
            liquidPixels: [],
            distortionOffset: 0,
          })
        } else {
          // Normal mode - platform at left side
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
        }
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
        for (let i = 0; i < 5 + this.currentLevel; i++) {
          const platform =
            this.platforms[Math.floor(Math.random() * this.platforms.length)]
          this.enemies.push({
            x: platform.x + Math.random() * platform.width,
            y: platform.y - 15,
            width: 15,
            height: 15,
            velX: Math.random() < 0.5 ? 1 : -1,
            velY: 0,
            speed: 1 + Math.random(),
            color: `hsl(${Math.random() * 360}, 100%, 50%)`,
            movementType: 'horizontal',
            startY: platform.y - 15,
            moveRange: 50,
            stompZoneActive: false,
          })
        }
        for (let i = 0; i < 8 + this.currentLevel; i++) {
          const platform =
            this.platforms[Math.floor(Math.random() * this.platforms.length)]
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
        // Canvas effects only - visual effects will be handled by VFX wrapper
        const canvasEffectPool = [
          "wobble",
          "upsideDown",
          "invert",
          "backwards",
          "melting",
          "dataBleed",
        ]
        this.levelEffects = []
        this.isReversed = false

        // Filter out disorienting effects for level 1
        let availableEffects = [...canvasEffectPool]
        if (this.currentLevel === 1) {
          availableEffects = availableEffects.filter(effect => 
            effect !== "upsideDown" && effect !== "backwards"
          )
        }

        // Shuffle the effect pool
        for (let i = availableEffects.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[availableEffects[i], availableEffects[j]] = [availableEffects[j], availableEffects[i]]
        }
        
        // Determine number of effects (1 or 2)
        const effectCount = Math.random() > 0.6 ? 2 : 1

        // Add random canvas effects
        for (let i = 0; i < effectCount && i < availableEffects.length; i++) {
          this.levelEffects.push(availableEffects[i])
        }

        // Set the reversed flag if 'backwards' is chosen
        if (this.levelEffects.includes("backwards")) {
          this.isReversed = true
        }
      }

      nextLevel() {
        // Prevent infinite transition loop
        if (this.gameState === "transition") {
          console.warn("Preventing infinite transition loop")
          return
        }
        
        this.gameState = "transition"
        this.transitionPhase = 'zoomIn'
        this.transitionProgress = 0
        this.stopBGM()
        
        // Check if player has reached level 101 to unlock Effects Lab
        if (this.currentLevel >= 101) {
          // saveToStorage('effectsLabUnlocked', true) // Commented out as per instructions
        }
      }

      resetEffectsLabToLevelDefault() {
        // Reset all effects to disabled
        Object.keys(this.effectsLabSettings).forEach(key => {
          const effectKey = key as keyof typeof this.effectsLabSettings
          if (this.effectsLabSettings[effectKey] && typeof this.effectsLabSettings[effectKey] === 'object' && 'enabled' in this.effectsLabSettings[effectKey]) {
            (this.effectsLabSettings[effectKey] as any).enabled = this.levelEffects.includes(key)
          }
        })
      }

      saveEffectsLabPreset(presetName: string) {
        // Deep copy the current settings
        const settingsCopy = JSON.parse(JSON.stringify(this.effectsLabSettings))
        
        // Check if preset already exists
        const existingIndex = this.effectsLabPresets.findIndex(preset => preset.name === presetName)
        
        if (existingIndex >= 0) {
          // Update existing preset
          this.effectsLabPresets[existingIndex].settings = settingsCopy
        } else {
          // Add new preset
          this.effectsLabPresets.push({
            name: presetName,
            settings: settingsCopy
          })
        }
        
        // Save to localStorage
        // saveToStorage('effectsLabPresets', this.effectsLabPresets) // Commented out as per instructions
      }

      loadEffectsLabPreset(presetName: string) {
        const preset = this.effectsLabPresets.find(p => p.name === presetName)
        if (preset) {
          // Deep copy the preset settings
          this.effectsLabSettings = JSON.parse(JSON.stringify(preset.settings))
          this.selectedPresetName = presetName
        }
      }

      deleteEffectsLabPreset(presetName: string) {
        this.effectsLabPresets = this.effectsLabPresets.filter(preset => preset.name !== presetName)
        // saveToStorage('effectsLabPresets', this.effectsLabPresets) // Commented out as per instructions
        
        // Clear selection if the deleted preset was selected
        if (this.selectedPresetName === presetName) {
          this.selectedPresetName = ''
        }
      }



      update() {
        if (this.paused) return
        switch (this.gameState) {
          case "start":
            this.updateGamepadInput()
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
        // 1s zoomIn, 0.5s moire, 0.5s zoomOut
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
            // Keep camera zoomed in
          }
        } else if (this.transitionPhase === 'transition') {
          this.transitionProgress++
          if (this.transitionProgress >= 60) {
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
        this.updateGamepadInput()
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

        if (this.isReversed) {
          this.levelProgress =
            ((this.levelTarget - this.player.x) / this.levelTarget) * 100
          if (this.player.x <= 100) this.nextLevel()
        } else {
          this.levelProgress = (this.player.x / this.levelTarget) * 100
          if (this.levelProgress >= 100) this.nextLevel()
        }
      }

      handleInput() {
        const leftPressed =
          this.keys["a"] ||
          this.keys["arrowleft"] ||
          this.gamepadInput.left ||
          this.touchInput.left
        const rightPressed =
          this.keys["d"] ||
          this.keys["arrowright"] ||
          this.gamepadInput.right ||
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
          )
            enemy.velX *= -1
        })
      }

      updateEffects() {
        // Helper function to check if a canvas effect is enabled
        const isCanvasEffectEnabled = (effectName: string) => {
          if (this.activeCustomEffects) {
            // Check custom effects settings
            const effect = this.activeCustomEffects[effectName as keyof typeof this.activeCustomEffects]
            return effect && typeof effect === 'object' && 'enabled' in effect && (effect as any).enabled
          } else {
            // Check level effects (only canvas effects)
            return this.levelEffects.includes(effectName)
          }
        }
        
        // Helper function to get canvas effect intensity
        const getCanvasEffectIntensity = (effectName: string, defaultValue: number) => {
          if (this.activeCustomEffects) {
            const effect = this.activeCustomEffects[effectName as keyof typeof this.activeCustomEffects]
            return effect && typeof effect === 'object' && 'intensity' in effect ? (effect as any).intensity : defaultValue
          }
          return defaultValue
        }

        // Canvas effects are now handled by effectsLabSettings
        // No need to reset legacy effects properties

        // Apply wobble effect (canvas effect - affects object positions)
        if (isCanvasEffectEnabled("wobble")) {
          // Wobble is handled in renderToContext() method
          // This is just a placeholder for future wobble-specific logic
        }
        
        // Apply backwards effect (canvas effect - affects game direction)
        if (isCanvasEffectEnabled("backwards")) {
          this.isReversed = true
        } else {
          this.isReversed = false
        }
        
        // Apply upsideDown effect (canvas effect - affects coordinate system)
        // Handled in render() method via canvas transformations
        
        // Apply invert effect (canvas effect - affects colors)
        // Handled in render() method via CSS filters
        
        // Apply melting effect (canvas effect - affects object shapes)
        // Melting effect is handled in renderToContext() method via object distortion
        
        // Apply dataBleed effect (canvas effect - affects screen capture)
        // Handled in renderDataBleed() method
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
              this.player.doubleJump = false  // Reset double jump when grounded
              this.combo = 0
            }
          }
        })
        this.enemies.forEach((enemy, index) => {
          if (
            this.player.x < enemy.x + enemy.width &&
            this.player.x + this.player.width > enemy.x &&
            this.player.y < enemy.y + enemy.height &&
            this.player.y + this.player.height > enemy.y
          ) {
            if (this.player.invulnerable > 0 || this.levelStartInvincibility > 0) return
            // Always normal stomping logic (same as normal mode)
            const isStomping = (this.player.velY > 0 && this.player.y + this.player.height < enemy.y + enemy.height)
            if (isStomping) {
              this.triggerDataBleed(enemy.x, enemy.y)
              this.enemies.splice(index, 1)
              this.score += 250
              this.combo++
              if (this.combo > this.bestCombo) this.bestCombo = this.combo
              const jumpDirection = -1
              this.player.velY = jumpDirection * this.player.jumpPower * 0.6
              this.playSound("stomp")
            } else {
              this.respawn()
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
            this.score += c.value
            this.playSound("collect")
          }
        })
      }

      triggerDataBleed(x: number, y: number) {
        const duration = this.combo >= 5 ? 60 : 20
        this.dataBleedEffects.push({
          x: x,
          y: y,
          duration: duration,
          size: Math.random() * 80 + 50,
        })
      }

      respawn() {
        this.lives--
        this.combo = 0
        this.playSound("hit")
        if (this.lives <= 0) {
          this.gameState = "gameover"
          const finalScore = document.getElementById("finalScore")
          const bestCombo = document.getElementById("bestCombo")
          const gameOverScreen = document.getElementById("gameOverScreen")
          if (finalScore) finalScore.textContent = this.score.toString()
          if (bestCombo) bestCombo.textContent = this.bestCombo.toString()
          if (gameOverScreen) gameOverScreen.style.display = "flex"
          this.stopBGM()
        } else {
          // Respawn player based on backwards mode
          if (this.isReversed) {
            this.player.x = this.levelTarget - 100
          } else {
            this.player.x = 100
          }
          this.player.y = 400
          this.player.velX = 0
          this.player.velY = 0
          this.player.grounded = false
          this.player.doubleJump = false  // Reset double jump on respawn
          this.player.invulnerable = 180
        }
      }

      resetLevel(fullReset = true) {
        if (fullReset) {
          this.score = 0
          this.lives = 3
          this.combo = 0
          this.currentLevel = 1
          // Don't reset isReversed if it's set by custom effects
          if (!this.activeCustomEffects?.backwards?.enabled) {
            this.isReversed = false
          }
        }
        this.player.velX = 0
        this.player.velY = 0
        this.generateLevel()
        // Set 2-second invincibility at level start (120 frames at 60fps)
        this.levelStartInvincibility = 120
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
        this.ctx.fillStyle = "#0a0a0a"
        this.ctx.fillRect(0, 0, this.width, this.height)
        
        // Render background with canvas effects only
        this.renderBackgroundLayer(0)
      }

      renderBackgroundToContext(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = "#0a0a0a"
        ctx.fillRect(0, 0, this.width, this.height)
        
        // Render background with canvas effects only
        this.renderBackgroundLayerToContext(ctx, 0)
      }

      renderBackgroundLayer(parallaxOffset = 0, tint: string | null = null) {
        const camX = this.camera.x * (1 + parallaxOffset)
        this.backgroundStars.forEach((star) => {
          const drawX = (star.x - camX * star.parallax) % this.width
          const wrappedX = drawX < 0 ? drawX + this.width : drawX
          this.ctx.fillStyle = tint || `hsl(${star.hue}, 80%, 70%)`
          this.ctx.fillRect(wrappedX, star.y, star.size, star.size)
        })
      }

      renderBackgroundLayerToContext(ctx: CanvasRenderingContext2D, parallaxOffset = 0, tint: string | null = null) {
        const camX = this.camera.x * (1 + parallaxOffset)
        this.backgroundStars.forEach((star) => {
          const drawX = (star.x - camX * star.parallax) % this.width
          const wrappedX = drawX < 0 ? drawX + this.width : drawX
          ctx.fillStyle = tint || `hsl(${star.hue}, 80%, 70%)`
          ctx.fillRect(wrappedX, star.y, star.size, star.size)
        })
      }

      // Screen-space melting effect methods


      render() {
        if (this.gameState === "transition") {
          this.renderTransition()
          return
        }

        // Helper function to check if a canvas effect is enabled
        const isCanvasEffectEnabled = (effectName: string) => {
          if (this.activeCustomEffects) {
            const effect = this.activeCustomEffects[effectName as keyof typeof this.activeCustomEffects]
            return effect && typeof effect === 'object' && 'enabled' in effect && (effect as any).enabled
          } else {
            return this.levelEffects.includes(effectName)
          }
        }

        // Canvas rendering with canvas effects only
        this.ctx.save()

        // Apply upsideDown effect (canvas effect - coordinate system)
        if (isCanvasEffectEnabled("upsideDown")) {
          this.ctx.translate(0, this.height)
          this.ctx.scale(1, -1)
        }
        
        // Apply backwards effect (canvas effect - direction)
        if (isCanvasEffectEnabled("backwards")) {
          this.ctx.translate(this.width, 0)
          this.ctx.scale(-1, 1)
        }
        
        // Apply invert effect (canvas effect - colors)
        if (isCanvasEffectEnabled("invert")) {
          this.ctx.filter = "invert(1) hue-rotate(180deg)"
        }

        this.renderToContext(this.ctx)
        
        this.ctx.restore()
      }

      renderToContext(ctx: CanvasRenderingContext2D) {
        this.renderBackgroundToContext(ctx)
        this.renderDataBleedToContext(ctx)

        ctx.translate(-this.camera.x, -this.camera.y)

        const now = Date.now()
        
        // Helper function to check if a canvas effect is enabled
        const isCanvasEffectEnabled = (effectName: string) => {
          if (this.activeCustomEffects) {
            const effect = this.activeCustomEffects[effectName as keyof typeof this.activeCustomEffects]
            return effect && typeof effect === 'object' && 'enabled' in effect && (effect as any).enabled
          } else {
            return this.levelEffects.includes(effectName)
          }
        }
        
        const wobbleActive = isCanvasEffectEnabled("wobble")
        const meltingActive = isCanvasEffectEnabled("melting")
        
        // Get effect settings
        const wobbleSettings = this.activeCustomEffects?.wobble || { amplitude: 5, frequency: 0.05, speed: 0.002 }
        const wobbleAmplitude = wobbleSettings.amplitude || 5
        const wobbleFrequency = wobbleSettings.frequency || 0.05
        const wobbleSpeed = wobbleSettings.speed || 0.002
        
        const meltingSettings = this.activeCustomEffects?.melting || { intensity: 1, speed: 0.01 }
        const meltingIntensity = meltingSettings.intensity || 1
        const meltingSpeed = meltingSettings.speed || 0.01

        // Draw platforms with canvas effects
        this.platforms.forEach((p) => {
          let yOffset = 0
          let width = p.width
          let height = p.height
          
          // Apply wobble effect to platforms
          if (wobbleActive) {
            yOffset = Math.sin(p.x * wobbleFrequency + now * wobbleSpeed) * wobbleAmplitude
          }
          
          // Apply melting effect to platforms
          if (meltingActive) {
            const meltOffset = Math.sin(p.x * 0.02 + now * meltingSpeed) * meltingIntensity * 2
            yOffset += meltOffset
            height += Math.abs(meltOffset) * 0.5
            width += Math.abs(meltOffset) * 0.3
          }
          
          ctx.fillStyle = p.color
          ctx.fillRect(p.x, p.y + yOffset, width, height)
        })

        // Draw enemies with canvas effects
        const drawWithEffects = (obj: any) => {
          let yOffset = 0
          let xOffset = 0
          let width = obj.width
          let height = obj.height
          
          // Apply wobble effect
          if (wobbleActive) {
            yOffset = Math.sin(obj.x * wobbleFrequency + now * wobbleSpeed) * wobbleAmplitude
          }
          
          // Apply melting effect
          if (meltingActive) {
            const meltOffset = Math.sin(obj.x * 0.02 + now * meltingSpeed) * meltingIntensity * 2
            yOffset += meltOffset
            height += Math.abs(meltOffset) * 0.5
            width += Math.abs(meltOffset) * 0.3
          }
          
          ctx.fillRect(obj.x + xOffset, obj.y + yOffset, width, height)
        }

        this.enemies.forEach((e) => {
          ctx.fillStyle = e.color
          drawWithEffects(e)
        })
        
        // Draw collectibles with canvas effects
        this.collectibles.forEach((c) => {
          if (!c.collected) {
            ctx.fillStyle = c.color
            // Draw triangle centered at (c.x + c.width/2, c.y + c.height/2)
            const cx = c.x + c.width / 2
            const cy = c.y + c.height / 2
            const size = c.width
            ctx.beginPath()
            ctx.moveTo(cx, cy - size / 2)
            ctx.lineTo(cx - size / 2, cy + size / 2)
            ctx.lineTo(cx + size / 2, cy + size / 2)
            ctx.closePath()
            ctx.fill()
          }
        })

        // Draw player trail with canvas effects
        this.player.trail.forEach((point, index) => {
          ctx.fillStyle = `rgba(0, 255, 255, ${index * 0.05})`
          let yOffset = 0
          let width = this.player.width
          let height = this.player.height
          
          // Apply wobble effect to trail
          if (wobbleActive) {
            yOffset = Math.sin(point.x * wobbleFrequency + now * wobbleSpeed) * wobbleAmplitude
          }
          
          // Apply melting effect to trail
          if (meltingActive) {
            const meltOffset = Math.sin(point.x * 0.02 + now * meltingSpeed) * meltingIntensity * 2
            yOffset += meltOffset
            height += Math.abs(meltOffset) * 0.5
            width += Math.abs(meltOffset) * 0.3
          }
          
          ctx.fillRect(point.x, point.y + yOffset, width, height)
        })

        // Draw player with canvas effects
        ctx.fillStyle =
          (this.player.invulnerable > 0 || this.levelStartInvincibility > 0) && Math.floor(now / 100) % 2 === 0
            ? "white"
            : this.player.color
        drawWithEffects(this.player)
      }

      // renderScanlines methods removed - visual effects will be handled by VFX wrapper

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
            const opacity = effect.duration / (this.combo >= 5 ? 60 : 20)
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

      renderDataBleedToContext(ctx: CanvasRenderingContext2D) {
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
            const opacity = effect.duration / (this.combo >= 5 ? 60 : 20)
            ctx.save()
            ctx.globalAlpha = opacity * 0.8
            ctx.drawImage(
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
            ctx.restore()
          }
        })
      }

      renderTransition() {
        // During transition, apply zoom and screen rotation
        let zoom = this.cameraZoom
        let rotation = 0
        
        // Helper function to check if an effect is enabled
        const isEffectEnabled = (effectName: string) => {
          if (this.activeCustomEffects) {
            const effect = this.activeCustomEffects[effectName as keyof typeof this.activeCustomEffects]
            return effect && typeof effect === 'object' && 'enabled' in effect && (effect as any).enabled
          } else {
            return this.levelEffects.includes(effectName)
          }
        }
        
        if (this.transitionPhase === 'zoomIn') {
          const t = Math.min(1, this.transitionProgress / 60)
          zoom = 1 + 1.5 * t
        } else if (this.transitionPhase === 'transition') {
          zoom = 2.5
          const t = Math.min(1, this.transitionProgress / 60)
          rotation = t * Math.PI * 2 // Full 360 degree rotation
        } else if (this.transitionPhase === 'zoomOut') {
          const t = Math.min(1, this.transitionProgress / 30)
          zoom = 2.5 - 1.5 * t
        }
        
        // Normal rendering
        this.ctx.save()
        
        // Apply zoom and rotation transformation
        this.ctx.translate(this.width / 2, this.height / 2)
        this.ctx.scale(zoom, zoom)
        this.ctx.rotate(rotation)
        
        // Apply backwards flip if needed
        if (isEffectEnabled("backwards")) {
          this.ctx.scale(-1, 1)
        }
        
        this.ctx.translate(-this.player.x - this.player.width / 2, -this.player.y - this.player.height / 2)
        
        this.renderToContext(this.ctx)
        
        this.ctx.restore()
      }

      updateUI() {
        const lives = document.getElementById("lives")
        const score = document.getElementById("score")
        const level = document.getElementById("level")
        const combo = document.getElementById("combo")
        
        if (lives) lives.textContent = this.lives.toString()
        if (score) score.textContent = this.score.toString()
        if (level) level.textContent = this.currentLevel.toString()
        if (combo) combo.textContent = this.combo.toString()
        
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
    }
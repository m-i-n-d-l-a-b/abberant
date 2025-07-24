# Abberant - Trippy Side Scroller

A psychedelic side-scrolling platformer game built with Next.js and React.

## Features

- **Trippy Visual Effects**: Glitch, melting, chromatic aberration, upside-down, backwards mode, pulsing, wobble, and scanlines
- **Dynamic Audio**: Procedural BGM with tempo and pitch modulation
- **Multiple Input Methods**: Keyboard, gamepad, and mobile touch controls
- **Progressive Difficulty**: Levels get more challenging with additional effects
- **Combo System**: Chain enemy stomps for higher scores
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/aliendabz/abberant.git
cd abberant
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Controls

### Desktop
- **WASD/Arrow Keys**: Move
- **Space**: Jump
- **Shift**: Dash
- **P**: Pause
- **R**: Reset

### Mobile
- **D-pad**: Movement
- **JUMP button**: Jump
- **DASH button**: Dash
- **PAUSE button**: Pause

### Gamepad
- **Left Stick/D-pad**: Movement
- **A button**: Jump
- **B button**: Dash
- **Start button**: Pause

## Deployment

This project is configured for static export and can be deployed to any static hosting service:

### Vercel (Recommended)
```bash
npm run build
# Deploy the 'out' directory
```

### Netlify
```bash
npm run build
# Deploy the 'out' directory
```

### GitHub Pages
```bash
npm run build
# Deploy the 'out' directory to gh-pages branch
```

## Game Mechanics

- **Lives**: Start with 3 lives, lose one when hit by enemies
- **Score**: Earn points by collecting items and stomping enemies
- **Combo**: Chain enemy stomps for bonus points
- **Level Progress**: Complete levels by reaching the end (or beginning in backwards mode)
- **Effects**: Each level features random visual effects that change gameplay

## Technical Details

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: CSS with custom animations
- **Audio**: Web Audio API for procedural sound generation
- **Graphics**: HTML5 Canvas for rendering
- **Input**: Keyboard, Gamepad API, and Touch Events

## Three.js & React-Three-Fiber Setup

This project uses [Three.js](https://threejs.org/), [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber/), and [@react-three/drei](https://github.com/pmndrs/drei) for advanced 3D and VFX rendering.

### Installation

These dependencies are already included in `package.json`:
- `three`
- `@react-three/fiber`
- `@react-three/drei`

To install (if needed):
```bash
npm install three @react-three/fiber @react-three/drei
```

### Compatibility
- `@react-three/fiber` v9+ is required for React 19 compatibility.
- `@react-three/drei` 10+ is compatible with React 19 and Fiber v9.
- **Note:** There is a known runtime issue with Next.js 15 and React Three Fiber (see [Next.js issue #71836](https://github.com/vercel/next.js/issues/71836)). If you encounter errors like `TypeError: Cannot read properties of undefined (reading 'ReactCurrentOwner')`, monitor upstream for fixes.

### Testing the Setup
A minimal test component is provided at `components/VFXCanvasTest.tsx`. To verify your setup:
1. Import and render `<VFXCanvasTest />` in your app (e.g., in `app/page.tsx`).
2. You should see a spinning orange cube rendered in 3D.

### Troubleshooting
- If you see blank output or errors, ensure all dependencies are installed and versions match those in `package.json`.
- For Next.js 15, if you encounter issues, try downgrading to Next.js 14 or monitor the upstream issue for updates.
- For untranspiled module errors with Three.js, add `transpilePackages: ['three']` to your `next.config.js` if needed.

## VFX Shader Parameters & Usage

The following custom GLSL fragment shaders are used for 2D post-processing effects:
- `glitch.glsl`: Horizontal glitch offset
  - **Uniforms:**
    - `uTexture` (sampler2D): Source texture
    - `uTime` (float): Animation time
    - `uIntensity` (float): Glitch strength
- `chromatic.glsl`: Chromatic aberration (RGB channel split)
  - **Uniforms:**
    - `uTexture` (sampler2D): Source texture
    - `uIntensity` (float): Aberration strength
- `scanlines.glsl`: Horizontal scanlines overlay
  - **Uniforms:**
    - `uTexture` (sampler2D): Source texture
    - `uIntensity` (float): Scanline strength
- `pulse.glsl`: Pulsing brightness
  - **Uniforms:**
    - `uTexture` (sampler2D): Source texture
    - `uTime` (float): Animation time
    - `uIntensity` (float): Pulse strength

### Usage
- Shaders are loaded and mapped by effect name in `lib/vfx/utils.ts`.
- In `VFXCanvas`, the appropriate shader is selected based on the `effect` prop and used in a `ShaderMaterial`.
- Uniforms are set from props and animation state.
- To add new effects, create a new `.glsl` file in `lib/vfx/shaders/`, add it to the map in `utils.ts`, and document its parameters here.

## VFX Utility Functions

The following utility functions are provided in `lib/vfx/utils.ts`:

- **Shader Mapping & Loading**
  - `shaderMap`: Maps effect names (e.g., 'glitch', 'chromatic') to GLSL shader source files.
  - `loadShader(effect: string)`: Returns the GLSL source for a given effect name.

- **Debouncing**
  - `debounce(fn, delay)`: Returns a debounced version of a function, useful for limiting rapid parameter changes (e.g., slider input).

- **Canvas/Texture Handling**
  - `isCanvasValid(canvas)`: Checks if a canvas element is valid and usable.
  - `updateTextureFromCanvas(texture, canvas)`: Safely updates a THREE.Texture from a canvas element, ensuring correct image assignment and update flag.

These utilities help ensure robust, efficient, and safe VFX pipeline operations.

## Project Structure

```
abberant/
  app/                # Next.js app entry, layout, and pages
  components/         # React UI components (Game, UI, Menus, Overlays)
  constants/          # Game constants (e.g., initial values, config)
  hooks/              # Custom React hooks (e.g., useGame)
  lib/
    game/             # Core game engine modules (engine, managers, systems)
    utils/            # Utility functions (e.g., storage)
  styles/             # CSS and CSS modules for styling
  types/              # TypeScript type definitions
  legacy/             # Old/experimental game files (not used in main app)
  public/             # Static assets (if any)
  ...                # Config, docs, and other project files
```

- All gameplay, rendering, and UI logic is modularized and imported via the React/Next.js app.
- The `legacy/` folder contains old or experimental code and is not used in the main game.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

ISC License - see LICENSE file for details.

## Acknowledgments

- Inspired by classic platformer games
- Built with modern web technologies
- Designed for maximum trippyness

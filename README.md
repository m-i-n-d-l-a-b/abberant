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

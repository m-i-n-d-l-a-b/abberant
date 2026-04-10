# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Abberant is a client-side psychedelic side-scrolling platformer game built with Next.js 15, React 19, TypeScript, and HTML5 Canvas. It is a single-product repository with no backend, no database, no Docker, and no environment variables.

### Running the app

- `npm run dev` starts the Next.js dev server on `http://localhost:3000`.
- The game renders entirely client-side (Canvas + WebGL via Three.js). No external services are needed.

### Available commands

See `package.json` scripts. Key commands: `npm run dev`, `npm run build`, `npm run lint`, `npm run type-check`, `npm test`.

### Pre-existing issues

- **Lint (`npm run lint`)**: Exits with code 1 due to a pre-existing `react/no-unescaped-entities` error in `components/VFXCanvas.tsx`. This is not a setup issue.
- **Type-check (`npm run type-check`)**: Exits with code 2 due to pre-existing type errors across test files, legacy code, and some library types. Not a setup issue.
- **Tests (`npm test`)**: All 19 test suites fail because `jest.setup.js` uses ES module `import` syntax (`import '@testing-library/jest-dom'`) but Jest is configured to treat it as CommonJS. This is a pre-existing configuration issue.

### Game controls (for manual testing)

Desktop: Arrow keys / WASD to move, Space to jump, Shift to dash, P to pause, R to reset. The start screen has a "Start Game" button.

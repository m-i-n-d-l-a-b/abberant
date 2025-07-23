## Relevant Files

- `lib/game/InputManager.ts` - Handles keyboard and mobile input detection
- `lib/game/GameEngine.ts` - Core game engine with lifecycle methods
- `lib/game/PlayerManager.ts` - Player movement and dash logic
- `lib/game/CollisionSystem.ts` - Collision detection and statistics
- `lib/game/Renderer.ts` - Rendering logic and visual effects
- `lib/game/LevelGenerator.ts` - Level generation and color adjustments
- `components/MobileControls.tsx` - Mobile control button setup
- `components/GameOverScreen.tsx` - Displays game over text

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.

## Tasks

- [ ] 1.0 Normalize input handling and dash mechanics
- [ ] 2.0 Implement missing rendering effects and color adjustment
- [ ] 3.0 Clean up event listener management for gamepad and mobile controls
- [ ] 4.0 Correct collision system statistics calculation and add tests
- [ ] 5.0 Align component text with tests and disable dev-only features

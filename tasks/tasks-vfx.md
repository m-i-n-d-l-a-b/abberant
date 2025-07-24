## Relevant Files

- `components/VFXCanvas.tsx` - Scaffolded VFX overlay component with props for enabled, effect, intensity, quality, and sourceCanvas.
- `components/VFXCanvas.test.tsx` - Unit tests for VFXCanvas (rendering, error handling, prop changes).
- `components/VFXCanvasTest.tsx` - Minimal test component rendering a spinning cube with <Canvas /> from @react-three/fiber.
- `lib/vfx/shaders/` - Directory for custom GLSL shader files (e.g., glitch, chromatic, scanlines, pulse).
- `lib/vfx/shaders/__tests__/` - Unit tests for shader logic (if applicable).
- `components/VFXControls.tsx` - Scaffolded UI component with toggles and sliders for VFX parameters.
- `components/VFXControls.test.tsx` - Unit tests for VFXControls (UI, state, persistence).
- `lib/vfx/utils.ts` - Utility functions for mapping effect names to shaders and loading GLSL source code.
- `lib/vfx/utils.test.ts` - Unit tests for VFX utility functions (mapping, debounce, canvas/texture helpers).
- `app/layout.tsx` or `app/page.tsx` - Main layout/page file where VFX integration will occur.
- `tests/integration/VFXIntegration.test.tsx` - Integration tests for VFX overlay with the game.
- `lib/vfx/shaders/glitch.glsl` - Custom GLSL fragment shader for glitch effect (basic version).
- `lib/vfx/shaders/chromatic.glsl` - Custom GLSL fragment shader for chromatic aberration effect (basic version).
- `lib/vfx/shaders/scanlines.glsl` - Custom GLSL fragment shader for scanlines effect (basic version).
- `lib/vfx/shaders/pulse.glsl` - Custom GLSL fragment shader for pulse/brightness effect (basic version).
- `lib/vfx/shaders/__tests__/glslUtils.test.ts` - Unit tests for shader source loading and structure.

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `VFXCanvas.tsx` and `VFXCanvas.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.

## Tasks

- [ ] 1.0 Set Up Three.js and React-Three-Fiber Boilerplate
  - [x] 1.1 Add `three`, `@react-three/fiber`, and `@react-three/drei` to `package.json` and install dependencies.
  - [x] 1.2 Verify compatibility with current React/Next.js version. <!-- Compatible versions installed. Note: There is a known runtime issue with Next.js 15 and React Three Fiber; monitor for errors during development. -->
  - [x] 1.3 Create a minimal `<Canvas />` example in a test component to confirm setup.
  - [x] 1.4 Document setup and troubleshooting steps in the project README.

- [ ] 2.0 Create VFXCanvas Component
  - [x] 2.1 Scaffold `components/VFXCanvas.tsx` with props for `enabled`, `effect`, `intensity`, `quality`, and `sourceCanvas`.
  - [x] 2.2 Set up an orthographic camera and a full-screen quad for 2D rendering.
  - [x] 2.3 Accept a source texture (game canvas) and render it as a material on the quad.
  - [x] 2.4 Expose effect parameters to be controlled via props.
  - [x] 2.5 Add error boundary and fallback UI for WebGL errors.

- [ ] 3.0 Implement Custom GLSL Shaders for 2D Effects
  - [x] 3.1 Create `lib/vfx/shaders/glitch.glsl` for glitch effect.
  - [x] 3.2 Create `lib/vfx/shaders/chromatic.glsl` for chromatic aberration.
  - [x] 3.3 Create `lib/vfx/shaders/scanlines.glsl` for scanlines effect.
  - [x] 3.4 Create `lib/vfx/shaders/pulse.glsl` for pulse/brightness effect.
  - [x] 3.5 Write a shader loader utility to import and use these shaders in `VFXCanvas`.
  - [x] 3.6 Document shader parameters and usage.

- [ ] 4.0 Create VFXControls UI Component
  - [x] 4.1 Scaffold `components/VFXControls.tsx` with toggles and sliders for VFX parameters.
  - [x] 4.2 Connect controls to React state and pass values to `VFXCanvas`.
  - [x] 4.3 Add localStorage persistence for user settings.
  - [x] 4.4 Style the controls for usability and accessibility.

- [ ] 5.0 Develop Utility Functions for VFX Pipeline
  - [x] 5.1 Implement helpers for mapping effect names to shaders.
  - [x] 5.2 Add utilities for debouncing parameter changes.
  - [x] 5.3 Write functions for safely handling canvas/texture updates.
  - [x] 5.4 Document all utility functions.

- [ ] 6.0 Write Unit Tests for All New Components and Utilities
  - [x] 6.1 Write tests for `VFXCanvas` (rendering, error handling, prop changes).
  - [x] 6.2 Write tests for each shader (if testable in isolation).
  - [x] 6.3 Write tests for `VFXControls` (UI, state, persistence).
  - [x] 6.4 Write tests for VFX utilities.

- [ ] 7.0 Integrate VFXCanvas into Main Game Layout
  - [ ] 7.1 Overlay `VFXCanvas` on top of the main game canvas in `app/layout.tsx` or `app/page.tsx`.
  - [ ] 7.2 Ensure pointer events and z-index are set correctly for seamless interaction.
  - [ ] 7.3 Wire up VFXControls to control the overlay in real time.
  - [ ] 7.4 Test integration on all target browsers/devices.

- [ ] 8.0 Add Integration Tests and Final QA
  - [ ] 8.1 Write integration tests for VFX overlay and controls.
  - [ ] 8.2 Profile performance and optimize for low-end devices.
  - [ ] 8.3 Document known issues, limitations, and future extension points.
  - [ ] 8.4 Final code review and QA pass.

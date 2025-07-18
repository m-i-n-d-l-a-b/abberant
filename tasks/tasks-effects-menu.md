Of course. I will now generate the detailed sub-tasks and the list of relevant files.

The final task list has been generated and saved as `/tasks/tasks-prd-debug-effects-menu.md`.

---

## Relevant Files

-   `Game.tsx` - The main game file. Will require significant modification to add new state, UI components for the menu, and logic in the game loop to handle custom effects.
-   `Game.test.tsx` - Unit tests for the new logic within `Game.tsx`, such as applying custom effects and preset management.
-   `lib/utils/storage.ts` - **(New File)** To be created for handling all `localStorage` interactions (get/set/remove), keeping the main game file cleaner.
-   `lib/utils/storage.test.ts` - **(New File)** Unit tests for the `localStorage` utility functions.

### Notes

-   Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
-   Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.

## Tasks

-   [ ] 1.0 **Implement Backend Logic for Feature Unlock and Settings Persistence**
    -   [x] 1.1 Create a new file `lib/utils/storage.ts` with generic helper functions: `getFromStorage(key)` and `saveToStorage(key, value)`.
    -   [x] 1.2 In `Game.tsx`, add a check at the end of `nextLevel` to see if `this.currentLevel` has reached 101. If so, use the storage helper to save a flag: `saveToStorage('effectsLabUnlocked', true)`.
    -   [x] 1.3 In the `init` or `constructor` method, add a new state property `isEffectsLabUnlocked` and initialize it by reading from storage: `this.isEffectsLabUnlocked = getFromStorage('effectsLabUnlocked') || false;`.
    -   [x] 1.4 Add a new state property `activeCustomEffects` and initialize it by reading from storage. This will hold the settings currently applied to the game. `this.activeCustomEffects = getFromStorage('activeCustomEffects') || null;`.

-   [x] 2.0 **Create and Integrate the "Effects Lab" UI Panel**
    -   [x] 2.1 Add a new state property `isEffectsLabOpen` to the game class, initialized to `false`.
    -   [x] 2.2 In the JSX for the `#pauseScreen`, add a new button "Effects Lab". This button should only be rendered if `this.isEffectsLabUnlocked` is `true`.
    -   [x] 2.3 Add an `onClick` handler to the "Effects Lab" button that sets `isEffectsLabOpen = true`.
    -   [x] 2.4 Create the JSX structure for the Effects Lab panel. It should only be visible when `isEffectsLabOpen` is `true` and should render inside the `#pauseScreen` container.
    -   [x] 2.5 Add an "Apply & Close" button to the panel. Its `onClick` handler will set `isEffectsLabOpen = false` and apply the settings (logic for applying settings will be implemented in Task 5).
    -   [x] 2.6 Add a "Reset to Level Default" button.

-   [x] 3.0 **Build the Core Effect Toggles and Sliders**
    -   [x] 3.1 Add a state property `effectsLabSettings` to hold the current state of the UI controls in the menu. Initialize it from `activeCustomEffects` if available, otherwise from a default state.
    -   [x] 3.2 For each effect (`glitch`, `melting`, etc.), create a labeled checkbox (`<input type="checkbox">`) in the Effects Lab panel, bound to the `effectsLabSettings` state.
    -   [x] 3.3 For `glitch`, `melting`, `chromatic`, and `pulsing`, add a labeled range slider (`<input type="range">`). Bind its value to `effectsLabSettings`.
    -   [x] 3.4 Set the `min`, `max`, and `step` for each slider. The `max` value should be roughly 10x the default maximum value used in the game.
    -   [x] 3.5 Implement the `onClick` handler for the "Reset to Level Default" button. This should update `effectsLabSettings` to match the current level's `levelEffects`.

-   [x] 4.0 **Implement the Preset Management System (Save/Load/Delete)**
    -   [x] 4.1 Add a state property `effectsLabPresets` and initialize it by reading from storage: `getFromStorage('effectsLabPresets') || []`.
    -   [x] 4.2 In the UI, add a text input for preset name, a "Save Preset" button, a `<select>` dropdown for presets, and "Load Preset" / "Delete Preset" buttons.
    -   [x] 4.3 Implement the "Save Preset" logic: on click, it adds the current `effectsLabSettings` to the `effectsLabPresets` array and saves the updated array to storage.
    -   [x] 4.4 Populate the `<select>` dropdown with the `effectsLabPresets`.
    -   [x] 4.5 Implement the "Load Preset" logic: on click, it sets `activeCustomEffects` to the selected preset's values, saves it to storage, and sets `isEffectsLabOpen = false`.
    -   [x] 4.6 Implement the "Delete Preset" logic: on click, it removes the selected preset from the `effectsLabPresets` array and updates storage.

-   [ ] 5.0 **Modify Core Game Loop to Apply Custom Effects**
    -   [ ] 5.1 Update the `onClick` handler for the "Apply & Close" button to save the current `effectsLabSettings` to `activeCustomEffects` and persist it to `localStorage`.
    -   [ ] 5.2 Modify the `updateEffects` method. It should now check if `this.activeCustomEffects` exists. If so, it should populate `this.effects` based on those settings instead of `this.levelEffects`.
    -   [ ] 5.3 Modify the `render` method. Where it checks for effects like `invert` or `upsideDown` (e.g., `this.levelEffects.includes('invert')`), it must now check against the effects determined in the updated `updateEffects` logic.
    -   [ ] 5.4 Ensure that if `activeCustomEffects` is active, it is not reset or overridden by `generateLevel()` or `respawn()`. These custom settings should persist across levels and deaths.
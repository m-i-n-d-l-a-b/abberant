# Effect Classification Documentation

## Overview

This document classifies the visual effects in the game system based on their implementation method and purpose. Effects are categorized into two main groups: Canvas Effects and VFX Wrapper Effects.

## Canvas Effects (Keep in Game.tsx)

Canvas effects are implemented directly in the game's canvas rendering system and affect game objects and logic.

### 1. wobble
- **Type**: Object movement physics
- **Implementation**: Applied to individual game objects (platforms, enemies, player)
- **Effect**: Sinusoidal vertical movement based on object position and time
- **Parameters**: amplitude, frequency, speed
- **Location**: `renderToContext()` method, `drawWobbled()` function

### 2. backwards
- **Type**: Game direction logic
- **Implementation**: Affects level progress calculation and camera direction
- **Effect**: Reverses game direction, changes level completion logic
- **Parameters**: enabled (boolean)
- **Location**: `updateGame()` method, level progress calculation

### 3. upsideDown
- **Type**: Coordinate system changes
- **Implementation**: Canvas transformation in render method
- **Effect**: Flips the entire game vertically
- **Parameters**: enabled (boolean)
- **Location**: `render()` method, canvas transformation

### 4. invert
- **Type**: Game logic inversion
- **Implementation**: CSS filter applied to canvas context
- **Effect**: Inverts colors and applies hue rotation
- **Parameters**: enabled (boolean)
- **Location**: `render()` method, context filter

### 5. melting
- **Type**: Object-specific distortion
- **Implementation**: Not currently implemented in Game.tsx
- **Effect**: Should distort object shapes over time
- **Parameters**: TBD
- **Location**: TBD

### 6. dataBleed
- **Type**: Screen capture effects
- **Implementation**: Captures portions of the canvas and re-renders them
- **Effect**: Creates glitch-like screen corruption effects
- **Parameters**: duration, size, position
- **Location**: `renderDataBleed()` method, triggered on enemy stomps

## VFX Wrapper Effects (Move to react-vfx)

VFX wrapper effects are implemented using react-vfx shaders and applied as overlays to the entire game.

### 1. glitch
- **Type**: Screen distortion overlay
- **Implementation**: react-vfx shader with UV coordinate manipulation
- **Effect**: Random horizontal displacement of screen content
- **Parameters**: intensity, frequency, xOffset, yOffset
- **Location**: VFXOverlay.tsx, GameWithVFX.tsx

### 2. chromatic
- **Type**: Color separation
- **Implementation**: react-vfx shader with RGB channel separation
- **Effect**: Separates red, green, and blue channels
- **Parameters**: intensity, speed
- **Location**: VFXOverlay.tsx, GameWithVFX.tsx

### 3. pulsing
- **Type**: Brightness modulation
- **Implementation**: react-vfx shader with brightness multiplication
- **Effect**: Rhythmic brightness changes across the entire screen
- **Parameters**: intensity, speed, minAlpha, maxAlpha
- **Location**: VFXOverlay.tsx, GameWithVFX.tsx

### 4. scanlines
- **Type**: CRT monitor effect
- **Implementation**: react-vfx shader with vertical line patterns
- **Effect**: Creates alternating dark lines across the screen
- **Parameters**: spacing, opacity, speed
- **Location**: VFXOverlay.tsx, GameWithVFX.tsx

## Current Implementation Issues

### Duplicate Implementations
1. **glitch**: Implemented in both Game.tsx (canvas-based) and VFXOverlay.tsx (shader-based)
2. **chromatic**: Implemented in both Game.tsx (canvas-based) and VFXOverlay.tsx (shader-based)
3. **pulsing**: Implemented in both Game.tsx (canvas-based) and VFXOverlay.tsx (shader-based)
4. **scanlines**: Implemented in both Game.tsx (canvas-based) and VFXOverlay.tsx (shader-based)

### Effect Boundaries
- Canvas effects should only affect game objects and logic
- VFX wrapper effects should only affect the visual presentation
- No effect should be implemented in both systems

## Migration Plan

### Phase 1: Remove VFX Effects from Game.tsx
- Remove glitch, chromatic, pulsing, scanlines from `updateEffects()` method
- Remove visual effect rendering from `render()` method
- Keep only canvas-specific effects in `levelEffects` array

### Phase 2: Enhance VFX Wrapper
- Implement all visual effects using react-vfx shaders
- Create unified control interface
- Add effect combinations and layering

### Phase 3: Communication Interface
- Create GameRef interface for canvas effect control
- Implement state synchronization between systems
- Add performance monitoring and optimization 
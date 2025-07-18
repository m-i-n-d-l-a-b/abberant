# Unified VFX Architecture Design

## Overview

This document outlines the redesigned architecture for the Unified VFX System, which separates canvas effects from visual effects while maintaining a unified control interface.

## Architecture Components

### 1. Game Component (Pure Game Logic + Canvas Effects)

The Game component will be refactored to focus solely on:
- Core game mechanics and logic
- Canvas-based effects that affect game objects
- Game state management
- Performance optimization for game rendering

#### Responsibilities:
- **Game Logic**: Player movement, collision detection, level progression
- **Canvas Effects**: wobble, backwards, upsideDown, invert, melting, dataBleed
- **State Management**: Game state, player state, level state
- **Rendering**: Canvas-based rendering with object-specific effects
- **Communication**: Expose canvas effect controls via GameRef interface

#### Interface:
```typescript
export interface GameRef {
  // Canvas Effect Controls
  setCanvasEffects: (effects: CanvasEffects) => void
  getCanvasEffects: () => CanvasEffects
  updateCanvasEffects: () => void
  
  // Game State Information
  getGameState: () => GameState
  getPerformanceMetrics: () => PerformanceMetrics
  
  // Effect Lab Integration
  getEffectsLabState: () => EffectsLabState
  setEffectsLabState: (state: EffectsLabState) => void
}
```

### 2. VFX Wrapper (Visual Effects + Unified Control Panel)

The VFX Wrapper will be enhanced to provide:
- Visual effects using react-vfx shaders
- Unified control interface for all effects
- Performance monitoring and optimization
- Effect combinations and presets

#### Responsibilities:
- **Visual Effects**: glitch, chromatic, pulsing, scanlines
- **Unified Control**: Single interface for all effects (visual + canvas)
- **Effect Management**: Presets, combinations, performance optimization
- **State Synchronization**: Keep visual and canvas effects in sync
- **User Interface**: Control panel, effect preview, accessibility features

#### Interface:
```typescript
interface VFXWrapperProps {
  gameRef: React.RefObject<GameRef>
  onEffectChange?: (effects: UnifiedEffects) => void
  onPerformanceChange?: (metrics: PerformanceMetrics) => void
}

interface UnifiedEffects {
  visual: VisualEffects
  canvas: CanvasEffects
  presets: EffectPreset[]
}
```

### 3. Communication Interface

The communication between Game and VFX Wrapper will be handled through:

#### GameRef Interface
- **Canvas Effect Control**: VFX Wrapper controls canvas effects via GameRef
- **State Synchronization**: Real-time sync of effect states
- **Performance Monitoring**: Shared performance metrics
- **Event Handling**: Effect change notifications

#### State Management
- **Wrapper State**: Manages all effect settings and presets
- **Game State**: Receives effect commands and applies them
- **Synchronization**: Bidirectional state sync with validation
- **Persistence**: Save/load unified effect configurations

## Data Flow

### 1. Effect Application Flow
```
User Input → VFX Wrapper → GameRef → Game Component → Canvas Rendering
     ↓
Visual Effects → react-vfx → Screen Overlay
```

### 2. State Synchronization Flow
```
VFX Wrapper State ←→ GameRef Interface ←→ Game Component State
     ↓                    ↓                    ↓
Local Storage    ←→  Validation      ←→  Canvas Effects
```

### 3. Performance Monitoring Flow
```
Game Component → Performance Metrics → VFX Wrapper → Quality Adjustment
     ↓                    ↓                    ↓
Canvas Effects    ←→  Frame Rate      ←→  Visual Effects
```

## Effect Priority System

### Priority Levels:
1. **Visual Effects (Highest)**: Applied as screen overlays
2. **Canvas Effects (Medium)**: Applied to game objects
3. **Game Logic (Lowest)**: Core gameplay mechanics

### Conflict Resolution:
- Visual effects take precedence over canvas effects
- Canvas effects can be disabled if visual effects conflict
- Performance-based effect culling when needed
- User-configurable effect combinations

## Performance Considerations

### Quality Settings:
- **Low**: Reduced effect complexity, basic shaders
- **Medium**: Balanced quality and performance
- **High**: Full effect complexity, advanced shaders
- **Auto**: Automatic quality based on device performance

### Optimization Strategies:
- **Effect Culling**: Disable effects based on performance
- **LOD System**: Reduce effect complexity on slower devices
- **Memory Management**: Efficient resource usage and cleanup
- **Frame Rate Monitoring**: Real-time performance tracking

## File Structure

```
components/
├── Game.tsx                    # Refactored game component
├── Game.test.tsx              # Game component tests
├── VFXWrapper.tsx             # Enhanced VFX wrapper
├── VFXWrapper.test.tsx        # VFX wrapper tests
├── UnifiedVFXControl.tsx      # Unified control panel
├── UnifiedVFXControl.test.tsx # Control panel tests
└── EffectsLab.tsx             # Canvas effects lab
    └── EffectsLab.test.tsx    # Effects lab tests

lib/
├── utils/
│   ├── effectUtils.ts         # Effect management utilities
│   ├── effectUtils.test.ts    # Effect utilities tests
│   ├── performanceUtils.ts    # Performance monitoring
│   └── performanceUtils.test.ts # Performance tests

types/
├── effects.d.ts               # Effect type definitions
└── gameRef.d.ts              # GameRef interface definitions
```

## Migration Strategy

### Phase 1: Preparation
1. Create new component files
2. Define TypeScript interfaces
3. Set up utility functions
4. Create test infrastructure

### Phase 2: Game Component Refactoring
1. Remove visual effects from Game.tsx
2. Enhance GameRef interface
3. Update canvas effect implementation
4. Add performance monitoring

### Phase 3: VFX Wrapper Enhancement
1. Implement visual effects with react-vfx
2. Create unified control interface
3. Add state synchronization
4. Implement performance optimization

### Phase 4: Integration
1. Connect Game and VFX Wrapper
2. Test effect combinations
3. Validate performance
4. User acceptance testing

## Success Criteria

### Technical Success:
- ✅ No duplicate effect implementations
- ✅ Clear separation of concerns
- ✅ Unified control interface
- ✅ Proper state synchronization

### User Experience Success:
- ✅ Single control panel for all effects
- ✅ Intuitive effect categorization
- ✅ Smooth effect transitions
- ✅ Good performance across devices

### Maintainability Success:
- ✅ Clear code organization
- ✅ Well-documented architecture
- ✅ Easy to add new effects
- ✅ Simple debugging process 
# Architecture Diagrams

## Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    VFX Wrapper                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Visual Effects│  │ Unified Controls│  │ Performance │ │
│  │   (react-vfx)   │  │   (Single UI)   │  │ Monitoring  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
│           │                     │                    │      │
│           └─────────────────────┼────────────────────┘      │
│                                 │                           │
└─────────────────────────────────┼───────────────────────────┘
                                  │ GameRef Interface
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│                      Game Component                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Game Logic    │  │  Canvas Effects │  │   Effects   │ │
│  │   (Core Game)   │  │   (Object-based)│  │    Lab      │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
│           │                     │                    │      │
│           └─────────────────────┼────────────────────┘      │
│                                 │                           │
└─────────────────────────────────┼───────────────────────────┘
                                  │ Canvas Rendering
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    Screen Output                            │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │  Visual Effects │  │  Canvas Effects │                  │
│  │   (Overlay)     │  │   (Game Objects)│                  │
│  └─────────────────┘  └─────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   User      │───▶│ VFX Wrapper │───▶│ GameRef     │
│   Input     │    │   State     │    │ Interface   │
└─────────────┘    └─────────────┘    └─────────────┘
                          │                    │
                          ▼                    ▼
                   ┌─────────────┐    ┌─────────────┐
                   │ Local       │    │ Game        │
                   │ Storage     │    │ Component   │
                   └─────────────┘    └─────────────┘
                                              │
                                              ▼
                                     ┌─────────────┐
                                     │ Canvas      │
                                     │ Rendering   │
                                     └─────────────┘
                                              │
                                              ▼
                                     ┌─────────────┐
                                     │ Visual      │
                                     │ Effects     │
                                     │ (Overlay)   │
                                     └─────────────┘
```

## Effect Priority System

```
┌─────────────────────────────────────────────────────────────┐
│                    Effect Priority                          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Priority 1: Visual Effects (Highest)              │   │
│  │  • glitch, chromatic, pulsing, scanlines           │   │
│  │  • Applied as screen overlays                      │   │
│  │  • Can override canvas effects                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Priority 2: Canvas Effects (Medium)               │   │
│  │  • wobble, backwards, upsideDown, invert          │   │
│  │  • Applied to game objects                        │   │
│  │  • Can be disabled by visual effects              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Priority 3: Game Logic (Lowest)                   │   │
│  │  • Player movement, collision detection            │   │
│  │  • Level progression, scoring                      │   │
│  │  • Core gameplay mechanics                         │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## State Synchronization

```
┌─────────────────┐         ┌─────────────────┐
│ VFX Wrapper     │◄────────┤ GameRef         │
│ State           │         │ Interface       │
│                 │         │                 │
│ • Visual Effects│         │ • Canvas Effects│
│ • Presets       │         │ • Game State    │
│ • Performance   │         │ • Metrics       │
└─────────────────┘         └─────────────────┘
         │                           │
         ▼                           ▼
┌─────────────────┐         ┌─────────────────┐
│ Local Storage   │         │ Game Component  │
│ (Persistence)   │         │ State           │
│                 │         │                 │
│ • Effect Configs│         │ • Canvas Effects│
│ • User Presets  │         │ • Game Logic    │
│ • Performance   │         │ • Object States │
└─────────────────┘         └─────────────────┘
```

## Performance Monitoring

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Game Component  │───▶│ Performance     │───▶│ VFX Wrapper     │
│                 │    │ Metrics         │    │                 │
│ • Frame Rate    │    │ • FPS           │    │ • Quality       │
│ • Memory Usage  │    │ • Memory        │    │ Adjustment      │
│ • Effect Load   │    │ • Effect Count  │    │ • Effect Culling│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Canvas Effects  │    │ Performance     │    │ Visual Effects  │
│ (Optimized)     │    │ History         │    │ (Optimized)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## File Structure Diagram

```
project/
├── components/
│   ├── Game.tsx                    # Refactored game component
│   ├── Game.test.tsx              # Game component tests
│   ├── VFXWrapper.tsx             # Enhanced VFX wrapper
│   ├── VFXWrapper.test.tsx        # VFX wrapper tests
│   ├── UnifiedVFXControl.tsx      # Unified control panel
│   ├── UnifiedVFXControl.test.tsx # Control panel tests
│   ├── EffectsLab.tsx             # Canvas effects lab
│   └── EffectsLab.test.tsx        # Effects lab tests
│
├── lib/
│   └── utils/
│       ├── effectUtils.ts         # Effect management utilities
│       ├── effectUtils.test.ts    # Effect utilities tests
│       ├── performanceUtils.ts    # Performance monitoring
│       └── performanceUtils.test.ts # Performance tests
│
├── types/
│   ├── effects.d.ts               # Effect type definitions
│   └── gameRef.d.ts              # GameRef interface definitions
│
└── docs/
    ├── effect-classification.md   # Effect categorization
    ├── architecture-design.md     # Architecture documentation
    └── architecture-diagrams.md   # This file
``` 
# React-VFX Integration Guide

This guide explains how to integrate `react-vfx` with your existing Canvas-based game to add WebGL-accelerated visual effects.

## Overview

`react-vfx` is a React library that provides WebGL-based visual effects for React elements. It can be used alongside your existing Canvas-based game to add sophisticated visual effects without modifying your core game logic.

## Installation

```bash
npm install react-vfx
```

## Integration Approaches

### 1. Simple VFX Overlay (Recommended)

**Best for:** Adding effects to UI elements, transitions, and special events.

**How it works:** `react-vfx` components are rendered as overlays on top of your existing game canvas.

**Benefits:**
- Minimal code changes
- Keeps existing game logic intact
- WebGL acceleration for certain effects
- Easy to implement and maintain

**Example:**
```tsx
import { VFXProvider, VFXDiv } from 'react-vfx'

function GameWithVFX() {
  return (
    <VFXProvider>
      <div style={{ position: 'relative' }}>
        {/* Your existing game */}
        <Game />
        
        {/* VFX overlay */}
        <VFXDiv
          shader="rgbShift"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            opacity: 0.3
          }}
        />
      </div>
    </VFXProvider>
  )
}
```

### 2. Advanced Integration

**Best for:** Syncing VFX effects with your game's existing Effects Lab system.

**How it works:** VFX effects are synchronized with your game's current effect settings.

**Benefits:**
- Seamless integration with existing effects
- Combines Canvas and WebGL rendering
- More sophisticated effect combinations

### 3. UI Element Effects

**Best for:** Applying effects to specific UI elements like buttons, text, and panels.

**Example:**
```tsx
import { VFXProvider, VFXSpan, VFXDiv } from 'react-vfx'

function UIWithVFX() {
  return (
    <VFXProvider>
      {/* Text with rainbow effect */}
      <VFXSpan shader="rainbow">
        Trippy Game Title!
      </VFXSpan>
      
      {/* Button with glitch effect */}
      <VFXDiv shader="rgbShift">
        <button>Start Game</button>
      </VFXDiv>
    </VFXProvider>
  )
}
```

## Available Components

### VFXProvider
Wrapper component that provides the WebGL context for all VFX components.

### VFXImg
Apply effects to images. Supports static images, GIFs, and videos.

```tsx
<VFXImg 
  src="game-screenshot.png" 
  shader="pixelate" 
  alt="Game screenshot with pixelation effect"
/>
```

### VFXSpan
Apply effects to text content.

```tsx
<VFXSpan shader="rainbow">
  This text has a rainbow effect!
</VFXSpan>
```

### VFXDiv
Apply effects to any HTML content.

```tsx
<VFXDiv shader="rgbShift">
  <div>Any content here gets the effect!</div>
</VFXDiv>
```

## Built-in Shaders

### rgbShift
Creates chromatic aberration effect by shifting red and blue channels.

### pixelate
Reduces image resolution for a pixelated look.

### halftone
Creates a halftone dot pattern effect.

### rainbow
Applies a rainbow color cycling effect.

## Custom Shaders

You can write your own GLSL shaders for custom effects:

```tsx
<VFXDiv
  shader={`
    uniform vec2 resolution;
    uniform vec2 offset;
    uniform float time;
    uniform sampler2D src;
    out vec4 outColor;

    void main() {
      vec2 uv = (gl_FragCoord.xy - offset) / resolution;
      
      // Custom glitch effect
      float glitch = sin(time * 5.0) * 0.1;
      uv.x += glitch * sin(uv.y * 10.0);
      
      outColor = texture2D(src, uv);
    }
  `}
>
  Content with custom effect
</VFXDiv>
```

## Performance Considerations

### When to Use react-vfx
- **UI elements** (buttons, text, panels)
- **Transition effects** (level transitions, menu animations)
- **Special events** (combo multipliers, power-ups)
- **Overlay effects** (screen-wide effects)

### When to Stick with Canvas
- **Core game rendering** (player, enemies, platforms)
- **Real-time game logic** (physics, collisions)
- **Performance-critical effects** (particle systems)

## Demo

Visit `/vfx-demo` to see all integration approaches in action:

1. **Original Game** - Your current Canvas-based game
2. **Simple VFX Overlay** - Basic react-vfx integration
3. **Advanced Integration** - Synced with Effects Lab
4. **VFX Examples** - Built-in and custom shaders

## Implementation Steps

### Step 1: Choose Your Approach
Decide which integration approach fits your needs:
- **Simple Overlay** for basic effects
- **Advanced Integration** for complex synchronization
- **UI Effects** for interface elements

### Step 2: Install Dependencies
```bash
npm install react-vfx
```

### Step 3: Wrap with VFXProvider
```tsx
import { VFXProvider } from 'react-vfx'

function App() {
  return (
    <VFXProvider>
      <YourGame />
    </VFXProvider>
  )
}
```

### Step 4: Add VFX Components
Choose the appropriate VFX component for your use case:
- `VFXDiv` for overlays and containers
- `VFXSpan` for text effects
- `VFXImg` for image effects

### Step 5: Select Shaders
Start with built-in shaders, then experiment with custom GLSL code.

## Best Practices

1. **Layer Management**: Use proper z-index values to control effect layering
2. **Performance**: Don't apply heavy effects to frequently updating elements
3. **Accessibility**: Ensure effects don't interfere with game usability
4. **Fallbacks**: Provide fallbacks for devices that don't support WebGL
5. **Testing**: Test effects on different devices and browsers

## Troubleshooting

### Effects Not Showing
- Ensure `VFXProvider` wraps your components
- Check that shader names are correct
- Verify WebGL support in browser

### Performance Issues
- Reduce effect complexity
- Use fewer VFX components
- Consider disabling effects on low-end devices

### TypeScript Errors
- Install proper type definitions
- Use correct import statements
- Check component prop types

## Conclusion

`react-vfx` provides a powerful way to add sophisticated visual effects to your game without major architectural changes. The Simple VFX Overlay approach is recommended for most use cases, as it provides the best balance of functionality and maintainability.

For more examples and advanced usage, explore the demo components in this project. 
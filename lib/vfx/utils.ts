// utils.ts - VFX utility functions

import type * as THREE from 'three';

/**
 * Maps effect names to shader file paths.
 */
export const shaderMap: Record<string, string> = {
  glitch: require('./shaders/glitch.glsl').default,
  chromatic: require('./shaders/chromatic.glsl').default,
  scanlines: require('./shaders/scanlines.glsl').default,
  pulse: require('./shaders/pulse.glsl').default,
};

/**
 * Loads a shader by effect name.
 * Returns the GLSL source as a string.
 */
export function loadShader(effect: string): string | undefined {
  return shaderMap[effect];
}

/**
 * Debounce a function to limit how often it can fire.
 * Usage: const debouncedFn = debounce(fn, 200);
 */
export function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return function(this: any, ...args: any[]) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  } as T;
}

/**
 * Check if a canvas element is valid and usable.
 */
export function isCanvasValid(canvas: any): canvas is HTMLCanvasElement {
  return (
    canvas &&
    typeof canvas.getContext === 'function' &&
    canvas.width > 0 &&
    canvas.height > 0
  );
}

/**
 * Safely update a THREE.Texture from a canvas element.
 * Returns true if updated, false if not.
 */
export function updateTextureFromCanvas(texture: THREE.Texture, canvas: HTMLCanvasElement | null): boolean {
  if (texture && canvas && isCanvasValid(canvas)) {
    texture.image = canvas;
    texture.needsUpdate = true;
    return true;
  }
  return false;
}

// If async loading is needed (e.g., dynamic import), add here in the future. 
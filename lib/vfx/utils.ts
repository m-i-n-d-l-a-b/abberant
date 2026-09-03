// utils.ts - VFX utility functions

import type * as THREE from 'three';

import chromatic from './shaders/chromatic.glsl';
import glitch from './shaders/glitch.glsl';
import pulse from './shaders/pulse.glsl';
import scanlines from './shaders/scanlines.glsl';

/**
 * Maps effect names to their GLSL source.
 */
export const shaderMap: Record<string, string> = {
  glitch,
  chromatic,
  scanlines,
  pulse,
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
  // Boolean() matters: without it a null/undefined argument returns the falsy
  // value itself rather than `false`, which breaks the type-predicate contract
  // and any caller doing a strict === false comparison.
  return Boolean(
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
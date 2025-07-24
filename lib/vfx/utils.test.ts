import { shaderMap, loadShader, debounce, isCanvasValid, updateTextureFromCanvas } from './utils';
import * as THREE from 'three';

describe('VFX Utilities', () => {
  it('shaderMap contains all expected effects', () => {
    expect(Object.keys(shaderMap)).toEqual(
      expect.arrayContaining(['glitch', 'chromatic', 'scanlines', 'pulse'])
    );
  });

  it('loadShader returns shader source for valid effect', () => {
    expect(typeof loadShader('glitch')).toBe('string');
    expect(loadShader('glitch')).toMatch(/void\s+main/);
  });

  it('debounce delays function execution', done => {
    let count = 0;
    const fn = debounce(() => { count++; }, 50);
    fn(); fn(); fn();
    setTimeout(() => {
      expect(count).toBe(1);
      done();
    }, 100);
  });

  it('isCanvasValid returns true for valid canvas', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 10;
    canvas.height = 10;
    expect(isCanvasValid(canvas)).toBe(true);
  });

  it('isCanvasValid returns false for invalid canvas', () => {
    expect(isCanvasValid(null)).toBe(false);
    expect(isCanvasValid({})).toBe(false);
    const canvas = document.createElement('canvas');
    canvas.width = 0;
    expect(isCanvasValid(canvas)).toBe(false);
  });

  it('updateTextureFromCanvas updates texture if valid', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 10;
    canvas.height = 10;
    const texture = new THREE.Texture();
    const result = updateTextureFromCanvas(texture, canvas);
    expect(result).toBe(true);
    expect(texture.image).toBe(canvas);
    expect(texture.needsUpdate).toBe(true);
  });

  it('updateTextureFromCanvas returns false if invalid', () => {
    const texture = new THREE.Texture();
    expect(updateTextureFromCanvas(texture, null)).toBe(false);
    expect(updateTextureFromCanvas(texture, {} as any)).toBe(false);
  });
}); 
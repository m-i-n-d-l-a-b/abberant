import glitch from '../glitch.glsl';
import chromatic from '../chromatic.glsl';
import scanlines from '../scanlines.glsl';
import pulse from '../pulse.glsl';

describe('VFX GLSL Shaders', () => {
  it('glitch.glsl loads and contains main()', () => {
    expect(typeof glitch).toBe('string');
    expect(glitch).toMatch(/void\s+main\s*\(/);
    expect(glitch).toMatch(/uTexture/);
  });
  it('chromatic.glsl loads and contains main()', () => {
    expect(typeof chromatic).toBe('string');
    expect(chromatic).toMatch(/void\s+main\s*\(/);
    expect(chromatic).toMatch(/uTexture/);
  });
  it('scanlines.glsl loads and contains main()', () => {
    expect(typeof scanlines).toBe('string');
    expect(scanlines).toMatch(/void\s+main\s*\(/);
    expect(scanlines).toMatch(/uTexture/);
  });
  it('pulse.glsl loads and contains main()', () => {
    expect(typeof pulse).toBe('string');
    expect(pulse).toMatch(/void\s+main\s*\(/);
    expect(pulse).toMatch(/uTexture/);
  });
}); 
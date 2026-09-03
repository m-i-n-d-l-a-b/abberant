/**
 * Jest Setup File
 *
 * Configures the test environment for DOM and WebAudio testing.
 * Mocks browser APIs and globals required for game and UI tests.
 */

require('@testing-library/jest-dom');

// --- Canvas/DOM Mocks ---
if (typeof global.Path2D === 'undefined') {
  Object.defineProperty(global, 'Path2D', {
    value: class Path2D {
      constructor() {}
      moveTo() {}
      lineTo() {}
      closePath() {}
    },
    writable: true,
    configurable: true,
  });
}

if (typeof global.DOMMatrix === 'undefined') {
  Object.defineProperty(global, 'DOMMatrix', {
    value: class DOMMatrix {
      constructor() {
        this.a = 1;
        this.b = 0;
        this.c = 0;
        this.d = 1;
        this.e = 0;
        this.f = 0;
      }
    },
    writable: true,
    configurable: true,
  });
}

// --- WebAudio API Mocks ---
if (typeof global.AudioContext === 'undefined') {
  Object.defineProperty(global, 'AudioContext', {
    value: class MockAudioContext {
      constructor() {
        this.state = 'running';
        this.destination = {};
      }
      createGain() {
        return {
          gain: {
            setValueAtTime: jest.fn(),
            linearRampToValueAtTime: jest.fn(),
            exponentialRampToValueAtTime: jest.fn(),
          },
          connect: jest.fn(),
          disconnect: jest.fn(),
        };
      }
      createOscillator() {
        return {
          frequency: { setValueAtTime: jest.fn() },
          connect: jest.fn(),
          disconnect: jest.fn(),
          start: jest.fn(),
          stop: jest.fn(),
        };
      }
      createBufferSource() {
        return {
          buffer: null,
          connect: jest.fn(),
          disconnect: jest.fn(),
          start: jest.fn(),
          stop: jest.fn(),
        };
      }
      createBuffer() {
        return {
          length: 44100,
          duration: 1,
          numberOfChannels: 1,
          sampleRate: 44100,
          getChannelData: () => new Float32Array(44100),
        };
      }
      decodeAudioData() {
        return Promise.resolve(this.createBuffer());
      }
      resume() { return Promise.resolve(); }
      suspend() { return Promise.resolve(); }
      close() { return Promise.resolve(); }
    },
    writable: true,
    configurable: true,
  });
}

// --- AnimationFrame/Performance Mocks ---
if (typeof global.requestAnimationFrame === 'undefined') {
  global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
}
if (typeof global.cancelAnimationFrame === 'undefined') {
  global.cancelAnimationFrame = jest.fn();
}
if (typeof global.performance === 'undefined') {
  global.performance = {};
}
if (typeof global.performance.now !== 'function') {
  global.performance.now = jest.fn(() => Date.now());
} 
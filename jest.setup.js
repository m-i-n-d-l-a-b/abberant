/**
 * Jest Setup File
 * 
 * Configures the test environment for DOM testing.
 */

require('@testing-library/jest-dom')

// Mock Path2D and DOMMatrix for tests that need them
global.Path2D = class Path2D {
  constructor() {}
  moveTo() {}
  lineTo() {}
  closePath() {}
}

global.DOMMatrix = class DOMMatrix {
  constructor() {
    this.a = 1
    this.b = 0
    this.c = 0
    this.d = 1
    this.e = 0
    this.f = 0
  }
}

// Mock AudioContext for audio tests
global.AudioContext = class MockAudioContext {
  constructor() {
    this.state = 'running'
    this.destination = {}
  }
  
  createGain() {
    return {
      gain: {
        setValueAtTime: jest.fn(),
        linearRampToValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn()
      },
      connect: jest.fn(),
      disconnect: jest.fn()
    }
  }
  
  createOscillator() {
    return {
      frequency: { setValueAtTime: jest.fn() },
      connect: jest.fn(),
      disconnect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn()
    }
  }
  
  createBufferSource() {
    return {
      buffer: null,
      connect: jest.fn(),
      disconnect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn()
    }
  }
  
  createBuffer() {
    return {
      length: 44100,
      duration: 1,
      numberOfChannels: 1,
      sampleRate: 44100,
      getChannelData: () => new Float32Array(44100)
    }
  }
  
  decodeAudioData() {
    return Promise.resolve(this.createBuffer())
  }
  
  resume() {
    return Promise.resolve()
  }
  
  suspend() {
    return Promise.resolve()
  }
  
  close() {
    return Promise.resolve()
  }
}

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16))
global.cancelAnimationFrame = jest.fn()

// Mock performance
global.performance = {
  now: jest.fn(() => Date.now())
} 
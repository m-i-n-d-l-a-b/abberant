import React from 'react';
import { render, screen } from '@testing-library/react';

// @react-three/fiber's <Canvas> needs a real WebGL context, which jsdom does
// not provide -- unmocked, it throws and every assertion about rendered output
// becomes a test of jsdom rather than of VFXCanvas. Mock it to a plain <canvas>
// so the component's own behaviour (enabled gating, error boundary, prop
// updates) is what gets exercised. mockCanvasShouldThrow lets a single test
// simulate a WebGL failure; the `mock` prefix is required for jest to allow the
// reference inside the module factory.
let mockCanvasShouldThrow = false;

jest.mock('@react-three/fiber', () => ({
  Canvas: () => {
    if (mockCanvasShouldThrow) {
      throw new Error('WebGL context unavailable');
    }
    return <canvas data-testid="r3f-canvas" />;
  },
  useThree: () => ({}),
  useFrame: () => undefined,
}));

import VFXCanvas from './VFXCanvas';

// Mock for HTMLCanvasElement
const mockCanvas = document.createElement('canvas');
mockCanvas.width = 100;
mockCanvas.height = 100;

describe('VFXCanvas', () => {
  beforeEach(() => {
    mockCanvasShouldThrow = false;
  });

  it('renders when enabled', () => {
    render(
      <VFXCanvas
        enabled={true}
        effect="glitch"
        intensity={0.5}
        quality="medium"
        sourceCanvas={mockCanvas}
      />
    );
    // Should render a div with a canvas inside
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('does not render when disabled', () => {
    render(
      <VFXCanvas
        enabled={false}
        effect="glitch"
        intensity={0.5}
        quality="medium"
        sourceCanvas={mockCanvas}
      />
    );
    expect(document.querySelector('canvas')).not.toBeInTheDocument();
  });

  it('renders error fallback UI if the WebGL canvas throws', () => {
    // Suppress React's error-boundary logging for this expected throw.
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockCanvasShouldThrow = true;

    render(
      <VFXCanvas
        enabled={true}
        effect="glitch"
        intensity={0.5}
        quality="medium"
        sourceCanvas={mockCanvas}
      />
    );

    // The fallback UI should be present, and no canvas should have rendered.
    expect(screen.getByText(/WebGL Error/i)).toBeInTheDocument();
    expect(document.querySelector('canvas')).not.toBeInTheDocument();

    consoleError.mockRestore();
  });

  it('updates when props change', () => {
    const { rerender } = render(
      <VFXCanvas
        enabled={true}
        effect="glitch"
        intensity={0.5}
        quality="medium"
        sourceCanvas={mockCanvas}
      />
    );
    expect(document.querySelector('canvas')).toBeInTheDocument();
    rerender(
      <VFXCanvas
        enabled={true}
        effect="pulse"
        intensity={1}
        quality="high"
        sourceCanvas={mockCanvas}
      />
    );
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });
});

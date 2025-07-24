// scanlines.glsl - Fragment shader for scanlines effect

precision highp float;

uniform sampler2D uTexture;
uniform float uIntensity;
varying vec2 vUv;

void main() {
  // Overlay horizontal scanlines
  float scanline = sin(vUv.y * 400.0) * 0.5 + 0.5;
  float factor = 1.0 - (scanline * 0.2 * uIntensity);
  vec4 color = texture2D(uTexture, vUv);
  color.rgb *= factor;
  gl_FragColor = color;
} 
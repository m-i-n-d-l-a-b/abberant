// chromatic.glsl - Fragment shader for chromatic aberration effect

precision highp float;

uniform sampler2D uTexture;
uniform float uIntensity;
varying vec2 vUv;

void main() {
  // Offset each color channel for chromatic aberration
  float offset = 0.01 * uIntensity;
  vec4 color;
  color.r = texture2D(uTexture, vUv + vec2(offset, 0.0)).r;
  color.g = texture2D(uTexture, vUv).g;
  color.b = texture2D(uTexture, vUv - vec2(offset, 0.0)).b;
  color.a = 1.0;
  gl_FragColor = color;
} 
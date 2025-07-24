// glitch.glsl - Fragment shader for glitch effect

precision highp float;

uniform sampler2D uTexture;
uniform float uTime;
uniform float uIntensity;
varying vec2 vUv;

void main() {
  // Simple horizontal glitch offset
  float glitch = sin(vUv.y * 40.0 + uTime * 10.0) * 0.02 * uIntensity;
  vec2 uv = vUv + vec2(glitch, 0.0);
  gl_FragColor = texture2D(uTexture, uv);
} 
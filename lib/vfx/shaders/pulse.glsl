// pulse.glsl - Fragment shader for pulse/brightness effect

precision highp float;

uniform sampler2D uTexture;
uniform float uTime;
uniform float uIntensity;
varying vec2 vUv;

void main() {
  // Modulate brightness with a pulsing sine wave
  float pulse = 1.0 + sin(uTime * 2.0) * 0.5 * uIntensity;
  vec4 color = texture2D(uTexture, vUv);
  color.rgb *= pulse;
  gl_FragColor = color;
} 
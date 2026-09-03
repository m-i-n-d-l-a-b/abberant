/**
 * Type declarations for GLSL shader imports.
 *
 * Shader files are loaded as raw source strings -- by webpack's `asset/source`
 * in the Next.js build, and by jest.glsl-transformer.js under test.
 */
declare module '*.glsl' {
  const source: string
  export default source
}

declare module '*.vert' {
  const source: string
  export default source
}

declare module '*.frag' {
  const source: string
  export default source
}

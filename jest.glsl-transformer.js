/**
 * Jest transformer for .glsl shader files.
 *
 * Mirrors what webpack's `asset/source` type does in the Next.js build (see
 * next.config.js): the shader source is exposed as the module's default
 * export. Without this, importing a .glsl file from a test throws
 * "Jest encountered an unexpected token".
 *
 * __esModule is set so both `import src from './x.glsl'` and
 * `require('./x.glsl').default` resolve to the source string.
 */
module.exports = {
  process(sourceText) {
    return {
      code: `module.exports = { __esModule: true, default: ${JSON.stringify(
        sourceText
      )} };`,
    };
  },

  // Shader contents are the only thing that affects the output, so the source
  // text alone is a sufficient cache key.
  getCacheKey(sourceText) {
    return sourceText;
  },
};

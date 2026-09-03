/**
 * Registers @testing-library/jest-dom's matcher type augmentations.
 *
 * jest.setup.js requires the package at runtime, but because that file is
 * plain JavaScript TypeScript never sees the import and therefore never picks
 * up the `toBeInTheDocument` / `toHaveClass` / etc. declarations. This ambient
 * import makes the matchers visible to `tsc` across all test files.
 */
import '@testing-library/jest-dom'

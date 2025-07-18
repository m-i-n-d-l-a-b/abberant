declare global {
  const describe: (name: string, fn: () => void) => void
  const it: (name: string, fn: () => void) => void
  const expect: any
  const beforeEach: (fn: () => void) => void
  const afterEach: (fn: () => void) => void
  const jest: any
}

export {} 
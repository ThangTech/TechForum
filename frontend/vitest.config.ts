import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    // Every test is in src/__tests__, in the same sub-folder as the code it checks (src/api/x.ts -> src/__tests__/api/x.test.ts).
    include: ['src/__tests__/**/*.test.ts'],
  },
})

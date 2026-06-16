import { mergeConfig } from 'vite'
import { defineConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    server: {
      deps: {
        inline: ['@asamuzakjp/css-color', '@csstools/css-calc'],
      },
    },
    test: {
      environment: 'node',
      pool: 'threads',
      globals: false,
      setupFiles: ['./src/vitest.setup.dom.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
      environmentMatchGlobs: [],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'json-summary'],
        include: [
          'src/engine/**/*.ts',
          'src/comparison/**/*.ts',
          'src/api/clinrecProcessMapper.ts',
          'src/utils/permissions.ts',
        ],
        exclude: ['**/*.test.ts', '**/index.ts'],
      },
    },
  })
)

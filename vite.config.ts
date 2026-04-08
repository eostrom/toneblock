import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'
import solidPlugin from 'vite-plugin-solid'
import devtools from 'solid-devtools/vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [devtools(), solidPlugin(), tailwindcss()],
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    transformMode: {
      web: [/\.[jt]sx?$/],
    },
    setupFiles: ['./vitest.setup.ts'],
    deps: {
      inline: [/solid-js/],
    },
  },
  resolve: {
    conditions: ['development', 'browser'],
  },
})

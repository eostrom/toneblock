import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock WebRenderer
vi.mock('@elemaudio/web-renderer', () => {
  return {
    default: class {
      initialize = vi.fn().mockResolvedValue({ connect: vi.fn() })
      render = vi.fn().mockResolvedValue(undefined)
    },
  }
})

// Mock AudioContext globally
global.AudioContext = class {
  resume = vi.fn().mockResolvedValue(undefined)
  close = vi.fn().mockResolvedValue(undefined)
  destination = {}
} as unknown as typeof AudioContext

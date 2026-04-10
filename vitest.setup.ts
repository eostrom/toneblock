import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock WebRenderer
const mockInitialize = vi.fn().mockResolvedValue({ connect: vi.fn() })
const mockRender = vi.fn().mockResolvedValue(undefined)

vi.mock('@elemaudio/web-renderer', () => {
  return {
    default: class {
      initialize = mockInitialize
      render = mockRender
    },
    mockInitialize,
    mockRender,
  }
})

// Mock AudioContext globally
const mockResume = vi.fn().mockResolvedValue(undefined)
const mockClose = vi.fn().mockResolvedValue(undefined)

global.AudioContext = class {
  resume = mockResume
  close = mockClose
  destination = {}
} as unknown as typeof AudioContext

export { mockInitialize, mockRender, mockResume, mockClose }

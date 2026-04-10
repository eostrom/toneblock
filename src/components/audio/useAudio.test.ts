import { describe, it, expect } from 'vitest'
import { renderHook } from '@solidjs/testing-library'
import { useAudio } from './useAudio'
import { mockRender, mockResume } from '../../../vitest.setup'

describe('`useAudio`', () => {
  it('calls `context.resume` when `activate` is called', async () => {
    const { result } = renderHook(() => useAudio())

    await result.activate()

    expect(mockResume).toHaveBeenCalled()
  })

  it('calls `core.render` when `render` is called', async () => {
    const { result } = renderHook(() => useAudio())

    const tones = { some: 'tones' }
    await result.render(tones)

    expect(mockRender).toHaveBeenCalledWith(tones)
  })
})

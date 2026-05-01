import { describe, expect, it } from 'vitest'
import { renderHook } from '@solidjs/testing-library'
import { useAudio } from './useAudio'
import { mockRender, mockResume } from '../../../vitest.setup'
import { el } from '@elemaudio/core'

describe('`useAudio`', () => {
  it('calls `context.resume` when `activate` is called', async () => {
    const { result } = renderHook(() => useAudio())

    await result.activate()

    expect(mockResume).toHaveBeenCalled()
  })

  it('calls `core.render` when `render` is called', async () => {
    const { result } = renderHook(() => useAudio())

    result.unmute()
    const tones = { some: 'tones' }
    await result.render(tones)

    expect(mockRender).toHaveBeenCalledWith(tones)
  })

  it('renders silence when `render` is called (muted)', async () => {
    const { result } = renderHook(() => useAudio())

    await result.render({ some: 'tones' })

    expect(mockRender).toHaveBeenCalledWith(el.const({ value: 0 }))
  })

  it('is initially muted', () => {
    const { result } = renderHook(() => useAudio())

    expect(result.isMuted()).toBe(true)
  })

  it('can be unmuted and muted', () => {
    const { result } = renderHook(() => useAudio())

    result.unmute()

    expect(result.isMuted()).toBe(false)

    result.mute()

    expect(result.isMuted()).toBe(true)
  })
})

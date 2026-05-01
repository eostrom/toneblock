import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { useToneBlockAudio } from './useToneBlockAudio'
import { mockRender, mockResume } from '../../../vitest.setup'
import { blockTones } from '../../tone'
import { solvedGrid } from '../../block/constants'
import { moveBlock } from '../../block/utils'

describe('`useToneBlockAudio`', () => {
  it('resumes the audio context when `activate` is called', async () => {
    const { result } = renderHook(() => useToneBlockAudio(() => solvedGrid))
    expect(mockResume).toHaveBeenCalled()

    await result.activate()

    expect(mockResume).toHaveBeenCalledTimes(2)
  })

  it('renders tones when the biggest group changes', async () => {
    const [grid, setGrid] = createSignal(solvedGrid)
    const { result } = renderHook(() => useToneBlockAudio(grid))

    result.unmute()

    await waitFor(() => {
      expect(mockRender).toHaveBeenCalledWith(
        blockTones([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]),
      )
    })

    setGrid(moveBlock(15, grid()))

    await waitFor(() => {
      expect(mockRender).toHaveBeenCalledWith(
        blockTones([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]),
      )
    })
  })

  it('is initially muted', () => {
    const { result } = renderHook(() => useToneBlockAudio(() => solvedGrid))

    expect(result.isMuted()).toBe(true)
  })

  it('can be unmuted and muted', () => {
    const { result } = renderHook(() => useToneBlockAudio(() => solvedGrid))

    result.unmute()

    expect(result.isMuted()).toBe(false)

    result.mute()

    expect(result.isMuted()).toBe(true)
  })
})

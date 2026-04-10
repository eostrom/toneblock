import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { useFlipAnimation } from './useFlipAnimation'
import { solvedGrid } from '../../block/constants'

describe('`useFlipAnimation`', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('updates the grid when `animateGrid` is called', async () => {
    const [grid, setGrid] = createSignal(solvedGrid)
    const { result } = renderHook(() => useFlipAnimation(setGrid))

    const newGrid = solvedGrid.toReversed()
    const promise = result.animateGrid(newGrid)

    expect(grid()).toBe(newGrid)

    vi.runAllTimers()
    await promise
  })

  it('manages `animating` state', async () => {
    const [, setGrid] = createSignal(solvedGrid)
    const { result } = renderHook(() => useFlipAnimation(setGrid))

    expect(result.animating()).toBe(false)

    const promise = result.animateGrid(solvedGrid)
    expect(result.animating()).toBe(true)

    vi.runAllTimers()
    await promise
    expect(result.animating()).toBe(false)
  })

  it('applies FLIP transformations to elements', async () => {
    const [, setGrid] = createSignal(solvedGrid)
    const { result } = renderHook(() => useFlipAnimation(setGrid))

    const mockElement = {
      style: { transform: '', transition: '' },
      getBoundingClientRect: vi.fn(),
    } as unknown as HTMLElement

    // Mock different positions
    vi.mocked(mockElement.getBoundingClientRect)
      .mockReturnValueOnce({ left: 10, top: 10 } as DOMRect) // First
      .mockReturnValueOnce({ left: 20, top: 20 } as DOMRect) // Last

    result.blockRefs.set(1, mockElement)

    const promise = result.animateGrid(solvedGrid)

    // First animation frame
    vi.advanceTimersByTime(16)

    const style = mockElement.style
    expect(style.transform).toEqual('translate(-10px, -10px)')
    expect(style.transition).toEqual('none')

    // Second (inner) animation frame
    vi.advanceTimersByTime(16)

    vi.runAllTimers()
    await promise

    expect(style.transform).toEqual('')
    expect(style.transition).toEqual('transform 300ms ease-out')
  })
})

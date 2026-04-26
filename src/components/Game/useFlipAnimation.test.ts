import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@solidjs/testing-library'
import { useFlipAnimation } from './useFlipAnimation'
import { solvedGrid } from '../../block/constants'
import { GameProvider, useGame } from '../../stores/GameContext'

describe('`useFlipAnimation`', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('updates the grid when `animateGrid` is called', async () => {
    const { result } = renderHook(
      () => {
        const animation = useFlipAnimation()
        const game = useGame()
        return { ...animation, game }
      },
      { wrapper: GameProvider },
    )

    const newGrid = solvedGrid.toReversed()
    const promise = result.animateGrid(newGrid)

    expect(result.game.grid.grid).toStrictEqual(newGrid)

    vi.runAllTimers()
    await promise
  })

  it('manages `animating` state', async () => {
    const { result } = renderHook(
      () => {
        const animation = useFlipAnimation()
        const game = useGame()
        return { ...animation, game }
      },
      { wrapper: GameProvider },
    )

    expect(result.game.view.animating).toBe(false)

    const promise = result.animateGrid(solvedGrid)
    expect(result.game.view.animating).toBe(true)

    vi.runAllTimers()
    await promise
    expect(result.game.view.animating).toBe(false)
  })

  it('applies FLIP transformations to elements', async () => {
    const { result } = renderHook(() => useFlipAnimation(), {
      wrapper: GameProvider,
    })

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

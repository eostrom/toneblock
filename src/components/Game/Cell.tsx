import { Component, createMemo } from 'solid-js'
import { unwait } from '../../utils/promise'
import springSkyImage from '../../assets/images/spring-sky.jpg'
import type { Block } from '../../block/types'
import { solvedGrid } from '../../block/constants'
import {
  getMovementPath,
  getPositionForBlock,
  isBlockMovable,
} from '../../block/utils'
import { useGame } from '../../stores/GameContext'

interface Props {
  /** The block identifier (number) or null for the empty cell. */
  block: Block | null
  /** Callback to trigger a move animation and logic. */
  onMove: (block: Block | null) => Promise<void>
  /** Ref setter for the flip animation. */
  ref?: (element: HTMLDivElement) => void
}

/**
 * Maps the size of a group to a Tailwind background color class.
 *
 * @param size - The size of the contiguous group.
 * @param maxSize - The maximum possible size of a group.
 * @returns A Tailwind background color class.
 */
const getBackgroundColorForGroupSize = (
  size: number,
  maxSize: number,
): string => {
  if (size <= 1) return 'bg-gray-500'
  if (size >= maxSize) return 'bg-white'

  const step = (maxSize - 1) / 5

  if (size <= 1 + step) return 'bg-gray-400'
  if (size <= 1 + step * 2) return 'bg-gray-300'
  if (size <= 1 + step * 3) return 'bg-gray-200'
  if (size <= 1 + step * 4) return 'bg-gray-100'

  return 'bg-white'
}

/**
 * A single cell in the ToneBlock game grid.
 *
 * @param props - Component props.
 */
export const Cell: Component<Props> = (props) => {
  const { grid: gridState, view: viewState, setView: setViewState } = useGame()

  const bgColor = () => {
    if (props.block === null) return 'transparent'

    const group = () =>
      gridState.correctNeighborGroups.find(
        (g) => props.block !== null && g.has(props.block),
      )
    const groupSize = group()?.size ?? 0
    const maxGroupSize = gridState.width * gridState.height - 1
    return getBackgroundColorForGroupSize(groupSize, maxGroupSize)
  }

  const correctPosition = createMemo(() =>
    getPositionForBlock(props.block, solvedGrid),
  )

  const pushDirection = () => {
    const path = getMovementPath(viewState.activeBlock, gridState.grid)
    return path.affectedBlocks.has(props.block) ? path.direction : null
  }

  const handleFocus = () => {
    setViewState('focusedBlock', props.block)
    if (isBlockMovable(props.block, gridState.grid)) {
      setViewState('activeBlock', props.block)
    } else if (isBlockMovable(viewState.hoveredBlock, gridState.grid)) {
      setViewState('activeBlock', viewState.hoveredBlock)
    }
  }

  const handleBlur = () => {
    setViewState('focusedBlock', null)
    if (isBlockMovable(viewState.hoveredBlock, gridState.grid)) {
      setViewState('activeBlock', viewState.hoveredBlock)
    } else {
      setViewState('activeBlock', null)
    }
  }

  const handleMouseEnter = () => {
    setViewState('hoveredBlock', props.block)
    if (isBlockMovable(props.block, gridState.grid)) {
      setViewState('activeBlock', props.block)
    }
  }

  const handleMouseMove = () => {
    if (isBlockMovable(props.block, gridState.grid)) {
      setViewState('activeBlock', props.block)
    }
  }

  const handleMouseLeave = () => {
    setViewState('hoveredBlock', null)
    if (isBlockMovable(viewState.focusedBlock, gridState.grid)) {
      setViewState('activeBlock', viewState.focusedBlock)
    } else {
      setViewState('activeBlock', null)
    }
  }

  const handleClick = () => {
    unwait(props.onMove)(props.block)
  }

  const backgroundImage = props.block ? `url(${springSkyImage})` : 'none'
  const backgroundSize = `${gridState.width * 100}% ${gridState.height * 100}%`
  const backgroundPosition = `${(correctPosition().column / (gridState.width - 1)) * 100}% ${(correctPosition().row / (gridState.height - 1)) * 100}%`

  return (
    <div ref={props.ref} class="group relative">
      <button
        name="block"
        class={`flex aspect-square h-full w-full items-center justify-center text-xl font-bold outline-0 outline-[rgba(219,39,119,0)] transition-all duration-200 focus:outline-4 focus:-outline-offset-4 focus:outline-[rgba(219,39,119,0.7)] ${bgColor()} bg-blend-multiply`}
        classList={{
          'cursor-wait': viewState.busy,
          '-translate-y-[10%]': !viewState.busy && pushDirection() === 'Up',
          'translate-y-[10%]': !viewState.busy && pushDirection() === 'Down',
          '-translate-x-[10%]': !viewState.busy && pushDirection() === 'Left',
          'translate-x-[10%]': !viewState.busy && pushDirection() === 'Right',
        }}
        style={{
          'background-image': backgroundImage,
          'background-size': backgroundSize,
          'background-position': backgroundPosition,
        }}
        disabled={viewState.busy}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        <span class="relative z-10 text-transparent">
          {props.block || 'empty'}
        </span>
      </button>
    </div>
  )
}

import { render, screen } from '@solidjs/testing-library'
import { describe, it, expect, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { Cell } from './Cell'
import { GameProvider } from '../../stores/GameContext'
import '@testing-library/jest-dom'
import { Grid } from '../../block/types'

describe('Cell', () => {
  const mockOnMove = vi.fn()

  it('renders a block with its number', () => {
    render(() => (
      <GameProvider>
        <Cell block={1} onMove={mockOnMove} />
      </GameProvider>
    ))

    expect(screen.getByRole('button')).toHaveTextContent('1')
  })

  it('renders an empty cell', () => {
    render(() => (
      <GameProvider>
        <Cell block={null} onMove={mockOnMove} />
      </GameProvider>
    ))

    expect(screen.getByRole('button')).toHaveTextContent('empty')
  })

  it('calls `onMove` when clicked', async () => {
    const user = userEvent.setup()
    render(() => (
      <GameProvider>
        <Cell block={1} onMove={mockOnMove} />
      </GameProvider>
    ))

    const button = screen.getByRole('button')
    await user.click(button)

    expect(mockOnMove).toHaveBeenCalledWith(1)
  })

  it('indicates move when focused if it is movable', async () => {
    const customGrid: Grid = [
      [1, 2, 3, 4],
      [5, 6, 7, 8],
      [9, 10, 11, 12],
      [13, 14, 15, null],
    ]
    render(() => (
      <GameProvider initialGrid={customGrid}>
        <Cell block={15} onMove={mockOnMove} />
      </GameProvider>
    ))
    const button = screen.getByRole('button')
    const pushRightClass = 'translate-x-[10%]'

    button.focus()

    expect(button).toHaveClass(pushRightClass)

    button.blur()

    expect(button).not.toHaveClass(pushRightClass)
  })

  it('applies a white background color when all blocks are correctly positioned', () => {
    render(() => (
      <GameProvider>
        <Cell block={1} onMove={mockOnMove} />
      </GameProvider>
    ))

    expect(screen.getByRole('button', { name: '1' })).toHaveClass('bg-white')
  })

  it('applies a dark background color for an isolated block', () => {
    const disorderedGrid: Grid = [
      [1, 5, 2, 6],
      [9, 13, 10, 14],
      [3, 7, 4, 8],
      [11, 15, 12, null],
    ]
    render(() => (
      <GameProvider initialGrid={disorderedGrid}>
        <Cell block={1} onMove={mockOnMove} />
      </GameProvider>
    ))

    expect(screen.getByRole('button', { name: '1' })).toHaveClass('bg-gray-500')
  })
})

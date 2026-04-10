import { render, screen, waitFor } from '@solidjs/testing-library'
import { describe, it, expect } from 'vitest'
import { Game } from './Game'
import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'

describe('Game', () => {
  describe('active block', () => {
    it('sets a movable block as active on hover', async () => {
      const user = userEvent.setup()
      render(() => <Game />)
      const movableBlock = screen.getByRole('button', { name: '15' })

      await user.hover(movableBlock)

      // Block 15 itself should be pushed (to the right, where null is)
      // The class 'translate-x-[10%]' is added for 'Right' push direction
      expect(movableBlock).toHaveClass('translate-x-[10%]')
    })

    it('sets a movable block as active on focus', async () => {
      render(() => <Game />)
      const movableBlock = screen.getByRole('button', { name: '15' })

      movableBlock.focus()

      expect(movableBlock).toHaveClass('translate-x-[10%]')
    })

    it('does not set an unmovable block as active on hover', async () => {
      const user = userEvent.setup()
      render(() => <Game />)
      const unmovableBlock = screen.getByRole('button', { name: '1' })

      await user.hover(unmovableBlock)

      // No push direction should be active for block 1
      expect(unmovableBlock).not.toHaveClass('-translate-y-[10%]')
      expect(unmovableBlock).not.toHaveClass('translate-y-[10%]')
      expect(unmovableBlock).not.toHaveClass('-translate-x-[10%]')
      expect(unmovableBlock).not.toHaveClass('translate-x-[10%]')
    })

    it('reverts to hovered block on blur if it is movable', async () => {
      const user = userEvent.setup()
      render(() => <Game />)
      const focusBlock = screen.getByRole('button', { name: '12' }) // movable (Down)
      const hoverBlock = screen.getByRole('button', { name: '15' }) // movable (Right)

      await user.hover(hoverBlock)
      focusBlock.focus()

      expect(focusBlock).toHaveClass('translate-y-[10%]')

      focusBlock.blur()

      expect(hoverBlock).toHaveClass('translate-x-[10%]')
    })

    it('reverts to focused block on unhover if it is movable', async () => {
      const user = userEvent.setup()
      render(() => <Game />)
      const focusBlock = screen.getByRole('button', { name: '12' }) // movable (Down)
      const hoverBlock = screen.getByRole('button', { name: '15' }) // movable (Right)
      const emptyCell = screen.getByRole('button', { name: 'empty' })
      await waitFor(() => expect(emptyCell).toHaveFocus()) // wait for focus-on-mount

      focusBlock.focus()
      await user.hover(hoverBlock)

      expect(hoverBlock).toHaveClass('translate-x-[10%]')

      await user.unhover(hoverBlock)

      expect(focusBlock).toHaveClass('translate-y-[10%]')
    })

    it('keeps focused block active when hovering an unmovable block', async () => {
      const user = userEvent.setup()
      render(() => <Game />)
      const movableBlock = screen.getByRole('button', { name: '12' })
      const unmovableBlock = screen.getByRole('button', { name: '1' })
      const emptyCell = screen.getByRole('button', { name: 'empty' })
      await waitFor(() => expect(emptyCell).toHaveFocus())

      movableBlock.focus()
      await user.hover(unmovableBlock)

      expect(movableBlock).toHaveClass('translate-y-[10%]')
      expect(unmovableBlock).not.toHaveClass('translate-y-[10%]')
    })

    it('keeps hovered block active when focusing an unmovable block', async () => {
      const user = userEvent.setup()
      render(() => <Game />)
      const movableBlock = screen.getByRole('button', { name: '15' })
      const unmovableBlock = screen.getByRole('button', { name: '1' })

      await user.hover(movableBlock)
      unmovableBlock.focus()

      expect(movableBlock).toHaveClass('translate-x-[10%]')
    })
  })
})

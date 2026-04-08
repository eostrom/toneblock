import { describe, it, expect } from 'vitest'
import { isSolved, isBlockMovable, getMovableDirection } from './utils'
import { solvedGrid } from './constants'
import type { Grid } from './types'

describe('block utils', () => {
  describe('`isSolved`', () => {
    it('returns true for a solved grid', () => {
      expect(isSolved(solvedGrid)).toBe(true)
    })

    it('returns false for an unsolved grid', () => {
      const unsolvedGrid: Grid = [
        [2, 1, 3, 4],
        [5, 6, 7, 8],
        [9, 10, 11, 12],
        [13, 14, 15, null],
      ]
      expect(isSolved(unsolvedGrid)).toBe(false)
    })
  })

  describe('`isBlockMovable`', () => {
    it('returns true for blocks adjacent to the null space', () => {
      // In `solvedGrid`, null is at (3, 3). Blocks 12 and 15 are adjacent.
      expect(isBlockMovable(15, solvedGrid)).toBe(true)
      expect(isBlockMovable(12, solvedGrid)).toBe(true)
    })

    it('returns false for blocks not adjacent to the null space', () => {
      expect(isBlockMovable(1, solvedGrid)).toBe(false)
      expect(isBlockMovable(6, solvedGrid)).toBe(false)
    })

    it('returns false for the null block itself', () => {
      expect(isBlockMovable(null, solvedGrid)).toBe(false)
    })
  })

  describe('`getMovableDirection`', () => {
    it('returns the direction to the null space', () => {
      // `15` is at (3, 2), null is at (3, 3) -> `Right`
      expect(getMovableDirection(15, solvedGrid)).toBe('Right')
      // `12` is at (2, 3), null is at (3, 3) -> `Down`
      expect(getMovableDirection(12, solvedGrid)).toBe('Down')
    })

    it('returns null if the block cannot move', () => {
      expect(getMovableDirection(1, solvedGrid)).toBe(null)
    })
  })
})

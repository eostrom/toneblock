import { createContext, useContext, JSX } from 'solid-js'
import { SetStoreFunction } from 'solid-js/store'
import { createGridStore, GridState } from './gridStore'
import { createViewStore, ViewState } from './viewStore'

type GameContextValue = {
  grid: GridState
  setGrid: SetStoreFunction<GridState>
  view: ViewState
  setView: SetStoreFunction<ViewState>
}

const GameContext = createContext<GameContextValue>()

/**
 * Provides the game state to its children.
 *
 * @param props - Component props.
 * @param props.children - The children to render.
 */
export const GameProvider = (props: { children: JSX.Element }) => {
  const [grid, setGrid] = createGridStore()
  const [view, setView] = createViewStore()

  const value: GameContextValue = {
    grid,
    setGrid,
    view,
    setView,
  }

  return (
    <GameContext.Provider value={value}>{props.children}</GameContext.Provider>
  )
}

/**
 * Hook to access the game state from the GameProvider.
 *
 * @returns The game context value.
 * @throws Error if used outside of a GameProvider.
 */
export const useGame = () => {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
}

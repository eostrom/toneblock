import { createContext, useContext, JSX } from 'solid-js'
import { SetStoreFunction } from 'solid-js/store'
import { createGridStore, GridState } from './gridStore'
import { createViewStore, ViewState } from './viewStore'
import { Grid } from '../block/types'

type GameContextValue = {
  grid: GridState
  setGrid: SetStoreFunction<GridState>
  view: ViewState
  setView: SetStoreFunction<ViewState>
}

const GameContext = createContext<GameContextValue>()

type Props = {
  children: JSX.Element
  initialGrid?: Grid
  initialView?: Partial<ViewState>
}

/**
 * Provides the game state to its children.
 *
 * @param props - Component props.
 * @param props.children - The children to render.
 * @param props.initialGrid - Optional initial grid state.
 * @param props.initialView - Optional initial view state.
 */
export const GameProvider = (props: Props) => {
  const [grid, setGrid] = createGridStore(props.initialGrid)
  const [view, setView] = createViewStore(props.initialView)

  const value: GameContextValue = { grid, setGrid, view, setView }

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

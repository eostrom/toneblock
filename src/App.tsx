import type { Component } from 'solid-js'
import { Game } from './Game'
import { GameProvider } from './stores/GameContext'

const App: Component = () => {
  return (
    <GameProvider>
      <Game />
    </GameProvider>
  )
}

export default App

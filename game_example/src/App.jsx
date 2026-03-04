import { useState } from 'react'
import Game from './components/Game'
import GameOver from './components/GameOver'
import './App.css'

function App() {
  const [screen, setScreen] = useState('start') // 'start' | 'playing' | 'gameover'
  const [finalInventory, setFinalInventory] = useState([])

  const handleGameOver = (inventory) => {
    setFinalInventory(inventory)
    setScreen('gameover')
  }

  const handleRestart = () => {
    setFinalInventory([])
    setScreen('playing')
  }

  return (
    <div className="app">
      {screen === 'start' && (
        <div className="overlay-screen">
          <h1>Catalog Runner</h1>
          <p>Collect coins and stars. Don't fall into the gaps!</p>
          <div className="legend">
            <span className="legend-coin">● Coin = 1 pt</span>
            <span className="legend-star">★ Star = 5 pts</span>
          </div>
          <p className="controls-hint">
            Press <kbd>↑</kbd> or <kbd>Space</kbd> to jump
          </p>
          <button onClick={() => setScreen('playing')}>Start Game</button>
        </div>
      )}
      {screen === 'playing' && <Game onGameOver={handleGameOver} />}
      {screen === 'gameover' && (
        <GameOver inventory={finalInventory} onRestart={handleRestart} />
      )}
    </div>
  )
}

export default App

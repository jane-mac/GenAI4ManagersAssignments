import { findItem, getTotal, getItemCount } from '../engine'

function GameOver({ inventory, onRestart }) {
  // These engine calls are the same functions the tests verify —
  // if students break the engine while adding features, this screen breaks too.
  const coins = findItem(inventory, 'coin')
  const stars = findItem(inventory, 'star')
  const score = getTotal(inventory)
  const totalItems = getItemCount(inventory)

  return (
    <div className="overlay-screen">
      <h2>Game Over</h2>
      <table className="stat-table">
        <tbody>
          <tr>
            <td>Coins collected</td>
            <td>{coins ? coins.quantity : 0}</td>
          </tr>
          <tr>
            <td>Stars collected</td>
            <td>{stars ? stars.quantity : 0}</td>
          </tr>
          <tr>
            <td>Total items</td>
            <td>{totalItems}</td>
          </tr>
          <tr className="stat-score">
            <td>Final score</td>
            <td>{score}</td>
          </tr>
        </tbody>
      </table>
      <p className="score-note">Stars = 5 pts · Coins = 1 pt</p>
      <button onClick={onRestart}>Play Again</button>
    </div>
  )
}

export default GameOver

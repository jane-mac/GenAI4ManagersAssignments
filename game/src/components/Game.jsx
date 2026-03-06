import { useEffect, useRef } from 'react'
import { addItem, findItem, getTotal } from '../engine'

const W = 640
const H = 220
const GROUND = 168       // y-coordinate of platform tops
const PLAYER_X = 80      // fixed horizontal position
const PLAYER_W = 26
const PLAYER_H = 26
const GRAVITY = 0.55
const JUMP_FORCE = -11
const SCROLL_SPEED = 3

function Game({ onGameOver }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    canvas.focus()

    // All mutable game state lives in a plain object — never in React state,
    // so the game loop runs without triggering re-renders.
    const s = {
      playerY: GROUND - PLAYER_H,
      playerVY: 0,
      onGround: true,
      scrollX: 0,
      platforms: [{ x: 0, w: 380 }],
      nextPlatformEnd: 380,
      collectibles: [],
      inventory: [],
      raf: null,
      dead: false,
      paused: false,
      elapsed: 0,
      lastTime: null,
    }

    // Pre-generate platforms so there are always enough ahead
    for (let i = 0; i < 6; i++) spawnPlatform()

    function spawnPlatform() {
      const gap = 55 + Math.random() * 65
      const w = 110 + Math.random() * 160
      const x = s.nextPlatformEnd + gap
      s.platforms.push({ x, w })
      s.nextPlatformEnd = x + w

      // Randomly place a coin or star above the platform
      if (Math.random() > 0.3) {
        const isStar = Math.random() > 0.72
        s.collectibles.push({
          x: x + w * (0.25 + Math.random() * 0.5),
          y: GROUND - 44 - Math.random() * 20,
          type: isStar ? 'star' : 'coin',
          r: isStar ? 10 : 8,
          collected: false,
        })
      }
    }

    function onKey(e) {
      if (e.code === 'ArrowUp' || e.code === 'Space') {
        e.preventDefault()
        if (s.onGround && !s.dead) {
          s.playerVY = JUMP_FORCE
          s.onGround = false
        }
      }
      if (e.code === 'KeyP') {
        e.preventDefault()
        if (s.paused) {
          s.elapsed = 0
          s.lastTime = null
          s.paused = false
        } else {
          s.paused = true
          s.lastTime = null
        }
      }
    }
    window.addEventListener('keydown', onKey)

    // ── update ──────────────────────────────────────────────────────────────

    function update() {
      s.scrollX += SCROLL_SPEED

      // Keep platforms generated well ahead of the viewport
      while (s.nextPlatformEnd - s.scrollX < W + 300) spawnPlatform()

      // Cull off-screen objects
      s.platforms = s.platforms.filter((p) => p.x + p.w > s.scrollX - 50)
      s.collectibles = s.collectibles.filter((c) => c.x > s.scrollX - 50)

      // Physics
      s.playerVY += GRAVITY
      s.playerY += s.playerVY

      // Platform collision — check if player's feet are at ground level
      s.onGround = false
      const pb = s.playerY + PLAYER_H
      for (const p of s.platforms) {
        const plx = p.x - s.scrollX
        const prx = plx + p.w
        if (
          PLAYER_X + PLAYER_W > plx &&
          PLAYER_X < prx &&
          pb >= GROUND &&
          pb <= GROUND + 20 &&
          s.playerVY >= 0
        ) {
          s.playerY = GROUND - PLAYER_H
          s.playerVY = 0
          s.onGround = true
          break
        }
      }

      // Fell off the bottom → game over
      if (s.playerY > H + 40) {
        s.dead = true
        onGameOver([...s.inventory])
        return
      }

      // Collectible collision
      for (const c of s.collectibles) {
        if (c.collected) continue
        const hitX = s.scrollX - c.x
        if (
          PLAYER_X < hitX + c.r &&
          PLAYER_X + PLAYER_W > hitX - c.r &&
          s.playerY < c.y + c.r &&
          pb > c.y - c.r
        ) {
          c.collected = true
          s.inventory = addItem(s.inventory, c.type, c.type === 'star' ? 5 : 1, 1)
        }
      }
    }

    // ── draw helpers ─────────────────────────────────────────────────────────

    function drawStar(cx, cy, r) {
      ctx.beginPath()
      for (let i = 0; i < 10; i++) {
        const radius = i % 2 === 0 ? r : r * 0.42
        const angle = (i * Math.PI) / 5 - Math.PI / 2
        const x = cx + radius * Math.cos(angle)
        const y = cy + radius * Math.sin(angle)
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.fillStyle = '#ffe566'
      ctx.fill()
      ctx.strokeStyle = '#e0a020'
      ctx.lineWidth = 1.5
      ctx.stroke()
    }

    function drawCoin(cx, cy, r) {
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fillStyle = '#ffd700'
      ctx.fill()
      ctx.strokeStyle = '#b8860b'
      ctx.lineWidth = 1.5
      ctx.stroke()
      ctx.fillStyle = '#b8860b'
      ctx.font = `bold ${Math.floor(r * 1.1)}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('$', cx, cy + 0.5)
    }

    // ── draw ─────────────────────────────────────────────────────────────────

    function draw() {
      // Sky
      ctx.fillStyle = '#16213e'
      ctx.fillRect(0, 0, W, H)

      // Static background dots
      ctx.fillStyle = 'rgba(255,255,255,0.35)'
      const bgDots = [
        [50, 18], [130, 42], [210, 12], [295, 55], [380, 28],
        [460, 50], [545, 18], [610, 38], [90, 68], [170, 32],
        [340, 72], [500, 62], [620, 80], [260, 48], [420, 82],
      ]
      for (const [bx, by] of bgDots) ctx.fillRect(bx, by, 2, 2)

      // Platforms
      for (const p of s.platforms) {
        const px = p.x - s.scrollX
        ctx.fillStyle = '#2d6a4f'
        ctx.fillRect(px, GROUND, p.w, H - GROUND)
        ctx.fillStyle = '#52b788'
        ctx.fillRect(px, GROUND, p.w, 5)
      }

      // Collectibles
      for (const c of s.collectibles) {
        if (c.collected) continue
        const cx = c.x - s.scrollX
        if (c.type === 'coin') drawCoin(cx, c.y, c.r)
        else drawStar(cx, c.y, c.r)
      }

      // Player
      ctx.fillStyle = s.onGround ? '#e63946' : '#ff6b81'
      ctx.fillRect(PLAYER_X, s.playerY, PLAYER_W, PLAYER_H)
      // Eyes
      ctx.fillStyle = 'white'
      ctx.fillRect(PLAYER_X + 5, s.playerY + 6, 6, 6)
      ctx.fillRect(PLAYER_X + 15, s.playerY + 6, 6, 6)
      ctx.fillStyle = '#111'
      ctx.fillRect(PLAYER_X + 7, s.playerY + 8, 3, 3)
      ctx.fillRect(PLAYER_X + 17, s.playerY + 8, 3, 3)

      // HUD — powered by engine functions
      const coins = findItem(s.inventory, 'coin')
      const stars = findItem(s.inventory, 'star')
      ctx.textBaseline = 'top'
      ctx.font = 'bold 13px monospace'

      ctx.fillStyle = '#ffd700'
      ctx.textAlign = 'left'
      ctx.fillText(`Coins: ${coins ? coins.quantity : 0}`, 10, 10)

      ctx.fillStyle = '#ffe566'
      ctx.fillText(`Stars: ${stars ? stars.quantity : 0}`, 10, 30)

      ctx.fillStyle = '#16213e'
      ctx.textAlign = 'right'
      ctx.fillText(`Score: ${getTotal(s.inventory)}`, W - 10, 10)

      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      ctx.textAlign = 'right'
      ctx.fillText(`Time: ${s.elapsed.toFixed(1)}s`, W - 10, 30)
    }

    // ── loop ─────────────────────────────────────────────────────────────────

    function loop(timestamp) {
      if (s.paused) {
        draw()
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'
        ctx.fillRect(0, 0, W, H)
        ctx.fillStyle = 'white'
        ctx.font = 'bold 20px monospace'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('PAUSED  —  press P to resume', W / 2, H / 2)
        s.raf = requestAnimationFrame(loop)
        return
      }

      if (s.lastTime !== null) {
        s.elapsed += (timestamp - s.lastTime) / 1000
      }
      s.lastTime = timestamp

      update()
      if (!s.dead) {
        draw()
        s.raf = requestAnimationFrame(loop)
      }
    }

    s.raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(s.raf)
      window.removeEventListener('keydown', onKey)
    }
  }, [onGameOver])

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      className="game-canvas"
      tabIndex={0}
    />
  )
}

export default Game

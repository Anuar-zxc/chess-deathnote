import { useState, useCallback, useEffect, useRef } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { useTranslation } from 'react-i18next'
import { useGameStore } from '../store/useGameStore'
import { motion, AnimatePresence } from 'framer-motion'
import { NOIR_PIECES } from './NoirPieces'

const DEPTH_MAP = { easy: 1, medium: 2, hard: 3, master: 4 }
const PIECE_VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 }

const BOARD_STYLES = {
  deathnote: { lightSquare: '#1a0a2e', darkSquare: '#0d0618', highlight: 'rgba(192,132,252,0.35)', lastMove: 'rgba(139,92,246,0.4)' },
  neon:      { lightSquare: '#0a1628', darkSquare: '#050d1a',  highlight: 'rgba(0,255,200,0.35)',  lastMove: 'rgba(0,200,150,0.4)' },
  marble:    { lightSquare: '#f0ebe0', darkSquare: '#8b7355',  highlight: 'rgba(255,215,0,0.4)',   lastMove: 'rgba(180,140,0,0.4)' },
  classic:   { lightSquare: '#f0d9b5', darkSquare: '#b58863',  highlight: 'rgba(255,255,0,0.4)',   lastMove: 'rgba(200,200,0,0.4)' },
}

function evaluate(game) {
  if (game.isCheckmate()) return game.turn() === 'w' ? -10000 : 10000
  if (game.isDraw()) return 0
  let score = 0
  for (const row of game.board()) {
    for (const sq of row) {
      if (sq) score += (sq.color === 'w' ? 1 : -1) * (PIECE_VALUES[sq.type] || 0)
    }
  }
  return score
}

function evaluateForTurn(game) {
  const score = evaluate(game)
  return game.turn() === 'w' ? score : -score
}

function orderMoves(moves) {
  return [...moves].sort((a, b) => {
    const score = (m) => (m.captured ? 10 : 0) + (m.promotion ? 8 : 0) + (m.san.includes('+') ? 2 : 0)
    return score(b) - score(a)
  })
}

function negamax(game, depth, alpha, beta) {
  if (depth === 0 || game.isGameOver()) return evaluateForTurn(game)
  let best = -Infinity
  for (const move of orderMoves(game.moves({ verbose: true }))) {
    game.move(move)
    const score = -negamax(game, depth - 1, -beta, -alpha)
    game.undo()
    best = Math.max(best, score)
    alpha = Math.max(alpha, score)
    if (alpha >= beta) break
  }
  return best
}

function aiMove(game, depth) {
  const moves = game.moves({ verbose: true })
  if (!moves.length) return null
  if (depth <= 1) {
    const caps = moves.filter(m => m.flags.includes('c'))
    return (caps.length ? caps : moves)[Math.floor(Math.random() * (caps.length || moves.length))]
  }
  let best = null, bestScore = -Infinity
  for (const move of orderMoves(moves)) {
    game.move(move)
    const score = -negamax(game, depth - 1, -Infinity, Infinity)
    game.undo()
    if (score > bestScore) { bestScore = score; best = move }
  }
  return best
}

function buildCoachReport(moves, t) {
  if (!moves.length) {
    return {
      title: t('coach_empty_title'),
      score: 0,
      summary: t('coach_empty_summary'),
      notes: [],
    }
  }

  const replay = new Chess()
  const notes = []
  let sharpest = null
  let totalLoss = 0

  moves.forEach((played, idx) => {
    const beforeFen = replay.fen()
    const before = new Chess(beforeFen)
    const legal = before.moves({ verbose: true })
    const side = before.turn()
    const sign = side === 'w' ? 1 : -1
    const beforeScore = evaluate(before) * sign

    let best = null
    let bestScore = -Infinity
    for (const candidate of orderMoves(legal)) {
      before.move(candidate)
      const candidateScore = evaluate(before) * sign
      before.undo()
      if (candidateScore > bestScore) {
        bestScore = candidateScore
        best = candidate
      }
    }

    replay.move({ from: played.from, to: played.to, promotion: played.promotion || 'q' })
    const afterScore = evaluate(replay) * sign
    const loss = Math.max(0, bestScore - afterScore)

    if (!sharpest || loss > sharpest.loss) {
      sharpest = { loss, move: played, best, ply: idx + 1, beforeScore }
    }
    if (loss >= 180) totalLoss += loss

    if (loss >= 300) {
      notes.push({
        type: 'blunder',
        label: t('coach_blunder_label'),
        text: t('coach_blunder_text', { move: idx + 1, san: played.san, loss: Math.round(loss / 100), best: best?.san || t('coach_best_develop') }),
      })
    } else if (loss >= 160) {
      notes.push({
        type: 'mistake',
        label: t('coach_mistake_label'),
        text: t('coach_mistake_text', { move: idx + 1, san: played.san, best: best?.san || t('coach_best_active') }),
      })
    } else if (played.san.includes('#')) {
      notes.push({ type: 'brilliant', label: t('coach_mate_label'), text: t('coach_mate_text', { move: idx + 1, san: played.san }) })
    } else if (played.san.includes('+') || played.captured) {
      notes.push({ type: 'good', label: t('coach_pressure_label'), text: t('coach_pressure_text', { move: idx + 1, san: played.san }) })
    }
  })

  const accuracy = Math.max(42, Math.min(98, Math.round(96 - totalLoss / Math.max(1, moves.length * 18))))
  const topNotes = notes.slice(0, 5)
  if (!topNotes.length && sharpest) {
    topNotes.push({
      type: 'good',
      label: t('coach_even_label'),
      text: t('coach_even_text', { ply: sharpest.ply, san: sharpest.move.san }),
    })
  }

  return {
    title: accuracy >= 82 ? t('coach_title_clean') : accuracy >= 65 ? t('coach_title_fight') : t('coach_title_weakness'),
    score: accuracy,
    summary: sharpest?.loss >= 160
      ? t('coach_summary_turning', { ply: sharpest.ply, san: sharpest.move.san, best: sharpest.best?.san || t('coach_best_calm') })
      : t('coach_summary_clean'),
    notes: topNotes,
  }
}

function findPlayableMove(moves, from, to) {
  const directMove = moves.find(x => x.from === from && x.to === to)
  if (directMove) return directMove

  const rookCastleTarget = {
    e1: { h1: 'g1', a1: 'c1' },
    e8: { h8: 'g8', a8: 'c8' },
  }
  const normalizedTo = rookCastleTarget[from]?.[to]
  if (!normalizedTo) return null

  return moves.find(x => x.from === from && x.to === normalizedTo && x.flags.includes('k'))
    || moves.find(x => x.from === from && x.to === normalizedTo && x.flags.includes('q'))
}

export default function GameScreen() {
  const { t } = useTranslation()
  const { difficulty, gameMode, boardFlipped, toggleFlip, addWin, addLoss, addDraw, theme, plan, grokApiKey } = useGameStore()

  const [game, setGame]         = useState(new Chess())
  const [fen, setFen]           = useState(new Chess().fen())
  const [moveFrom, setMoveFrom] = useState(null)
  const [optSq, setOptSq]       = useState({})
  const [lastMove, setLastMove] = useState(null)
  const [status, setStatus]     = useState('playing')
  const [history, setHistory]   = useState([])
  const [aiThink, setAiThink]   = useState(false)
  const [winner, setWinner]     = useState(null)
  const [timer, setTimer]       = useState({ w: 600, b: 600 })
  const [activeTurn, setActiveTurn] = useState('w')
  const [coachReport, setCoachReport] = useState(null)
  const [coachOpen, setCoachOpen] = useState(true)
  const timerRef  = useRef(null)
  const histRef   = useRef(null)
  const styles    = BOARD_STYLES[theme] || BOARD_STYLES.deathnote

  useEffect(() => {
    if (status !== 'playing' && status !== 'check') { clearInterval(timerRef.current); return }
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        const next = { ...prev, [activeTurn]: prev[activeTurn] - 1 }
        if (next[activeTurn] <= 0) {
          clearInterval(timerRef.current)
          const w = activeTurn === 'w' ? 'b' : 'w'
          setStatus('checkmate'); setWinner(w)
          activeTurn === 'w' ? addLoss() : addWin()
        }
        return next
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [status, activeTurn, addLoss, addWin])

  useEffect(() => {
    if (histRef.current) histRef.current.scrollTop = histRef.current.scrollHeight
  }, [history])

  const fmt = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`

  const checkStatus = useCallback((g) => {
    if (g.isCheckmate()) {
      const w = g.turn() === 'w' ? 'b' : 'w'
      setStatus('checkmate'); setWinner(w)
      if (gameMode === 'ai') w === 'w' ? addWin() : addLoss()
      setCoachReport(buildCoachReport(g.history({ verbose: true }), t))
    } else if (g.isStalemate()) setStatus('stalemate')
    else if (g.isDraw()) { setStatus('draw'); addDraw(); setCoachReport(buildCoachReport(g.history({ verbose: true }), t)) }
    else setStatus(g.isCheck() ? 'check' : 'playing')
  }, [gameMode, addWin, addLoss, addDraw, t])

  const doAI = useCallback(async (g) => {
    setAiThink(true)
    let m = null
    
    if (grokApiKey) {
      try {
        const res = await fetch('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${grokApiKey}`,
          },
          body: JSON.stringify({
            messages: [
              { role: "system", content: "You are a chess engine. Reply with ONLY the best valid move in UCI format (e.g., e2e4). Do not add any explanation or text." },
              { role: "user", content: `Current FEN: ${g.fen()}` }
            ],
            model: "grok-beta",
            stream: false,
            temperature: 0.1
          })
        })
        const data = await res.json()
        const uciMove = data.choices?.[0]?.message?.content?.trim().toLowerCase()
        if (uciMove) {
          const moveObj = g.moves({ verbose: true }).find(x => (x.from + x.to + (x.promotion || '')) === uciMove || (x.from + x.to) === uciMove)
          if (moveObj) m = moveObj
        }
      } catch (e) {
        console.error("Grok API error:", e)
      }
    }

    if (!m) {
      // Fallback to simple minimax if Grok API is not set or failed
      await new Promise(r => setTimeout(r, 500 + Math.random() * 400)) // simulated delay
      m = aiMove(g, DEPTH_MAP[difficulty] || 2)
    }

    if (m) {
      const gc = new Chess(g.fen())
      try {
        gc.move(m)
        setGame(gc); setFen(gc.fen())
        setLastMove({ from: m.from, to: m.to })
        setHistory(gc.history({ verbose: true }))
        setActiveTurn('w')
        checkStatus(gc)
      } catch (e) {
        console.error('AI move rejected:', e)
      }
    }
    setAiThink(false)
  }, [difficulty, checkStatus, grokApiKey])

  function getMoveOpts(sq) {
    const moves = game.moves({ square: sq, verbose: true })
    if (!moves.length) return false
    const opts = {}
    moves.forEach(m => { opts[m.to] = { background: `radial-gradient(circle, ${styles.highlight} 36%, transparent 40%)`, borderRadius: '50%' } })
    if (moves.some(m => m.from === sq && m.to === 'g1' && m.flags.includes('k'))) opts.h1 = { background: styles.highlight }
    if (moves.some(m => m.from === sq && m.to === 'c1' && m.flags.includes('q'))) opts.a1 = { background: styles.highlight }
    if (moves.some(m => m.from === sq && m.to === 'g8' && m.flags.includes('k'))) opts.h8 = { background: styles.highlight }
    if (moves.some(m => m.from === sq && m.to === 'c8' && m.flags.includes('q'))) opts.a8 = { background: styles.highlight }
    setOptSq(opts)
    return true
  }

  function onSquareClick(sq) {
    if (!['playing','check'].includes(status)) return
    if (gameMode === 'ai' && game.turn() !== 'w') return
    if (aiThink) return
    if (moveFrom) {
      const gc = new Chess(game.fen())
      const moves = gc.moves({ verbose: true })
      const m = findPlayableMove(moves, moveFrom, sq)
      if (m) {
        try {
          gc.move({ from: m.from, to: m.to, promotion: m.promotion ? 'q' : undefined })
          setGame(gc); setFen(gc.fen())
          setLastMove({ from: m.from, to: m.to })
          setHistory(gc.history({ verbose: true }))
          setActiveTurn(gc.turn())
          setMoveFrom(null); setOptSq({})
          checkStatus(gc)
          if (gameMode === 'ai' && !gc.isGameOver()) doAI(gc)
          return
        } catch { setMoveFrom(null); setOptSq({}) }
      }
      setMoveFrom(null); setOptSq({})
    }
    if (getMoveOpts(sq)) setMoveFrom(sq)
  }

  function onDrop(from, to) {
    if (!['playing','check'].includes(status)) return false
    if (gameMode === 'ai' && game.turn() !== 'w') return false
    if (aiThink) return false
    const gc = new Chess(game.fen())
    const moves = gc.moves({ verbose: true })
    const m = findPlayableMove(moves, from, to)
    if (!m) return false
    try {
      gc.move({ from: m.from, to: m.to, promotion: m.promotion ? 'q' : undefined })
      setGame(gc); setFen(gc.fen())
      setLastMove({ from: m.from, to: m.to })
      setHistory(gc.history({ verbose: true }))
      setActiveTurn(gc.turn())
      setMoveFrom(null); setOptSq({})
      checkStatus(gc)
      if (gameMode === 'ai' && !gc.isGameOver()) doAI(gc)
      return true
    } catch {
      return false
    }
  }

  function newGame() {
    const g = new Chess()
    setGame(g); setFen(g.fen()); setMoveFrom(null); setOptSq({})
    setLastMove(null); setStatus('playing'); setWinner(null)
    setHistory([]); setTimer({ w: 600, b: 600 }); setActiveTurn('w'); setAiThink(false)
    setCoachReport(null); setCoachOpen(true)
  }

  function undo() {
    if (plan === 'free') return
    const gc = new Chess(game.fen())
    if (gameMode === 'ai') { gc.undo(); gc.undo() } else gc.undo()
    setGame(gc); setFen(gc.fen())
    setHistory(gc.history({ verbose: true }))
    setStatus(gc.isCheck() ? 'check' : 'playing'); setWinner(null)
    setCoachReport(null)
  }

  function analyzeNow() {
    setCoachReport(buildCoachReport(history, t))
    setCoachOpen(true)
  }

  const sqStyles = {
    ...(moveFrom ? { [moveFrom]: { background: styles.highlight } } : {}),
    ...optSq,
    ...(lastMove ? {
      [lastMove.from]: { background: styles.lastMove },
      [lastMove.to]:   { background: styles.lastMove },
    } : {}),
  }

  const statusMsg = {
    check:     t('game_check'),
    checkmate: t('game_checkmate'),
    stalemate: t('game_stalemate'),
    draw:      t('game_draw'),
    playing:   aiThink ? t('game_ai_thinking') : t('game_your_turn'),
  }[status] || ''

  return (
    <div className="game-screen">
      <div className="game-layout">
        <div className="game-panel left-panel">
          <div className="panel-section">
            <div className="section-title">{t('game_difficulty')}</div>
            <div className="difficulty-btns">
              {['easy','medium','hard','master'].map(d => (
                <button key={d} className={`diff-btn ${difficulty===d?'active':''}`}
                  onClick={() => useGameStore.getState().setDifficulty(d)}>{t(`diff_${d}`)}</button>
              ))}
            </div>
          </div>
          <div className={`timer-card ${activeTurn==='b' && ['playing','check'].includes(status) ? 'active':''}`}>
            <span className="timer-color">⬛</span>
            <span className="timer-val">{fmt(timer.b)}</span>
          </div>
          <div className="game-actions">
            <button className="action-btn" onClick={newGame}>🔄 {t('game_new_game')}</button>
            <button className={`action-btn ${plan==='free'?'locked':''}`} onClick={undo}>
              ↩ {t('game_undo')} {plan==='free'&&'🔒'}
            </button>
            <button className={`action-btn coach-action ${plan==='free'?'locked':''}`} onClick={plan==='free' ? () => useGameStore.getState().setScreen('subscription') : analyzeNow}>
              ✦ AI Coach {plan==='free'&&'🔒'}
            </button>
            <button className="action-btn" onClick={toggleFlip}>⇅ {t('game_flip')}</button>
          </div>
        </div>

        <div className="board-container">
          <AnimatePresence>
            {status !== 'playing' && (
              <motion.div className={`status-banner status-${status}`}
                initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0}}>
                <div className="status-text">
                  {statusMsg}
                  {winner && <span className="winner-text"> — {winner==='w'?'⬜':' ⬛'} {t(winner==='w'?'game_you_win':'game_you_lose')}</span>}
                </div>
                <button className="status-new-btn" onClick={newGame}>{t('game_new_game')}</button>
              </motion.div>
            )}
          </AnimatePresence>
          {aiThink && (
            <div className="thinking-overlay">
              <div className="thinking-dots"><span/><span/><span/></div>
            </div>
          )}
          <Chessboard
            options={{
              id: 'main-board',
              position: fen,
              pieces: NOIR_PIECES,
              onSquareClick: ({ square }) => onSquareClick(square),
              onPieceClick: ({ square }) => onSquareClick(square),
              onPieceDrop: ({ sourceSquare, targetSquare }) => onDrop(sourceSquare, targetSquare),
              boardOrientation: boardFlipped ? 'black' : 'white',
              boardStyle: { borderRadius: '12px', boxShadow: '0 0 60px rgba(139,92,246,0.3)' },
              darkSquareStyle: { backgroundColor: styles.darkSquare },
              lightSquareStyle: { backgroundColor: styles.lightSquare },
              squareStyles: sqStyles,
              animationDurationInMs: 200,
            }}
          />
        </div>

        <div className="game-panel right-panel">
          <div className={`timer-card ${activeTurn==='w' && ['playing','check'].includes(status) ? 'active':''}`}>
            <span className="timer-color">⬜</span>
            <span className="timer-val">{fmt(timer.w)}</span>
          </div>
          <div className="panel-section moves-section">
            <div className="section-title">{t('game_moves')} <span className="move-count">({Math.ceil(history.length/2)})</span></div>
            <div className="moves-list" ref={histRef}>
              {history.reduce((acc, m, i) => {
                if (i%2===0) acc.push(
                  <div key={i} className="move-row">
                    <span className="move-num">{Math.floor(i/2)+1}.</span>
                    <span className="move-san white">{m.san}</span>
                    {history[i+1] && <span className="move-san black">{history[i+1].san}</span>}
                  </div>
                )
                return acc
              }, [])}
            </div>
          </div>
          <div className="panel-section">
            <div className="status-display">
              <div className={`status-dot ${status}`}/>
              <span>{statusMsg}</span>
            </div>
          </div>
          <div className={`coach-panel ${coachOpen ? 'open' : ''}`}>
            <button className="coach-head" onClick={() => setCoachOpen(v => !v)}>
              <span>✦ AI Coach</span>
              <span>{coachOpen ? '−' : '+'}</span>
            </button>
            {coachOpen && (
              <div className="coach-body">
                {plan === 'free' ? (
                  <>
                    <div className="coach-score locked-score">PRO</div>
                    <p>{t('coach_locked_desc')}</p>
                    <button className="coach-upgrade" onClick={() => useGameStore.getState().setScreen('subscription')}>{t('coach_open_analysis')}</button>
                  </>
                ) : coachReport ? (
                  <>
                    <div className="coach-score">{coachReport.score}%</div>
                    <h3>{coachReport.title}</h3>
                    <p>{coachReport.summary}</p>
                    <div className="coach-notes">
                      {coachReport.notes.map((note, i) => (
                        <div className={`coach-note ${note.type}`} key={`${note.label}-${i}`}>
                          <strong>{note.label}</strong>
                          <span>{note.text}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="coach-score">Live</div>
                    <p>{t('coach_live_hint')}</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

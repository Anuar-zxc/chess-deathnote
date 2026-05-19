import { useState } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { useTranslation } from 'react-i18next'
import { useGameStore } from '../store/useGameStore'
import { motion, AnimatePresence } from 'framer-motion'
import { TRAINING_CATEGORIES, TRAINING_LEVELS } from '../data/trainingLevels'
import { NOIR_PIECES } from './NoirPieces'

const BOARD_STYLES = {
  deathnote: { lightSquare: '#1a0a2e', darkSquare: '#0d0618', correct: 'rgba(74,222,128,0.5)', wrong: 'rgba(239,68,68,0.5)' },
  neon:      { lightSquare: '#0a1628', darkSquare: '#050d1a',  correct: 'rgba(0,255,200,0.5)',  wrong: 'rgba(255,60,60,0.5)' },
  marble:    { lightSquare: '#f0ebe0', darkSquare: '#8b7355',  correct: 'rgba(74,222,128,0.5)', wrong: 'rgba(239,68,68,0.5)' },
  classic:   { lightSquare: '#f0d9b5', darkSquare: '#b58863',  correct: 'rgba(74,222,128,0.5)', wrong: 'rgba(239,68,68,0.5)' },
}

function findPlayableMove(moves, from, to) {
  const directMove = moves.find((move) => move.from === from && move.to === to)
  if (directMove) return directMove

  const rookCastleTarget = {
    e1: { h1: 'g1', a1: 'c1' },
    e8: { h8: 'g8', a8: 'c8' },
  }
  const normalizedTo = rookCastleTarget[from]?.[to]
  if (!normalizedTo) return null

  return moves.find((move) => move.from === from && move.to === normalizedTo && move.flags.includes('k'))
    || moves.find((move) => move.from === from && move.to === normalizedTo && move.flags.includes('q'))
}

function PuzzleBoard({ puzzle, onComplete, onFail }) {
  const { t, i18n } = useTranslation()
  const { theme } = useGameStore()
  const [game]       = useState(() => new Chess(puzzle.fen))
  const [fen, setFen]     = useState(puzzle.fen)
  const [moveIdx, setMoveIdx] = useState(0)
  const [flash, setFlash]     = useState(null) // 'correct' | 'wrong'
  const [showHint, setShowHint] = useState(false)
  const [done, setDone]         = useState(false)
  const styles = BOARD_STYLES[theme] || BOARD_STYLES.deathnote
  const lang = (i18n.language || 'ru').split('-')[0]

  function onDrop(from, to) {
    if (done) return false
    const expected = puzzle.solution[moveIdx]

    const moves = game.moves({ verbose: true })
    const mObj = findPlayableMove(moves, from, to)
    if (!mObj) return false
    const actual = `${mObj.from}${mObj.to}${mObj.promotion || ''}`
    try {
      game.move({ from: mObj.from, to: mObj.to, promotion: mObj.promotion || 'q' })
    } catch { return false }

    if (actual === expected || `${mObj.from}${mObj.to}` === expected) {
      setFen(game.fen())
      setFlash('correct')
      setTimeout(() => setFlash(null), 600)
      const next = moveIdx + 1
      if (next >= puzzle.solution.length) {
        setDone(true)
        setTimeout(onComplete, 800)
      } else {
        // Play opponent's response
        setMoveIdx(next)
        if (puzzle.solution[next]) {
          setTimeout(() => {
            const respFrom = puzzle.solution[next].slice(0,2)
            const respTo   = puzzle.solution[next].slice(2,4)
            const promo    = puzzle.solution[next][4]
            const responseMove = findPlayableMove(game.moves({ verbose: true }), respFrom, respTo)
            if (!responseMove) {
              setFlash('wrong')
              setTimeout(() => { setFlash(null); onFail() }, 800)
              return
            }
            game.move({ from: responseMove.from, to: responseMove.to, promotion: promo || responseMove.promotion || 'q' })
            setFen(game.fen())
            setMoveIdx(next + 1)
          }, 500)
        }
      }
      return true
    } else {
      game.undo()
      setFlash('wrong')
      setTimeout(() => { setFlash(null); onFail() }, 800)
      return false
    }
  }

  const sqStyles = flash ? {
    [puzzle.solution[moveIdx]?.slice(2,4)]: { background: styles[flash] }
  } : {}

  const desc = puzzle.description[lang] || puzzle.description.en
  const hint = puzzle.hint[lang] || puzzle.hint.en

  return (
    <div className="puzzle-board-wrap">
      <div className="puzzle-desc">{desc}</div>
      <div style={{ position: 'relative' }}>
        <Chessboard
          options={{
            id: `puzzle-${puzzle.id}`,
            position: fen,
            pieces: NOIR_PIECES,
            onPieceDrop: ({ sourceSquare, targetSquare }) => onDrop(sourceSquare, targetSquare),
            boardOrientation: game.turn() === 'b' ? 'black' : 'white',
            boardStyle: { borderRadius: '10px', boxShadow: '0 0 40px rgba(139,92,246,0.25)' },
            darkSquareStyle: { backgroundColor: styles.darkSquare },
            lightSquareStyle: { backgroundColor: styles.lightSquare },
            squareStyles: sqStyles,
            animationDurationInMs: 200,
          }}
        />
      </div>
      <div className="puzzle-actions">
        <button className="puz-btn hint-btn" onClick={() => setShowHint(v => !v)}>
          💡 {t('train_hint')}
        </button>
        {showHint && <div className="hint-text">{hint}</div>}
      </div>
    </div>
  )
}

export default function TrainingScreen() {
  const { t } = useTranslation()
  const { plan, trainingProgress, completeTrainingLevel } = useGameStore()
  const [category, setCategory] = useState(null)
  const [levelIdx, setLevelIdx] = useState(0)
  const [result, setResult]     = useState(null) // null | 'success' | 'fail'
  const [retryCount, setRetryCount] = useState(0)

  if (!category) {
    return (
      <div className="training-screen">
        <motion.div className="training-hero" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
          <h2 className="screen-title">{t('train_title')}</h2>
          <p className="screen-subtitle">{t('train_subtitle')}</p>
        </motion.div>
        <div className="category-grid">
          {TRAINING_CATEGORIES.map((cat, i) => {
            const levels  = TRAINING_LEVELS[cat.id] || []
            const done    = levels.filter(l => trainingProgress[l.id]).length
            const locked  = cat.tier === 'pro' && plan === 'free'
            return (
              <motion.div
                key={cat.id}
                className={`category-card ${locked ? 'locked' : ''}`}
                style={{ '--cat-color': cat.color }}
                onClick={() => !locked && setCategory(cat.id)}
                initial={{opacity:0, y:30}} animate={{opacity:1,y:0}} transition={{delay: i*0.1}}
                whileHover={{ scale: locked ? 1 : 1.04 }}
              >
                <div className="cat-icon">{locked ? '🔒' : cat.icon}</div>
                <div className="cat-name">{t(cat.labelKey)}</div>
                <div className="cat-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: levels.length ? `${(done/levels.length)*100}%` : '0%', background: cat.color}} />
                  </div>
                  <span className="progress-text">{done}/{levels.length}</span>
                </div>
                {locked && <div className="lock-badge">PRO</div>}
              </motion.div>
            )
          })}
        </div>
      </div>
    )
  }

  const levels  = TRAINING_LEVELS[category] || []
  const puzzle  = levels[levelIdx]

  if (!puzzle) {
    return (
      <div className="training-screen">
        <div className="training-complete-all">
          <div className="complete-emoji">🏆</div>
          <h3>{t('train_complete')}</h3>
          <button className="action-btn" onClick={() => { setCategory(null); setLevelIdx(0) }}>{t('back')}</button>
        </div>
      </div>
    )
  }

  function onComplete() {
    completeTrainingLevel(puzzle.id)
    setResult('success')
  }
  function onFail() {
    setResult('fail')
  }
  function nextLevel() {
    setResult(null)
    setLevelIdx(i => i + 1)
  }
  function retry() {
    setResult(null)
    setRetryCount(c => c + 1)
  }

  return (
    <div className="training-screen">
      <div className="training-header">
        <button className="back-btn" onClick={() => { setCategory(null); setLevelIdx(0); setResult(null) }}>← {t('back')}</button>
        <div className="training-info">
          <span className="level-label">{t('train_level')} {levelIdx + 1}/{levels.length}</span>
          <div className="star-row">
            {Array.from({ length: 4 }).map((_, i) => (
              <span key={i} className={i < (puzzle.stars || 1) ? 'star active' : 'star'}>★</span>
            ))}
          </div>
        </div>
        <div className="level-progress">
          {levels.map((l, i) => (
            <div key={i} className={`level-dot ${i===levelIdx?'current':trainingProgress[l.id]?'done':''}`} />
          ))}
        </div>
      </div>

      <div className="puzzle-title">{t('train_puzzle_title')}</div>

      <AnimatePresence mode="wait">
        <motion.div key={`${puzzle.id}-${retryCount}`} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
          <PuzzleBoard puzzle={puzzle} onComplete={onComplete} onFail={onFail} />
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {result && (
          <motion.div className={`result-overlay result-${result}`}
            initial={{opacity:0,scale:0.8}} animate={{opacity:1,scale:1}} exit={{opacity:0}}>
            <div className="result-icon">{result === 'success' ? '✅' : '❌'}</div>
            <div className="result-text">{result === 'success' ? t('train_complete') : t('train_retry')}</div>
            {result === 'success' && levelIdx < levels.length - 1 && (
              <button className="result-btn success-btn" onClick={nextLevel}>{t('train_next')} →</button>
            )}
            <button className="result-btn retry-btn" onClick={retry}>{t('train_retry')}</button>
            <button className="result-btn back-btn-sm" onClick={() => { setCategory(null); setLevelIdx(0); setResult(null) }}>
              {t('back')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

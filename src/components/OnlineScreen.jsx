import { useCallback, useState, useEffect, useRef } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { useTranslation } from 'react-i18next'
import { useGameStore } from '../store/useGameStore'
import { motion, AnimatePresence } from 'framer-motion'
import { NOIR_PIECES } from './NoirPieces'

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

function getClientId() {
  try {
    const params = new URLSearchParams(window.location.search)
    if (params.get('room') && params.get('join') === '1') {
      const guest = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`
      sessionStorage.setItem('dn-client-id', guest)
      return guest
    }
    const saved = sessionStorage.getItem('dn-client-id')
    if (saved) return saved
    const next = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`
    sessionStorage.setItem('dn-client-id', next)
    return next
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`
  }
}

const BOARD_STYLES = {
  deathnote: { lightSquare: '#1a0a2e', darkSquare: '#0d0618', highlight: 'rgba(192,132,252,0.35)', lastMove: 'rgba(139,92,246,0.4)' },
  neon:      { lightSquare: '#0a1628', darkSquare: '#050d1a',  highlight: 'rgba(0,255,200,0.35)',  lastMove: 'rgba(0,200,150,0.4)' },
  marble:    { lightSquare: '#f0ebe0', darkSquare: '#8b7355',  highlight: 'rgba(255,215,0,0.4)',   lastMove: 'rgba(180,140,0,0.4)' },
  classic:   { lightSquare: '#f0d9b5', darkSquare: '#b58863',  highlight: 'rgba(255,255,0,0.4)',   lastMove: 'rgba(200,200,0,0.4)' },
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

export default function OnlineScreen() {
  const { t } = useTranslation()
  const { stats, theme, addWin, addLoss, addDraw } = useGameStore()
  const initialRoomCode = new URLSearchParams(window.location.search).get('room')?.toUpperCase() || ''
  const [mode, setMode]         = useState('lobby') // lobby | create | join | playing | searching
  const [roomCode, setRoomCode] = useState('')
  const [joinCode, setJoinCode] = useState(initialRoomCode)
  const [myColor, setMyColor]   = useState('w')
  const [isSpectator, setIsSpectator] = useState(false)
  const [copied, setCopied]     = useState(false)
  const [game, setGame]         = useState(new Chess())
  const [fen, setFen]           = useState(new Chess().fen())
  const [lastMove, setLastMove] = useState(null)
  const [status, setStatus]     = useState('playing')
  const [history, setHistory]   = useState([])
  const [clientId] = useState(getClientId)
  const [roomSource, setRoomSource] = useState('api')
  const pollRef = useRef(null)
  const autoJoinRef = useRef(false)
  const styles  = BOARD_STYLES[theme] || BOARD_STYLES.deathnote

  async function roomApi(payload) {
    const response = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, clientId }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.error || 'room_error')
    return data
  }

  async function getRemoteRoom(code) {
    const response = await fetch(`/api/rooms?code=${encodeURIComponent(code)}`)
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.error || 'room_error')
    return data.room
  }

  function applyRoom(room) {
    const g = new Chess(room.fen)
    setFen(room.fen)
    setGame(g)
    setHistory(room.history || g.history({ verbose: true }))
    if (room.lastMove) setLastMove(room.lastMove)
    if (room.status === 'checkmate') setStatus('checkmate')
    else if (room.status === 'stalemate') setStatus('stalemate')
    else if (room.status === 'draw') setStatus('draw')
    else setStatus(g.isCheck() ? 'check' : 'playing')
  }

  function localCreateRoom() {
    const code = generateCode()
    const g = new Chess()
    localStorage.setItem(`dn-room-${code}`, JSON.stringify({
      fen: g.fen(),
      history: [],
      turn: 'w',
      lastMove: null,
      status: 'waiting',
      whiteClientId: clientId,
      blackClientId: null,
    }))
    return { code, color: 'w', room: { code, fen: g.fen(), history: [], lastMove: null, status: 'waiting' } }
  }

  const localJoinRoom = useCallback((code) => {
    const raw = localStorage.getItem(`dn-room-${code}`)
    if (!raw) throw new Error('room_not_found')
    const data = JSON.parse(raw)
    let color = 'spectator'
    if (data.whiteClientId === clientId) color = 'w'
    else if (data.blackClientId === clientId) color = 'b'
    else if (!data.blackClientId) {
      data.blackClientId = clientId
      data.status = 'playing'
      color = 'b'
    }
    localStorage.setItem(`dn-room-${code}`, JSON.stringify(data))
    return { color, room: { code, ...data } }
  }, [clientId])

  // Poll for opponent joins and moves.
  useEffect(() => {
    if (mode !== 'playing' && mode !== 'create') return
    const interval = setInterval(async () => {
      try {
        const room = roomSource === 'api'
          ? await getRemoteRoom(roomCode)
          : localJoinRoom(roomCode).room
        if (mode === 'create' && room.blackConnected) {
          setMode('playing')
        }
        if (room.fen !== fen || room.status !== status) {
          applyRoom(room)
          const g2 = new Chess(room.fen)
          if (g2.isCheckmate() && g2.turn() === myColor) addLoss()
          if (g2.isDraw()) addDraw()
        }
      } catch {
        if (roomSource === 'api') {
          setRoomSource('local')
        }
      }
    }, 800)
    return () => clearInterval(interval)
  }, [mode, fen, roomCode, roomSource, status, myColor, localJoinRoom, addDraw, addLoss])

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  async function createRoom() {
    let result
    try {
      result = await roomApi({ action: 'create' })
      setRoomSource('api')
    } catch {
      result = localCreateRoom()
      setRoomSource('local')
    }
    setRoomCode(result.room.code)
    setJoinCode(result.room.code)
    setMyColor(result.color)
    setIsSpectator(false)
    applyRoom(result.room)
    window.history.replaceState(null, '', `?room=${result.room.code}`)
    setMode('create')
  }

  async function joinRoom() {
    const code = joinCode.toUpperCase()
    let result
    try {
      result = await roomApi({ action: 'join', code })
      setRoomSource('api')
    } catch {
      try {
        result = localJoinRoom(code)
        setRoomSource('local')
      } catch {
        alert(t('online_room_not_found'))
        return
      }
    }
    setRoomCode(code)
    setMyColor(result.color === 'spectator' ? 'w' : result.color)
    setIsSpectator(result.color === 'spectator')
    applyRoom(result.room)
    window.history.replaceState(null, '', `?room=${code}`)
    setMode('playing')
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (!autoJoinRef.current && initialRoomCode && params.get('join') === '1' && mode === 'lobby') {
      autoJoinRef.current = true
      joinRoom()
    }
    // The invite handler should fire only once for the URL that mounted this screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRoomCode, mode])

  function copyCode() {
    const link = `${window.location.origin}${window.location.pathname}?room=${roomCode}&join=1`
    navigator.clipboard.writeText(link).catch(() => navigator.clipboard.writeText(roomCode).catch(() => {}))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function doMove(from, to) {
    if (isSpectator || game.turn() !== myColor) return false
    const gc = new Chess(game.fen())
    const moves = gc.moves({ verbose: true })
    const m = findPlayableMove(moves, from, to)
    if (!m) return false
    try {
      if (roomSource === 'api') {
        const result = await roomApi({ action: 'move', code: roomCode, from: m.from, to: m.to })
        applyRoom(result.room)
        if (result.room.status === 'checkmate') addWin()
        if (result.room.status === 'draw') addDraw()
        return true
      }

      gc.move({ from: m.from, to: m.to, promotion: m.promotion || 'q' })
      setGame(gc); setFen(gc.fen())
      setLastMove({ from: m.from, to: m.to })
      setHistory(gc.history({ verbose: true }))
      const raw  = localStorage.getItem(`dn-room-${roomCode}`)
      if (raw) {
        const data = JSON.parse(raw)
        data.fen = gc.fen()
        data.history = gc.history({ verbose: true })
        data.lastMove = { from: m.from, to: m.to }
        data.status = gc.isCheckmate() ? 'checkmate' : gc.isStalemate() ? 'stalemate' : gc.isDraw() ? 'draw' : 'playing'
        localStorage.setItem(`dn-room-${roomCode}`, JSON.stringify(data))
      }
      if (gc.isCheckmate()) {
        setStatus('checkmate')
        addWin()
      } else if (gc.isStalemate()) setStatus('stalemate')
      else if (gc.isDraw()) { setStatus('draw'); addDraw() }
      else setStatus(gc.isCheck() ? 'check' : 'playing')
      return true
    } catch {
      return false
    }
  }

  const sqStyles = lastMove ? {
    [lastMove.from]: { background: styles.lastMove },
    [lastMove.to]:   { background: styles.lastMove },
  } : {}

  // LOBBY
  if (mode === 'lobby') return (
    <div className="online-screen">
      <motion.div className="online-hero" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
        <div className="online-icon">🌐</div>
        <h2 className="screen-title">{t('online_title')}</h2>
        <div className="online-stats">
          <div className="ostat"><span className="ostat-val">⭐ {stats.rating}</span><span>{t('online_rating')}</span></div>
          <div className="ostat"><span className="ostat-val" style={{color:'#4ade80'}}>{stats.wins}</span><span>{t('online_wins')}</span></div>
          <div className="ostat"><span className="ostat-val" style={{color:'#f87171'}}>{stats.losses}</span><span>{t('online_losses')}</span></div>
          <div className="ostat"><span className="ostat-val" style={{color:'#fbbf24'}}>{stats.draws}</span><span>{t('online_draws')}</span></div>
        </div>
        <div className="online-lobby-btns">
          <motion.button className="lobby-btn create-btn" onClick={createRoom}
            whileHover={{scale:1.04}} whileTap={{scale:0.96}}>
            ➕ {t('online_create_room')}
          </motion.button>
          <div className="join-row">
            <input className="join-input" placeholder={t('online_room_code')} value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())} maxLength={6} />
            <motion.button className="lobby-btn join-btn" onClick={joinRoom}
              whileHover={{scale:1.04}} whileTap={{scale:0.96}}>
              🚪 {t('online_join_room')}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  )

  // CREATED ROOM — waiting
  if (mode === 'create') return (
    <div className="online-screen">
      <motion.div className="waiting-panel" initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}}>
        <div className="waiting-icon">⏳</div>
        <h3>{t('online_waiting')}</h3>
        <div className="room-code-display">
          <span className="room-code-val">{roomCode}</span>
          <button className="copy-btn" onClick={copyCode}>
            {copied ? `✅ ${t('copied')}` : `📋 ${t('online_copy_code')}`}
          </button>
        </div>
        <p style={{opacity:0.6, fontSize:'0.9rem'}}>{t('online_share_code')}</p>
        <p style={{opacity:0.45, fontSize:'0.82rem'}}>Ссылка скопирует комнату для другого игрока: {window.location.origin}{window.location.pathname}?room={roomCode}&join=1</p>
        <div className="pulse-dots"><span/><span/><span/></div>
        <button className="action-btn" style={{marginTop:'1.5rem'}} onClick={() => {
          if (pollRef.current) clearInterval(pollRef.current)
          localStorage.removeItem(`dn-room-${roomCode}`)
          window.history.replaceState(null, '', window.location.pathname)
          setMode('lobby')
        }}>✕ {t('online_cancel')}</button>
      </motion.div>
    </div>
  )

  // PLAYING
  const statusMsg = {
    check: t('game_check'), checkmate: t('game_checkmate'),
    stalemate: t('game_stalemate'), draw: t('game_draw'),
    playing: game.turn() === myColor ? t('game_your_turn') : t('online_opponent_turn'),
  }[status] || ''

  return (
    <div className="online-screen playing">
      <div className="online-play-layout">
        <div className="online-sidebar">
          <div className="online-info-box">
            <div className="oib-label">{t('online_you_play')}</div>
            <div className="oib-color">{isSpectator ? 'Spectator' : myColor === 'w' ? t('online_white') : t('online_black')}</div>
          </div>
          <div className="online-info-box">
            <div className="oib-label">{t('online_room_code')}</div>
            <div className="oib-code">{roomCode}</div>
          </div>
          <div className="panel-section moves-section" style={{flex:1}}>
            <div className="section-title">{t('game_moves')}</div>
            <div className="moves-list">
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
        </div>
        <div className="board-container">
          <AnimatePresence>
            {status !== 'playing' && (
              <motion.div className={`status-banner status-${status}`}
                initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}}>
                <div className="status-text">{statusMsg}</div>
                <button className="status-new-btn" onClick={() => { setMode('lobby'); setGame(new Chess()); setFen(new Chess().fen()); setStatus('playing'); setHistory([]); setLastMove(null) }}>
                  {t('back')}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          <Chessboard
            options={{
              id: 'online-board',
              position: fen,
              pieces: NOIR_PIECES,
              onPieceDrop: ({ sourceSquare, targetSquare }) => {
                doMove(sourceSquare, targetSquare)
                return true
              },
              boardOrientation: myColor === 'b' ? 'black' : 'white',
              boardStyle: { borderRadius: '12px', boxShadow: '0 0 60px rgba(139,92,246,0.3)' },
              darkSquareStyle: { backgroundColor: styles.darkSquare },
              lightSquareStyle: { backgroundColor: styles.lightSquare },
              squareStyles: sqStyles,
              animationDurationInMs: 200,
            }}
          />
          <div className="status-bar-bottom">
            <div className={`status-dot ${status}`}/>
            <span>{statusMsg}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

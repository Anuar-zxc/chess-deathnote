import { Chess } from 'chess.js'

const rooms = globalThis.__dnChessRooms || new Map()
globalThis.__dnChessRooms = rooms

function json(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(body))
}

function code() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

function publicRoom(room) {
  return {
    code: room.code,
    fen: room.fen,
    lastMove: room.lastMove,
    history: room.history,
    status: room.status,
    whiteConnected: Boolean(room.whiteClientId),
    blackConnected: Boolean(room.blackClientId),
    updatedAt: room.updatedAt,
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (chunk) => { raw += chunk })
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {})
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })
}

function joinRoom(room, clientId) {
  if (room.whiteClientId === clientId) return 'w'
  if (room.blackClientId === clientId) return 'b'
  if (!room.whiteClientId) {
    room.whiteClientId = clientId
    return 'w'
  }
  if (!room.blackClientId) {
    room.blackClientId = clientId
    room.status = 'playing'
    return 'b'
  }
  return 'spectator'
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

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const room = rooms.get(String(req.query.code || '').toUpperCase())
    if (!room) return json(res, 404, { error: 'room_not_found' })
    return json(res, 200, { room: publicRoom(room) })
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    return json(res, 405, { error: 'method_not_allowed' })
  }

  let body
  try {
    body = await readBody(req)
  } catch {
    return json(res, 400, { error: 'bad_json' })
  }

  const action = body.action
  const clientId = String(body.clientId || '').slice(0, 80)
  if (!clientId) return json(res, 400, { error: 'client_required' })

  if (action === 'create') {
    const roomCode = code()
    const game = new Chess()
    const room = {
      code: roomCode,
      fen: game.fen(),
      history: [],
      lastMove: null,
      status: 'waiting',
      whiteClientId: clientId,
      blackClientId: null,
      updatedAt: Date.now(),
    }
    rooms.set(roomCode, room)
    return json(res, 200, { color: 'w', room: publicRoom(room) })
  }

  const roomCode = String(body.code || '').toUpperCase()
  const room = rooms.get(roomCode)
  if (!room) return json(res, 404, { error: 'room_not_found' })

  if (action === 'join') {
    const color = joinRoom(room, clientId)
    room.updatedAt = Date.now()
    return json(res, 200, { color, room: publicRoom(room) })
  }

  if (action === 'move') {
    const color = room.whiteClientId === clientId ? 'w' : room.blackClientId === clientId ? 'b' : null
    if (!color) return json(res, 403, { error: 'not_a_player' })

    const game = new Chess(room.fen)
    if (game.turn() !== color) return json(res, 409, { error: 'not_your_turn', room: publicRoom(room) })

    const from = String(body.from || '')
    const to = String(body.to || '')
    const legalMove = findPlayableMove(game.moves({ verbose: true }), from, to)
    if (!legalMove) return json(res, 400, { error: 'illegal_move', room: publicRoom(room) })

    const move = game.move({ from: legalMove.from, to: legalMove.to, promotion: legalMove.promotion || 'q' })
    room.fen = game.fen()
    room.lastMove = { from: move.from, to: move.to }
    room.history = game.history({ verbose: true })
    room.status = game.isCheckmate()
      ? 'checkmate'
      : game.isStalemate()
        ? 'stalemate'
        : game.isDraw()
          ? 'draw'
          : 'playing'
    room.updatedAt = Date.now()
    return json(res, 200, { color, room: publicRoom(room) })
  }

  return json(res, 400, { error: 'unknown_action' })
}

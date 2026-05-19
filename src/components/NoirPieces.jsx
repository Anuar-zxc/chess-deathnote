/* eslint-disable react-refresh/only-export-components */
const PIECE_META = {
  P: { mark: 'N', title: 'notebook pawn' },
  R: { mark: 'T', title: 'tower seal' },
  N: { mark: 'L', title: 'knight suspect' },
  B: { mark: 'E', title: 'watching bishop' },
  Q: { mark: 'Q', title: 'queen verdict' },
  K: { mark: 'K', title: 'king name' },
}

function PieceSvg({ type }) {
  return function NoirPiece({ svgStyle }) {
    const side = type[0]
    const kind = type[1]
    const isWhite = side === 'w'
    const ink = isWhite ? '#f8fafc' : '#09070f'
    const edge = isWhite ? '#0a0712' : '#f6e7ff'
    const accent = isWhite ? '#f5c542' : '#9f7aea'
    const glow = isWhite ? '#fff7d6' : '#b794f4'
    const meta = PIECE_META[kind]
    const id = `noir-${type}`

    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45" width="100%" height="100%" style={svgStyle} aria-label={meta.title}>
        <defs>
          <linearGradient id={`${id}-body`} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor={isWhite ? '#ffffff' : '#1f1233'} />
            <stop offset="58%" stopColor={ink} />
            <stop offset="100%" stopColor={isWhite ? '#cfd7e6' : '#030106'} />
          </linearGradient>
          <filter id={`${id}-glow`} x="-35%" y="-35%" width="170%" height="170%">
            <feDropShadow dx="0" dy="0" stdDeviation="1.3" floodColor={glow} floodOpacity="0.45" />
          </filter>
        </defs>

        <ellipse cx="22.5" cy="39" rx="13.8" ry="3.2" fill={isWhite ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.55)'} />
        <path d="M10.5 37.4h24l-2.8-5.9H13.3z" fill={`url(#${id}-body)`} stroke={edge} strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M14.2 31.7h16.6l-2.3-4.9h-12z" fill={`url(#${id}-body)`} stroke={edge} strokeWidth="1.3" strokeLinejoin="round" />

        {kind === 'P' && (
          <g filter={`url(#${id}-glow)`}>
            <circle cx="22.5" cy="14.2" r="5.2" fill={`url(#${id}-body)`} stroke={edge} strokeWidth="1.4" />
            <path d="M17.8 26.8c1.2-5.9 8.2-5.9 9.4 0z" fill={`url(#${id}-body)`} stroke={edge} strokeWidth="1.4" />
            <path d="M20 12.8l5.6 4.5-4.4.9z" fill={accent} opacity="0.9" />
          </g>
        )}

        {kind === 'R' && (
          <g filter={`url(#${id}-glow)`}>
            <path d="M15.1 26.9V12.2h14.8v14.7z" fill={`url(#${id}-body)`} stroke={edge} strokeWidth="1.4" />
            <path d="M13.5 12.3h18v-4h-4.1v2h-3.1v-2h-3.6v2h-3.1v-2h-4.1z" fill={`url(#${id}-body)`} stroke={edge} strokeWidth="1.3" />
            <path d="M18.2 17h8.6M18.2 22.2h8.6" stroke={accent} strokeWidth="1.4" strokeLinecap="round" />
          </g>
        )}

        {kind === 'N' && (
          <g filter={`url(#${id}-glow)`}>
            <path d="M15.4 27.2c2.9-6.4 2.6-12.5 9.9-17.2 3 3.1 5.2 6.1 4.8 10.6l3 3.1-2.2 3.5z" fill={`url(#${id}-body)`} stroke={edge} strokeWidth="1.45" strokeLinejoin="round" />
            <path d="M24.7 11.2l-1.4 5.9 5.2-2.1" fill="none" stroke={accent} strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="27.2" cy="18.6" r="1.15" fill={accent} />
          </g>
        )}

        {kind === 'B' && (
          <g filter={`url(#${id}-glow)`}>
            <path d="M22.5 8.2c6.5 4.7 6.5 13.9 0 18.8-6.5-4.9-6.5-14.1 0-18.8z" fill={`url(#${id}-body)`} stroke={edge} strokeWidth="1.4" />
            <path d="M16.2 17.6c4-4.1 8.6-4.1 12.6 0-4 4.3-8.6 4.3-12.6 0z" fill="none" stroke={accent} strokeWidth="1.5" />
            <circle cx="22.5" cy="17.6" r="2.25" fill={accent} />
          </g>
        )}

        {kind === 'Q' && (
          <g filter={`url(#${id}-glow)`}>
            <path d="M13.5 25.9l2.2-15.2 5.2 7.4 1.6-9.7 1.6 9.7 5.2-7.4 2.2 15.2z" fill={`url(#${id}-body)`} stroke={edge} strokeWidth="1.35" strokeLinejoin="round" />
            <circle cx="15.7" cy="10.7" r="2" fill={accent} />
            <circle cx="22.5" cy="8.4" r="2.2" fill={accent} />
            <circle cx="29.3" cy="10.7" r="2" fill={accent} />
          </g>
        )}

        {kind === 'K' && (
          <g filter={`url(#${id}-glow)`}>
            <path d="M16.1 26.4l1.5-11.7 4.9-5.9 4.9 5.9 1.5 11.7z" fill={`url(#${id}-body)`} stroke={edge} strokeWidth="1.45" strokeLinejoin="round" />
            <path d="M22.5 6.4v10.4M18.9 10.1h7.2" stroke={accent} strokeWidth="1.8" strokeLinecap="round" />
          </g>
        )}

        <text x="22.5" y="35.8" textAnchor="middle" fontSize="6.2" fontFamily="Cinzel, Georgia, serif" fontWeight="800" fill={accent} stroke={edge} strokeWidth="0.25">
          {meta.mark}
        </text>
      </svg>
    )
  }
}

export const NOIR_PIECES = Object.fromEntries(
  ['wP', 'wR', 'wN', 'wB', 'wQ', 'wK', 'bP', 'bR', 'bN', 'bB', 'bQ', 'bK'].map((type) => [type, PieceSvg({ type })])
)

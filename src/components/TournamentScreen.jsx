import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useGameStore } from '../store/useGameStore'

const PLAYERS = [
  'You', 'Light', 'L Lawliet', 'Misa', 'Near', 'Mello', 'Takada', 'Matsuda',
  'Aizawa', 'Soichiro', 'Naomi', 'Ryuzaki', 'Rem', 'Watari', 'Ide', 'Mikami',
  'Sakura', 'Kenzaki', 'Noir-17', 'Akira', 'Yumi', 'Raito', 'Hikari', 'Shiori',
  'Almaty Ace', 'Astana Ink', 'Shymkent Sharp', 'Taraz Tactician', 'Aktau Bishop', 'Atyrau Knight', 'Konaev King', 'Semey Queen',
]

const TOURNAMENT_COPY = {
  ru: {
    rounds: ['1/16 финала', '1/8 финала', 'Четвертьфинал', 'Полуфинал', 'Финал', 'Чемпион'],
    season: 'Рейтинговый сезон #{season}',
    title: 'Kira Cup: сетка на 32 игрока',
    subtitle: 'Соревновательный режим с сеткой, рейтингом, призами и premium season pass.',
    openPro: 'Открыть Pro',
    simulate: 'Симулировать раунд',
    newSeason: 'Новый сезон',
    progress: 'Прогресс',
    yourRating: 'Ваш рейтинг',
    seasonWin: 'победа в сезоне: +120',
    prizePool: 'Призовой фонд',
    champion: 'Чемпион',
    unknown: 'не определен',
    finalAhead: 'финал еще впереди',
    payTitle: 'Pro турнир заблокирован',
    payText: 'Free игроки видят сетку, Pro/Elite запускают сезоны, получают AI Coach reports и premium фигуры.',
    roomTitle: 'Live Tournament Room',
    roomCode: 'Код турнира: {code}',
    roomEmpty: 'Создай турнир или подключись по коду',
    roomDesc: 'Работает как онлайн-матч: код сохраняет участников, сетку, победителей и сезон в общей комнате.',
    createRoom: 'Создать турнир',
    recreateCode: 'Пересоздать код',
    codePlaceholder: 'Код турнира',
    join: 'Подключиться',
    spectator: 'Открыть как зритель',
    copied: 'Скопировано',
    copyCode: 'Копировать код',
    lobbyTitle: 'Tournament Lobby',
    lobbyHeading: 'Регистрация по коду',
    lobbyDesc: 'Участник вводит имя и город, заявка появляется у организатора турнира.',
    namePlaceholder: 'Имя участника',
    cityPlaceholder: 'Город',
    submitRequest: 'Подать заявку',
    noRequests: 'Заявок пока нет',
    approve: 'Принять',
    reject: 'Отклонить',
    rosterTitle: 'Roster Builder',
    rosterHeading: 'Участники турнира',
    rosterLocked: 'Список закрыт после старта сезона',
    rosterHint: 'Впиши 32 имени перед стартом',
    profilesTitle: 'Player Profiles',
    profilesHeading: 'Карточки игроков',
    profilesHint: 'город, рейтинг, форма и любимый дебют',
    wins: 'побед',
    draftTitle: 'Opponent Draft',
    draftHeading: 'Выбери первого соперника',
    draftSelected: 'Сейчас ты стартуешь против {name} ({city}, {rating}).',
    draftEmpty: 'Выбери игрока, и сетка перестроится так, чтобы он попал к тебе в первый матч.',
    draftLocked: 'Чтобы поменять соперника, нажми “Новый сезон”.',
    randomOpponent: 'Случайный соперник',
    proRival: 'PRO соперник',
    waitingWinners: 'ожидает победителей',
    finalPending: 'финал ожидает',
    ratingDelta: 'рейтинг {delta}',
    mvpSeason: 'чемпион сезона #{season}',
    noUpsets: 'без апсетов',
    upsetFallback: 'фавориты удержали сетку',
    upsetText: '{winner} победил {loser}',
    bestMatchFallback: 'финальный хайлайт появится после игр',
    notFoundBang: 'Турнир не найден!',
    openFailed: 'Не удалось открыть турнир',
    needCode: 'Сначала создай турнир или введи код.',
    notFound: 'Турнир не найден.',
    needName: 'Введи имя участника.',
  },
  en: {
    rounds: ['Round of 32', 'Round of 16', 'Quarterfinal', 'Semifinal', 'Final', 'Champion'],
    season: 'Ranked Season #{season}',
    title: 'Kira Cup: 32-player bracket',
    subtitle: 'Competitive mode with a full bracket, ratings, prizes, and a premium season pass.',
    openPro: 'Open Pro',
    simulate: 'Simulate round',
    newSeason: 'New season',
    progress: 'Progress',
    yourRating: 'Your rating',
    seasonWin: 'season win: +120',
    prizePool: 'Prize pool',
    champion: 'Champion',
    unknown: 'not decided',
    finalAhead: 'the final is still ahead',
    payTitle: 'Pro tournament locked',
    payText: 'Free players can view the bracket; Pro/Elite players run seasons, get AI Coach reports, and unlock premium pieces.',
    roomTitle: 'Live Tournament Room',
    roomCode: 'Tournament code: {code}',
    roomEmpty: 'Create a tournament or join by code',
    roomDesc: 'Works like an online match: the code stores players, bracket, winners, and season in one shared room.',
    createRoom: 'Create tournament',
    recreateCode: 'Regenerate code',
    codePlaceholder: 'Tournament code',
    join: 'Join',
    spectator: 'Open as spectator',
    copied: 'Copied',
    copyCode: 'Copy code',
    lobbyTitle: 'Tournament Lobby',
    lobbyHeading: 'Code registration',
    lobbyDesc: 'A participant enters name and city, then the organizer sees the request.',
    namePlaceholder: 'Participant name',
    cityPlaceholder: 'City',
    submitRequest: 'Submit request',
    noRequests: 'No requests yet',
    approve: 'Approve',
    reject: 'Reject',
    rosterTitle: 'Roster Builder',
    rosterHeading: 'Tournament participants',
    rosterLocked: 'Roster locks after the season starts',
    rosterHint: 'Enter 32 names before launch',
    profilesTitle: 'Player Profiles',
    profilesHeading: 'Player cards',
    profilesHint: 'city, rating, form, and favorite opening',
    wins: 'wins',
    draftTitle: 'Opponent Draft',
    draftHeading: 'Choose your first opponent',
    draftSelected: 'You currently start against {name} ({city}, {rating}).',
    draftEmpty: 'Choose a player and the bracket will rebuild so they meet you in the first match.',
    draftLocked: 'To change opponent, press “New season”.',
    randomOpponent: 'Random opponent',
    proRival: 'PRO rival',
    waitingWinners: 'waiting for winners',
    finalPending: 'final pending',
    ratingDelta: 'rating {delta}',
    mvpSeason: 'season #{season} champion',
    noUpsets: 'no upsets',
    upsetFallback: 'favorites held the bracket',
    upsetText: '{winner} beat {loser}',
    bestMatchFallback: 'final highlight appears after games',
    notFoundBang: 'Tournament not found!',
    openFailed: 'Could not open tournament',
    needCode: 'Create a tournament or enter a code first.',
    notFound: 'Tournament not found.',
    needName: 'Enter participant name.',
  },
  kk: {
    rounds: ['1/16 финал', '1/8 финал', 'Ширек финал', 'Жартылай финал', 'Финал', 'Чемпион'],
    season: 'Рейтинг маусымы #{season}',
    title: 'Kira Cup: 32 ойыншы сеткасы',
    subtitle: 'Сеткасы, рейтингі, жүлделері және premium season pass бар жарыс режимі.',
    openPro: 'Pro ашу',
    simulate: 'Раундты симуляциялау',
    newSeason: 'Жаңа маусым',
    progress: 'Прогресс',
    yourRating: 'Сіздің рейтинг',
    seasonWin: 'маусымдағы жеңіс: +120',
    prizePool: 'Жүлде қоры',
    champion: 'Чемпион',
    unknown: 'анықталмаған',
    finalAhead: 'финал әлі алда',
    payTitle: 'Pro турнирі жабық',
    payText: 'Free ойыншылар сетканы көреді, Pro/Elite маусым бастайды, AI Coach есептерін және premium фигураларды алады.',
    roomTitle: 'Live Tournament Room',
    roomCode: 'Турнир коды: {code}',
    roomEmpty: 'Турнир жаса немесе кодпен қосыл',
    roomDesc: 'Онлайн матч сияқты жұмыс істейді: код қатысушыларды, сетканы, жеңімпаздарды және маусымды ортақ бөлмеде сақтайды.',
    createRoom: 'Турнир жасау',
    recreateCode: 'Кодты жаңарту',
    codePlaceholder: 'Турнир коды',
    join: 'Қосылу',
    spectator: 'Көрермен ретінде ашу',
    copied: 'Көшірілді',
    copyCode: 'Кодты көшіру',
    lobbyTitle: 'Tournament Lobby',
    lobbyHeading: 'Код арқылы тіркелу',
    lobbyDesc: 'Қатысушы аты мен қаласын енгізеді, өтінім ұйымдастырушыға түседі.',
    namePlaceholder: 'Қатысушы аты',
    cityPlaceholder: 'Қала',
    submitRequest: 'Өтінім беру',
    noRequests: 'Әзірге өтінім жоқ',
    approve: 'Қабылдау',
    reject: 'Қабылдамау',
    rosterTitle: 'Roster Builder',
    rosterHeading: 'Турнир қатысушылары',
    rosterLocked: 'Маусым басталғаннан кейін тізім жабылады',
    rosterHint: 'Бастамас бұрын 32 атты енгіз',
    profilesTitle: 'Player Profiles',
    profilesHeading: 'Ойыншы карталары',
    profilesHint: 'қала, рейтинг, форма және сүйікті дебют',
    wins: 'жеңіс',
    draftTitle: 'Opponent Draft',
    draftHeading: 'Бірінші қарсыласты таңда',
    draftSelected: 'Қазір сен {name} қарсы бастайсың ({city}, {rating}).',
    draftEmpty: 'Ойыншыны таңда, сетка оны алғашқы матчқа қояды.',
    draftLocked: 'Қарсыласты өзгерту үшін “Жаңа маусым” бас.',
    randomOpponent: 'Кездейсоқ қарсылас',
    proRival: 'PRO қарсылас',
    waitingWinners: 'жеңімпаздарды күтуде',
    finalPending: 'финал күтілуде',
    ratingDelta: 'рейтинг {delta}',
    mvpSeason: '#{season} маусым чемпионы',
    noUpsets: 'апсет жоқ',
    upsetFallback: 'фавориттер сетканы ұстады',
    upsetText: '{winner} {loser} жеңді',
    bestMatchFallback: 'финал хайлайты ойындардан кейін шығады',
    notFoundBang: 'Турнир табылмады!',
    openFailed: 'Турнирді ашу мүмкін болмады',
    needCode: 'Алдымен турнир жаса немесе код енгіз.',
    notFound: 'Турнир табылмады.',
    needName: 'Қатысушы атын енгіз.',
  },
  zh: {
    rounds: ['32强赛', '16强赛', '四分之一决赛', '半决赛', '决赛', '冠军'],
    season: '排位赛季 #{season}',
    title: 'Kira Cup：32人锦标赛',
    subtitle: '带完整赛程、评分、奖品和高级赛季通行证的竞技模式。',
    openPro: '打开专业版',
    simulate: '模拟本轮',
    newSeason: '新赛季',
    progress: '进度',
    yourRating: '你的评分',
    seasonWin: '赛季胜利：+120',
    prizePool: '奖池',
    champion: '冠军',
    unknown: '未确定',
    finalAhead: '决赛还未开始',
    payTitle: '专业锦标赛已锁定',
    payText: '免费玩家可查看赛程；Pro/Elite 玩家可开启赛季、获得 AI Coach 报告和高级棋子。',
    roomTitle: 'Live Tournament Room',
    roomCode: '锦标赛代码：{code}',
    roomEmpty: '创建锦标赛或用代码加入',
    roomDesc: '像在线比赛一样工作：代码会保存玩家、赛程、胜者和赛季。',
    createRoom: '创建锦标赛',
    recreateCode: '重新生成代码',
    codePlaceholder: '锦标赛代码',
    join: '加入',
    spectator: '以观众打开',
    copied: '已复制',
    copyCode: '复制代码',
    lobbyTitle: 'Tournament Lobby',
    lobbyHeading: '代码报名',
    lobbyDesc: '参赛者输入姓名和城市，组织者即可看到申请。',
    namePlaceholder: '参赛者姓名',
    cityPlaceholder: '城市',
    submitRequest: '提交申请',
    noRequests: '暂无申请',
    approve: '批准',
    reject: '拒绝',
    rosterTitle: 'Roster Builder',
    rosterHeading: '锦标赛参赛者',
    rosterLocked: '赛季开始后名单锁定',
    rosterHint: '开始前输入32个姓名',
    profilesTitle: 'Player Profiles',
    profilesHeading: '玩家卡片',
    profilesHint: '城市、评分、状态和最爱开局',
    wins: '胜',
    draftTitle: 'Opponent Draft',
    draftHeading: '选择第一个对手',
    draftSelected: '你当前首战对手是 {name}（{city}，{rating}）。',
    draftEmpty: '选择一个玩家，赛程会重排让他们成为你的首轮对手。',
    draftLocked: '要更换对手，请点击“新赛季”。',
    randomOpponent: '随机对手',
    proRival: 'PRO 对手',
    waitingWinners: '等待胜者',
    finalPending: '决赛待定',
    ratingDelta: '评分 {delta}',
    mvpSeason: '第 {season} 赛季冠军',
    noUpsets: '没有爆冷',
    upsetFallback: '热门选手守住了赛程',
    upsetText: '{winner} 击败 {loser}',
    bestMatchFallback: '比赛结束后会出现决赛亮点',
    notFoundBang: '未找到锦标赛！',
    openFailed: '无法打开锦标赛',
    needCode: '请先创建锦标赛或输入代码。',
    notFound: '未找到锦标赛。',
    needName: '请输入参赛者姓名。',
  },
}

function ratingFor(index) {
  return Math.max(980, 1840 - index * 23 + ((index * 37) % 90))
}

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

function normalizeNames(input = []) {
  const names = Array.from({ length: 32 }, (_, i) => input[i] || PLAYERS[i] || `Player ${i + 1}`)
  return names.map((name, i) => (name || '').trim() || `Player ${i + 1}`)
}

function seedPlayers(names = PLAYERS) {
  return names.map((name, index) => ({
    id: `p-${index}`,
    name,
    city: index % 3 === 0 ? 'Алматы' : index % 3 === 1 ? 'Астана' : 'Global',
    rating: ratingFor(index),
    pro: index < 8,
  }))
}

function buildSeededPlayers(opponentId, names = PLAYERS) {
  const seeded = seedPlayers(names)
  if (!opponentId) return seeded
  const you = seeded.find((player) => player.name === 'You')
  const opponent = seeded.find((player) => player.id === opponentId)
  if (!you || !opponent) return seeded

  const rest = seeded.filter((player) => player.id !== you.id && player.id !== opponent.id)
  return [you, ...rest.slice(0, 30), opponent]
}

function createInitialRounds(opponentId, names = PLAYERS) {
  const seeded = buildSeededPlayers(opponentId, names)
  const firstRound = []
  for (let i = 0; i < 16; i += 1) {
    firstRound.push({ id: `r0-${i}`, a: seeded[i], b: seeded[31 - i], winner: null })
  }
  return [
    firstRound,
    Array.from({ length: 8 }, (_, i) => ({ id: `r1-${i}`, a: null, b: null, winner: null })),
    Array.from({ length: 4 }, (_, i) => ({ id: `r2-${i}`, a: null, b: null, winner: null })),
    Array.from({ length: 2 }, (_, i) => ({ id: `r3-${i}`, a: null, b: null, winner: null })),
    [{ id: 'r4-0', a: null, b: null, winner: null }],
  ]
}

function pickByRating(match) {
  if (!match.a) return match.b
  if (!match.b) return match.a
  const upset = Math.random() > 0.78
  return (match.a.rating >= match.b.rating) !== upset ? match.a : match.b
}

function openingFor(index) {
  const openings = ['Sicilian', 'Queen Gambit', 'Caro-Kann', 'London', 'King Indian', 'Ruy Lopez', 'French', 'Catalan']
  return openings[index % openings.length]
}

function formFor(index) {
  const forms = ['W-W-L-W-W', 'W-D-W-L-W', 'L-W-W-W-D', 'D-W-L-W-W', 'W-W-W-L-D', 'L-D-W-W-W']
  return forms[index % forms.length]
}

function profileFor(player) {
  const index = Number(player.id.replace('p-', '')) || 0
  return {
    ...player,
    wins: Math.max(8, Math.round((player.rating - 900) / 42) + (index % 7)),
    opening: openingFor(index),
    form: formFor(index),
  }
}

function applyMatchResult(rounds, roundIndex, matchIndex, score) {
  const next = rounds.map((round) => round.map((match) => ({ ...match })))
  const match = next[roundIndex][matchIndex]
  if (!match?.a || !match?.b) return next

  let winner = null
  let label = score
  if (score === '1-0') winner = match.a
  if (score === '0-1') winner = match.b
  if (score === '1/2') {
    winner = pickByRating(match)
    label = `1/2 TB -> ${winner.name}`
  }

  match.winner = winner
  match.score = label
  const targetRound = roundIndex + 1
  if (next[targetRound]) {
    const targetMatch = Math.floor(matchIndex / 2)
    const slot = matchIndex % 2 === 0 ? 'a' : 'b'
    next[targetRound][targetMatch][slot] = winner
    next[targetRound][targetMatch].winner = null
    next[targetRound][targetMatch].score = null
  }
  return next
}

function buildTournamentReport(rounds) {
  const played = rounds.flatMap((round, roundIndex) => round.map((match) => ({ ...match, roundIndex }))).filter((match) => match.winner)
  const champion = rounds[4][0]?.winner
  if (!champion) return null

  const upsets = played
    .filter((match) => match.a && match.b)
    .map((match) => {
      const loser = match.winner.id === match.a.id ? match.b : match.a
      return { match, loser, delta: loser.rating - match.winner.rating }
    })
    .filter((item) => item.delta > 0)
    .sort((a, b) => b.delta - a.delta)

  const bestMatch = [...played]
    .filter((match) => match.a && match.b)
    .sort((a, b) => (b.a.rating + b.b.rating) - (a.a.rating + a.b.rating))[0]

  return {
    mvp: champion,
    upset: upsets[0],
    bestMatch,
    ratingDelta: champion.name === 'You' ? '+120' : '+48',
  }
}

export default function TournamentScreen() {
  const { i18n } = useTranslation()
  const { plan, setScreen, stats } = useGameStore()
  const [participantNames, setParticipantNames] = useState(() => normalizeNames(PLAYERS))
  const [rounds, setRounds] = useState(() => createInitialRounds(undefined, normalizeNames(PLAYERS)))
  const [season, setSeason] = useState(1)
  const [selectedPrize, setSelectedPrize] = useState('pro')
  const [selectedOpponentId, setSelectedOpponentId] = useState(() => seedPlayers(PLAYERS)[31].id)
  const [roomCode, setRoomCode] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [isSpectator, setIsSpectator] = useState(false)
  const [lobbyRequests, setLobbyRequests] = useState([])
  const [registerName, setRegisterName] = useState('')
  const [registerCity, setRegisterCity] = useState('Алматы')

  const champion = rounds[4][0]?.winner
  const report = useMemo(() => buildTournamentReport(rounds), [rounds])
  const currentRound = useMemo(() => rounds.findIndex((round) => round.some((m) => m.a && m.b && !m.winner)), [rounds])
  const progress = Math.round((rounds.flat().filter((m) => m.winner).length / 31) * 100)
  const locked = plan === 'free'
  const opponents = useMemo(() => seedPlayers(participantNames).filter((player) => player.id !== 'p-0'), [participantNames])
  const profilePlayers = useMemo(() => seedPlayers(participantNames).slice(0, 8).map(profileFor), [participantNames])
  const selectedOpponent = opponents.find((player) => player.id === selectedOpponentId)
  const draftLocked = progress > 0 || Boolean(rounds[0][0]?.winner)
  const canManage = !locked && !isSpectator
  const lang = (i18n.language || 'ru').split('-')[0]
  const copy = TOURNAMENT_COPY[lang] || TOURNAMENT_COPY.en
  const tc = (key, params = {}) => {
    const template = copy[key] || TOURNAMENT_COPY.en[key] || key
    return template.replace(/\{(\w+)\}/g, (_, name) => params[name] ?? '')
  }

  useEffect(() => {
    if (!roomCode) return undefined
    const interval = setInterval(() => {
      const raw = localStorage.getItem(`dn-tournament-${roomCode}`)
      if (!raw) return
      try {
        const data = JSON.parse(raw)
        if (data.participantNames) setParticipantNames(normalizeNames(data.participantNames))
        if (data.rounds) setRounds(data.rounds)
        if (data.season) setSeason(data.season)
        if (data.selectedOpponentId) setSelectedOpponentId(data.selectedOpponentId)
        if (data.selectedPrize) setSelectedPrize(data.selectedPrize)
        if (Array.isArray(data.lobbyRequests)) setLobbyRequests(data.lobbyRequests)
      } catch (e) {
        console.error('Tournament sync failed:', e)
      }
    }, 900)
    return () => clearInterval(interval)
  }, [roomCode])

  useEffect(() => {
    if (!roomCode || isSpectator) return
    localStorage.setItem(`dn-tournament-${roomCode}`, JSON.stringify({
      participantNames,
      rounds,
      season,
      selectedOpponentId,
      selectedPrize,
      lobbyRequests,
      updatedAt: Date.now(),
    }))
  }, [isSpectator, lobbyRequests, participantNames, roomCode, rounds, season, selectedOpponentId, selectedPrize])

  function createRoom() {
    const code = generateCode()
    setRoomCode(code)
    setJoinCode(code)
    setIsSpectator(false)
    localStorage.setItem(`dn-tournament-${code}`, JSON.stringify({
      participantNames,
      rounds,
      season,
      selectedOpponentId,
      selectedPrize,
      lobbyRequests,
      updatedAt: Date.now(),
    }))
  }

  function joinRoom(mode = 'organizer') {
    const code = joinCode.trim().toUpperCase()
    const raw = localStorage.getItem(`dn-tournament-${code}`)
    if (!raw) { alert(tc('notFoundBang')); return }
    try {
      const data = JSON.parse(raw)
      const normalized = normalizeNames(data.participantNames || PLAYERS)
      setParticipantNames(normalized)
      setRounds(data.rounds || createInitialRounds(data.selectedOpponentId, normalized))
      setSeason(data.season || 1)
      setSelectedOpponentId(data.selectedOpponentId || 'p-31')
      setSelectedPrize(data.selectedPrize || 'pro')
      setLobbyRequests(data.lobbyRequests || [])
      setRoomCode(code)
      setIsSpectator(mode === 'spectator')
    } catch {
      alert(tc('openFailed'))
    }
  }

  function copyCode() {
    if (!roomCode) return
    navigator.clipboard.writeText(roomCode).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  function resetTournament() {
    if (!canManage) return
    setRounds(createInitialRounds(selectedOpponentId, participantNames))
    setSeason((s) => s + 1)
  }

  function chooseOpponent(opponentId) {
    if (!canManage || draftLocked) return
    setSelectedOpponentId(opponentId)
    setRounds(createInitialRounds(opponentId, participantNames))
  }

  function chooseRandomOpponent() {
    if (!canManage || draftLocked) return
    const pool = opponents.filter((player) => player.id !== selectedOpponentId)
    const nextOpponent = pool[Math.floor(Math.random() * pool.length)]
    if (nextOpponent) chooseOpponent(nextOpponent.id)
  }

  function updateParticipantName(index, value) {
    if (!canManage) return
    const cleanName = value.slice(0, 24)
    setParticipantNames((prev) => {
      const next = [...prev]
      next[index] = cleanName
      if (!draftLocked) {
        const safeNames = normalizeNames(next)
        setRounds(createInitialRounds(selectedOpponentId, safeNames))
      }
      return next
    })
  }

  function advance(roundIndex, matchIndex, winner) {
    if (!canManage) return
    setRounds((prev) => applyMatchResult(prev, roundIndex, matchIndex, winner.id === prev[roundIndex][matchIndex].a?.id ? '1-0' : '0-1'))
  }

  function submitResult(roundIndex, matchIndex, score) {
    if (!canManage) return
    setRounds((prev) => applyMatchResult(prev, roundIndex, matchIndex, score))
  }

  function submitRegistration() {
    const code = roomCode || joinCode.trim().toUpperCase()
    if (!code) { alert(tc('needCode')); return }
    const raw = localStorage.getItem(`dn-tournament-${code}`)
    if (!raw) { alert(tc('notFound')); return }
    const name = registerName.trim()
    if (name.length < 2) { alert(tc('needName')); return }

    const request = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: name.slice(0, 24),
      city: registerCity.trim().slice(0, 24) || 'Алматы',
      createdAt: Date.now(),
    }
    const data = JSON.parse(raw)
    const nextRequests = [...(data.lobbyRequests || []), request]
    localStorage.setItem(`dn-tournament-${code}`, JSON.stringify({ ...data, lobbyRequests: nextRequests, updatedAt: Date.now() }))
    setLobbyRequests(nextRequests)
    setRegisterName('')
  }

  function approveRequest(request) {
    if (!canManage || draftLocked) return
    setParticipantNames((prev) => {
      const next = normalizeNames(prev)
      const replaceIndex = Math.max(1, next.length - lobbyRequests.length)
      next[Math.min(31, replaceIndex)] = request.name
      setRounds(createInitialRounds(selectedOpponentId, next))
      return next
    })
    setLobbyRequests((prev) => prev.filter((item) => item.id !== request.id))
  }

  function rejectRequest(id) {
    if (!canManage) return
    setLobbyRequests((prev) => prev.filter((item) => item.id !== id))
  }

  function simulateCurrentRound() {
    if (locked || isSpectator) {
      setScreen('subscription')
      return
    }
    const idx = currentRound === -1 ? 0 : currentRound
    setRounds((prev) => {
      const next = prev.map((round) => round.map((match) => ({ ...match })))
      next[idx].forEach((match, matchIndex) => {
        if (!match.a || !match.b || match.winner) return
        const winner = pickByRating(match)
        const score = winner.id === match.a.id ? '1-0' : '0-1'
        const applied = applyMatchResult(next, idx, matchIndex, score)
        next.splice(0, next.length, ...applied)
      })
      return next
    })
  }

  return (
    <div className="tournament-screen">
      <motion.section className="tournament-hero" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
        <div>
          <div className="hero-kicker">{tc('season', { season })}</div>
          <h2 className="screen-title">{tc('title')}</h2>
          <p className="screen-subtitle">{tc('subtitle')}</p>
        </div>
        <div className="tournament-actions">
          {isSpectator && <span className="mode-pill">Spectator</span>}
          <button className="market-cta" onClick={simulateCurrentRound} disabled={isSpectator}>{locked ? tc('openPro') : tc('simulate')}</button>
          <button className="action-btn" onClick={resetTournament} disabled={!canManage}>{tc('newSeason')}</button>
        </div>
      </motion.section>

      <section className="tournament-dashboard">
        <div className="dash-tile">
          <span>{tc('progress')}</span>
          <strong>{progress}%</strong>
          <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%`, background: 'var(--gold)' }} /></div>
        </div>
        <div className="dash-tile">
          <span>{tc('yourRating')}</span>
          <strong>{stats.rating}</strong>
          <small>{tc('seasonWin')}</small>
        </div>
        <div className="dash-tile prize-tile">
          <span>{tc('prizePool')}</span>
          <strong>{selectedPrize === 'elite' ? 'Elite Skin Vault' : 'Pro Analysis Pass'}</strong>
          <div className="segmented">
            <button className={selectedPrize === 'pro' ? 'active' : ''} onClick={() => setSelectedPrize('pro')}>Pro</button>
            <button className={selectedPrize === 'elite' ? 'active' : ''} onClick={() => setSelectedPrize('elite')}>Elite</button>
          </div>
        </div>
        <div className="dash-tile">
          <span>{tc('champion')}</span>
          <strong>{champion?.name || tc('unknown')}</strong>
          <small>{champion ? `${champion.city} · ${champion.rating}` : tc('finalAhead')}</small>
        </div>
      </section>

      {locked && (
        <div className="tournament-paywall">
          <strong>{tc('payTitle')}</strong>
          <span>{tc('payText')}</span>
          <button onClick={() => setScreen('subscription')}>Upgrade to Pro</button>
        </div>
      )}

      <section className="tournament-room">
        <div className="room-copy">
          <span>{tc('roomTitle')}</span>
          <h3>{roomCode ? tc('roomCode', { code: roomCode }) : tc('roomEmpty')}</h3>
          <p>{tc('roomDesc')}</p>
        </div>
        <div className="room-controls">
          <button className="market-cta" onClick={createRoom}>{roomCode ? tc('recreateCode') : tc('createRoom')}</button>
          <input className="join-input" placeholder={tc('codePlaceholder')} value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} maxLength={6} />
          <button className="action-btn" onClick={() => joinRoom('organizer')}>{tc('join')}</button>
          <button className="action-btn" onClick={() => joinRoom('spectator')}>{tc('spectator')}</button>
          <button className="action-btn" onClick={copyCode} disabled={!roomCode}>{copied ? tc('copied') : tc('copyCode')}</button>
        </div>
      </section>

      <section className="tournament-lobby">
        <div className="lobby-copy">
          <span>{tc('lobbyTitle')}</span>
          <h3>{tc('lobbyHeading')}</h3>
          <p>{tc('lobbyDesc')}</p>
        </div>
        <div className="registration-form">
          <input className="join-input" placeholder={tc('namePlaceholder')} value={registerName} onChange={(e) => setRegisterName(e.target.value)} />
          <input className="join-input" placeholder={tc('cityPlaceholder')} value={registerCity} onChange={(e) => setRegisterCity(e.target.value)} />
          <button className="market-cta" onClick={submitRegistration}>{tc('submitRequest')}</button>
        </div>
        <div className="request-list">
          {lobbyRequests.length === 0 ? (
            <span className="empty-requests">{tc('noRequests')}</span>
          ) : lobbyRequests.map((request) => (
            <div className="request-row" key={request.id}>
              <strong>{request.name}</strong>
              <span>{request.city}</span>
              <button onClick={() => approveRequest(request)} disabled={!canManage || draftLocked}>{tc('approve')}</button>
              <button onClick={() => rejectRequest(request.id)} disabled={!canManage}>{tc('reject')}</button>
            </div>
          ))}
        </div>
      </section>

      <section className="participant-editor">
        <div className="editor-head">
          <div>
            <span>{tc('rosterTitle')}</span>
            <h3>{tc('rosterHeading')}</h3>
          </div>
          <small>{draftLocked ? tc('rosterLocked') : tc('rosterHint')}</small>
        </div>
        <div className="participant-grid">
          {participantNames.map((name, index) => (
            <label className="participant-field" key={`participant-${index}`}>
              <span>#{index + 1}</span>
              <input value={name} onChange={(e) => updateParticipantName(index, e.target.value)} disabled={draftLocked || !canManage} />
            </label>
          ))}
        </div>
      </section>

      <section className="profile-section">
        <div className="editor-head">
          <div>
            <span>{tc('profilesTitle')}</span>
            <h3>{tc('profilesHeading')}</h3>
          </div>
          <small>{tc('profilesHint')}</small>
        </div>
        <div className="profile-grid">
          {profilePlayers.map((player) => (
            <div className="profile-card" key={player.id}>
              <div>
                <strong>{player.name}</strong>
                <span>{player.city} · {player.rating}</span>
              </div>
              <p>{player.opening}</p>
              <small>{player.wins} {tc('wins')} · {player.form}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="opponent-draft">
        <div className="draft-copy">
          <span>{tc('draftTitle')}</span>
          <h3>{tc('draftHeading')}</h3>
          <p>
            {selectedOpponent
              ? tc('draftSelected', { name: selectedOpponent.name, city: selectedOpponent.city, rating: selectedOpponent.rating })
              : tc('draftEmpty')}
          </p>
          {draftLocked && <small>{tc('draftLocked')}</small>}
          <button className="draft-random" onClick={chooseRandomOpponent} disabled={draftLocked}>{tc('randomOpponent')}</button>
        </div>
        <div className="opponent-grid">
          {opponents.slice(0, 12).map((player) => (
            <button
              className={`opponent-card ${selectedOpponentId === player.id ? 'active' : ''}`}
              key={player.id}
              onClick={() => !draftLocked && chooseOpponent(player.id)}
              disabled={draftLocked}
            >
              <strong>{player.name}</strong>
              <span>{player.city} · {player.rating}</span>
              {player.pro && <em>{tc('proRival')}</em>}
            </button>
          ))}
        </div>
      </section>

      <div className="bracket-wrap">
        {rounds.map((round, roundIndex) => (
          <section className="bracket-round" key={copy.rounds[roundIndex]}>
            <h3>{copy.rounds[roundIndex]}</h3>
            <div className="match-list">
              {round.map((match, matchIndex) => (
                <div className={`match-card ${match.winner ? 'complete' : ''}`} key={match.id}>
                  <PlayerRow player={match.a} winner={match.winner?.id === match.a?.id} onPick={() => canManage && match.a && advance(roundIndex, matchIndex, match.a)} />
                  <PlayerRow player={match.b} winner={match.winner?.id === match.b?.id} onPick={() => canManage && match.b && advance(roundIndex, matchIndex, match.b)} />
                  {match.score && <span className="score-chip">{match.score}</span>}
                  {match.a && match.b && (
                    <div className="score-buttons">
                      <button onClick={() => submitResult(roundIndex, matchIndex, '1-0')} disabled={!canManage}>1-0</button>
                      <button onClick={() => submitResult(roundIndex, matchIndex, '0-1')} disabled={!canManage}>0-1</button>
                      <button onClick={() => submitResult(roundIndex, matchIndex, '1/2')} disabled={!canManage}>1/2</button>
                    </div>
                  )}
                  {!match.a || !match.b ? <span className="match-wait">{tc('waitingWinners')}</span> : null}
                </div>
              ))}
            </div>
          </section>
        ))}
        <section className="bracket-round champion-column">
          <h3>{copy.rounds[5]}</h3>
          <div className="champion-card">
            <div className="champion-crown">♛</div>
            <strong>{champion?.name || 'TBD'}</strong>
            <span>{champion ? 'Kira Cup Champion' : tc('finalPending')}</span>
          </div>
        </section>
      </div>

      {report && (
        <section className="tournament-report">
          <div className="report-grid">
            <div className="winner-card">
              <span>Kira Cup Champion</span>
              <h2>{report.mvp.name}</h2>
              <p>{report.mvp.city} · {report.mvp.rating} · {tc('ratingDelta', { delta: report.ratingDelta })}</p>
            </div>
            <div className="report-tile">
              <span>MVP</span>
              <strong>{report.mvp.name}</strong>
              <p>{tc('mvpSeason', { season })}</p>
            </div>
            <div className="report-tile">
              <span>Upset</span>
              <strong>{report.upset ? `+${report.upset.delta}` : tc('noUpsets')}</strong>
              <p>{report.upset ? tc('upsetText', { winner: report.upset.match.winner.name, loser: report.upset.loser.name }) : tc('upsetFallback')}</p>
            </div>
            <div className="report-tile">
              <span>Best Match</span>
              <strong>{report.bestMatch ? `${report.bestMatch.a.name} vs ${report.bestMatch.b.name}` : 'TBD'}</strong>
              <p>{report.bestMatch?.score || tc('bestMatchFallback')}</p>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

function PlayerRow({ player, winner, onPick }) {
  return (
    <button className={`player-row ${winner ? 'winner' : ''}`} onClick={onPick} disabled={!player}>
      <span className="player-name">{player?.name || 'TBD'}</span>
      <span className="player-meta">{player ? `${player.city} · ${player.rating}` : '-'}</span>
      {player?.pro && <span className="player-pro">PRO</span>}
    </button>
  )
}

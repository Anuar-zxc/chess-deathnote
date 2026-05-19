import { useTranslation } from 'react-i18next'
import { useGameStore } from '../store/useGameStore'
import { motion } from 'framer-motion'

const PIECES_PREVIEW = ['♔', '♕', '♖', '♗', '♘', '♙']
const CITY_LEADERS = [
  { name: 'Light', city: 'Алматы', rating: 1840, streak: '+7' },
  { name: 'Misa', city: 'Астана', rating: 1715, streak: '+4' },
  { name: 'L Lawliet', city: 'Алматы', rating: 1688, streak: '+3' },
]

const PRODUCT_SIGNALS = [
  { value: 'AI Coach', labelKey: 'home_signal_coach' },
  { value: 'Rooms', labelKey: 'home_signal_rooms' },
  { value: 'Pro', labelKey: 'home_signal_pro' },
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } }
}
const item = {
  hidden: { opacity: 0, y: 30 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120 } }
}

export default function HomeScreen() {
  const { t, i18n } = useTranslation()
  const { setScreen, setGameMode, stats, plan } = useGameStore()

  const menuItems = [
    {
      id: 'ai',
      icon: '🤖',
      label: t('home_play_ai'),
      desc: { ru: 'Сразись с искусственным интеллектом', en: 'Battle the AI engine', kk: 'ИИ-мен шайқас', zh: '与AI对战' },
      action: () => { setGameMode('ai'); setScreen('game') },
      tier: 'free',
      color: '#c084fc',
    },
    {
      id: 'friend',
      icon: '🤝',
      label: t('home_play_friend'),
      desc: { ru: 'Играй с другом на одном устройстве', en: 'Play locally with a friend', kk: 'Бір құрылғыда досыңмен ойна', zh: '与朋友本地对战' },
      action: () => { setGameMode('friend'); setScreen('game') },
      tier: 'free',
      color: '#4ade80',
    },
    {
      id: 'online',
      icon: '🌐',
      label: t('home_play_online'),
      desc: { ru: 'Онлайн-матч с игроком по всему миру', en: 'Match against global players', kk: 'Әлем бойынша онлайн матч', zh: '全球在线对战' },
      action: () => setScreen('online'),
      tier: 'pro',
      color: '#60a5fa',
    },
    {
      id: 'training',
      icon: '🎯',
      label: t('home_training'),
      desc: { ru: 'Решай задачи и прокачивай навыки', en: 'Puzzles, openings & endgames', kk: 'Тапсырмаларды шеш, дағдыларды арттыр', zh: '战术、开局和残局' },
      action: () => setScreen('training'),
      tier: 'free',
      color: '#f59e0b',
    },
    {
      id: 'tournament',
      icon: '🏆',
      label: 'Kira Cup',
      desc: { ru: 'Сетка на 32 игрока и сезонные призы', en: '32-player bracket and seasonal prizes', kk: '32 ойыншы турнирі', zh: '32人锦标赛' },
      action: () => setScreen('tournament'),
      tier: 'pro',
      color: '#fbbf24',
    },
  ]

  const lang = (i18n.language || 'ru').split('-')[0]

  return (
    <div className="home-screen">
      {/* Animated background pieces */}
      <div className="bg-pieces">
        {PIECES_PREVIEW.map((p, i) => (
          <motion.span
            key={i}
            className="bg-piece"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.05, scale: 1, y: [0, -20, 0] }}
            transition={{ delay: i * 0.2, duration: 4, repeat: Infinity, repeatType: 'mirror' }}
            style={{ left: `${10 + i * 15}%`, top: `${20 + (i % 3) * 25}%`, fontSize: `${60 + i * 10}px` }}
          >
            {p}
          </motion.span>
        ))}
      </div>

      <motion.div className="home-hero" variants={container} initial="hidden" animate="show">
        <motion.div variants={item} className="hero-kicker">{t('home_kicker')}</motion.div>
        <motion.div variants={item} className="hero-emblem">✒️</motion.div>
        <motion.h1 variants={item} className="hero-title">
          Death Note <span className="accent">Chess</span>
        </motion.h1>
        <motion.p variants={item} className="hero-subtitle">
          {t('home_hero_desc')}
        </motion.p>

        <motion.div variants={item} className="product-strip">
          {PRODUCT_SIGNALS.map((signal) => (
            <div className="product-pill" key={signal.value}>
              <span>{signal.value}</span>
              <small>{t(signal.labelKey)}</small>
            </div>
          ))}
        </motion.div>

        {/* Stats bar */}
        <motion.div variants={item} className="stats-bar">
          <div className="stat-item">
            <span className="stat-val">{stats.wins}</span>
            <span className="stat-lbl">{t('online_wins')}</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-val">{stats.losses}</span>
            <span className="stat-lbl">{t('online_losses')}</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-val">{stats.draws}</span>
            <span className="stat-lbl">{t('online_draws')}</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-val stat-rating">⭐ {stats.rating}</span>
            <span className="stat-lbl">{t('online_rating')}</span>
          </div>
        </motion.div>

        <motion.div variants={item} className="home-menu">
          {menuItems.map((m) => {
            const locked = m.tier === 'pro' && plan === 'free'
            return (
              <motion.div
                key={m.id}
                className={`home-card ${locked ? 'locked' : ''}`}
                style={{ '--card-color': m.color }}
                onClick={locked ? () => setScreen('subscription') : m.action}
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.97 }}
              >
                <div className="card-icon">{locked ? '🔒' : m.icon}</div>
                <div className="card-content">
                  <div className="card-title">{m.label}</div>
                  <div className="card-desc">{m.desc[lang] || m.desc.en}</div>
                </div>
                {locked && <div className="card-lock-badge">PRO</div>}
                <div className="card-arrow">→</div>
              </motion.div>
            )
          })}
        </motion.div>

        <motion.div variants={item} className="home-market-grid">
          <section className="market-panel">
            <div className="market-title">{t('home_city_league')}</div>
            <div className="leader-list">
              {CITY_LEADERS.map((player, i) => (
                <div className="leader-row" key={player.name}>
                  <span className="leader-rank">{i + 1}</span>
                  <div>
                    <strong>{player.name}</strong>
                    <small>{player.city}</small>
                  </div>
                  <span className="leader-rating">{player.rating}</span>
                  <span className="leader-streak">{player.streak}</span>
                </div>
              ))}
            </div>
          </section>
          <section className="market-panel pro-panel" onClick={() => setScreen('subscription')}>
            <div className="market-title">Upgrade to Pro</div>
            <p>{t('home_pro_desc')}</p>
            <button className="market-cta">{t('home_open_plans')}</button>
          </section>
        </motion.div>
      </motion.div>
    </div>
  )
}

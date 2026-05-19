import { useTranslation } from 'react-i18next'
import { useGameStore } from '../store/useGameStore'
import { motion } from 'framer-motion'

const LANGS = [
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'kk', label: 'Қазақша', flag: '🇰🇿' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
]

export default function Navbar() {
  const { t, i18n } = useTranslation()
  const { screen, setScreen, stats, plan, grokApiKey, setGrokApiKey } = useGameStore()

  const changeLang = (code) => {
    i18n.changeLanguage(code)
    localStorage.setItem('dn-lang', code)
  }

  const handleGrokKey = () => {
    const key = window.prompt(t('grok_key_prompt'), grokApiKey || "")
    if (key !== null) setGrokApiKey(key.trim())
  }

  const navItems = [
    { key: 'home',         label: t('nav_play'),      icon: '♟' },
    { key: 'training',     label: t('nav_train'),     icon: '🎯' },
    { key: 'online',       label: t('nav_online'),    icon: '🌐' },
    { key: 'tournament',   label: t('nav_tournament'), icon: '🏆' },
    { key: 'subscription', label: t('nav_subscribe'), icon: '👑' },
  ]

  return (
    <nav className="navbar">
      <div className="navbar-brand" onClick={() => setScreen('home')}>
        <span className="brand-icon">✒️</span>
        <span className="brand-text">Death Note</span>
        <span className="brand-tag">Chess</span>
      </div>

      <div className="navbar-items">
        {navItems.map((item) => (
          <motion.button
            key={item.key}
            className={`nav-btn ${screen === item.key ? 'active' : ''}`}
            onClick={() => setScreen(item.key)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </motion.button>
        ))}
      </div>

      <div className="navbar-right">
        <button className="lang-btn" onClick={handleGrokKey} title={t('grok_settings')} style={{opacity: grokApiKey ? 1 : 0.4}}>
          🤖
        </button>
        <div className="lang-selector">
          {LANGS.map((l) => (
            <button
              key={l.code}
              className={`lang-btn ${i18n.language === l.code ? 'active' : ''}`}
              onClick={() => changeLang(l.code)}
              title={l.label}
            >
              {l.flag}
            </button>
          ))}
        </div>
        <div className="rating-badge">
          <span className="rating-icon">⭐</span>
          <span>{stats.rating}</span>
        </div>
        {plan !== 'free' && (
          <div className="plan-badge" data-plan={plan}>
            {plan === 'pro' ? '🔥 PRO' : '💎 ELITE'}
          </div>
        )}
      </div>
    </nav>
  )
}

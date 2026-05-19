import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameStore } from '../store/useGameStore'
import { motion } from 'framer-motion'

const PLANS = [
  {
    id: 'free',
    color: '#6b7280',
    icon: '🆓',
    price: { month: 0, year: 0 },
    featKeys: ['sub_free_f1','sub_free_f2','sub_free_f3'],
  },
  {
    id: 'pro',
    color: '#c084fc',
    icon: '🔥',
    price: { month: 990, year: 7990 },
    featKeys: ['sub_pro_f1','sub_pro_f2','sub_pro_f3','sub_pro_f4','sub_pro_f5','sub_pro_f6'],
    popular: true,
  },
  {
    id: 'elite',
    color: '#fbbf24',
    icon: '💎',
    price: { month: 1990, year: 15990 },
    featKeys: ['sub_elite_f1','sub_elite_f2','sub_elite_f3','sub_elite_f4','sub_elite_f5','sub_elite_f6','sub_elite_f7'],
  },
]

const THEMES = [
  { id: 'deathnote', icon: '✒️', color: '#c084fc' },
  { id: 'neon',      icon: '💡', color: '#00ffc8' },
  { id: 'marble',    icon: '🏛️', color: '#e5e5e5' },
  { id: 'classic',   icon: '♟',  color: '#b58863' },
]

export default function SubscriptionScreen() {
  const { t } = useTranslation()
  const { plan, setPlan, theme, setTheme } = useGameStore()
  const [billing, setBilling] = useState('month')
  const [purchasing, setPurchasing] = useState(null)
  const [success, setSuccess]       = useState(false)

  function selectPlan(id) {
    if (id === plan) return
    setPurchasing(id)
    setTimeout(() => {
      setPlan(id)
      setPurchasing(null)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2500)
    }, 1200)
  }

  const fmt = (n) => n === 0 ? t('sub_free') : `${n.toLocaleString()} ₸`

  return (
    <div className="subscription-screen">
      {success && (
        <motion.div className="success-toast" initial={{opacity:0,y:-40}} animate={{opacity:1,y:0}} exit={{opacity:0}}>
          ✅ {t('sub_success')}
        </motion.div>
      )}

      <motion.div className="sub-hero" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
        <h2 className="screen-title">{t('sub_title')}</h2>
        <p className="screen-subtitle">{t('sub_subtitle')}</p>

        {/* Billing toggle */}
        <div className="billing-toggle">
          <button className={`bill-btn ${billing==='month'?'active':''}`} onClick={() => setBilling('month')}>
            {t('sub_month').replace('/','') || 'Месяц'}
          </button>
          <button className={`bill-btn ${billing==='year'?'active':''}`} onClick={() => setBilling('year')}>
            {t('sub_year_label')} <span className="save-badge">{t('sub_save')}</span>
          </button>
        </div>
      </motion.div>

      <div className="plans-grid">
        {PLANS.map((p, i) => {
          const isCurrent = plan === p.id
          const isLoading = purchasing === p.id
          const price     = p.price[billing]
          return (
            <motion.div
              key={p.id}
              className={`plan-card ${isCurrent ? 'current' : ''} ${p.popular ? 'popular' : ''}`}
              style={{ '--plan-color': p.color }}
              initial={{opacity:0,y:40}} animate={{opacity:1,y:0}} transition={{delay: i*0.12}}
              whileHover={{ scale: isCurrent ? 1 : 1.03, y: isCurrent ? 0 : -6 }}
            >
              {p.popular && <div className="popular-badge">⭐ {t('sub_popular')}</div>}
              <div className="plan-icon">{p.icon}</div>
              <div className="plan-name">{t(`sub_${p.id}`)}</div>
              <div className="plan-price">
                <span className="price-val">{fmt(price)}</span>
                {price > 0 && <span className="price-period">{t(`sub_${billing}`)}</span>}
              </div>
              <ul className="plan-features">
                {p.featKeys.map((k) => (
                  <li key={k}><span className="feat-check">✓</span> {t(k)}</li>
                ))}
              </ul>
              <button
                className={`plan-btn ${isCurrent ? 'current-btn' : 'upgrade-btn-sm'}`}
                onClick={() => selectPlan(p.id)}
                disabled={isCurrent || isLoading}
              >
                {isLoading ? <span className="btn-spinner">⏳</span>
                  : isCurrent ? t('sub_current')
                  : p.id === 'free' ? t('sub_switch_free')
                  : t('sub_upgrade')}
              </button>
            </motion.div>
          )
        })}
      </div>

      {/* Theme selector */}
      <motion.div className="theme-section" initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.4}}>
        <h3 className="theme-title">🎨 {t('sub_board_theme')}</h3>
        <div className="theme-grid">
          {THEMES.map((th) => {
            const locked = (th.id === 'neon' || th.id === 'marble') && plan === 'free'
            return (
              <motion.div
                key={th.id}
                className={`theme-card ${theme===th.id?'active':''} ${locked?'locked':''}`}
                style={{ '--th-color': th.color }}
                onClick={() => !locked && setTheme(th.id)}
                whileHover={{ scale: locked ? 1 : 1.06 }}
              >
                <span className="th-icon">{locked ? '🔒' : th.icon}</span>
                <span className="th-name">{t(`theme_${th.id}`)}</span>
                {locked && <span className="th-lock">PRO</span>}
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      <motion.div className="premium-vault" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.5}}>
        <h3 className="theme-title">Premium Content Vault</h3>
        <div className="vault-grid">
          {[
            ['Noir Pieces', t('vault_noir'), 'PRO'],
            ['Kira Cup', t('vault_kira'), 'PRO'],
            ['Coach Deep Scan', t('vault_coach'), 'PRO'],
            ['Elite Skin Vault', t('vault_elite'), 'ELITE'],
          ].map((item) => (
            <div className="vault-card" key={item[0]}>
              <span>{item[2]}</span>
              <strong>{item[0]}</strong>
              <p>{item[1]}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

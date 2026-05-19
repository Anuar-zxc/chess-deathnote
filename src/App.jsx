import './i18n'
import './index.css'
import { useEffect } from 'react'
import Navbar from './components/Navbar'
import HomeScreen from './components/HomeScreen'
import GameScreen from './components/GameScreen'
import TrainingScreen from './components/TrainingScreen'
import OnlineScreen from './components/OnlineScreen'
import SubscriptionScreen from './components/SubscriptionScreen'
import TournamentScreen from './components/TournamentScreen'
import { useGameStore } from './store/useGameStore'
import { AnimatePresence, motion } from 'framer-motion'

const SCREENS = {
  home:         HomeScreen,
  game:         GameScreen,
  training:     TrainingScreen,
  online:       OnlineScreen,
  tournament:   TournamentScreen,
  subscription: SubscriptionScreen,
}

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit:    { opacity: 0, y: -16, transition: { duration: 0.2 } },
}

export default function App() {
  const { screen, setScreen } = useGameStore()
  const Screen = SCREENS[screen] || HomeScreen

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('room') && screen !== 'online') {
      setScreen('online')
    }
  }, [screen, setScreen])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [screen])

  return (
    <div className="app-root">
      <Navbar />
      <main className="app-main">
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="screen-wrapper"
          >
            <Screen />
          </motion.div>
        </AnimatePresence>
      </main>
      <footer className="app-footer">
        <span>✒️ Death Note Chess</span>
        <span className="footer-sep">·</span>
        <span>2026</span>
      </footer>
    </div>
  )
}

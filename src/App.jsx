import { Suspense, lazy, useState } from 'react'
import { AnimatePresence, motion as Motion } from 'framer-motion'
import {
  AudioWaveform,
  Disc3,
  Home as HomeIcon,
  Library,
  Music4,
  Sparkles,
} from 'lucide-react'
import { AudioPlayer } from './components/AudioPlayer'
import { Home } from './components/Home'
import { PlayerBar } from './components/PlayerBar'
import { useTrackPalette } from './hooks/useTrackPalette'
import { usePlayerStore } from './store'
import { paletteToCssVars } from './utils/palette'
import './App.css'

const Playlist = lazy(() => import('./components/Playlist').then((module) => ({ default: module.Playlist })))
const NowPlaying = lazy(() => import('./components/NowPlaying').then((module) => ({ default: module.NowPlaying })))
const PlayerFull = lazy(() => import('./components/PlayerFull').then((module) => ({ default: module.PlayerFull })))

const NAV_ITEMS = [
  {
    id: 'home',
    label: 'Discover',
    caption: 'Search and import',
    icon: HomeIcon,
  },
  {
    id: 'library',
    label: 'Library',
    caption: 'Queue and favorites',
    icon: Library,
  },
  {
    id: 'player',
    label: 'Now playing',
    caption: 'Mood + lyrics',
    icon: AudioWaveform,
  },
]

function LoadingPanel() {
  return (
    <div className="lyrics-empty lyrics-empty--large">
      <Music4 size={22} />
      <p>Loading premium view…</p>
    </div>
  )
}

function renderPage(activePage, onExpand) {
  if (activePage === 'library') return <Playlist />
  if (activePage === 'player') return <NowPlaying onExpand={onExpand} />
  return <Home />
}

function App() {
  const [activePage, setActivePage] = useState('home')
  const [showFullPlayer, setShowFullPlayer] = useState(false)

  const currentTrack = usePlayerStore((state) => state.currentTrack)
  const tracks = usePlayerStore((state) => state.tracks)
  const isPlaying = usePlayerStore((state) => state.isPlaying)
  const moodPalette = usePlayerStore((state) => state.moodPalette)
  const favoritesCount = usePlayerStore((state) => Object.keys(state.favorites).length)

  useTrackPalette(currentTrack)

  const themeStyle = paletteToCssVars(moodPalette)
  const queuePreview = !tracks.length
    ? []
    : currentTrack
      ? [currentTrack, ...tracks.filter((track) => track.id !== currentTrack.id)].slice(0, 4)
      : tracks.slice(0, 4)

  return (
    <div className="app-shell" style={themeStyle}>
      <AudioPlayer />

      <div className="app-background" aria-hidden="true">
        {currentTrack?.thumbnail && (
          <div
            className="app-backdrop-art"
            style={{ backgroundImage: `url(${currentTrack.thumbnail})` }}
          />
        )}
        <div className="ambient-orb ambient-orb--main" />
        <div className="ambient-orb ambient-orb--accent" />
        <div className="ambient-orb ambient-orb--hot" />
      </div>

      <div className="app-frame">
        <aside className="sidebar-panel glass-panel">
          <div className="brand-block">
            <div className="brand-mark">
              <Disc3 size={22} />
            </div>

            <div>
              <p className="brand-kicker">Lane noir</p>
              <h1 className="brand-title">Luxury glass player</h1>
              <p className="brand-copy">Dark plum palette, adaptive mood and practical music flow.</p>
            </div>
          </div>

          <div className="sidebar-group">
            <p className="sidebar-title">Navigation</p>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = activePage === item.id

              return (
                <button
                  key={item.id}
                  type="button"
                  className={`nav-button ${isActive ? 'nav-button--active' : ''}`}
                  onClick={() => setActivePage(item.id)}
                >
                  <span className="nav-button__icon">
                    <Icon size={18} />
                  </span>

                  <span>
                    <span className="nav-button__label">{item.label}</span>
                    <span className="nav-button__caption">{item.caption}</span>
                  </span>
                </button>
              )
            })}
          </div>

          <div className="metric-grid">
            <div className="metric-card">
              <Sparkles size={18} />
              <p className="metric-card__value">{tracks.length}</p>
              <p className="meta-copy">tracks active in the current session</p>
            </div>

            <div className="metric-card">
              <Library size={18} />
              <p className="metric-card__value">{favoritesCount}</p>
              <p className="meta-copy">liked tracks saved locally in your library</p>
            </div>
          </div>
        </aside>

        <main className="content-panel glass-panel">
          <header className="topbar">
            <div>
              <p className="eyebrow">Adaptive mood engine</p>
              <h2 className="topbar-title">
                {currentTrack ? `Visuals tuned to ${currentTrack.title}` : 'Plum-toned premium music interface'}
              </h2>
              <p className="topbar-subtitle">
                Clean layouts, liquid-glass depth, synchronized lyrics and Spotify import without heavy UI noise.
              </p>
            </div>

            <div className="topbar-actions">
              <span className="surface-pill">
                <Sparkles size={14} />
                {isPlaying ? 'Playback live' : 'Ready to play'}
              </span>
              <span className="surface-pill">
                <Library size={14} />
                {tracks.length} queued
              </span>
            </div>
          </header>

          <div className="page-canvas">
            <AnimatePresence mode="wait">
              <Motion.div
                key={activePage}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              >
                <Suspense fallback={<LoadingPanel />}>
                  {renderPage(activePage, () => setShowFullPlayer(true))}
                </Suspense>
              </Motion.div>
            </AnimatePresence>
          </div>
        </main>

        <aside className="rail-panel glass-panel">
          <div className="rail-card">
            <p className="eyebrow">Current mood</p>
            <h3 className="section-title section-title--sm">
              {currentTrack ? currentTrack.title : 'Waiting for a track'}
            </h3>
            <p className="meta-copy">
              {currentTrack
                ? `${currentTrack.artist} is steering the current color grade, blur and highlights.`
                : 'Once a track starts playing, the shell shifts its gradients and glow around it.'}
            </p>
            <div className="palette-swatch-row">
              <span style={{ background: moodPalette.base }} />
              <span style={{ background: moodPalette.panel }} />
              <span style={{ background: moodPalette.accent }} />
              <span style={{ background: moodPalette.hot }} />
              <span style={{ background: moodPalette.neutral }} />
            </div>
          </div>

          <div className="rail-card">
            <div className="section-header">
              <div>
                <p className="eyebrow">Queue preview</p>
                <h3 className="section-title section-title--sm">Next in line</h3>
              </div>
            </div>

            {queuePreview.length ? (
              <div className="mini-track-list">
                {queuePreview.map((track) => (
                  <div key={track.id} className="mini-track">
                    {track.thumbnail ? (
                      <img className="mini-track__art" src={track.thumbnail} alt={track.title} />
                    ) : (
                      <div className="mini-track__art art-placeholder">
                        <Disc3 size={16} />
                      </div>
                    )}

                    <div className="mini-track__copy">
                      <p className="mini-track__title">{track.title}</p>
                      <p className="mini-track__artist">{track.artist}</p>
                    </div>

                    <span className="meta-pill">{currentTrack?.id === track.id ? 'Live' : 'Queued'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="lyrics-empty">
                <Sparkles size={18} />
                <p>Your right rail becomes a quick session overview after the first search.</p>
              </div>
            )}
          </div>
        </aside>
      </div>

      {currentTrack && <PlayerBar onExpand={() => setShowFullPlayer(true)} />}

      <nav className="mobile-nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = activePage === item.id

          return (
            <button
              key={item.id}
              type="button"
              className={`mobile-nav__button ${isActive ? 'mobile-nav__button--active' : ''}`}
              onClick={() => setActivePage(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      <AnimatePresence>
        {showFullPlayer && currentTrack && (
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Suspense fallback={<LoadingPanel />}>
              <PlayerFull onClose={() => setShowFullPlayer(false)} />
            </Suspense>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App

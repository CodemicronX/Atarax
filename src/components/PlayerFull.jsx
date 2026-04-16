import { Minimize2, Pause, Play, Shuffle, SkipBack, SkipForward } from 'lucide-react'
import { FavoriteButton } from './FavoriteButton'
import { LyricsPanel } from './LyricsPanel'
import { VolumeControl } from './VolumeControl'
import { usePlayerStore } from '../store'

function formatTime(seconds) {
  const total = Number(seconds)
  if (!total || Number.isNaN(total)) return '0:00'

  const minutes = Math.floor(total / 60)
  const remainder = Math.floor(total % 60)
  return `${minutes}:${String(remainder).padStart(2, '0')}`
}

export function PlayerFull({ onClose }) {
  const currentTrack = usePlayerStore((state) => state.currentTrack)
  const isPlaying = usePlayerStore((state) => state.isPlaying)
  const isShuffleEnabled = usePlayerStore((state) => state.isShuffleEnabled)
  const currentTime = usePlayerStore((state) => state.currentTime)
  const duration = usePlayerStore((state) => state.duration)
  const togglePlay = usePlayerStore((state) => state.togglePlay)
  const toggleShuffle = usePlayerStore((state) => state.toggleShuffle)
  const prevTrack = usePlayerStore((state) => state.prevTrack)
  const nextTrack = usePlayerStore((state) => state.nextTrack)
  const requestSeek = usePlayerStore((state) => state.requestSeek)

  if (!currentTrack) return null

  return (
    <div className="full-player-overlay">
      {currentTrack.thumbnail && (
        <div
          className="full-player-backdrop"
          style={{ backgroundImage: `url(${currentTrack.thumbnail})` }}
        />
      )}
      <div className="full-player-noise" />

      <div className="full-player-card">
        <button type="button" className="icon-button full-player-close" onClick={onClose}>
          <Minimize2 size={18} />
        </button>

        <div className="full-player-art-shell">
          <div className="full-player-art">
            {currentTrack.thumbnail ? (
              <img src={currentTrack.thumbnail} alt={currentTrack.title} />
            ) : (
              <div className="art-placeholder full-player-art__fallback">
                <Play size={46} />
              </div>
            )}
          </div>

          <div className="full-player-meta">
            <p className="eyebrow">Active track</p>
            <h1 className="full-player-title">{currentTrack.title}</h1>
            <p className="full-player-artist">{currentTrack.artist}</p>

            <div className="meta-row">
              <FavoriteButton track={currentTrack} />
              <span className="meta-pill">{currentTrack.isImported ? 'Spotify mapped' : 'Direct YouTube search'}</span>
            </div>
          </div>
        </div>

        <div className="full-player-main">
          <div className="full-player-controls">
            <div
              className="full-player-progress"
              onClick={(event) => {
                const rect = event.currentTarget.getBoundingClientRect()
                const percent = (event.clientX - rect.left) / rect.width
                const seekTime = Math.max(0, Math.min(duration || 0, percent * duration))
                requestSeek(seekTime)
              }}
            >
              <div
                className="full-player-progress__fill"
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>

            <div className="time-row">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>

            <div className="player-action-row">
              <button type="button" className="icon-button" onClick={prevTrack}>
                <SkipBack size={20} />
              </button>
              <button type="button" className="icon-button--primary" onClick={togglePlay}>
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>
              <button type="button" className="icon-button" onClick={nextTrack}>
                <SkipForward size={20} />
              </button>
              <button
                type="button"
                className={`icon-button ${isShuffleEnabled ? 'icon-button--toggled' : ''}`}
                onClick={toggleShuffle}
              >
                <Shuffle size={18} />
              </button>
            </div>

            <VolumeControl />

            <div className="full-player-stats">
              <div className="full-player-stat">
                <span>Status</span>
                <strong>{isPlaying ? 'Playing' : 'Paused'}</strong>
              </div>
              <div className="full-player-stat">
                <span>Length</span>
                <strong>{formatTime(duration)}</strong>
              </div>
              <div className="full-player-stat">
                <span>Queue mode</span>
                <strong>{isShuffleEnabled ? 'Shuffle' : 'Ordered'}</strong>
              </div>
            </div>
          </div>

          <LyricsPanel title="Synced lyrics" compact />
        </div>
      </div>
    </div>
  )
}

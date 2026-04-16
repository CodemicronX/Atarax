import { Maximize2, Pause, Play, Shuffle, SkipBack, SkipForward } from 'lucide-react'
import { FavoriteButton } from './FavoriteButton'
import { VolumeControl } from './VolumeControl'
import { usePlayerStore } from '../store'

function formatTime(seconds) {
  const total = Number(seconds)
  if (!total || Number.isNaN(total)) return '0:00'

  const minutes = Math.floor(total / 60)
  const remainder = Math.floor(total % 60)
  return `${minutes}:${String(remainder).padStart(2, '0')}`
}

export function PlayerBar({ onExpand }) {
  const currentTrack = usePlayerStore((state) => state.currentTrack)
  const isPlaying = usePlayerStore((state) => state.isPlaying)
  const isShuffleEnabled = usePlayerStore((state) => state.isShuffleEnabled)
  const currentTime = usePlayerStore((state) => state.currentTime)
  const duration = usePlayerStore((state) => state.duration)
  const togglePlay = usePlayerStore((state) => state.togglePlay)
  const prevTrack = usePlayerStore((state) => state.prevTrack)
  const nextTrack = usePlayerStore((state) => state.nextTrack)
  const toggleShuffle = usePlayerStore((state) => state.toggleShuffle)
  const requestSeek = usePlayerStore((state) => state.requestSeek)

  if (!currentTrack) return null

  const runWithoutBubble = (callback) => (event) => {
    event.stopPropagation()
    callback()
  }

  return (
    <div className="player-bar-shell" onClick={onExpand}>
      <div
        className="player-progress"
        onClick={(event) => {
          event.stopPropagation()
          const rect = event.currentTarget.getBoundingClientRect()
          const percent = (event.clientX - rect.left) / rect.width
          const seekTime = Math.max(0, Math.min(duration || 0, percent * duration))
          requestSeek(seekTime)
        }}
      >
        <div
          className="player-progress__fill"
          style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
        />
      </div>

      <div className="player-bar-main">
        <div className="player-bar-track">
          {currentTrack.thumbnail ? (
            <img className="track-row__art" src={currentTrack.thumbnail} alt={currentTrack.title} />
          ) : (
            <div className="track-row__art art-placeholder">
              <Play size={18} />
            </div>
          )}

          <div className="player-bar-meta">
            <h3>{currentTrack.title}</h3>
            <p>{currentTrack.artist}</p>
            <div className="meta-row">
              <span className="surface-pill">{isPlaying ? 'Playing' : 'Paused'}</span>
              {currentTrack.isImported && <span className="surface-pill">Spotify mapped</span>}
            </div>
          </div>
        </div>

        <div className="player-bar-controls">
          <button type="button" className="icon-button" onClick={runWithoutBubble(prevTrack)}>
            <SkipBack size={18} />
          </button>
          <button type="button" className="icon-button--primary" onClick={runWithoutBubble(togglePlay)}>
            {isPlaying ? <Pause size={22} /> : <Play size={22} />}
          </button>
          <button type="button" className="icon-button" onClick={runWithoutBubble(nextTrack)}>
            <SkipForward size={18} />
          </button>
          <button
            type="button"
            className={`icon-button ${isShuffleEnabled ? 'icon-button--toggled' : ''}`}
            onClick={runWithoutBubble(toggleShuffle)}
          >
            <Shuffle size={18} />
          </button>
        </div>

        <div className="player-bar-side">
          <div className="player-bar-time">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
          <VolumeControl compact />
        </div>

        <div className="player-bar-extras">
          <FavoriteButton track={currentTrack} compact />
          <button type="button" className="icon-button" onClick={runWithoutBubble(onExpand)}>
            <Maximize2 size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

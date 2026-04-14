import { motion as Motion } from 'framer-motion'
import { Pause, Play, Sparkles } from 'lucide-react'
import { FavoriteButton } from './FavoriteButton'
import { usePlayerStore } from '../store'

function formatTime(duration) {
  const total = Number(duration)
  if (!total || Number.isNaN(total)) return '--:--'

  const minutes = Math.floor(total / 60)
  const seconds = Math.floor(total % 60)
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function TrackItem({ track, index = 0 }) {
  const { currentTrack, isPlaying, setCurrentTrack, togglePlay, setHoverTrackId, hoverTrackId } = usePlayerStore()
  const isActive = currentTrack?.id === track.id
  const isHovered = hoverTrackId === track.id

  return (
    <Motion.button
      type="button"
      className={`track-row ${isActive ? 'track-row--active' : ''}`}
      onClick={() => {
        if (isActive) {
          togglePlay()
          return
        }

        setCurrentTrack(track, { autoplay: true })
      }}
      onMouseEnter={() => setHoverTrackId(track.id)}
      onMouseLeave={() => setHoverTrackId(null)}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.18 }}
    >
      <span className="track-row__index">
        {isActive ? (isPlaying ? <Pause size={16} /> : <Play size={16} />) : String(index + 1).padStart(2, '0')}
      </span>

      <div className="track-row__art-shell">
        {track.thumbnail ? (
          <img className="track-row__art" src={track.thumbnail} alt={track.title} />
        ) : (
          <div className="track-row__art art-placeholder">
            <Play size={18} />
          </div>
        )}

        <div className={`track-row__hover-preview ${isHovered || isActive ? 'track-row__hover-preview--visible' : ''}`}>
          <span />
          <span />
          <span />
        </div>
      </div>

      <span className="track-row__body">
        <span className="track-row__title">{track.title}</span>
        <span className="track-row__artist">{track.artist}</span>
      </span>

      <span className="track-row__badge">
        <Sparkles size={14} />
        {track.isImported ? 'Imported' : isActive ? 'Live' : 'Ready'}
      </span>

      <span className="track-row__actions">
        <FavoriteButton track={track} compact />
        <span className="track-row__time">{formatTime(track.duration)}</span>
      </span>
    </Motion.button>
  )
}

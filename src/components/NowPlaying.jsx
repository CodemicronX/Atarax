import { Maximize2, Pause, Play, Shuffle, SkipBack, SkipForward } from 'lucide-react'
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

export function NowPlaying({ onExpand }) {
  const currentTrack = usePlayerStore((state) => state.currentTrack)
  const tracks = usePlayerStore((state) => state.tracks)
  const isPlaying = usePlayerStore((state) => state.isPlaying)
  const isShuffleEnabled = usePlayerStore((state) => state.isShuffleEnabled)
  const currentTime = usePlayerStore((state) => state.currentTime)
  const duration = usePlayerStore((state) => state.duration)
  const togglePlay = usePlayerStore((state) => state.togglePlay)
  const toggleShuffle = usePlayerStore((state) => state.toggleShuffle)
  const prevTrack = usePlayerStore((state) => state.prevTrack)
  const nextTrack = usePlayerStore((state) => state.nextTrack)
  const requestSeek = usePlayerStore((state) => state.requestSeek)
  const setCurrentTrack = usePlayerStore((state) => state.setCurrentTrack)

  if (!currentTrack) {
    return (
      <section className="page-stack">
        <div className="lyrics-empty lyrics-empty--large">
          <Play size={24} />
          <p>Nothing is playing yet. Search or import a playlist to open the detailed player view.</p>
        </div>
      </section>
    )
  }

  const queue = tracks.filter((track) => track.id !== currentTrack.id).slice(0, 8)

  return (
    <section className="page-stack">
      <div className="player-hero">
        <div className="player-hero__art">
          {currentTrack.thumbnail ? (
            <img src={currentTrack.thumbnail} alt={currentTrack.title} />
          ) : (
            <div className="art-placeholder player-hero__fallback">
              <Play size={36} />
            </div>
          )}
        </div>

        <div className="player-hero__body">
          <p className="eyebrow">Now playing</p>
          <h1 className="hero-title">{currentTrack.title}</h1>
          <p className="hero-copy">{currentTrack.artist}</p>

          <div className="meta-row">
            <span className="meta-pill">{formatTime(duration)} total</span>
            <span className="meta-pill">{isShuffleEnabled ? 'Shuffle on' : 'Queue order'}</span>
          </div>

          <div
            className="player-progress player-progress--hero"
            onClick={(event) => {
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

          <div className="time-row">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>

          <div className="player-action-row">
            <button type="button" className="icon-button" onClick={prevTrack}>
              <SkipBack size={18} />
            </button>
            <button type="button" className="icon-button--primary" onClick={togglePlay}>
              {isPlaying ? <Pause size={22} /> : <Play size={22} />}
            </button>
            <button type="button" className="icon-button" onClick={nextTrack}>
              <SkipForward size={18} />
            </button>
            <button
              type="button"
              className={`icon-button ${isShuffleEnabled ? 'icon-button--toggled' : ''}`}
              onClick={toggleShuffle}
            >
              <Shuffle size={18} />
            </button>
            <FavoriteButton track={currentTrack} />
            <button type="button" className="secondary-button" onClick={onExpand}>
              <Maximize2 size={16} />
              Fullscreen view
            </button>
          </div>

          <VolumeControl />
        </div>
      </div>

      <div className="player-layout">
        <LyricsPanel title="Karaoke sync" />

        <div className="queue-card">
          <div className="section-header">
            <div>
              <p className="eyebrow">Up next</p>
              <h2 className="section-title section-title--sm">Smart queue</h2>
            </div>
            <span className="meta-pill">{queue.length} tracks</span>
          </div>

          {queue.length ? (
            <div className="queue-list">
              {queue.map((track) => (
                <button
                  key={track.id}
                  type="button"
                  className="queue-item"
                  onClick={() => setCurrentTrack(track, { autoplay: true })}
                >
                  {track.thumbnail ? (
                    <img className="queue-item__art" src={track.thumbnail} alt={track.title} />
                  ) : (
                    <div className="queue-item__art art-placeholder">
                      <Play size={16} />
                    </div>
                  )}

                  <span className="queue-item__copy">
                    <span className="queue-item__title">{track.title}</span>
                    <span className="queue-item__artist">{track.artist}</span>
                  </span>

                  <span className="meta-pill">{formatTime(track.duration)}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="lyrics-empty">
              <Play size={20} />
              <p>The current track is the only item in your session right now.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

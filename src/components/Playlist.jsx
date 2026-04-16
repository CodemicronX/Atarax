import { useMemo } from 'react'
import { Heart, Library, Shuffle, Waves } from 'lucide-react'
import { SpotifyImportPanel } from './SpotifyImportPanel'
import { TrackItem } from './TrackItem'
import { usePlayerStore } from '../store'

export function Playlist() {
  const tracks = usePlayerStore((state) => state.tracks)
  const favoritesMap = usePlayerStore((state) => state.favorites)
  const favorites = useMemo(() => Object.values(favoritesMap), [favoritesMap])
  const isShuffleEnabled = usePlayerStore((state) => state.isShuffleEnabled)
  const toggleShuffle = usePlayerStore((state) => state.toggleShuffle)

  return (
    <section className="page-stack">
      <div className="hero-card">
        <div className="hero-layout">
          <div>
            <p className="eyebrow">Library & queue</p>
            <h1 className="hero-title">Minimal library layout with practical controls and premium spacing.</h1>
            <p className="hero-copy">
              Favorites, current queue and session context stay visible without turning the screen into a dashboard.
            </p>
          </div>

          <div className="hero-highlight">
            <div>
              <p className="hero-highlight__label">Queue mode</p>
              <p className="hero-highlight__value">{isShuffleEnabled ? 'Shuffle' : 'Ordered'}</p>
              <p className="meta-copy">switch instantly without disturbing the current premium layout</p>
            </div>

            <button type="button" className="secondary-button" onClick={toggleShuffle}>
              <Shuffle size={16} />
              {isShuffleEnabled ? 'Disable shuffle' : 'Enable shuffle'}
            </button>
          </div>
        </div>
      </div>

      <div className="content-grid content-grid--library">
        <div className="section-card">
          <div className="section-header">
            <div>
              <p className="eyebrow">Current queue</p>
              <h2 className="section-title section-title--sm">Tracks in this session</h2>
            </div>
            <span className="meta-pill">
              <Library size={14} />
              {tracks.length}
            </span>
          </div>

          {tracks.length ? (
            <div className="track-list">
              {tracks.map((track, index) => (
                <TrackItem key={track.id} track={track} index={index} />
              ))}
            </div>
          ) : (
            <div className="lyrics-empty">
              <Waves size={20} />
              <p>Search or import a playlist to build the library.</p>
            </div>
          )}
        </div>

        <div className="page-stack">
          <SpotifyImportPanel />

          <div className="section-card">
            <div className="section-header">
              <div>
                <p className="eyebrow">Favorites</p>
                <h2 className="section-title section-title--sm">Saved highlights</h2>
              </div>
              <span className="meta-pill">
                <Heart size={14} />
                {favorites.length}
              </span>
            </div>

            {favorites.length ? (
              <div className="track-list">
                {favorites.map((track, index) => (
                  <TrackItem key={track.id} track={track} index={index} />
                ))}
              </div>
            ) : (
              <div className="lyrics-empty">
                <Heart size={20} />
                <p>Tap the heart on any track to keep it in your premium shelf.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

import { useState } from 'react'
import { motion as Motion } from 'framer-motion'
import { Disc3, Play, Search, Sparkles } from 'lucide-react'
import { TrackItem } from './TrackItem'
import { SpotifyImportPanel } from './SpotifyImportPanel'
import { usePlayerStore } from '../store'

const API_BASE = 'http://localhost:3001/api'
const QUICK_SEARCHES = ['Dark trap', 'Night drive', 'Luxury RnB', 'Ambient focus', 'Deep house']

export function Home() {
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const tracks = usePlayerStore((state) => state.tracks)
  const currentTrack = usePlayerStore((state) => state.currentTrack)
  const setTracks = usePlayerStore((state) => state.setTracks)
  const setCurrentTrack = usePlayerStore((state) => state.setCurrentTrack)
  const setSearchQuery = usePlayerStore((state) => state.setSearchQuery)

  const runSearch = async (value) => {
    const nextQuery = value.trim()
    if (!nextQuery) return

    setSearchQuery(nextQuery)
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(nextQuery)}`)
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Search failed')
      }

      setTracks(payload, {
        preserveCurrent: false,
      })
    } catch (searchError) {
      console.error('Search error:', searchError)
      setError(searchError.message || 'Search failed')
      setTracks([], { preserveCurrent: false })
    } finally {
      setIsLoading(false)
    }
  }

  const topTrack = tracks[0]

  return (
    <section className="page-stack">
      <div className="hero-card hero-card--discover">
        <div className="hero-layout">
          <div>
            <p className="eyebrow">Mood search</p>
            <h1 className="hero-title">Premium dark player UI tuned to the energy of the current track.</h1>
            <p className="hero-copy">
              The interface stays minimal and soft, but reacts with dynamic plum gradients, glass layers and
              micro-interactions that feel intentional instead of noisy.
            </p>

            <form
              className="search-form"
              onSubmit={(event) => {
                event.preventDefault()
                runSearch(query)
              }}
            >
              <div className="field-shell">
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search a track, artist or mood"
                />
                <Search className="field-icon" size={18} />
              </div>

              <button type="submit" className="primary-button" disabled={isLoading}>
                {isLoading ? 'Searching…' : 'Search'}
              </button>
            </form>

            <div className="chip-row">
              {QUICK_SEARCHES.map((value) => (
                <button
                  key={value}
                  type="button"
                  className="chip-button"
                  onClick={() => {
                    setQuery(value)
                    runSearch(value)
                  }}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <Motion.div className="hero-highlight" animate={{ y: [0, -6, 0] }} transition={{ duration: 6, repeat: Infinity }}>
            <div>
              <p className="hero-highlight__label">Session energy</p>
              <p className="hero-highlight__value">{tracks.length}</p>
              <p className="meta-copy">tracks currently loaded into the active queue</p>
            </div>

            {topTrack ? (
              <button
                type="button"
                className="spotlight-track"
                onClick={() => setCurrentTrack(topTrack, { autoplay: true })}
              >
                {topTrack.thumbnail ? (
                  <img className="spotlight-track__art" src={topTrack.thumbnail} alt={topTrack.title} />
                ) : (
                  <div className="spotlight-track__art art-placeholder">
                    <Disc3 size={20} />
                  </div>
                )}

                <div className="spotlight-track__copy">
                  <p className="spotlight-track__title">{topTrack.title}</p>
                  <p className="spotlight-track__artist">{topTrack.artist}</p>
                </div>

                <span className="meta-pill">
                  <Play size={14} />
                  Play now
                </span>
              </button>
            ) : (
              <div className="lyrics-empty">
                <Sparkles size={20} />
                <p>Search or import a playlist to light up the player.</p>
              </div>
            )}
          </Motion.div>
        </div>
      </div>

      <div className="content-grid">
        <SpotifyImportPanel />

        <div className="info-card">
          <div className="section-header">
            <div>
              <p className="eyebrow">Current focus</p>
              <h2 className="section-title section-title--sm">
                {currentTrack ? currentTrack.title : 'No track selected yet'}
              </h2>
            </div>
          </div>
          <p className="meta-copy">
            {currentTrack
              ? `${currentTrack.artist} is driving the palette, blur and lighting right now.`
              : 'When you start playback, the interface adapts to the active song art and metadata.'}
          </p>
        </div>
      </div>

      {error && (
        <div className="info-card info-card--error">
          <p className="eyebrow">Search backend</p>
          <p className="meta-copy">{error}</p>
        </div>
      )}

      {tracks.length > 0 ? (
        <div className="results-layout">
          <button
            type="button"
            className="top-result-card"
            onClick={() => setCurrentTrack(topTrack, { autoplay: true })}
          >
            {topTrack.thumbnail && (
              <div
                className="top-result-card__bg"
                style={{ backgroundImage: `url(${topTrack.thumbnail})` }}
              />
            )}

            <div className="top-result-card__content">
              {topTrack.thumbnail ? (
                <img className="top-result-card__media" src={topTrack.thumbnail} alt={topTrack.title} />
              ) : (
                <div className="top-result-card__media art-placeholder">
                  <Disc3 size={42} />
                </div>
              )}

              <p className="eyebrow">Best match</p>
              <h3>{topTrack.title}</h3>
              <p className="meta-copy">{topTrack.artist}</p>
              <div className="meta-row">
                <span className="meta-pill">{topTrack.isImported ? 'Imported mapping' : 'Direct search hit'}</span>
                <span className="meta-pill">{tracks.length} results</span>
              </div>
            </div>
          </button>

          <div className="section-card">
            <div className="section-header">
              <div>
                <p className="eyebrow">Result list</p>
                <h2 className="section-title section-title--sm">Clean queue-ready results</h2>
              </div>
              <span className="meta-pill">{tracks.length} tracks</span>
            </div>

            <div className="track-list">
              {tracks.slice(0, 12).map((track, index) => (
                <TrackItem key={track.id} track={track} index={index} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="summary-grid">
          <div className="summary-tile">
            <Search size={18} />
            <strong>Track search</strong>
            <p className="meta-copy">YouTube-backed search keeps results fast and flexible.</p>
          </div>

          <div className="summary-tile">
            <Sparkles size={18} />
            <strong>Mood UI</strong>
            <p className="meta-copy">Colors and lighting adapt to the active cover art or a seeded fallback palette.</p>
          </div>

          <div className="summary-tile">
            <Play size={18} />
            <strong>Smooth playback</strong>
            <p className="meta-copy">Volume, shuffle, lyrics sync and premium motion stay lightweight and responsive.</p>
          </div>
        </div>
      )}
    </section>
  )
}

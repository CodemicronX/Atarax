import { useState } from 'react'
import { Disc3, Play, Search, Sparkles } from 'lucide-react'
import { TrackItem } from './TrackItem'
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
        <div className="hero-layout hero-layout--single">
          <div>
            <p className="eyebrow">Mood search</p>
            <h1 className="hero-title">Search first, then move into dedicated playback and library views.</h1>
            <p className="hero-copy">
              The home screen stays intentionally focused on discovery so the app feels fast. Queue control, import and
              detailed playback now belong to separate sections instead of competing on one page.
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
                {isLoading ? 'Searching...' : 'Search'}
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
                {currentTrack && (
                  <span className="meta-pill">
                    <Play size={14} />
                    Live: {currentTrack.title}
                  </span>
                )}
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
            <strong>Separated pages</strong>
            <p className="meta-copy">Search stays here, while import, queue and detailed playback live elsewhere.</p>
          </div>

          <div className="summary-tile">
            <Play size={18} />
            <strong>Lean playback</strong>
            <p className="meta-copy">Lighter effects and simpler layout leave more headroom for actual music playback.</p>
          </div>
        </div>
      )}
    </section>
  )
}

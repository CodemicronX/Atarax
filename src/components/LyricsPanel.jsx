import { useEffect, useMemo, useRef } from 'react'
import { motion as Motion } from 'framer-motion'
import { Music4 } from 'lucide-react'
import { usePlayerStore } from '../store'
import { findActiveLyricIndex } from '../utils/lyrics'

export function LyricsPanel({ title = 'Lyrics', compact = false }) {
  const lyrics = usePlayerStore((state) => state.lyrics)
  const plainLyrics = usePlayerStore((state) => state.plainLyrics)
  const lyricsStatus = usePlayerStore((state) => state.lyricsStatus)
  const lyricsSource = usePlayerStore((state) => state.lyricsSource)
  const currentTime = usePlayerStore((state) => state.currentTime)

  const activeIndex = useMemo(() => findActiveLyricIndex(lyrics, currentTime), [lyrics, currentTime])
  const activeLineRef = useRef(null)

  useEffect(() => {
    if (!activeLineRef.current || activeIndex < 0) return

    activeLineRef.current.scrollIntoView({
      block: 'center',
      behavior: 'smooth',
    })
  }, [activeIndex])

  return (
    <div className={`lyrics-card ${compact ? 'lyrics-card--compact' : ''}`}>
      <div className="section-header">
        <div>
          <p className="eyebrow">Sing along</p>
          <h2 className="section-title section-title--sm">{title}</h2>
        </div>
        <span className="meta-pill">{lyricsSource || 'lyrics fallback'}</span>
      </div>

      {lyricsStatus === 'loading' && (
        <div className="lyrics-empty">
          <Music4 size={20} />
          <p>Loading lyrics…</p>
        </div>
      )}

      {lyrics.length > 0 && (
        <div className="lyrics-scroll">
          {lyrics.map((line, index) => {
            const isActive = index === activeIndex

            return (
              <Motion.p
                key={line.id}
                ref={isActive ? activeLineRef : null}
                className={`lyrics-line ${isActive ? 'lyrics-line--active' : ''}`}
                animate={{
                  opacity: isActive ? 1 : 0.46,
                  x: isActive ? 0 : 8,
                  scale: isActive ? 1 : 0.985,
                }}
                transition={{ duration: 0.18 }}
              >
                {line.text || '…'}
              </Motion.p>
            )
          })}
        </div>
      )}

      {!lyrics.length && plainLyrics && (
        <pre className="lyrics-plain">{plainLyrics}</pre>
      )}

      {!lyrics.length && !plainLyrics && lyricsStatus !== 'loading' && (
        <div className="lyrics-empty">
          <Music4 size={20} />
          <p>Timed lyrics are not available for this track yet.</p>
        </div>
      )}
    </div>
  )
}

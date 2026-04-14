import { Suspense, lazy, useEffect, useRef } from 'react'
import { usePlayerStore } from '../store'
import { parseLyricsLines } from '../utils/lyrics'

const API_BASE = 'http://localhost:3001/api'
const ReactPlayer = lazy(() => import('react-player'))

export function AudioPlayer() {
  const playerRef = useRef(null)
  const lyricsCacheRef = useRef(new Map())

  const {
    currentTrack,
    isPlaying,
    volume,
    currentTime,
    setIsPlaying,
    setCurrentTime,
    setDuration,
    nextTrack,
    setLyrics,
    setLyricsStatus,
  } = usePlayerStore()

  useEffect(() => {
    if (!currentTrack) {
      setDuration(0)
      return undefined
    }

    let cancelled = false

    const loadLyrics = async () => {
      try {
        const cachedLyrics = lyricsCacheRef.current.get(currentTrack.id)
        let lyricsPayload = cachedLyrics

        if (!lyricsPayload) {
          const response = await fetch(
            `${API_BASE}/lyrics?videoId=${encodeURIComponent(currentTrack.id)}&title=${encodeURIComponent(currentTrack.title)}&artist=${encodeURIComponent(currentTrack.artist)}&duration=${encodeURIComponent(currentTrack.duration || 0)}`,
          )
          const payload = await response.json()

          if (!response.ok) {
            throw new Error(payload.error || 'Lyrics request failed')
          }

          lyricsPayload = payload
          lyricsCacheRef.current.set(currentTrack.id, lyricsPayload)
        }

        if (cancelled || !lyricsPayload) return

        setLyrics({
          lines: lyricsPayload.lines?.length ? lyricsPayload.lines : parseLyricsLines(lyricsPayload.syncedLyrics || ''),
          plainLyrics: lyricsPayload.plainLyrics || '',
          source: lyricsPayload.source || null,
          status:
            lyricsPayload.lines?.length || lyricsPayload.syncedLyrics || lyricsPayload.plainLyrics
              ? 'ready'
              : 'empty',
        })
      } catch (error) {
        console.error('Error loading lyrics:', error)
        if (!cancelled) {
          setLyrics({
            lines: [],
            plainLyrics: '',
            source: null,
            status: 'error',
          })
        }
      }
    }

    setLyricsStatus('loading')
    loadLyrics()

    return () => {
      cancelled = true
    }
  }, [currentTrack, setDuration, setLyrics, setLyricsStatus])

  useEffect(() => {
    const player = playerRef.current
    if (!player || !currentTrack) return

    const actualTime = player.getCurrentTime?.() || 0
    if (Math.abs(actualTime - currentTime) > 1) {
      player.seekTo(currentTime, 'seconds')
    }
  }, [currentTime, currentTrack])

  if (!currentTrack) return null

  return (
    <div className="media-engine" aria-hidden="true">
      <Suspense fallback={null}>
        <ReactPlayer
          ref={playerRef}
          url={`https://www.youtube.com/watch?v=${currentTrack.id}`}
          width={1}
          height={1}
          playing={isPlaying}
          volume={volume}
          progressInterval={200}
          playsinline
          config={{
            youtube: {
              playerVars: {
                autoplay: 1,
                controls: 0,
                fs: 0,
                modestbranding: 1,
                playsinline: 1,
                rel: 0,
              },
            },
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onProgress={({ playedSeconds }) => {
            setCurrentTime(playedSeconds)
          }}
          onDuration={(duration) => {
            setDuration(duration)
          }}
          onEnded={nextTrack}
          onError={(error) => {
            console.error('Playback error:', error)
            setIsPlaying(false)
          }}
        />
      </Suspense>
    </div>
  )
}

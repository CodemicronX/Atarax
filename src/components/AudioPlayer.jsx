import { useEffect, useRef } from 'react'
import { usePlayerStore } from '../store'
import { parseLyricsLines } from '../utils/lyrics'

const API_BASE = 'http://localhost:3001/api'

export function AudioPlayer() {
  const audioRef = useRef(null)
  const streamCacheRef = useRef(new Map())
  const lyricsCacheRef = useRef(new Map())
  const frameRef = useRef(0)

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
    const audio = audioRef.current
    if (!audio) return

    audio.volume = volume
  }, [volume])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack) return undefined

    let cancelled = false

    const loadResources = async () => {
      try {
        const cachedStream = streamCacheRef.current.get(currentTrack.id)
        const streamPayload = cachedStream
          || await fetch(`${API_BASE}/stream/${currentTrack.id}`).then((response) => response.json())

        if (!cachedStream) {
          streamCacheRef.current.set(currentTrack.id, streamPayload)
        }

        if (cancelled) return

        audio.src = streamPayload.url
        audio.load()
        setIsPlaying(true)
      } catch (error) {
        console.error('Error loading stream:', error)
        setIsPlaying(false)
      }

      try {
        const cachedLyrics = lyricsCacheRef.current.get(currentTrack.id)
        const lyricsPayload = cachedLyrics
          || await fetch(
            `${API_BASE}/lyrics?videoId=${encodeURIComponent(currentTrack.id)}&title=${encodeURIComponent(currentTrack.title)}&artist=${encodeURIComponent(currentTrack.artist)}&duration=${encodeURIComponent(currentTrack.duration || 0)}`,
          ).then((response) => response.json())

        if (!cachedLyrics) {
          lyricsCacheRef.current.set(currentTrack.id, lyricsPayload)
        }

        if (cancelled) return

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
    loadResources()

    return () => {
      cancelled = true
    }
  }, [currentTrack, setIsPlaying, setLyrics, setLyricsStatus])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return undefined

    const tick = () => {
      if (!audio.paused) {
        setCurrentTime(audio.currentTime)
        frameRef.current = requestAnimationFrame(tick)
      }
    }

    if (isPlaying) {
      audio.play().catch((error) => {
        console.error('Play error:', error)
        setIsPlaying(false)
      })
      frameRef.current = requestAnimationFrame(tick)
    } else {
      audio.pause()
      cancelAnimationFrame(frameRef.current)
    }

    return () => {
      cancelAnimationFrame(frameRef.current)
    }
  }, [isPlaying, setCurrentTime, setIsPlaying])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !audio.duration || Number.isNaN(audio.duration)) return

    if (Math.abs(audio.currentTime - currentTime) > 0.35) {
      audio.currentTime = currentTime
    }
  }, [currentTime])

  return (
    <audio
      ref={audioRef}
      crossOrigin="anonymous"
      preload="metadata"
      onTimeUpdate={(event) => {
        setCurrentTime(event.currentTarget.currentTime)
      }}
      onLoadedMetadata={(event) => {
        setDuration(event.currentTarget.duration)
      }}
      onEnded={nextTrack}
      onError={(event) => {
        console.error('Audio error:', event.currentTarget.error)
        setIsPlaying(false)
      }}
    />
  )
}

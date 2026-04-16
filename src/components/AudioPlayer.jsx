import { useEffect, useRef } from 'react'
import { usePlayerStore } from '../store'

const API_BASE = 'http://localhost:3001/api'

export function AudioPlayer() {
  const audioRef = useRef(null)

  const currentTrack = usePlayerStore((state) => state.currentTrack)
  const isPlaying = usePlayerStore((state) => state.isPlaying)
  const volume = usePlayerStore((state) => state.volume)
  const pendingSeekTime = usePlayerStore((state) => state.pendingSeekTime)
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying)
  const setCurrentTime = usePlayerStore((state) => state.setCurrentTime)
  const clearPendingSeek = usePlayerStore((state) => state.clearPendingSeek)
  const setDuration = usePlayerStore((state) => state.setDuration)
  const nextTrack = usePlayerStore((state) => state.nextTrack)

  // Меняем трек
  useEffect(() => {
    if (!currentTrack || !audioRef.current) return
    audioRef.current.src = `${API_BASE}/audio/${currentTrack.id}`
    audioRef.current.load()
    if (isPlaying) audioRef.current.play().catch(console.error)
  }, [currentTrack])

  // Play / Pause
  useEffect(() => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.play().catch(console.error)
    } else {
      audioRef.current.pause()
    }
  }, [isPlaying])

  // Громкость
  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.volume = volume
  }, [volume])

  // Seek
  useEffect(() => {
    if (!audioRef.current || pendingSeekTime === null) return
    audioRef.current.currentTime = pendingSeekTime
    clearPendingSeek()
  }, [pendingSeekTime])

  if (!currentTrack) return null

  return (
    <audio
      ref={audioRef}
      onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
      onDurationChange={() => setDuration(audioRef.current?.duration || 0)}
      onEnded={nextTrack}
      onPlay={() => setIsPlaying(true)}
      onPause={() => setIsPlaying(false)}
      onError={(e) => {
        console.error('Audio error:', e)
        setIsPlaying(false)
      }}
    />
  )
}

import { useEffect, useMemo } from 'react'
import { usePlayerStore } from '../store'
import { createFallbackPalette } from '../utils/palette'

export function useTrackPalette(track) {
  const setMoodPalette = usePlayerStore((state) => state.setMoodPalette)
  const trackId = track?.id
  const trackTitle = track?.title
  const trackArtist = track?.artist

  const fallback = useMemo(
    () => createFallbackPalette(trackId || trackTitle || trackArtist || 'lane-player'),
    [trackId, trackTitle, trackArtist],
  )

  useEffect(() => {
    setMoodPalette(fallback)
  }, [setMoodPalette, fallback])
}

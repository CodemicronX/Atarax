import { startTransition, useEffect } from 'react'
import { usePlayerStore } from '../store'
import { createFallbackPalette } from '../utils/palette'

export function useTrackPalette(track) {
  const setMoodPalette = usePlayerStore((state) => state.setMoodPalette)
  const trackId = track?.id
  const trackTitle = track?.title
  const trackArtist = track?.artist

  useEffect(() => {
    const fallback = createFallbackPalette(trackId || trackTitle || trackArtist || 'lane-player')

    if (!trackId && !trackTitle) {
      setMoodPalette(fallback)
      return undefined
    }

    startTransition(() => setMoodPalette(fallback))

    return undefined
  }, [setMoodPalette, trackArtist, trackId, trackTitle])
}

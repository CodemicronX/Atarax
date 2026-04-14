import { startTransition, useEffect } from 'react'
import { getPalette } from 'colorthief'
import { usePlayerStore } from '../store'
import { createFallbackPalette, createPaletteFromSwatches } from '../utils/palette'

export function useTrackPalette(track) {
  const setMoodPalette = usePlayerStore((state) => state.setMoodPalette)
  const trackId = track?.id
  const trackTitle = track?.title
  const trackThumbnail = track?.thumbnail

  useEffect(() => {
    const fallback = createFallbackPalette(trackId || trackTitle || 'lane-player')

    if (!trackId && !trackTitle) {
      setMoodPalette(fallback)
      return undefined
    }

    if (!trackThumbnail) {
      setMoodPalette(fallback)
      return undefined
    }

    let cancelled = false
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.referrerPolicy = 'no-referrer'

    image.onload = () => {
      if (cancelled) return

      try {
        const swatches = getPalette(image, 5)
        const nextPalette = createPaletteFromSwatches(swatches, {
          id: trackId,
          title: trackTitle,
        })
        startTransition(() => setMoodPalette(nextPalette))
      } catch {
        setMoodPalette(fallback)
      }
    }

    image.onerror = () => {
      if (!cancelled) {
        setMoodPalette(fallback)
      }
    }

    image.src = trackThumbnail

    return () => {
      cancelled = true
    }
  }, [setMoodPalette, trackId, trackThumbnail, trackTitle])
}

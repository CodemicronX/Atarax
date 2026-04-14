import { create } from 'zustand'

const FAVORITES_KEY = 'lane-player-favorites'
const VOLUME_KEY = 'lane-player-volume'
const SHUFFLE_KEY = 'lane-player-shuffle'

function readStorage(key, fallback) {
  if (typeof window === 'undefined') return fallback

  try {
    const value = window.localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function writeStorage(key, value) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore storage quota and private mode failures.
  }
}

const DEFAULT_PALETTE = {
  base: '#06000A',
  panel: '#0E0314',
  panelStrong: '#190924',
  accent: '#3E1444',
  accentSoft: '#260C35',
  hot: '#8B0000',
  neutral: '#D3D3D3',
  glow: 'rgba(124, 42, 165, 0.42)',
}

const initialFavorites = readStorage(FAVORITES_KEY, {})
const initialVolume = readStorage(VOLUME_KEY, 0.72)
const initialShuffle = readStorage(SHUFFLE_KEY, false)

function clampVolume(value) {
  return Math.max(0, Math.min(1, Number(value) || 0))
}

function findTrackIndex(tracks, trackId) {
  return tracks.findIndex((track) => track.id === trackId)
}

export const usePlayerStore = create((set, get) => ({
  tracks: [],
  currentTrack: null,
  currentTrackIndex: -1,
  isPlaying: false,
  isShuffleEnabled: initialShuffle,
  currentTime: 0,
  duration: 0,
  volume: clampVolume(initialVolume),
  searchQuery: '',
  favorites: initialFavorites,
  hoverTrackId: null,
  lyrics: [],
  plainLyrics: '',
  lyricsSource: null,
  lyricsStatus: 'idle',
  moodPalette: DEFAULT_PALETTE,
  importMeta: null,
  history: [],

  setSearchQuery: (query) => set({ searchQuery: query }),

  setTracks: (tracks, options = {}) => {
    const nextTracks = Array.isArray(tracks) ? tracks : []
    const { currentTrack } = get()
    const shouldAutoplay = options.autoplay ?? false
    const preserveCurrent = options.preserveCurrent ?? true

    if (!nextTracks.length) {
      return set({
        tracks: [],
        currentTrack: null,
        currentTrackIndex: -1,
        isPlaying: false,
        currentTime: 0,
        duration: 0,
      })
    }

    if (currentTrack && preserveCurrent) {
      const currentIndex = findTrackIndex(nextTracks, currentTrack.id)
      if (currentIndex >= 0) {
        return set({
          tracks: nextTracks,
          currentTrack: nextTracks[currentIndex],
          currentTrackIndex: currentIndex,
        })
      }
    }

    return set({
      tracks: nextTracks,
      currentTrack: shouldAutoplay ? nextTracks[0] : get().currentTrack,
      currentTrackIndex: shouldAutoplay ? 0 : findTrackIndex(nextTracks, get().currentTrack?.id),
      isPlaying: shouldAutoplay,
      currentTime: shouldAutoplay ? 0 : get().currentTime,
      duration: shouldAutoplay ? 0 : get().duration,
    })
  },

  appendTracks: (tracks, options = {}) => {
    const incomingTracks = Array.isArray(tracks) ? tracks : []
    const { tracks: currentTracks, currentTrack } = get()

    if (!incomingTracks.length) return

    const seen = new Set(currentTracks.map((track) => track.id))
    const merged = [...currentTracks]

    for (const track of incomingTracks) {
      if (!seen.has(track.id)) {
        seen.add(track.id)
        merged.push(track)
      }
    }

    set({
      tracks: merged,
      importMeta: options.importMeta || null,
    })

    if (!currentTrack && options.autoplayFirst) {
      get().setCurrentTrack(merged[0], { autoplay: true })
    }
  },

  setCurrentTrack: (track, options = {}) => {
    if (!track) return

    const { tracks, currentTrackIndex, history } = get()
    const nextIndex = findTrackIndex(tracks, track.id)
    const autoplay = options.autoplay ?? true
    const nextHistory =
      currentTrackIndex >= 0 && currentTrackIndex !== nextIndex
        ? [...history, currentTrackIndex].slice(-50)
        : history

    set({
      currentTrack: track,
      currentTrackIndex: nextIndex,
      currentTime: 0,
      duration: 0,
      isPlaying: autoplay,
      lyrics: [],
      plainLyrics: '',
      lyricsStatus: 'loading',
      lyricsSource: null,
      history: nextHistory,
    })
  },

  setIsPlaying: (isPlaying) => set({ isPlaying }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration: Number(duration) || 0 }),

  nextTrack: () => {
    const { tracks, currentTrackIndex, isShuffleEnabled, history } = get()
    if (!tracks.length) return

    if (isShuffleEnabled && tracks.length > 1) {
      let nextIndex = currentTrackIndex
      while (nextIndex === currentTrackIndex) {
        nextIndex = Math.floor(Math.random() * tracks.length)
      }

      return set({
        currentTrack: tracks[nextIndex],
        currentTrackIndex: nextIndex,
        currentTime: 0,
        duration: 0,
        isPlaying: true,
        lyrics: [],
        plainLyrics: '',
        lyricsStatus: 'loading',
        lyricsSource: null,
        history: currentTrackIndex >= 0 ? [...history, currentTrackIndex].slice(-50) : history,
      })
    }

    const nextIndex = (currentTrackIndex + 1 + tracks.length) % tracks.length
    set({
      currentTrack: tracks[nextIndex],
      currentTrackIndex: nextIndex,
      currentTime: 0,
      duration: 0,
      isPlaying: true,
      lyrics: [],
      plainLyrics: '',
      lyricsStatus: 'loading',
      lyricsSource: null,
      history: currentTrackIndex >= 0 ? [...history, currentTrackIndex].slice(-50) : history,
    })
  },

  prevTrack: () => {
    const { tracks, currentTrackIndex, currentTime, isShuffleEnabled, history } = get()
    if (!tracks.length) return

    if (currentTime > 3) {
      return set({ currentTime: 0 })
    }

    if (isShuffleEnabled && history.length) {
      const previousIndex = history[history.length - 1]
      return set({
        currentTrack: tracks[previousIndex],
        currentTrackIndex: previousIndex,
        currentTime: 0,
        duration: 0,
        isPlaying: true,
        lyrics: [],
        plainLyrics: '',
        lyricsStatus: 'loading',
        lyricsSource: null,
        history: history.slice(0, -1),
      })
    }

    const previousIndex = currentTrackIndex <= 0 ? tracks.length - 1 : currentTrackIndex - 1
    set({
      currentTrack: tracks[previousIndex],
      currentTrackIndex: previousIndex,
      currentTime: 0,
      duration: 0,
      isPlaying: true,
      lyrics: [],
      plainLyrics: '',
      lyricsStatus: 'loading',
      lyricsSource: null,
    })
  },

  setVolume: (volume) => {
    const safeVolume = clampVolume(volume)
    writeStorage(VOLUME_KEY, safeVolume)
    set({ volume: safeVolume })
  },

  toggleShuffle: () => {
    const nextValue = !get().isShuffleEnabled
    writeStorage(SHUFFLE_KEY, nextValue)
    set({ isShuffleEnabled: nextValue })
  },

  toggleFavorite: (track) => {
    if (!track?.id) return

    const favorites = { ...get().favorites }
    if (favorites[track.id]) {
      delete favorites[track.id]
    } else {
      favorites[track.id] = {
        id: track.id,
        title: track.title,
        artist: track.artist,
        thumbnail: track.thumbnail,
        duration: track.duration,
      }
    }

    writeStorage(FAVORITES_KEY, favorites)
    set({ favorites })
  },

  setHoverTrackId: (hoverTrackId) => set({ hoverTrackId }),

  setLyrics: ({ lines = [], plainLyrics = '', source = null, status = 'ready' }) =>
    set({
      lyrics: lines,
      plainLyrics,
      lyricsSource: source,
      lyricsStatus: status,
    }),

  setLyricsStatus: (lyricsStatus) => set({ lyricsStatus }),

  setMoodPalette: (moodPalette) => set({ moodPalette: moodPalette || DEFAULT_PALETTE }),

  isFavorite: (trackId) => Boolean(get().favorites[trackId]),
}))

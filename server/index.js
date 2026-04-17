/* global Buffer, process */
import express from 'express'
import cors from 'cors'
import axios from 'axios'
import { pipeline } from 'node:stream/promises'
import { Innertube } from 'youtubei.js'

const app = express()
const PORT = 3001
const LRCLIB_BASE = 'https://lrclib.net/api'
const SPOTIFY_API = 'https://api.spotify.com/v1'
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'
const SPOTIFY_MARKET = process.env.SPOTIFY_MARKET || 'US'
const MAX_IMPORT_TRACKS = 20

let youtube

const spotifyTokenCache = {
  token: null,
  expiresAt: 0,
}

function pickThumbnail(thumbnails = []) {
  if (!Array.isArray(thumbnails) || !thumbnails.length) return ''
  const sorted = [...thumbnails].sort((left, right) => (right.width || 0) - (left.width || 0))
  return sorted[0]?.url || thumbnails[0]?.url || ''
}

function stripOfficialNoise(value = '') {
  return value
    .replace(/\(official[^)]*\)/gi, '')
    .replace(/\[official[^\]]*\]/gi, '')
    .replace(/\blyrics\b/gi, '')
    .replace(/\baudio\b/gi, '')
    .replace(/\bvisualizer\b/gi, '')
    .replace(/\(\s*\)/g, '')
    .replace(/\[\s*]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function splitTrackTitle(rawTitle = '', fallbackArtist = '') {
  const cleanedTitle = stripOfficialNoise(rawTitle)
  const separators = [' - ', ' – ', ' — ', ' | ']

  for (const separator of separators) {
    if (!cleanedTitle.includes(separator)) continue

    const [left, ...rest] = cleanedTitle.split(separator)
    const right = rest.join(separator).trim()
    const normalizedArtist = fallbackArtist.trim().toLowerCase()
    const normalizedLeft = left.trim().toLowerCase()

    if (normalizedArtist && normalizedLeft === normalizedArtist) {
      return {
        artist: fallbackArtist.trim(),
        title: right || cleanedTitle,
      }
    }
  }

  return {
    artist: fallbackArtist.trim() || 'Unknown artist',
    title: cleanedTitle || rawTitle || 'Unknown title',
  }
}  

function normalizeYoutubeTrack(item) {
  const author = item.author?.name || ''
  const parsed = splitTrackTitle(item.title?.text || '', author)

  return {
    id: item.id,
    title: parsed.title,
    artist: parsed.artist,
    duration: item.duration?.seconds || 0,
    durationText: item.duration?.text || '',
    thumbnail: pickThumbnail(item.thumbnails),
    album: item.author?.name || '',
    source: 'youtube',
    isImported: false,
  }
}
async function initYoutube() {
  youtube = await Innertube.create({
    generate_session_locally: true,
    fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      headers.set('User-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      return fetch(input, { ...init, headers });
    }
  });
  console.log('Youtube client ready')
}
async function searchYoutubeTracks(query, limit = 12) {
  const searchResult = await youtube.search(query)
  const videos = searchResult.videos || []

  return videos
    .map(normalizeYoutubeTrack)
    .filter((track) => track.id && track.title)
    .slice(0, limit)
}

async function getStreamForTrack(videoId) {
  try {
    console.log('audioFormatkeys:', audioFormat ? Object.keys(audioFormat) : 'null');
    console.log('audioFormat.url:', audioFormat?.url);
    console.log('has decipher method:', typeof audioFormat?.decipher);
    console.log('signature_cipher:', audioFormat?.signature_cipher);

    const info = await youtube.getInfo(videoId);

    // Ищем аудио-формат напрямую в streaming_data
    const formats = info.streaming_data?.adaptive_formats || [];
    
    // Приоритет: mp4 audio → любой audio
    const audioFormat = info.formats.find(f => f.hasAudio);
    if (!audioFormat) throw new Error("No audio format found");
    const stream = { url: audioFormat.url };  
    // Получаем URL: либо прямой, либо расшифровываем через player
    let streamUrl = audioFormat.url;

    if (!streamUrl && (audioFormat.signature_cipher || audioFormat.cipher)) {
      const cipher = audioFormat.signature_cipher || audioFormat.cipher;
      streamUrl = youtube.session.player.decipher(cipher);
    }

    if (!streamUrl || typeof streamUrl !== 'string') {
      throw new Error('Could not extract stream URL');
    }

    return {
      url: streamUrl,
      mimeType: audioFormat.mime_type || 'audio/mp4',
    };
  } catch (err) {
    console.error(`[getStreamForTrack ${videoId}]:`, err.message);
    throw err;
  }
} 
function parseLrc(syncedLyrics = '') {
  if (!syncedLyrics) return []

  return syncedLyrics
    .split('\n')
    .map((line, index) => {
      const match = line.match(/^\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?]\s?(.*)$/)
      if (!match) return null

      const minutes = Number(match[1])
      const seconds = Number(match[2])
      const decimals = Number((match[3] || '0').padEnd(3, '0'))

      return {
        id: `${index}-${minutes}-${seconds}-${decimals}`,
        time: minutes * 60 + seconds + decimals / 1000,
        text: match[4] || '',
      }
    })
    .filter(Boolean)
}

async function fetchLyricsFromYoutubeMusic(videoId) {
  if (!videoId) return null

  try {
    const shelf = await youtube.music.getLyrics(videoId)
    const plainLyrics = shelf?.description?.toString?.()?.trim()

    if (!plainLyrics) return null

    return {
      plainLyrics,
      syncedLyrics: null,
      lines: [],
      source: 'youtube-music',
    }
  } catch {
    return null
  }
}

async function fetchLyricsFromLrcLib({ title, artist, duration }) {
  if (!title || !artist) return null

  try {
    const response = await axios.get(`${LRCLIB_BASE}/get`, {
      params: {
        track_name: title,
        artist_name: artist,
        duration: duration || undefined,
      },
      timeout: 8000,
    })

    const payload = response.data
    if (!payload?.plainLyrics && !payload?.syncedLyrics) return null

    return {
      plainLyrics: payload.plainLyrics || '',
      syncedLyrics: payload.syncedLyrics || null,
      lines: parseLrc(payload.syncedLyrics || ''),
      source: 'lrclib',
    }
  } catch {
    try {
      const searchResponse = await axios.get(`${LRCLIB_BASE}/search`, {
        params: {
          track_name: title,
          artist_name: artist,
        },
        timeout: 8000,
      })

      const items = Array.isArray(searchResponse.data) ? searchResponse.data : []
      if (!items.length) return null

      const bestMatch = items
        .map((item) => ({
          ...item,
          distance: duration ? Math.abs(Number(item.duration || 0) - Number(duration)) : 0,
        }))
        .sort((left, right) => left.distance - right.distance)[0]

      return {
        plainLyrics: bestMatch.plainLyrics || '',
        syncedLyrics: bestMatch.syncedLyrics || null,
        lines: parseLrc(bestMatch.syncedLyrics || ''),
        source: 'lrclib',
      }
    } catch {
      return null
    }
  }
}

async function fetchLyrics({ videoId, title, artist, duration }) {
  const youtubeMusicLyrics = await fetchLyricsFromYoutubeMusic(videoId)
  if (youtubeMusicLyrics?.plainLyrics) {
    return youtubeMusicLyrics
  }

  const lrcLibLyrics = await fetchLyricsFromLrcLib({ title, artist, duration })
  if (lrcLibLyrics) {
    return lrcLibLyrics
  }

  return {
    plainLyrics: '',
    syncedLyrics: null,
    lines: [],
    source: null,
  }
}

function parseSpotifyResource(rawInput = '') {
  const value = rawInput.trim()
  if (!value) return null

  const uriMatch = value.match(/^spotify:(track|playlist):([A-Za-z0-9]+)$/)
  if (uriMatch) {
    return {
      type: uriMatch[1],
      id: uriMatch[2],
      url: `https://open.spotify.com/${uriMatch[1]}/${uriMatch[2]}`,
    }
  }

  const urlMatch = value.match(/open\.spotify\.com\/(track|playlist)\/([A-Za-z0-9]+)/i)
  if (urlMatch) {
    return {
      type: urlMatch[1].toLowerCase(),
      id: urlMatch[2],
      url: `https://open.spotify.com/${urlMatch[1].toLowerCase()}/${urlMatch[2]}`,
    }
  }

  return null
}

function decodeHtmlEntities(value = '') {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function extractMeta(html, key, attribute = 'property') {
  const expression = new RegExp(`<meta\\s+${attribute}="${key}"\\s+content="([^"]*)"`, 'i')
  const match = html.match(expression)
  return decodeHtmlEntities(match?.[1] || '')
}

async function getSpotifyAccessToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return null
  }

  if (spotifyTokenCache.token && spotifyTokenCache.expiresAt > Date.now() + 30_000) {
    return spotifyTokenCache.token
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  const response = await axios.post(
    SPOTIFY_TOKEN_URL,
    new URLSearchParams({ grant_type: 'client_credentials' }).toString(),
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 10000,
    },
  )

  spotifyTokenCache.token = response.data.access_token
  spotifyTokenCache.expiresAt = Date.now() + Number(response.data.expires_in || 0) * 1000
  return spotifyTokenCache.token
}

async function spotifyApiRequest(path, params = {}) {
  const token = await getSpotifyAccessToken()
  if (!token) return null

  const response = await axios.get(`${SPOTIFY_API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: {
      market: SPOTIFY_MARKET,
      ...params,
    },
    timeout: 10000,
  })

  return response.data
}

function normalizeSpotifyTrack(item) {
  if (!item) return null

  const artists = Array.isArray(item.artists)
    ? item.artists.map((artist) => artist.name).filter(Boolean)
    : item.artistName
      ? [item.artistName]
      : []

  return {
    id: item.id || item.spotifyId || '',
    title: item.name || item.trackName || '',
    artist: artists.join(', ') || 'Unknown artist',
    duration: item.duration_ms ? Math.round(item.duration_ms / 1000) : Number(item.duration || 0),
    thumbnail: pickThumbnail(item.album?.images) || item.thumbnail || '',
    album: item.album?.name || item.albumName || '',
    spotifyUrl: item.external_urls?.spotify || item.url || '',
    spotifyId: item.id || '',
    source: 'spotify',
  }
}

async function fetchSpotifyTrackFromApi(trackId) {
  const payload = await spotifyApiRequest(`/tracks/${trackId}`)
  return payload ? [normalizeSpotifyTrack(payload)] : []
}

async function fetchSpotifyPlaylistFromApi(playlistId, limit) {
  const items = []
  let offset = 0

  while (items.length < limit) {
    const payload = await spotifyApiRequest(`/playlists/${playlistId}/tracks`, {
      limit: Math.min(50, limit - items.length),
      offset,
    })

    const batch = payload?.items || []
    if (!batch.length) break

    items.push(
      ...batch
        .map((entry) => normalizeSpotifyTrack(entry.track))
        .filter(Boolean),
    )

    if (!payload.next) break
    offset += batch.length
  }

  return items.slice(0, limit)
}

async function fetchSpotifyHtml(url) {
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
    },
    timeout: 10000,
  })

  return response.data
}

async function fetchSpotifyTrackFromHtml(trackId) {
  const url = `https://open.spotify.com/track/${trackId}`
  const html = await fetchSpotifyHtml(url)

  return [
    normalizeSpotifyTrack({
      id: trackId,
      name: extractMeta(html, 'og:title'),
      artistName: extractMeta(html, 'music:musician_description', 'name'),
      duration: Number(extractMeta(html, 'music:duration', 'name') || 0),
      thumbnail: extractMeta(html, 'og:image'),
      url,
    }),
  ].filter(Boolean)
}

async function fetchSpotifyPlaylistFromHtml(playlistId, limit) {
  const playlistUrl = `https://open.spotify.com/playlist/${playlistId}`
  const html = await fetchSpotifyHtml(playlistUrl)
  const trackIds = [
    ...new Set(
      [...html.matchAll(/href="\/track\/([^"?/]+)(?:\?[^"]*)?"/g)].map((match) => match[1]),
    ),
  ].slice(0, limit)

  const items = []
  for (const trackId of trackIds) {
    const [track] = await fetchSpotifyTrackFromHtml(trackId)
    if (track) items.push(track)
  }

  return items
}

async function fetchSpotifyTracks(resource, limit) {
  if (resource.type === 'track') {
    const apiTrack = await fetchSpotifyTrackFromApi(resource.id)
    if (apiTrack?.length) return apiTrack
    return fetchSpotifyTrackFromHtml(resource.id)
  }

  const apiPlaylist = await fetchSpotifyPlaylistFromApi(resource.id, limit)
  if (apiPlaylist?.length) return apiPlaylist
  return fetchSpotifyPlaylistFromHtml(resource.id, limit)
}

async function mapSpotifyTrackToYoutubeTrack(spotifyTrack) {
  const query = `${spotifyTrack.artist} ${spotifyTrack.title} audio`
  const results = await searchYoutubeTracks(query, 5)

  if (!results.length) return null

  const bestMatch =
    results.find((track) => track.duration && spotifyTrack.duration && Math.abs(track.duration - spotifyTrack.duration) <= 12) ||
    results[0]

  return {
    ...bestMatch,
    title: spotifyTrack.title || bestMatch.title,
    artist: spotifyTrack.artist || bestMatch.artist,
    album: spotifyTrack.album || bestMatch.album,
    thumbnail: spotifyTrack.thumbnail || bestMatch.thumbnail,
    spotify: spotifyTrack,
    isImported: true,
    importQuery: query,
  }
}

async function mapWithConcurrency(items, mapper, concurrency = 4) {
  const results = []
  let pointer = 0

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (pointer < items.length) {
      const index = pointer
      pointer += 1
      results[index] = await mapper(items[index], index)
    }
  })

  await Promise.all(workers)
  return results
}

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({
    message: 'Music API server',
    endpoints: [
      '/api/search?q=query',
      '/api/stream/:videoId',
      '/api/audio/:videoId',
      '/api/lyrics?videoId=...&artist=...&title=...',
      '/api/import/spotify',
    ],
  })
})

app.get('/api/search', async (req, res) => {
  try {
    const query = `${req.query.q || ''}`.trim()
    const limit = Math.min(Number(req.query.limit || 12), 20)

    if (!query) {
      return res.status(400).json({ error: 'Query is required' })
    }

    const tracks = await searchYoutubeTracks(query, limit)
    return res.json(tracks)
  } catch (error) {
    console.error('Search error:', error)
    return res.status(500).json({ error: error.message || 'Failed to search tracks' })
  }
})

app.get('/api/stream/:videoId', async (req, res) => {
  try {
    const stream = await getStreamForTrack(req.params.videoId)
    return res.json(stream)
  } catch (error) {
    console.error('Stream error:', error)
    return res.status(500).json({ error: error.message || 'Failed to load stream' })
  }
})

app.get('/api/audio/:videoId', async (req, res) => {
  try {
    const videoId = req.params.videoId;
    
    // Получаем данные
    const stream = await getStreamForTrack(videoId); 

    // КРИТИЧЕСКАЯ ПРОВЕРКА:
    // Если по какой-то причине url всё еще промис (бывает в youtubei.js)
    const finalUrl = stream.url; 
    
    if (typeof finalUrl !== 'string') {
       throw new Error(`URL is not a string, it is: ${typeof finalUrl}`);
    }

    const upstream = await axios.get(finalUrl, { // используем finalUrl
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': 'https://www.youtube.com/',
        'Range': req.headers.range || 'bytes=0-',
      },
      timeout: 10000,
    });

    res.status(upstream.status);
    res.setHeader('Content-Type', stream.mimeType);
    if (upstream.headers['content-range']) res.setHeader('Content-Range', upstream.headers['content-range']);
    res.setHeader('Accept-Ranges', 'bytes');

    await pipeline(upstream.data, res);

  } catch (error) {
    console.error(`[Audio Error] Message: ${error.message}`);
    if (!res.headersSent) res.status(500).end();
  }
});
app.get('/api/lyrics', async (req, res) => {
  try {
    const payload = await fetchLyrics({
      videoId: `${req.query.videoId || ''}`.trim(),
      title: `${req.query.title || ''}`.trim(),
      artist: `${req.query.artist || ''}`.trim(),
      duration: Number(req.query.duration || 0),
    })

    return res.json(payload)
  } catch (error) {
    console.error('Lyrics error:', error)
    return res.status(500).json({ error: error.message || 'Failed to load lyrics' })
  }
})

app.post('/api/import/spotify', async (req, res) => {
  try {
    const resource = parseSpotifyResource(`${req.body?.url || ''}`)
    const limit = Math.min(Number(req.body?.limit || MAX_IMPORT_TRACKS), MAX_IMPORT_TRACKS)

    if (!resource) {
      return res.status(400).json({ error: 'Provide a valid Spotify track or playlist URL' })
    }

    const spotifyTracks = await fetchSpotifyTracks(resource, limit)
    if (!spotifyTracks.length) {
      return res.status(404).json({ error: 'Could not read Spotify track data from that link' })
    }

    const mappedTracks = await mapWithConcurrency(spotifyTracks, mapSpotifyTrackToYoutubeTrack, 4)
    const tracks = mappedTracks.filter(Boolean)

    if (!tracks.length) {
      return res.status(404).json({ error: 'Spotify items were found, but no matching YouTube tracks were resolved' })
    }

    return res.json({
      type: resource.type,
      importedCount: tracks.length,
      requestedCount: spotifyTracks.length,
      tracks,
      meta: {
        source: resource.url,
        usedSpotifyApiCredentials: Boolean(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET),
      },
    })
  } catch (error) {
    console.error('Spotify import error:', error)
    return res.status(500).json({ error: error.message || 'Failed to import Spotify resource' })
  }
})

initYoutube().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`)
  })
})

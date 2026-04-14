import { useState } from 'react'
import { Import, Link2, Sparkles } from 'lucide-react'
import { usePlayerStore } from '../store'

const API_BASE = 'http://localhost:3001/api'

export function SpotifyImportPanel() {
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('Paste a Spotify track or playlist link to map it into your YouTube-powered queue.')
  const appendTracks = usePlayerStore((state) => state.appendTracks)

  const handleImport = async (event) => {
    event.preventDefault()
    if (!url.trim()) return

    setStatus('loading')
    setMessage('Importing from Spotify and matching tracks on YouTube...')

    try {
      const response = await fetch(`${API_BASE}/import/spotify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url.trim(),
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Import failed')
      }

      appendTracks(payload.tracks, {
        autoplayFirst: true,
        importMeta: payload.meta,
      })
      setStatus('success')
      setMessage(`Imported ${payload.importedCount} ${payload.type === 'playlist' ? 'tracks' : 'track'} into your queue.`)
    } catch (error) {
      setStatus('error')
      setMessage(error.message || 'Spotify import failed')
    }
  }

  return (
    <div className="import-card">
      <div className="section-header">
        <div>
          <p className="eyebrow">Spotify import</p>
          <h2 className="section-title section-title--sm">Bring another playlist in</h2>
        </div>
        <span className="meta-pill">
          <Sparkles size={14} />
          Track + playlist links
        </span>
      </div>

      <form className="import-form" onSubmit={handleImport}>
        <div className="field-shell">
          <input
            type="text"
            placeholder="https://open.spotify.com/playlist/..."
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />
          <Link2 className="field-icon" size={18} />
        </div>

        <button type="submit" className="secondary-button" disabled={status === 'loading'}>
          <Import size={16} />
          {status === 'loading' ? 'Importing...' : 'Import'}
        </button>
      </form>

      <p className={`import-message import-message--${status}`}>{message}</p>
    </div>
  )
}

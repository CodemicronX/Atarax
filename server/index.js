import express from "express"
import cors from "cors"
import axios from "axios"

const app = express()
const PORT = 3001

// Список Invidious серверов (если один упадёт — используем другой)
const INVIDIOUS_SERVERS = [
  "https://invidious.nerdvpn.de",
  "https://invidious.privacydev.net",
  "https://vid.puffyan.us",
]

app.use(cors())
app.use(express.json())

// Поиск треков
app.get("/api/search", async (req, res) => {
  const { q } = req.query
  
  for (const server of INVIDIOUS_SERVERS) {
    try {
      const response = await axios.get(`${server}/api/v1/search`, {
        params: {
          q: `${q} official audio`,
          type: "video",
          sort_by: "relevance",
        },
        timeout: 5000,
      })
      return res.json(response.data)
    } catch (err) {
      continue
    }
  }
  
  res.status(500).json({ error: "Все серверы недоступны" })
})

// Получить стрим ссылку на трек
app.get("/api/stream/:videoId", async (req, res) => {
  const { videoId } = req.params

  for (const server of INVIDIOUS_SERVERS) {
    try {
      const response = await axios.get(`${server}/api/v1/videos/${videoId}`, {
        timeout: 5000,
      })

      const formats = response.data.adaptiveFormats || []
      
      // Берём лучший аудио формат
      const audioFormat = formats
        .filter(f => f.type?.startsWith("audio/"))
        .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0]

      if (audioFormat) {
        return res.json({
          url: audioFormat.url,
          bitrate: audioFormat.bitrate,
          mimeType: audioFormat.type,
        })
      }
    } catch (err) {
      continue
    }
  }

  res.status(500).json({ error: "Не удалось получить стрим" })
})

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`)
})


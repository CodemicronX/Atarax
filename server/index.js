import express from "express"
import cors from "cors"
import { Innertube } from "youtubei.js"

const app = express()
const PORT = 3001

let youtube

// Инициализация YouTube клиента
async function init() {
  youtube = await Innertube.create({
    generate_session_locally: true,
  })
  console.log("YouTube клиент готов")
}

app.use(cors())
app.use(express.json())

// Root route
app.get("/", (req, res) => {
  res.json({ message: "Music API Server", endpoints: ["/api/search?q=query", "/api/stream/:videoId"] })
})

// Поиск треков
app.get("/api/search", async (req, res) => {
  try {
    const { q } = req.query
    
    // Используем обычный поиск YouTube вместо Music
    const results = await youtube.search(q + " audio", { type: "video" })
    
    const tracks = results.videos?.map(item => ({
      id: item.id,
      title: item.title?.text || "",
      artist: item.author?.name || "Неизвестно",
      duration: item.duration?.seconds || 0,
      thumbnail: item.thumbnails?.[0]?.url || "",
    })) || []

    res.json(tracks)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// Стрим трека
app.get("/api/stream/:videoId", async (req, res) => {
  try {
    const { videoId } = req.params
    const info = await youtube.getBasicInfo(videoId)
    const url = info.streaming_data?.server_abr_streaming_url
      || info.streaming_data?.hls_manifest_url
      || info.streaming_data?.dash_manifest_url

    if (!url) {
      throw new Error("No stream URL available")
    }

    res.json({
      url: url.toString(),
      bitrate: info.streaming_data?.formats?.[0]?.bitrate || 0,
      mimeType: info.streaming_data?.formats?.[0]?.mimeType || "audio/mp4",
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

init().then(() => {
  app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`)
  })
})
import express from "express"
import cors from "cors"
import { Innertube } from "youtubei.js"

const app = express()
const PORT = 3001

let youtube

async function init() {
  youtube = await Innertube.create({
    generate_session_locally: true,
  })
  console.log("YouTube клиент готов")
}

app.use(cors())
app.use(express.json())

// Поиск треков
app.get("/api/search", async (req, res) => {
  try {
    const { q } = req.query
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

    const format = info.chooseFormat({
      quality: "best",
      type: "audio",
    })

    res.json({
      url: format.decipher(youtube.session.player),
      bitrate: format.bitrate,
      mimeType: format.mime_type,
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

import { useState } from "react"
import { Home, Search, Library } from "lucide-react"

function App() {
  const [activePage, setActivePage] = useState("home")

  const pageText = {
    home: "Здесь показана домашняя страница с последними треками и плейлистами.",
    search: "Ищите исполнителей, альбомы и треки из вашей коллекции.",
    library: "Сохранённые треки, альбомы и ваши плейлисты всегда под рукой."
  }

  return (
    <div className="bg-slate-900 min-h-screen text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.22),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.24),_transparent_35%)] pointer-events-none" />

      <div className="relative pb-32 p-6 max-w-5xl mx-auto">
        <section className="rounded-[2rem] border border-white/10 bg-slate-800/95 p-8 shadow-[0_25px_80px_-40px_rgba(15,23,42,0.8)] backdrop-blur-xl">
          <p className="text-sm uppercase tracking-[0.32em] text-cyan-200/90">Music App</p>
          <h1 className="mt-4 text-4xl font-bold text-slate-100">Tune in, scroll, and play.</h1>
          <p className="mt-4 max-w-2xl text-slate-300">Выберите страницу ниже, чтобы перейти к главной, поиску музыки или вашей библиотеке.</p>
        </section>

        <section className="mt-8 grid gap-6">
          <div className="rounded-3xl border border-white/10 bg-slate-800/95 p-6 shadow-xl">
            <h2 className="text-2xl font-semibold text-slate-100">Текущий раздел</h2>
            <p className="mt-3 text-slate-300">{pageText[activePage]}</p>
          </div>
        </section>
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[85%] z-50">
        <div
          className="flex justify-around items-center py-4 px-6 rounded-3xl"
          style={{
            background: "rgba(15, 23, 42, 0.82)",
            backdropFilter: "blur(28px)",
            WebkitBackdropFilter: "blur(28px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
          }}
        >
          <button
            onClick={() => setActivePage("home")}
            className={`flex flex-col items-center gap-1 transition-all ${
              activePage === "home" ? "text-white scale-110" : "text-slate-400"
            }`}
          >
            <Home size={22} />
            <span className="text-xs">Главная</span>
          </button>

          <button
            onClick={() => setActivePage("search")}
            className={`flex flex-col items-center gap-1 transition-all ${
              activePage === "search" ? "text-white scale-110" : "text-slate-400"
            }`}
          >
            <Search size={22} />
            <span className="text-xs">Поиск</span>
          </button>

          <button
            onClick={() => setActivePage("library")}
            className={`flex flex-col items-center gap-1 transition-all ${
              activePage === "library" ? "text-white scale-110" : "text-slate-400"
            }`}
          >
            <Library size={22} />
            <span className="text-xs">Библиотека</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
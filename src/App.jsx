import { useEffect, useMemo, useState } from 'react'

const CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Peshawar', 'Quetta', 'Multan', 'Faisalabad', 'Rawalpindi']
const INTERESTS = ['politics', 'economy', 'jobs', 'tech', 'sports']
const URGENCY = [
  { value: 'breaking', label: 'Breaking only' },
  { value: 'important', label: 'Important only' },
  { value: 'full', label: 'Full feed' },
]

function Pill({ children, active }) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
      active ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-600 border-gray-200'
    }`}>
      {children}
    </span>
  )
}

function FactBadge({ status, score }) {
  const map = {
    Verified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Unconfirmed: 'bg-amber-50 text-amber-700 border-amber-200',
    Rumour: 'bg-red-50 text-red-700 border-red-200',
  }
  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold border ${map[status] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
      {status}{status === 'Rumour' && typeof score === 'number' ? ` • Risk ${score}` : ''}
    </span>
  )
}

export default function App() {
  const [city, setCity] = useState('Karachi')
  const [selectedInterests, setSelectedInterests] = useState(['economy', 'politics'])
  const [urgency, setUrgency] = useState('important')
  const [language, setLanguage] = useState('en')

  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState([])
  const [digest, setDigest] = useState(null)
  const [note, setNote] = useState('')
  const [audioFor, setAudioFor] = useState({})

  const baseUrl = useMemo(() => import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000', [])

  useEffect(() => {
    // Load initial digest
    fetchDigest()
  }, [])

  const toggleInterest = (key) => {
    setSelectedInterests((prev) =>
      prev.includes(key) ? prev.filter((i) => i !== key) : [...prev, key]
    )
  }

  const runIngest = async () => {
    setLoading(true)
    setNote('Ingesting sample sources and generating summaries...')
    try {
      const res = await fetch(`${baseUrl}/api/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sources: ['dawn', 'geo', 'express'], language }),
      })
      const data = await res.json()
      setNote(`Ingested ${data.inserted || 0} stories. You can fetch your feed now.`)
    } catch (e) {
      setNote(`Ingest failed: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  const fetchFeed = async () => {
    setLoading(true)
    setNote('Fetching your personalized feed...')
    try {
      const payload = { city, interests: selectedInterests, urgency, language }
      const res = await fetch(`${baseUrl}/api/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      setItems(data.items || [])
      setNote(`Loaded ${data.count || 0} stories.`)
    } catch (e) {
      setNote(`Failed to load feed: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  const fetchDigest = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/digest?language=${language}`)
      const data = await res.json()
      setDigest(data)
    } catch (_) {
      // ignore
    }
  }

  const playAudio = async (text, id) => {
    try {
      setAudioFor((s) => ({ ...s, [id]: 'loading' }))
      const res = await fetch(`${baseUrl}/api/audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language }),
      })
      const data = await res.json()
      const audio = new Audio(data.audio_url)
      await audio.play()
      setAudioFor((s) => ({ ...s, [id]: 'playing' }))
      audio.onended = () => setAudioFor((s) => ({ ...s, [id]: 'idle' }))
    } catch (e) {
      setAudioFor((s) => ({ ...s, [id]: 'error' }))
      console.error(e)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="px-6 py-4 border-b bg-white/70 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">PakGPT News Engine</h1>
            <p className="text-sm text-slate-600">AI-filtered, bias-reduced news. 3 bullets + impact, Urdu/English, audio-ready.</p>
          </div>
          <div className="flex items-center gap-3">
            <select className="border rounded px-3 py-1.5 text-sm" value={language} onChange={(e)=>{setLanguage(e.target.value); fetchDigest()}}>
              <option value="en">English</option>
              <option value="ur">اردو</option>
            </select>
            <a href="/test" className="text-sm text-blue-600 underline">System Test</a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Controls */}
        <section className="bg-white rounded-xl shadow-sm border p-5">
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">City</label>
              <select value={city} onChange={(e)=>setCity(e.target.value)} className="w-full border rounded px-3 py-2">
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Urgency</label>
              <select value={urgency} onChange={(e)=>setUrgency(e.target.value)} className="w-full border rounded px-3 py-2">
                {URGENCY.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Interests</label>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map(i => (
                  <button key={i} type="button" onClick={()=>toggleInterest(i)} className={`px-3 py-1.5 rounded-full border text-sm transition ${selectedInterests.includes(i) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 hover:bg-slate-50'}`}>
                    {i}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-4">
            <button onClick={runIngest} disabled={loading} className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded disabled:opacity-60">Ingest Sources (demo)</button>
            <button onClick={fetchFeed} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-60">Generate My Feed</button>
            {note && <span className="text-sm text-slate-600">{note}</span>}
          </div>
        </section>

        {/* Feed */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-800">Your Feed</h2>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Pill active>{city}</Pill>
              {selectedInterests.map(i => <Pill key={i}>{i}</Pill>)}
              <Pill>{urgency}</Pill>
              <Pill>{language === 'en' ? 'English' : 'اردو'}</Pill>
            </div>
          </div>

          {items.length === 0 && (
            <div className="bg-white border rounded-xl p-6 text-slate-600">No stories yet. Click Ingest (demo), then Generate My Feed.</div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            {items.map((item) => (
              <article key={item.id || item.url} className="bg-white border rounded-xl p-5 space-y-3 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <a href={item.url} target="_blank" rel="noreferrer" className="text-lg font-semibold text-slate-800 hover:underline">
                      {item.title}
                    </a>
                    <div className="text-xs text-slate-500 mt-1">{item.source} • {new Date(item.published_at || Date.now()).toLocaleString()}</div>
                  </div>
                  <FactBadge status={item.fact_status} score={item.risk_score} />
                </div>

                <ul className="list-disc pl-5 text-slate-700 space-y-1">
                  {(item.bullets || []).slice(0,3).map((b, idx) => (
                    <li key={idx} className="text-sm">{b}</li>
                  ))}
                </ul>
                <div className="text-sm text-blue-700 font-medium">Impact: {item.impact}</div>

                <div className="flex items-center gap-2 pt-2">
                  <button onClick={() => playAudio(`${item.title}. ${item.bullets?.join('. ')}. ${item.impact}`, item.id || item.url)} className="px-3 py-1.5 text-sm rounded bg-slate-100 hover:bg-slate-200 border">
                    {audioFor[item.id || item.url] === 'loading' ? 'Loading audio…' : 'Play Audio'}
                  </button>
                  <a href={item.url} target="_blank" rel="noreferrer" className="text-sm text-slate-600 hover:text-slate-800 underline">
                    Original Source
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* God Mode Digest */}
        <section className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-800">Morning God Mode Digest</h2>
            <button onClick={fetchDigest} className="text-sm px-3 py-1.5 border rounded hover:bg-slate-50">Refresh</button>
          </div>
          {digest ? (
            <div className="mt-3 grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-slate-700 mb-2">Top Headlines</h3>
                <ol className="list-decimal pl-5 space-y-1 text-sm text-slate-700">
                  {(digest.headlines || []).slice(0,10).map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ol>
              </div>
              <div>
                <h3 className="font-semibold text-slate-700 mb-2">60-second AI Summary</h3>
                <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded border">{digest.summary_60s}</p>
                <div className="mt-3">
                  <h4 className="font-semibold text-slate-700 mb-1">Business/Economy</h4>
                  <p className="text-sm text-slate-700">{digest.business_economy?.snapshot}</p>
                </div>
                <div className="mt-3">
                  <h4 className="font-semibold text-slate-700 mb-1">Global affecting Pakistan</h4>
                  <ul className="list-disc pl-5 text-sm text-slate-700">
                    {(digest.global_affecting_pk || []).map((g, i) => <li key={i}>{g}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-600">Loading digest…</p>
          )}
          <div className="text-xs text-slate-500 mt-4">Delivery channels (app, WhatsApp, email) can be wired here in production.</div>
        </section>
      </main>

      <footer className="text-center text-xs text-slate-500 py-6">Built with ❤️ for unbiased, accessible Pakistan news.</footer>
    </div>
  )
}

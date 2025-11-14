import { useEffect, useRef, useState } from 'react'

function ChatBubble({ role, text }) {
  const isUser = role === 'user'
  return (
    <div className={`w-full flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`${isUser ? 'bg-blue-600 text-white' : 'bg-white text-gray-800'} max-w-[80%] rounded-2xl px-4 py-3 shadow` }>
        <p className="whitespace-pre-wrap leading-relaxed">{text}</p>
      </div>
    </div>
  )
}

function SuggestionChips({ suggestions, onPick }) {
  if (!suggestions || suggestions.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {suggestions.map((s, i) => (
        <button key={i} onClick={() => onPick(s)} className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded-full border border-gray-200">
          {s}
        </button>
      ))}
    </div>
  )
}

function App() {
  const [messages, setMessages] = useState([{ role: 'assistant', content: "Hi! I'm your restaurant assistant. Ask about hours, menu, reservations, or delivery." }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [backendUrl, setBackendUrl] = useState('')
  const listRef = useRef(null)

  useEffect(() => {
    setBackendUrl(import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000')
  }, [])

  useEffect(() => {
    listRef.current?.lastElementChild?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text) => {
    const msg = (text ?? input).trim()
    if (!msg) return
    setInput('')

    const next = [...messages, { role: 'user', content: msg }]
    setMessages(next)
    setLoading(true)

    try {
      const res = await fetch(`${backendUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, context: next.map(m => ({ role: m.role, content: m.content })) })
      })
      const data = await res.json()

      const assistantText = data?.reply || 'Sorry, something went wrong.'
      const assistantMsg = { role: 'assistant', content: assistantText, suggestions: data?.suggestions || [] }
      setMessages(prev => [...prev, assistantMsg])
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Unable to reach the server. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleChip = (s) => {
    sendMessage(s)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-orange-500 to-amber-500 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Blue Flame Bistro</h1>
                <p className="text-white/90 text-sm">Chat assistant for menu, hours, reservations and more</p>
              </div>
              <a href="/test" className="text-xs underline hover:opacity-90">System check</a>
            </div>
          </div>

          <div className="h-[60vh] md:h-[65vh] overflow-y-auto p-6 bg-gradient-to-b from-white to-amber-50/30" ref={listRef}>
            {messages.map((m, i) => (
              <div key={i}>
                <ChatBubble role={m.role} text={m.content} />
                {m.role === 'assistant' && (
                  <SuggestionChips suggestions={m.suggestions} onPick={handleChip} />
                )}
              </div>
            ))}
            {loading && (
              <div className="text-gray-500 text-sm">Thinking…</div>
            )}
          </div>

          <div className="p-4 border-t border-gray-100 bg-white">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                placeholder="Ask about hours, menu, reservations, delivery…"
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading}
                className="bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white px-5 py-3 rounded-xl shadow-sm"
              >
                Send
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">Backend: {backendUrl || 'Detecting…'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App

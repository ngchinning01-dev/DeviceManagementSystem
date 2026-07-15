import { useEffect, useRef, useState } from 'react'
import apiClient from '../api/client'

// Read-only AI assistant: natural-language search over devices/branches/users/
// maintenance data and general troubleshooting suggestions. Chat history is
// kept in memory only (sent back in full on every request) — nothing is
// persisted server-side.
function Assistant() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = (e) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    const next = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    setError(null)
    setLoading(true)

    apiClient
      .post('/assistant/chat', { messages: next })
      .then((res) => {
        setMessages([...next, { role: 'assistant', content: res.data.reply }])
      })
      .catch((err) => setError(err.response?.data?.error || err.message))
      .finally(() => setLoading(false))
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)]">
      <h2 className="text-xl font-semibold text-slate-800 mb-4">Assistant</h2>

      <div className="flex-1 overflow-y-auto bg-white rounded-lg shadow-sm p-4 mb-4 flex flex-col gap-3">
        {messages.length === 0 && (
          <p className="text-sm text-slate-400">
            Ask about devices, branches, users, or maintenance history — or describe an
            issue for troubleshooting suggestions. e.g. "Show all laptops in Sydney
            Office" or "A printer keeps disconnecting from the network."
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[75%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
              m.role === 'user'
                ? 'self-end bg-slate-800 text-white'
                : 'self-start bg-slate-100 text-slate-800'
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading && <div className="self-start text-sm text-slate-400">Thinking…</div>}
        <div ref={bottomRef} />
      </div>

      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about devices, branches, users, or maintenance…"
          className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-slate-800 text-white text-sm rounded px-4 py-2 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  )
}

export default Assistant

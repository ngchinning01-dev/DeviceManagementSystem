import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'

const AssistantContext = createContext(null)

// Holds the Assistant page's chat messages above the routed pages so the
// conversation survives navigating around the app, not just staying on the
// page. Cleared on logout, and naturally cleared by a full page refresh
// since it's in-memory only (no server-side persistence).
export function AssistantProvider({ children }) {
  const { token } = useAuth()
  const [messages, setMessages] = useState([])

  useEffect(() => {
    if (!token) setMessages([])
  }, [token])

  return (
    <AssistantContext.Provider value={{ messages, setMessages }}>
      {children}
    </AssistantContext.Provider>
  )
}

export const useAssistantChat = () => useContext(AssistantContext)

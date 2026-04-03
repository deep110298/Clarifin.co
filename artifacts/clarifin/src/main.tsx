import { createRoot } from "react-dom/client"
import App from "./App"
import "./index.css"
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react"

if (import.meta.env.VITE_API_BASE_URL) {
  setBaseUrl(import.meta.env.VITE_API_BASE_URL)
}

// Clerk token is wired via window.__clerkGetToken set in App.tsx
setAuthTokenGetter(async () => {
  const getter = (window as Window & { __clerkGetToken?: () => Promise<string | null> }).__clerkGetToken
  return getter ? getter() : null
})

createRoot(document.getElementById("root")!).render(<App />)

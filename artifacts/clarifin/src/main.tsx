import { createRoot } from "react-dom/client"
import App from "./App"
import "./index.css"
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react"
import { supabase } from "./lib/supabase"

if (import.meta.env.VITE_API_BASE_URL) {
  setBaseUrl(import.meta.env.VITE_API_BASE_URL)
}

// Use Supabase session token for all API calls
setAuthTokenGetter(async () => {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
})

createRoot(document.getElementById("root")!).render(<App />)

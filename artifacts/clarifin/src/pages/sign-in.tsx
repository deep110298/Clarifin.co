import { useState } from "react"
import { useLocation } from "wouter"
import { supabase } from "@/lib/supabase"
import logoImg from "@/assets/logo.png"

export default function SignInPage() {
  const [, navigate] = useLocation()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      navigate("/app/dashboard")
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 mb-2">
          <img src={logoImg} alt="Clarifin" className="w-9 h-9 rounded-lg object-cover" />
          <span className="text-2xl font-bold text-[#0D1B2A]">Clarifin</span>
        </div>
        <p className="text-gray-500 text-sm">Sign in to your account</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-sm p-8">
        <h2 className="text-xl font-bold text-[#1A1A2E] mb-6 text-center">Sign in</h2>

        <form onSubmit={handleEmailSignIn} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FACC15]/30 focus:border-[#FACC15]"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FACC15]/30 focus:border-[#FACC15]"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1A1A2E] hover:bg-[#1a2e40] text-white font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>

      <p className="mt-6 text-sm text-gray-500">
        Don't have an account?{" "}
        <button onClick={() => navigate("/sign-up")} className="font-semibold text-[#1A1A2E] hover:underline">
          Sign up
        </button>
      </p>
    </div>
  )
}

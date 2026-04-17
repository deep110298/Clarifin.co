import { useState } from "react"
import { useLocation } from "wouter"
import { supabase } from "@/lib/supabase"
import logoImg from "@/assets/logo.png"

export default function SignUpPage() {
  const [, navigate] = useLocation()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [checkEmail, setCheckEmail] = useState(false)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/app/profile` },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setCheckEmail(true)
    }
  }

  if (checkEmail) {
    return (
      <div className="min-h-screen bg-[#F4F6F8] flex flex-col items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-sm p-8 text-center">
          <div className="w-14 h-14 bg-[#FFF9E6] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📬</span>
          </div>
          <h2 className="text-xl font-bold text-[#1A1A2E] mb-2">Check your email</h2>
          <p className="text-sm text-gray-500 mb-6">We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.</p>
          <button onClick={() => navigate("/sign-in")} className="text-sm text-[#1A1A2E] font-semibold hover:underline">
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 mb-2">
          <img src={logoImg} alt="Clarifin" className="w-9 h-9 rounded-lg object-cover" />
          <span className="text-2xl font-bold text-[#0D1B2A]">Clarifin</span>
        </div>
        <p className="text-gray-500 text-sm">Create your free account</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-sm p-8">
        <h2 className="text-xl font-bold text-[#1A1A2E] mb-6 text-center">Create account</h2>

        <form onSubmit={handleSignUp} className="space-y-4">
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
              minLength={8}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FACC15]/30 focus:border-[#FACC15]"
              placeholder="Min 8 characters"
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#FACC15] hover:bg-yellow-300 text-[#1A1A2E] font-bold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>
      </div>

      <p className="mt-6 text-sm text-gray-500">
        Already have an account?{" "}
        <button onClick={() => navigate("/sign-in")} className="font-semibold text-[#1A1A2E] hover:underline">
          Sign in
        </button>
      </p>
    </div>
  )
}

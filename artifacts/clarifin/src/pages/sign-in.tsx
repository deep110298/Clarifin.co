import { useState, useEffect } from "react"
import { useLocation } from "wouter"
import { supabase } from "@/lib/supabase"
import { T, F, FONT_MONO, FONT_BODY } from "@/lib/atrium-engine"

// ── Mobile hook ────────────────────────────────────────────────────────────────
function useMobile() {
  const [mobile, setMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768)
  useEffect(() => {
    const h = () => setMobile(window.innerWidth < 768)
    window.addEventListener("resize", h)
    return () => window.removeEventListener("resize", h)
  }, [])
  return mobile
}

// ── Brand mark ────────────────────────────────────────────────────────────────
function BrandMark({ size = 22 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      border: `1.5px solid ${T.ink}`,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <div style={{ width: size * 0.36, height: size * 0.36, background: T.ink, borderRadius: "50%" }} />
    </div>
  )
}

// ── Google G SVG ──────────────────────────────────────────────────────────────
function GoogleG({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  )
}

function AppleLogo({ color = "#000", size = 16 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden fill={color}>
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
    </svg>
  )
}

// ── Provider sheet (simulated OAuth chrome) ───────────────────────────────────
function ProviderSheet({ provider, onClose, onAuthed }: {
  provider: "google" | "apple"
  onClose: () => void
  onAuthed: (name: string) => void
}) {
  const [step, setStep] = useState<"email" | "pw">("email")
  const [email, setEmail] = useState("")
  const [pw, setPw] = useState("")
  const [err, setErr] = useState("")
  const [busy, setBusy] = useState(false)

  const isGoogle = provider === "google"
  const brandBg = "#fff"
  const brandInk = "#202124"
  const brandAccent = isGoogle ? "#1a73e8" : "#000"

  const next = () => {
    setErr("")
    if (step === "email") {
      if (!email || !email.includes("@")) return setErr(isGoogle ? "Enter a valid email or phone." : "Enter a valid Apple ID.")
      setStep("pw")
    } else {
      if (!pw) return setErr("Enter your password.")
      setBusy(true)
      setTimeout(() => {
        const name = email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
        onAuthed(name || (isGoogle ? "Google User" : "Apple User"))
      }, 700)
    }
  }

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(20,18,16,0.5)", backdropFilter: "blur(3px)",
      zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: 420, background: brandBg, color: brandInk, borderRadius: 12,
        boxShadow: "0 20px 60px rgba(0,0,0,0.35)", overflow: "hidden",
        fontFamily: isGoogle ? '"Google Sans",Roboto,system-ui,sans-serif' : '"SF Pro Display",-apple-system,system-ui,sans-serif',
      }}>
        {/* Chrome bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: "1px solid #ececec", fontSize: 12, color: "#5f6368" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
              <span key={c} style={{ display: "inline-block", width: 12, height: 12, background: c, borderRadius: "50%" }} />
            ))}
          </div>
          <span>{isGoogle ? "accounts.google.com" : "appleid.apple.com"}</span>
          <span onClick={onClose} style={{ cursor: "pointer", fontSize: 16, color: "#5f6368" }}>×</span>
        </div>

        <div style={{ padding: "32px 40px 28px" }}>
          <div style={{ marginBottom: 22, display: "flex", justifyContent: isGoogle ? "flex-start" : "center" }}>
            {isGoogle ? <GoogleG size={28} /> : <AppleLogo color="#000" size={36} />}
          </div>
          <div style={{ fontSize: 24, fontWeight: 400, letterSpacing: -0.2, marginBottom: 6, textAlign: isGoogle ? "left" : "center" }}>
            {step === "email" ? (isGoogle ? "Sign in" : "Sign in with Apple") : "Welcome"}
          </div>
          <div style={{ fontSize: 14, color: "#5f6368", marginBottom: 24, textAlign: isGoogle ? "left" : "center" }}>
            {step === "email" ? <>to continue to <span style={{ color: brandInk, fontWeight: 500 }}>Clarifin</span></> : <span style={{ color: brandInk }}>{email}</span>}
          </div>

          {step === "email" ? (
            <div>
              <label style={{ display: "block", position: "relative", marginBottom: 6 }}>
                <span style={{ position: "absolute", left: 12, top: email ? 6 : 14, fontSize: email ? 11 : 14, color: email ? brandAccent : "#5f6368", pointerEvents: "none", transition: "all .15s", background: brandBg, padding: "0 4px" }}>
                  {isGoogle ? "Email or phone" : "Apple ID"}
                </span>
                <input type="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && next()}
                  style={{ width: "100%", boxSizing: "border-box", padding: "20px 12px 8px", fontSize: 15, border: `1px solid ${err ? "#d93025" : "#dadce0"}`, borderRadius: 4, outline: "none", fontFamily: "inherit" }}
                  onFocus={(e) => (e.target.style.borderColor = err ? "#d93025" : brandAccent)}
                  onBlur={(e) => (e.target.style.borderColor = err ? "#d93025" : "#dadce0")} />
              </label>
              {err && <div style={{ fontSize: 12, color: "#d93025", marginBottom: 8 }}>{err}</div>}
              <div style={{ fontSize: 13, color: brandAccent, marginTop: 18, marginBottom: 38, cursor: "pointer", fontWeight: 500 }}>
                {isGoogle ? "Forgot email?" : "Forgot Apple ID or password?"}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, color: brandAccent, fontWeight: 500, cursor: "pointer" }}>Create account</span>
                <button onClick={next} style={{ background: brandAccent, color: "#fff", border: "none", padding: "10px 24px", borderRadius: 4, fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>Next</button>
              </div>
            </div>
          ) : (
            <div>
              <label style={{ display: "block", position: "relative", marginBottom: 6 }}>
                <span style={{ position: "absolute", left: 12, top: pw ? 6 : 14, fontSize: pw ? 11 : 14, color: pw ? brandAccent : "#5f6368", pointerEvents: "none", transition: "all .15s", background: brandBg, padding: "0 4px" }}>
                  Enter your password
                </span>
                <input type="password" autoFocus value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && next()}
                  style={{ width: "100%", boxSizing: "border-box", padding: "20px 12px 8px", fontSize: 15, border: `1px solid ${err ? "#d93025" : "#dadce0"}`, borderRadius: 4, outline: "none", fontFamily: "inherit" }}
                  onFocus={(e) => (e.target.style.borderColor = err ? "#d93025" : brandAccent)}
                  onBlur={(e) => (e.target.style.borderColor = err ? "#d93025" : "#dadce0")} />
              </label>
              {err && <div style={{ fontSize: 12, color: "#d93025", marginBottom: 8 }}>{err}</div>}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 36 }}>
                <span onClick={() => setStep("email")} style={{ fontSize: 14, color: brandAccent, fontWeight: 500, cursor: "pointer" }}>Back</span>
                <button onClick={next} disabled={busy} style={{ background: brandAccent, color: "#fff", border: "none", padding: "10px 24px", borderRadius: 4, fontSize: 14, fontWeight: 500, cursor: busy ? "wait" : "pointer", fontFamily: "inherit" }}>
                  {busy ? "Signing in…" : "Next"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 22px", fontSize: 11, color: "#5f6368", background: "#fafafa" }}>
          <span>English (United States)</span>
          <div style={{ display: "flex", gap: 18 }}>
            {["Help", "Privacy", "Terms"].map((t) => <span key={t} style={{ cursor: "pointer" }}>{t}</span>)}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Forgot password sheet ─────────────────────────────────────────────────────
function ForgotPasswordSheet({ initialEmail, onClose }: { initialEmail: string; onClose: () => void }) {
  const [email, setEmail] = useState(initialEmail)
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState("")
  const [busy, setBusy] = useState(false)

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr("")
    if (!email || !email.includes("@")) return setErr("Enter a valid email.")
    setBusy(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/sign-in`,
      })
      if (error) throw error
      setSent(true)
    } catch (err: unknown) {
      setErr(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(20,18,16,0.55)", backdropFilter: "blur(3px)",
      zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: 460, background: T.paper, color: T.ink, border: `1px solid ${T.line}`,
        boxShadow: "0 20px 60px rgba(0,0,0,0.25)", fontFamily: FONT_BODY,
        padding: "36px 40px 32px", position: "relative",
      }}>
        <span onClick={onClose} style={{ position: "absolute", top: 14, right: 16, cursor: "pointer", fontSize: 22, color: T.mute, lineHeight: "1" }}>×</span>

        {!sent ? (
          <>
            <div style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: "0.22em", color: T.mute, marginBottom: 12 }}>FORGOTTEN PASSWORD</div>
            <div style={{ fontFamily: F.display, fontSize: 30, lineHeight: 1.05, letterSpacing: -0.5, marginBottom: 12 }}>
              We'll send you a <em style={{ color: T.accent }}>reset link</em>.
            </div>
            <div style={{ fontFamily: F.display, fontStyle: "italic", fontSize: 15, color: T.ink2, lineHeight: 1.55, marginBottom: 24 }}>
              Enter the email tied to your study. The link expires in 30 minutes — for your safety.
            </div>
            <form onSubmit={send} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: "0.18em", color: T.mute }}>EMAIL</span>
                <input type="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@studio.co"
                  autoComplete="off"
                  style={{ background: T.paper, border: `1px solid ${T.line2}`, color: T.ink, padding: "12px 14px", fontFamily: "inherit", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" }}
                  onFocus={(e) => (e.target.style.borderColor = T.ink)}
                  onBlur={(e) => (e.target.style.borderColor = T.line2)} />
              </label>
              {err && <div style={{ fontFamily: F.display, fontStyle: "italic", fontSize: 13, color: "#b15050" }}>{err}</div>}
              <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                <button type="button" onClick={onClose} style={{ background: T.paper, color: T.ink, border: `1px solid ${T.line2}`, padding: "13px 20px", fontFamily: FONT_MONO, fontSize: 11, letterSpacing: "0.16em", cursor: "pointer", flex: 1 }}>CANCEL</button>
                <button type="submit" disabled={busy} style={{ background: T.ink, color: T.paper, border: "none", padding: "13px 20px", fontFamily: FONT_MONO, fontSize: 11, letterSpacing: "0.16em", cursor: busy ? "wait" : "pointer", flex: 2 }}>
                  {busy ? "SENDING…" : "SEND RESET LINK →"}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <div style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: "0.22em", color: T.mute, marginBottom: 12 }}>CHECK YOUR INBOX</div>
            <div style={{ fontFamily: F.display, fontSize: 30, lineHeight: 1.05, letterSpacing: -0.5, marginBottom: 14 }}>
              Sent. <em style={{ color: T.accent }}>Look for us</em> in your mail.
            </div>
            <div style={{ fontFamily: F.display, fontStyle: "italic", fontSize: 15, color: T.ink2, lineHeight: 1.55, marginBottom: 22 }}>
              A reset link is on the way to <span style={{ color: T.ink, fontStyle: "normal" }}>{email}</span>. It's good for the next 30 minutes.
            </div>
            <div style={{ borderTop: `1px solid ${T.line}`, paddingTop: 18, fontSize: 13, color: T.ink2, marginBottom: 22, lineHeight: 1.6 }}>
              No email? Check spam, or{" "}
              <span onClick={() => setSent(false)} style={{ color: T.accent, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}>
                try a different address
              </span>.
            </div>
            <button onClick={onClose} style={{ background: T.ink, color: T.paper, border: "none", padding: "13px 20px", width: "100%", fontFamily: FONT_MONO, fontSize: 11, letterSpacing: "0.16em", cursor: "pointer" }}>
              BACK TO LOG IN
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── Input helpers ─────────────────────────────────────────────────────────────
const authInputStyle: React.CSSProperties = {
  background: T.paper,
  border: `1px solid ${T.line2}`,
  color: T.ink,
  padding: "12px 14px",
  fontFamily: "inherit",
  fontSize: 14,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
}

function AuthField({ label, right, children }: { label: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: "0.18em", color: T.mute }}>{label}</span>
        {right}
      </span>
      {children}
    </label>
  )
}

// ── Main auth page ────────────────────────────────────────────────────────────
export default function SignInPage() {
  const [, navigate] = useLocation()
  const isMobile = useMobile()
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [email, setEmail] = useState("")
  const [pw, setPw] = useState("")
  const [pw2, setPw2] = useState("")
  const [err, setErr] = useState("")
  const [busy, setBusy] = useState(false)
  const [providerSheet, setProviderSheet] = useState<"google" | "apple" | null>(null)
  const [forgot, setForgot] = useState(false)

  const socialBtnStyle: React.CSSProperties = {
    background: T.paper,
    border: `1px solid ${T.line2}`,
    color: T.ink,
    padding: "11px 12px",
    fontFamily: FONT_BODY,
    fontSize: 14,
    cursor: busy ? "wait" : "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    transition: "all .2s",
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr("")
    if (mode === "signup" && pw !== pw2) return setErr("Passwords don't match.")
    if (pw.length < 8) return setErr("Password must be at least 8 characters.")
    setBusy(true)
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password: pw })
        if (error) throw error
        navigate("/app/onboarding")
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pw })
        if (error) throw error
        navigate("/app")
      }
    } catch (err: unknown) {
      setErr(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setBusy(false)
    }
  }

  const handleOAuthSuccess = (_name: string) => {
    setProviderSheet(null)
    // In production: supabase.auth.signInWithOAuth({ provider: ... })
    // For now navigate to app after simulated OAuth
    navigate("/app")
  }

  return (
    <div className="cl-auth-grid" style={{ minHeight: "100vh", background: T.paper, fontFamily: FONT_BODY, display: "grid", gridTemplateColumns: "1.05fr 1fr" }}>

      {/* Left — editorial pitch */}
      <div className="cl-auth-left" style={{ display: "flex", background: T.cream, padding: "48px 56px", flexDirection: "column", justifyContent: "space-between", borderRight: `1px solid ${T.line}` }}>
        {/* Top nav */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <BrandMark size={24} />
          <span style={{ fontFamily: F.display, fontSize: 20, letterSpacing: -0.3, fontWeight: 500 }}>Clarifin</span>
        </div>

        {/* Hero copy */}
        <div style={{ maxWidth: 480 }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: "0.22em", color: T.mute, marginBottom: 20 }}>
            A STUDY IN YOUR FINANCIAL FUTURE
          </div>
          <div style={{ fontFamily: F.display, fontSize: 64, lineHeight: 1, letterSpacing: -1.5, fontWeight: 400, color: T.ink, marginBottom: 24 }}>
            Your money,<br /> quietly <em style={{ color: T.ink2 }}>rehearsed.</em>
          </div>
          <div style={{ fontFamily: F.display, fontStyle: "italic", fontSize: 18, color: T.ink2, lineHeight: 1.55, marginBottom: 40 }}>
            Run as many what-ifs as you like. What if you took a year off? What if you retired at 52? The numbers don't lie, but they do negotiate.
          </div>
          {/* Quiet testimonial */}
          <div style={{ borderLeft: `2px solid ${T.line2}`, paddingLeft: 20 }}>
            <div style={{ fontFamily: F.display, fontStyle: "italic", fontSize: 16, color: T.ink, lineHeight: 1.5, marginBottom: 8 }}>
              "It's the first time I've looked at retirement numbers without looking away."
            </div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: "0.16em", color: T.mute }}>
              EARLY BETA USER &nbsp;·&nbsp; SAN FRANCISCO
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: "0.18em", color: T.mute, display: "flex", gap: 24 }}>
          <span>© 2026 CLARIFIN</span>
          <span>EST. 2026</span>
        </div>
      </div>

      {/* Right — form */}
      <div className="cl-auth-right" style={{ padding: "56px 56px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ maxWidth: 380, margin: "0 auto", width: "100%" }}>
          {/* Mobile brand header — CSS shows on mobile only */}
          <div className="cl-mobile-brand" style={{ alignItems: "center", gap: 10, marginBottom: 32 }}>
            <BrandMark size={22} />
            <span style={{ fontFamily: F.display, fontSize: 20, letterSpacing: -0.3, fontWeight: 500 }}>Clarifin</span>
          </div>
          {/* Mode header */}
          <div style={{ marginBottom: 26 }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: "0.22em", color: T.mute, marginBottom: 8 }}>
              {mode === "signup" ? "NEW HERE" : "WELCOME BACK"}
            </div>
            <div style={{ fontFamily: F.display, fontSize: 34, lineHeight: 1, letterSpacing: -0.6 }}>
              {mode === "signup"
                ? <span>Create your <em style={{ color: T.accent }}>study</em>.</span>
                : <span>Log in to <em style={{ color: T.accent }}>continue</em>.</span>}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${T.line}`, marginBottom: 24 }}>
            {([["signup", "Sign up"], ["login", "Log in"]] as const).map(([k, l]) => (
              <div key={k} onClick={() => { setMode(k); setErr("") }} style={{
                padding: "12px 0", marginRight: 28, fontFamily: FONT_MONO, fontSize: 11, letterSpacing: "0.16em",
                cursor: "pointer", color: mode === k ? T.ink : T.mute, whiteSpace: "nowrap",
                borderBottom: mode === k ? `2px solid ${T.accent}` : "2px solid transparent",
                marginBottom: -1, transition: "color .2s",
              }}>{l.toUpperCase()}</div>
            ))}
          </div>

          {/* Social */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8 }}>
            <button type="button" disabled={busy} onClick={() => setProviderSheet("google")} style={socialBtnStyle}
              onMouseEnter={(e) => { if (!busy) e.currentTarget.style.borderColor = T.ink }}
              onMouseLeave={(e) => { if (!busy) e.currentTarget.style.borderColor = T.line2 }}>
              <GoogleG />
              <span style={{ fontFamily: F.display, fontSize: 14 }}>Google</span>
            </button>
            <button type="button" disabled={busy} onClick={() => setProviderSheet("apple")} style={socialBtnStyle}
              onMouseEnter={(e) => { if (!busy) e.currentTarget.style.borderColor = T.ink }}
              onMouseLeave={(e) => { if (!busy) e.currentTarget.style.borderColor = T.line2 }}>
              <AppleLogo color={T.ink} />
              <span style={{ fontFamily: F.display, fontSize: 14 }}>Apple</span>
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0 18px" }}>
            <div style={{ flex: 1, height: 1, background: T.line }} />
            <span style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: "0.22em", color: T.mute }}>OR WITH EMAIL</span>
            <div style={{ flex: 1, height: 1, background: T.line }} />
          </div>

          {/* Form */}
          <form onSubmit={submit} autoComplete="off" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <AuthField label="EMAIL">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@studio.co"
                autoComplete="off" style={authInputStyle}
                onFocus={(e) => (e.target.style.borderColor = T.ink)}
                onBlur={(e) => (e.target.style.borderColor = T.line2)} />
            </AuthField>

            <AuthField label="PASSWORD" right={
              mode === "login" ? (
                <span onClick={() => setForgot(true)} style={{ fontFamily: F.display, fontStyle: "italic", fontSize: 12, color: T.accent, cursor: "pointer" }}>
                  Forgot?
                </span>
              ) : undefined
            }>
              <input type="password" value={pw} onChange={(e) => setPw(e.target.value)}
                placeholder={mode === "signup" ? "At least 8 characters" : "••••••••"}
                autoComplete="new-password" style={authInputStyle}
                onFocus={(e) => (e.target.style.borderColor = T.ink)}
                onBlur={(e) => (e.target.style.borderColor = T.line2)} />
            </AuthField>

            {mode === "signup" && (
              <AuthField label="CONFIRM PASSWORD">
                <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="Once more"
                  autoComplete="new-password" style={authInputStyle}
                  onFocus={(e) => (e.target.style.borderColor = T.ink)}
                  onBlur={(e) => (e.target.style.borderColor = T.line2)} />
              </AuthField>
            )}

            {err && (
              <div style={{ fontFamily: F.display, fontStyle: "italic", fontSize: 13, color: "#b15050" }}>{err}</div>
            )}

            <button type="submit" disabled={busy} style={{
              background: T.ink, color: T.paper, border: "none", padding: "14px 22px",
              fontFamily: FONT_MONO, fontSize: 11, letterSpacing: "0.18em", cursor: busy ? "wait" : "pointer",
              fontWeight: 500, marginTop: 6,
            }}>
              {busy ? "ONE MOMENT…" : mode === "signup" ? "CREATE ACCOUNT →" : "LOG IN →"}
            </button>

            <div style={{ textAlign: "center", fontFamily: F.display, fontStyle: "italic", fontSize: 14, color: T.ink2, marginTop: 8 }}>
              {mode === "signup" ? (
                <>Already have an account?{" "}
                  <span onClick={() => { setMode("login"); setErr("") }} style={{ color: T.accent, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}>Log in</span>
                </>
              ) : (
                <>New to Clarifin?{" "}
                  <span onClick={() => { setMode("signup"); setErr("") }} style={{ color: T.accent, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}>Sign up</span>
                </>
              )}
            </div>

            <div style={{ fontFamily: F.display, fontStyle: "italic", fontSize: 12.5, color: T.mute, textAlign: "center", marginTop: 14, lineHeight: 1.55 }}>
              By continuing, you agree to our{" "}
              <span style={{ color: T.ink2, borderBottom: `1px solid ${T.line2}`, cursor: "pointer", paddingBottom: 1 }}>Terms of Service</span>
              {" & "}
              <span style={{ color: T.ink2, borderBottom: `1px solid ${T.line2}`, cursor: "pointer", paddingBottom: 1 }}>Privacy Policy</span>.
            </div>
          </form>
        </div>
      </div>

      {/* Provider sheet modals */}
      {providerSheet && (
        <ProviderSheet provider={providerSheet} onClose={() => setProviderSheet(null)} onAuthed={handleOAuthSuccess} />
      )}

      {/* Forgot password modal */}
      {forgot && (
        <ForgotPasswordSheet initialEmail={email} onClose={() => setForgot(false)} />
      )}
    </div>
  )
}

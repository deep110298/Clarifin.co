import { useState } from "react"
import { useLocation } from "wouter"
import { supabase } from "@/lib/supabase"

const T = {
  paper: "#eeeeec",
  cream: "#dfdfdb",
  panel: "#f4f4f1",
  ink: "#0a0a09",
  ink2: "#33332f",
  line: "rgba(10,10,9,0.12)",
  line2: "rgba(10,10,9,0.26)",
  accent: "#0a0a09",
  mute: "rgba(10,10,9,0.55)",
};

const MONO = "JetBrains Mono, monospace";
const SERIF = "Cormorant Garamond, Georgia, serif";
const BODY = "Geist, Inter, system-ui, sans-serif";

function BrandMark({ size = 22 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      border: "1.5px solid #0a0a09",
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <div style={{ width: size * 0.36, height: size * 0.36, background: "#0a0a09", borderRadius: "50%" }} />
    </div>
  );
}

function GoogleG() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

function AuthField({
  label, children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.18em", color: T.mute }}>
        {label}
      </span>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  background: T.paper,
  border: `1px solid ${T.line2}`,
  color: T.ink,
  padding: "12px 14px",
  fontFamily: BODY,
  fontSize: 14,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 0,
  transition: "border-color 0.15s",
};

export default function SignUpPage() {
  const [, navigate] = useLocation()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [checkEmail, setCheckEmail] = useState(false)

  const handleGoogle = async () => {
    setGoogleLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/app/profile` },
    })
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email || !email.includes("@")) {
      setError("Enter a valid email.")
      return
    }
    if (password.length < 8) {
      setError("Password should be at least 8 characters.")
      return
    }
    if (password !== confirm) {
      setError("Passwords don't match.")
      return
    }
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
      <div style={{
        minHeight: "100vh", background: T.paper, color: T.ink,
        fontFamily: BODY, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          width: "100%", maxWidth: 460, background: T.panel,
          border: `1px solid ${T.line}`, padding: "48px 44px",
        }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.22em", color: T.mute, marginBottom: 18 }}>
            CHECK YOUR INBOX
          </div>
          <div style={{ fontFamily: SERIF, fontSize: 34, lineHeight: 1.05, letterSpacing: -0.6, marginBottom: 14 }}>
            Sent. <em>Look for us</em> in your mail.
          </div>
          <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 15, color: T.ink2, lineHeight: 1.55, marginBottom: 28 }}>
            We sent a confirmation link to <span style={{ color: T.ink, fontStyle: "normal" }}>{email}</span>.
            Click it to activate your account.
          </div>
          <button
            onClick={() => navigate("/sign-in")}
            style={{
              background: T.ink, color: T.paper, border: "none", padding: "14px 22px",
              fontFamily: MONO, fontSize: 11, letterSpacing: "0.18em",
              cursor: "pointer", width: "100%", borderRadius: 0,
            }}
          >BACK TO LOG IN</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: "100vh", background: T.paper, color: T.ink,
      fontFamily: BODY, display: "grid", gridTemplateColumns: "1.05fr 1fr",
      position: "relative",
    }}>
      {/* Left — editorial pitch */}
      <div style={{
        padding: "48px 56px 56px",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        borderRight: `1px solid ${T.line}`, background: T.cream,
      }}>
        <a href="/" style={{ textDecoration: "none", color: "inherit" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
            <BrandMark size={22} />
            <span style={{ fontFamily: SERIF, fontSize: 19, color: T.ink }}>Clarifin</span>
          </div>
        </a>

        <div style={{ maxWidth: 460 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.22em", color: T.mute, marginBottom: 18 }}>
            ENTER THE STUDY
          </div>
          <div style={{
            fontFamily: SERIF, fontSize: 64, lineHeight: 1, letterSpacing: -1.5,
            fontWeight: 400, marginBottom: 22,
          }}>
            Your money,<br /><em style={{ color: T.ink }}>quietly</em><br />rehearsed.
          </div>
          <div style={{
            fontFamily: SERIF, fontSize: 18, fontStyle: "italic",
            color: T.ink2, lineHeight: 1.5, marginBottom: 30,
          }}>
            One account, every scenario. Your numbers are encrypted at rest and never shared.
            Cancel any time, your work stays.
          </div>
          <div style={{ borderTop: `1px solid ${T.line}`, paddingTop: 18 }}>
            {[
              ["Encrypted at rest", "AES-256 on every record."],
              ["No bank login required", "You type what you know."],
              ["Family profiles", "Up to four people on one plan."],
            ].map(([title, desc]) => (
              <div key={title} style={{ display: "flex", gap: 14, padding: "10px 0" }}>
                <span style={{ fontFamily: SERIF, fontStyle: "italic", color: T.ink, marginTop: 1 }}>◆</span>
                <div>
                  <div style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 500 }}>{title}</div>
                  <div style={{ fontSize: 12.5, color: T.ink2 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.18em", color: T.mute }}>
          © 2026 &nbsp;·&nbsp; CLARIFIN
        </div>
      </div>

      {/* Right — form */}
      <div style={{
        padding: "56px 56px",
        display: "flex", flexDirection: "column", justifyContent: "center",
      }}>
        <div style={{ maxWidth: 380, margin: "0 auto", width: "100%" }}>
          {/* Mode header */}
          <div style={{ marginBottom: 26 }}>
            <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.22em", color: T.mute, marginBottom: 8 }}>
              NEW HERE
            </div>
            <div style={{ fontFamily: SERIF, fontSize: 34, lineHeight: 1, letterSpacing: -0.6 }}>
              Create your <em style={{ color: T.ink }}>study</em>.
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: `1px solid ${T.line}`, marginBottom: 24 }}>
            <div style={{
              padding: "12px 0", marginRight: 28,
              fontFamily: MONO, fontSize: 11, letterSpacing: "0.16em",
              cursor: "pointer", color: T.ink, whiteSpace: "nowrap",
              borderBottom: `2px solid ${T.accent}`, marginBottom: -1,
            }}>SIGN UP</div>
            <a href="/sign-in" style={{ textDecoration: "none" }}>
              <div style={{
                padding: "12px 0", marginRight: 28,
                fontFamily: MONO, fontSize: 11, letterSpacing: "0.16em",
                cursor: "pointer", color: T.mute, whiteSpace: "nowrap",
                borderBottom: "2px solid transparent", marginBottom: -1,
              }}>LOG IN</div>
            </a>
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            style={{
              width: "100%", background: T.paper, border: `1px solid ${T.line2}`, color: T.ink,
              padding: "11px 12px", fontFamily: BODY, fontSize: 14,
              cursor: googleLoading ? "wait" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              borderRadius: 0, marginBottom: 8,
            }}
          >
            <GoogleG />
            <span style={{ fontFamily: SERIF, fontSize: 14 }}>
              {googleLoading ? "Redirecting…" : "Continue with Google"}
            </span>
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0 18px" }}>
            <div style={{ flex: 1, height: 1, background: T.line }} />
            <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.22em", color: T.mute }}>OR WITH EMAIL</span>
            <div style={{ flex: 1, height: 1, background: T.line }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSignUp} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <AuthField label="EMAIL">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@studio.co"
                required
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = T.ink; }}
                onBlur={(e) => { e.target.style.borderColor = T.line2; }}
              />
            </AuthField>

            <AuthField label="PASSWORD">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                minLength={8}
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = T.ink; }}
                onBlur={(e) => { e.target.style.borderColor = T.line2; }}
              />
            </AuthField>

            <AuthField label="CONFIRM PASSWORD">
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Once more"
                required
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = T.ink; }}
                onBlur={(e) => { e.target.style.borderColor = T.line2; }}
              />
            </AuthField>

            {error && (
              <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 13, color: "#b15050" }}>{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                background: T.ink, color: T.paper, border: "none", padding: "14px 22px",
                fontFamily: MONO, fontSize: 11, letterSpacing: "0.18em",
                cursor: loading ? "wait" : "pointer", fontWeight: 500, marginTop: 6, borderRadius: 0,
              }}
            >
              {loading ? "ONE MOMENT…" : "CREATE ACCOUNT →"}
            </button>

            <div style={{
              textAlign: "center", fontFamily: SERIF, fontStyle: "italic",
              fontSize: 14, color: T.ink2, marginTop: 8,
            }}>
              Already have an account?{" "}
              <a href="/sign-in" style={{
                color: T.ink, cursor: "pointer",
                textDecoration: "underline", textUnderlineOffset: 3,
              }}>Log in</a>
            </div>

            <div style={{
              fontFamily: SERIF, fontStyle: "italic", fontSize: 12.5,
              color: T.mute, textAlign: "center", marginTop: 14, lineHeight: 1.55,
            }}>
              By continuing, you agree to our{" "}
              <span style={{ color: T.ink2, borderBottom: `1px solid ${T.line2}`, cursor: "pointer", paddingBottom: 1 }}>
                Terms of Service
              </span>
              {" & "}
              <span style={{ color: T.ink2, borderBottom: `1px solid ${T.line2}`, cursor: "pointer", paddingBottom: 1 }}>
                Privacy Policy
              </span>.
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

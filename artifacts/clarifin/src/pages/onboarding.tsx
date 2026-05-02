import { useState, useRef, useEffect } from "react"
import { useLocation } from "wouter"
import { useSupabaseAuth } from "@/lib/supabase"
import {
  T, F, FONT_MONO, FONT_BODY,
  simulateAtrium, fmtA,
  DEFAULT_SCENARIO, SECOND_SCENARIO,
  saveIntake, saveScenarios, intakeToScenario,
  QUESTION_OPTIONS,
  type Intake,
} from "@/lib/atrium-engine"

// ── MiniChart SVG ──────────────────────────────────────────────────────────────
function MiniChart({ path, retireAge }: { path: { age: number; nw: number; lo: number; hi: number }[]; retireAge: number }) {
  if (!path.length) return null
  const W = 240, H = 80
  const pad = { t: 8, r: 8, b: 8, l: 8 }
  const xMin = path[0].age, xMax = path[path.length - 1].age
  const yMax = Math.max(...path.map((d) => d.hi))
  const yMin = Math.min(0, ...path.map((d) => d.lo))
  const x = (a: number) => pad.l + ((a - xMin) / (xMax - xMin || 1)) * (W - pad.l - pad.r)
  const y = (v: number) => pad.t + (1 - (v - yMin) / (yMax - yMin || 1)) * (H - pad.t - pad.b)
  const line = path.map((d, i) => (i === 0 ? "M" : "L") + x(d.age).toFixed(1) + "," + y(d.nw).toFixed(1)).join(" ")
  const band = [
    ...path.map((d, i) => (i === 0 ? "M" : "L") + x(d.age).toFixed(1) + "," + y(d.hi).toFixed(1)),
    ...[...path].reverse().map((d) => "L" + x(d.age).toFixed(1) + "," + y(d.lo).toFixed(1)), "Z",
  ].join(" ")
  const rx = x(retireAge)
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      <path d={band} fill={T.accent} opacity="0.12" />
      <path d={line} stroke={T.accent} strokeWidth="1.5" fill="none" />
      {rx >= pad.l && rx <= W - pad.r && (
        <line x1={rx} x2={rx} y1={pad.t} y2={H - pad.b} stroke={T.mute} strokeDasharray="2 2" strokeWidth="0.6" />
      )}
    </svg>
  )
}

// ── Live preview card ──────────────────────────────────────────────────────────
function SignupPreview({ intake, step }: { intake: Intake; step: number }) {
  const scenario = intakeToScenario(intake, { ...DEFAULT_SCENARIO })
  const result = simulateAtrium(scenario)
  const confidence = result.ruinAge ? Math.max(20, 100 - Math.round(((result.ruinAge - scenario.age) / (scenario.endAge - scenario.age)) * 100)) : 87

  return (
    <div style={{ background: T.paper, border: `1px solid ${T.line}`, padding: "28px 28px", display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: "0.22em", color: T.mute }}>DRAFT · YOUR STUDY</div>

      {step >= 1 && intake.question && (
        <div style={{ fontFamily: F.display, fontStyle: "italic", fontSize: 17, color: T.ink2, lineHeight: 1.4 }}>
          "{intake.question.toLowerCase()}"
        </div>
      )}

      <div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: "0.16em", color: T.mute, marginBottom: 4 }}>NET WORTH AT RETIRE</div>
        <div style={{ fontFamily: F.display, fontSize: 56, letterSpacing: -1.2, fontWeight: 400, color: T.ink, lineHeight: 1 }}>
          {fmtA(result.atRetire.nw, { short: true })}
        </div>
      </div>

      {step >= 2 && (
        <MiniChart path={result.path} retireAge={scenario.retireAge} />
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, paddingTop: 14, borderTop: `1px solid ${T.line}` }}>
        {[
          ["PEAK", fmtA(result.peak.nw, { short: true })],
          ["LEGACY", fmtA(result.legacy, { short: true })],
          ["CONFIDENCE", confidence + "%"],
        ].map(([k, v]) => (
          <div key={k}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 8.5, letterSpacing: "0.16em", color: T.mute, marginBottom: 4 }}>{k}</div>
            <div style={{ fontFamily: F.display, fontSize: 16, color: T.ink }}>{v}</div>
          </div>
        ))}
      </div>

      {step >= 3 && intake.name && (
        <div style={{ borderTop: `1px solid ${T.line}`, paddingTop: 14 }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: "0.16em", color: T.mute, marginBottom: 4 }}>STUDY BELONGS TO</div>
          <div style={{ fontFamily: F.display, fontSize: 20, fontStyle: "italic", color: T.ink }}>{intake.name}</div>
        </div>
      )}
    </div>
  )
}

// ── Editorial photo plate ─────────────────────────────────────────────────────
const PLATE_PHOTOS = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80", // mountains
  "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=600&q=80", // sunset
  "https://images.unsplash.com/photo-1439405326854-014607f694d7?w=600&q=80", // city lights
]
const PLATE_LABELS = ["PLATE I", "PLATE II", "PLATE III"]
const PLATE_CAPTIONS = [
  "What you're thinking about shapes what you can become.",
  "The numbers don't lie, but they do negotiate.",
  "Every plan is a rehearsal. Rehearse well.",
]

function SignupPlate({ step }: { step: number }) {
  const i = Math.min(step, PLATE_PHOTOS.length - 1)
  return (
    <div style={{ position: "relative", overflow: "hidden", height: "100%" }}>
      <img src={PLATE_PHOTOS[i]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "sepia(0.45) contrast(0.95)", transition: "opacity .4s" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 55%, rgba(10,10,9,0.75))" }} />
      <div style={{ position: "absolute", top: 20, left: 20, fontFamily: FONT_MONO, fontSize: 9, letterSpacing: "0.22em", color: "rgba(255,255,255,0.6)" }}>
        {PLATE_LABELS[i]}
      </div>
      <div style={{ position: "absolute", bottom: 24, left: 24, right: 24 }}>
        <div style={{ fontFamily: F.display, fontStyle: "italic", fontSize: 16, color: "rgba(255,255,255,0.9)", lineHeight: 1.5 }}>
          {PLATE_CAPTIONS[i]}
        </div>
      </div>
    </div>
  )
}

// ── Number input with label ───────────────────────────────────────────────────
function NumberInput({ label, value, onChange, unit }: {
  label: string; value: number; onChange: (v: number) => void; unit?: string
}) {
  return (
    <div style={{ borderBottom: `1px solid ${T.line}`, paddingBottom: 14, marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <label style={{ fontFamily: F.display, fontStyle: "italic", fontSize: 18, color: T.ink2 }}>{label}</label>
        {unit && <span style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: "0.14em", color: T.mute }}>{unit}</span>}
      </div>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        style={{
          background: "transparent", border: "none", outline: "none",
          fontFamily: F.display, fontSize: 36, fontWeight: 400, letterSpacing: -0.6,
          color: T.ink, width: "100%", padding: "6px 0 0",
        }}
      />
    </div>
  )
}

// ── Main onboarding page ───────────────────────────────────────────────────────
export default function OnboardingPage() {
  const [, navigate] = useLocation()
  const { session } = useSupabaseAuth()
  const [step, setStep] = useState(0) // 0=question, 1=numbers, 2=name
  const [intake, setIntake] = useState<Intake>({
    question: "",
    name: "",
    age: 34,
    income: 220,
    saveRate: 28,
    spend: 84,
    netWorth: 312,
  })
  const progressRef = useRef<HTMLDivElement>(null)

  const update = (patch: Partial<Intake>) => setIntake((prev) => ({ ...prev, ...patch }))

  const next = () => {
    if (step < 2) setStep(step + 1)
    else complete()
  }

  const complete = () => {
    // Save intake to localStorage
    saveIntake(intake)

    // Build and save two scenarios from intake
    const base = intakeToScenario(intake, { ...DEFAULT_SCENARIO })
    const second = intakeToScenario(intake, { ...SECOND_SCENARIO })
    saveScenarios([base, second])

    navigate("/app")
  }

  // Derive display name for the user if available
  const userName = session?.user?.email?.split("@")[0] ?? "friend"
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768)
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener("resize", h)
    return () => window.removeEventListener("resize", h)
  }, [])

  const stepLabels = ["The Question", "The Numbers", "The Name"]

  return (
    <div className="cl-onboarding-grid" style={{ minHeight: "100vh", background: T.paper, fontFamily: FONT_BODY, display: "grid", gridTemplateColumns: "1fr 1fr" }}>

      {/* Left — form */}
      <div className="cl-onboarding-left" style={{ padding: "48px 64px", display: "flex", flexDirection: "column", justifyContent: "space-between", borderRight: `1px solid ${T.line}` }}>
        {/* Progress rail */}
        <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: isMobile ? 28 : 48 }}>
          {stepLabels.map((l, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 0 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: i <= step ? "pointer" : "default" }} onClick={() => i <= step && setStep(i)}>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: i === step ? T.ink : i < step ? T.ink2 : "transparent",
                  border: `1.5px solid ${i <= step ? T.ink : T.line2}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: FONT_MONO, fontSize: 9, color: i <= step ? T.paper : T.mute,
                }}>
                  {i < step ? "✓" : i + 1}
                </div>
                {!isMobile && (
                  <span style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: "0.14em", color: i === step ? T.ink : T.mute, whiteSpace: "nowrap" }}>
                    {l.toUpperCase()}
                  </span>
                )}
              </div>
              {i < stepLabels.length - 1 && (
                <div style={{ width: isMobile ? 24 : 40, height: 1, background: i < step ? T.ink2 : T.line, margin: "0 8px", marginBottom: isMobile ? 0 : 20 }} />
              )}
            </div>
          ))}
          {isMobile && (
            <span style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: "0.14em", color: T.mute, marginLeft: 12 }}>
              {stepLabels[step].toUpperCase()}
            </span>
          )}
        </div>

        {/* Step 0: The Question */}
        {step === 0 && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 32 }}>
            <div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: "0.22em", color: T.mute, marginBottom: 16 }}>STEP 1 OF 3</div>
              <div className="cl-hero-xl" style={{ fontFamily: F.display, fontSize: 64, lineHeight: 1, letterSpacing: -1.5, fontWeight: 400, marginBottom: 12 }}>
                I'm thinking<br /> about…
              </div>
              <div style={{ fontFamily: F.display, fontStyle: "italic", fontSize: 17, color: T.ink2, lineHeight: 1.5 }}>
                Pick the question that's been living in your head.
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {QUESTION_OPTIONS.map((q) => {
                const sel = intake.question === q
                return (
                  <div key={q} onClick={() => update({ question: q })} style={{
                    padding: "18px 0", borderBottom: `1px solid ${T.line}`, cursor: "pointer",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    transition: "background .15s",
                  }}>
                    <span style={{ fontFamily: F.display, fontStyle: "italic", fontSize: 22, color: sel ? T.ink : T.ink2 }}>{q}</span>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 14, color: sel ? T.ink : T.mute }}>{sel ? "◆" : "→"}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 1: The Numbers */}
        {step === 1 && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: "0.22em", color: T.mute, marginBottom: 16 }}>STEP 2 OF 3</div>
              <div className="cl-head-md" style={{ fontFamily: F.display, fontSize: 52, lineHeight: 1, letterSpacing: -1.2, fontWeight: 400, marginBottom: 8 }}>
                The numbers<br /> as they stand.
              </div>
              <div style={{ fontFamily: F.display, fontStyle: "italic", fontSize: 15, color: T.ink2 }}>
                Rough is fine. You can refine later.
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <NumberInput label="Current age" value={intake.age} onChange={(v) => update({ age: v })} unit="years" />
              <NumberInput label="Household income" value={intake.income} onChange={(v) => update({ income: v })} unit="$K / yr" />
              <NumberInput label="Save rate" value={intake.saveRate} onChange={(v) => update({ saveRate: v })} unit="%" />
              <NumberInput label="Spend in retirement" value={intake.spend} onChange={(v) => update({ spend: v })} unit="$K / yr" />
              <NumberInput label="Net worth today" value={intake.netWorth} onChange={(v) => update({ netWorth: v })} unit="$K" />
            </div>
          </div>
        )}

        {/* Step 2: The Name */}
        {step === 2 && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 32 }}>
            <div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: "0.22em", color: T.mute, marginBottom: 16 }}>STEP 3 OF 3</div>
              <div className="cl-head-md" style={{ fontFamily: F.display, fontSize: 52, lineHeight: 1, letterSpacing: -1.2, fontWeight: 400, marginBottom: 8 }}>
                What should<br /> we call this study?
              </div>
              <div style={{ fontFamily: F.display, fontStyle: "italic", fontSize: 15, color: T.ink2 }}>
                Usually just your name. Or the name of the question.
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                <span style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: "0.18em", color: T.mute, marginBottom: 10 }}>YOUR NAME</span>
                <input
                  type="text"
                  autoFocus
                  value={intake.name}
                  onChange={(e) => update({ name: e.target.value })}
                  placeholder={userName}
                  style={{
                    fontFamily: F.display, fontStyle: "italic", fontSize: 40, letterSpacing: -0.8,
                    background: "transparent", border: "none", outline: "none",
                    borderBottom: `2px solid ${T.ink}`, color: T.ink,
                    padding: "8px 0", width: "100%",
                  }}
                />
              </label>

              <div style={{ marginTop: 28, background: T.cream, border: `1px solid ${T.line}`, padding: "18px 20px" }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 9.5, letterSpacing: "0.18em", color: T.mute, marginBottom: 6 }}>PRIVACY NOTE</div>
                <div style={{ fontFamily: F.display, fontStyle: "italic", fontSize: 14, color: T.ink2, lineHeight: 1.5 }}>
                  Your numbers live in your browser. We don't store them on our servers unless you explicitly back them up.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 32 }}>
          <button onClick={next} disabled={step === 0 && !intake.question} style={{
            background: (step === 0 && !intake.question) ? T.line2 : T.ink,
            color: T.paper, border: "none", padding: "16px 28px",
            fontFamily: FONT_MONO, fontSize: 11, letterSpacing: "0.18em",
            cursor: (step === 0 && !intake.question) ? "not-allowed" : "pointer",
          }}>
            {step < 2 ? "CONTINUE →" : "OPEN CLARIFIN →"}
          </button>
          {step === 0 && (
            <button onClick={() => next()} style={{ background: "transparent", border: "none", fontFamily: F.display, fontStyle: "italic", fontSize: 14, color: T.mute, cursor: "pointer", textAlign: "left" }}>
              Skip for now
            </button>
          )}
        </div>

        <div ref={progressRef} />
      </div>

      {/* Right — alternating plate / preview */}
      <div className="cl-hide-mobile" style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: 0, height: "100vh" }}>
        <div style={{ overflow: "hidden", borderBottom: `1px solid ${T.line}` }}>
          <SignupPlate step={step} />
        </div>
        <div style={{ padding: "32px 36px", overflowY: "auto" }}>
          <SignupPreview intake={intake} step={step} />
        </div>
      </div>
    </div>
  )
}

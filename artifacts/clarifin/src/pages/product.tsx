import { useState, useEffect, useRef, useCallback } from "react"
import { useLocation } from "wouter"
import { useSupabaseAuth, supabase } from "@/lib/supabase"
import {
  T, F, FONT_MONO, FONT_BODY,
  simulateAtrium, fmtA,
  loadScenarios, saveScenarios,
  loadJournal, saveJournal,
  loadIntake,
  DEFAULT_SCENARIO, SECOND_SCENARIO,
  type AtriumScenario, type AtriumEvent, type JournalEntry, type Intake,
} from "@/lib/atrium-engine"

// ─── Mobile hook ──────────────────────────────────────────────────────────────
function useMobile() {
  const [mobile, setMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768)
  useEffect(() => {
    const h = () => setMobile(window.innerWidth < 768)
    window.addEventListener("resize", h)
    return () => window.removeEventListener("resize", h)
  }, [])
  return mobile
}

// ─── Brand mark ───────────────────────────────────────────────────────────────
function BrandMark({ size = 18 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", border: `1.5px solid ${T.ink}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <div style={{ width: size * 0.38, height: size * 0.38, background: T.ink, borderRadius: "50%" }} />
    </div>
  )
}

// ─── Scenario colors ──────────────────────────────────────────────────────────
const SC_COLORS = [T.accent, T.accent2, T.gold, T.claret, T.sage]

// ─── Overview screen ──────────────────────────────────────────────────────────
function BigTimeline({ curS, result }: { curS: AtriumScenario; result: ReturnType<typeof simulateAtrium> }) {
  const W = 1000, H = 320
  const pad = { t: 70, r: 24, b: 70, l: 24 }
  const innerW = W - pad.l - pad.r, innerH = H - pad.t - pad.b
  const data = result.path
  const xMin = data[0].age, xMax = data[data.length - 1].age
  const yMax = Math.max(...data.map((d) => d.hi))
  const yMin = Math.min(0, ...data.map((d) => d.lo))
  const x = (a: number) => pad.l + ((a - xMin) / (xMax - xMin || 1)) * innerW
  const y = (v: number) => pad.t + (1 - (v - yMin) / (yMax - yMin || 1)) * innerH
  const line = data.map((d, i) => (i === 0 ? "M" : "L") + x(d.age).toFixed(1) + "," + y(d.nw).toFixed(1)).join(" ")
  const band = [
    ...data.map((d, i) => (i === 0 ? "M" : "L") + x(d.age).toFixed(1) + "," + y(d.hi).toFixed(1)),
    ...[...data].reverse().map((d) => "L" + x(d.age).toFixed(1) + "," + y(d.lo).toFixed(1)), "Z",
  ].join(" ")

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      <path d={band} fill={T.accent} opacity="0.1" />
      <path d={line} stroke={T.accent} strokeWidth="2" fill="none" />
      <line x1={pad.l} x2={W - pad.r} y1={H - pad.b} y2={H - pad.b} stroke={T.ink} strokeWidth="0.8" />
      {[30, 40, 50, 60, 70, 80, 90].filter((a) => a >= xMin && a <= xMax).map((a) => (
        <g key={a}>
          <line x1={x(a)} x2={x(a)} y1={H - pad.b} y2={H - pad.b + 5} stroke={T.ink2} strokeWidth="0.5" />
          <text x={x(a)} y={H - pad.b + 18} fontSize="10" fill={T.mute} textAnchor="middle" fontFamily={FONT_MONO} letterSpacing="0.08em">{a}</text>
        </g>
      ))}
      <line x1={x(curS.retireAge)} x2={x(curS.retireAge)} y1={pad.t - 18} y2={H - pad.b} stroke={T.ink} strokeDasharray="3 3" strokeWidth="0.7" opacity="0.5" />
      {curS.events.filter((e) => e.age >= xMin && e.age <= xMax).map((e, i) => {
        const above = i % 2 === 0
        const yL = above ? pad.t - 48 : H - pad.b + 38
        const cy = data.find((d) => d.age === e.age)?.nw ?? 0
        const c = e.kind === "retire" ? T.accent : e.kind === "income-gap" ? T.gold : e.kind === "expense" ? T.accent2 : T.ink2
        return (
          <g key={e.id}>
            <line x1={x(e.age)} x2={x(e.age)} y1={above ? yL + 18 : H - pad.b} y2={above ? y(cy) : yL - 4} stroke={c} strokeWidth="0.7" strokeDasharray="2 2" />
            <circle cx={x(e.age)} cy={y(cy)} r="4" fill={c} stroke={T.paper} strokeWidth="1.8" />
            <text x={x(e.age)} y={yL} fontSize="10" fill={c} textAnchor="middle" fontFamily={FONT_MONO} letterSpacing="0.12em">{e.age}</text>
            <text x={x(e.age)} y={yL + 16} fontSize="14" fill={T.ink} textAnchor="middle" fontFamily={F.display} fontStyle="italic">{e.label}</text>
          </g>
        )
      })}
    </svg>
  )
}

function OverviewScreen({ intake, curS, result, setTab, scenarios, setActiveId }: {
  intake: Intake; curS: AtriumScenario; result: ReturnType<typeof simulateAtrium>;
  setTab: (t: string) => void; scenarios: AtriumScenario[]; setActiveId: (id: string) => void
}) {
  return (
    <div className="cl-overview-grid" style={{ padding: "56px 56px 80px", display: "grid", gridTemplateColumns: "1fr 280px", gap: 56, maxWidth: 1500, margin: "0 auto" }}>
      <div className="cl-overview-left" style={{ display: "flex", flexDirection: "column", gap: 48 }}>
        {/* Hero */}
        <div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: "0.22em", color: T.mute, marginBottom: 16 }}>YOU ASKED</div>
          <div className="cl-hero-lg" style={{ fontFamily: F.display, fontSize: 38, fontStyle: "italic", lineHeight: 1.18, letterSpacing: -0.5, color: T.ink2, marginBottom: 28, maxWidth: 720 }}>
            "{intake.question?.toLowerCase() || "the shape of things"}"
          </div>
          <div className="cl-hero-xl" style={{ fontFamily: F.display, fontSize: 80, lineHeight: 1, letterSpacing: -2, fontWeight: 400, color: result.ruinAge ? T.claret : T.ink, marginBottom: 18 }}>
            {result.ruinAge ? <>Tight, <em>but workable.</em></> : <>Yes, <em style={{ color: T.accent }}>it holds.</em></>}
          </div>
          <div className="cl-overview-body" style={{ fontFamily: F.display, fontSize: 18, fontStyle: "italic", color: T.ink2, lineHeight: 1.5, maxWidth: 640 }}>
            {result.ruinAge
              ? `As drawn, the plan depletes at ${result.ruinAge}. The most leveraged moves are trimming retirement spend by ~8%, or pushing retire-age by two years.`
              : `The plan carries through to ${curS.endAge} with room. A gentle glide — your largest levers are save rate and spend, in that order.`}
          </div>
          <div className="cl-stats-row" style={{ display: "flex", flexWrap: "wrap", gap: 36, marginTop: 32, paddingTop: 24, borderTop: `1px solid ${T.line}` }}>
            {[
              ["At retirement", fmtA(result.atRetire.nw, { short: true }), `age ${curS.retireAge}`],
              ["Peak", fmtA(result.peak.nw, { short: true }), `age ${result.peak.age}`],
              ["Legacy", fmtA(result.legacy, { short: true }), `age ${curS.endAge}`],
            ].map(([k, v, s]) => (
              <div key={k}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 9.5, letterSpacing: "0.18em", color: T.mute, marginBottom: 6 }}>{String(k).toUpperCase()}</div>
                <div style={{ fontFamily: F.display, fontSize: 26, fontWeight: 400, letterSpacing: -0.4, color: T.ink, lineHeight: 1 }}>{v}</div>
                <div style={{ fontSize: 11.5, color: T.mute, marginTop: 4, fontStyle: "italic", fontFamily: F.display }}>{s}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div>
          <BigTimeline curS={curS} result={result} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, fontFamily: FONT_MONO, fontSize: 10, letterSpacing: "0.18em", color: T.mute }}>
            <span>FIG. 01 &nbsp;·&nbsp; A LIFE, RENDERED &nbsp;·&nbsp; AGES {curS.age}–{curS.endAge}</span>
            <span onClick={() => setTab("events")} style={{ color: T.accent, cursor: "pointer" }}>EDIT EVENTS&nbsp;↗</span>
          </div>
        </div>
      </div>

      {/* Right rail — scenarios */}
      <div className="cl-hide-mobile" style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 4 }}>
        <div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: "0.22em", color: T.mute, marginBottom: 14 }}>SCENARIOS</div>
          {scenarios.map((s) => {
            const r = simulateAtrium(s)
            const isActive = s.id === curS.id
            return (
              <div key={s.id} onClick={() => setActiveId(s.id)} style={{
                padding: "14px 0", borderTop: `1px solid ${T.line}`, cursor: "pointer",
                display: "flex", alignItems: "flex-start", gap: 12,
                opacity: isActive ? 1 : 0.7,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: isActive ? T.accent : T.line2, marginTop: 8, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: F.display, fontSize: 17, fontStyle: isActive ? "normal" : "italic", fontWeight: isActive ? 500 : 400, letterSpacing: -0.2, color: T.ink }}>{s.name}</div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: T.mute, marginTop: 4, letterSpacing: "0.08em" }}>
                    {fmtA(r.atRetire.nw, { short: true })} @ {s.retireAge} · {r.ruinAge ? `DEPLETES ${r.ruinAge}` : "HOLDS"}
                  </div>
                </div>
              </div>
            )
          })}
          <div onClick={() => setTab("compare")} style={{ paddingTop: 14, borderTop: `1px solid ${T.line}`, fontFamily: FONT_MONO, fontSize: 10.5, color: T.accent, letterSpacing: "0.16em", cursor: "pointer" }}>+ NEW SCENARIO</div>
        </div>
      </div>
    </div>
  )
}

// ─── Compare screen ───────────────────────────────────────────────────────────
function CompareScreen({ scenarios, setScenarios, activeId, setActiveId }: {
  scenarios: AtriumScenario[]; setScenarios: (s: AtriumScenario[]) => void;
  activeId: string; setActiveId: (id: string) => void
}) {
  const isMobile = useMobile()
  const results = scenarios.map((s) => ({ s, r: simulateAtrium(s) }))
  const W = 1100, H = 340
  const all = results.flatMap((x) => x.r.path)
  const yMax = Math.max(...all.map((p) => p.nw))
  const yMin = Math.min(0, ...all.map((p) => p.nw))
  const xMin = results[0]?.r.path[0]?.age ?? 30
  const xMax = results[0]?.r.path[results[0].r.path.length - 1]?.age ?? 90
  const pad = { t: 24, r: 24, b: 34, l: 56 }
  const innerW = W - pad.l - pad.r, innerH = H - pad.t - pad.b
  const x = (a: number) => pad.l + ((a - xMin) / (xMax - xMin || 1)) * innerW
  const y = (v: number) => pad.t + (1 - (v - yMin) / (yMax - yMin || 1)) * innerH

  const addScenario = () => {
    const base = scenarios[0]
    const id = "s" + Date.now()
    const next = [...scenarios, { ...base, id, name: "New scenario", retireAge: base.retireAge + 2 }]
    setScenarios(next)
    setActiveId(id)
  }

  return (
    <div className="cl-screen-pad" style={{ padding: "36px 48px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, gap: 12 }}>
        <div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: "0.2em", color: T.mute, marginBottom: 6 }}>COMPARE</div>
          <div className="cl-head-lg" style={{ fontFamily: F.display, fontSize: 44, letterSpacing: -0.8, fontWeight: 400 }}>Laying them side by side.</div>
        </div>
        <button onClick={addScenario} style={{ background: T.ink, color: T.paper, border: "none", padding: "12px 22px", fontFamily: FONT_MONO, fontSize: 11, letterSpacing: "0.14em", cursor: "pointer" }}>+ NEW SCENARIO</button>
      </div>

      <div style={{ background: T.cream, border: `1px solid ${T.line}`, padding: 24, marginBottom: 26 }}>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
          {[0, 0.25, 0.5, 0.75, 1].map((f) => {
            const yv = yMin + f * (yMax - yMin)
            return (
              <g key={f}>
                <line x1={pad.l} x2={W - pad.r} y1={y(yv)} y2={y(yv)} stroke={T.line} strokeDasharray={f === 0 ? "" : "2 4"} strokeWidth="0.6" />
                <text x={pad.l - 8} y={y(yv) + 3} fontSize="10" fill={T.mute} textAnchor="end" fontFamily={FONT_MONO}>{fmtA(yv, { short: true })}</text>
              </g>
            )
          })}
          {[30, 40, 50, 60, 70, 80, 90].filter((a) => a >= xMin && a <= xMax).map((a) => (
            <text key={a} x={x(a)} y={H - pad.b + 14} fontSize="10" fill={T.mute} textAnchor="middle" fontFamily={FONT_MONO}>{a}</text>
          ))}
          {results.map(({ s, r }, i) => {
            const path = r.path.map((d, j) => (j === 0 ? "M" : "L") + x(d.age).toFixed(1) + "," + y(d.nw).toFixed(1)).join(" ")
            const isActive = s.id === activeId
            return (
              <g key={s.id}>
                <path d={path} stroke={SC_COLORS[i % SC_COLORS.length]} strokeWidth={isActive ? 2.6 : 1.4} fill="none" opacity={isActive ? 1 : 0.55} />
                <line x1={x(s.retireAge)} x2={x(s.retireAge)} y1={y(r.atRetire.nw) - 4} y2={y(r.atRetire.nw) + 4} stroke={SC_COLORS[i % SC_COLORS.length]} strokeWidth="2" />
              </g>
            )
          })}
        </svg>
      </div>

      <div className="cl-compare-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
        {results.map(({ s, r }, i) => {
          const isActive = s.id === activeId
          return (
            <div key={s.id} onClick={() => setActiveId(s.id)} style={{
              padding: "22px", border: `1px solid ${isActive ? SC_COLORS[i % SC_COLORS.length] : T.line}`,
              background: isActive ? T.cream : T.paper, cursor: "pointer",
              display: "flex", flexDirection: "column", gap: 10,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: SC_COLORS[i % SC_COLORS.length] }} />
                <span style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: "0.2em", color: T.mute }}>{isActive ? "ACTIVE ◆" : `◇ ${String(i + 1).padStart(2, "0")}`}</span>
              </div>
              <input
                value={s.name}
                onChange={(e) => setScenarios(scenarios.map((x) => x.id === s.id ? { ...x, name: e.target.value } : x))}
                onClick={(ev) => ev.stopPropagation()}
                style={{ fontFamily: F.display, fontSize: 22, fontWeight: 500, background: "transparent", border: "none", outline: "none", color: T.ink, padding: 0 }}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8 }}>
                {[
                  ["At retire", fmtA(r.atRetire.nw, { short: true })],
                  ["Retire age", String(s.retireAge)],
                  ["Save rate", Math.round(s.saveRate * 100) + "%"],
                  ["Depletes", r.ruinAge ? String(r.ruinAge) : "—"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: "0.14em", color: T.mute }}>{String(k).toUpperCase()}</div>
                    <div style={{ fontFamily: F.display, fontSize: 18, color: k === "Depletes" && r.ruinAge ? T.claret : T.ink }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Stress screen ────────────────────────────────────────────────────────────
function StressScreen({ curS }: { curS: AtriumScenario }) {
  const tests = [
    { k: "2008", label: "2008 replay", survival: 91, pct: -0.37, desc: "A 37% drawdown in year 3, recovering over 4 years." },
    { k: "lost", label: "Lost decade", survival: 68, pct: -0.02, desc: "Ten years of flat returns starting today." },
    { k: "stag", label: "Stagflation", survival: 58, pct: -0.18, desc: "Seven years of negative real returns, high spend creep." },
    { k: "deep", label: "Deep drawdown", survival: 34, pct: -0.50, desc: "50% portfolio drop at age 55, slow recovery." },
    { k: "early", label: "Early crash", survival: 76, pct: -0.28, desc: "28% drop within 2 years — tests sequence-of-returns risk." },
    { k: "late", label: "Late crash", survival: 88, pct: -0.32, desc: "32% drop after age 70 — tests depletion cushion." },
  ]

  return (
    <div className="cl-screen-pad" style={{ padding: "36px 48px" }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: "0.2em", color: T.mute, marginBottom: 6 }}>STRESS</div>
        <div className="cl-head-md" style={{ fontFamily: F.display, fontSize: 48, letterSpacing: -0.9, lineHeight: 1.05 }}>
          What survives <em style={{ color: T.accent }}>weather.</em>
        </div>
        <div style={{ fontSize: 14, color: T.ink2, marginTop: 10, maxWidth: 640, lineHeight: 1.55 }}>
          We run your plan through six historical-flavoured weather systems. The number is the share of 10,000 paths that reach {curS.endAge} with positive net worth.
        </div>
      </div>

      <div className="cl-grid-3col" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {tests.map((t) => (
          <div key={t.k} className="cl-stress-card" style={{ padding: 24, border: `1px solid ${T.line}`, background: T.paper, display: "flex", flexDirection: "column", gap: 12, minHeight: 220 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: F.display, fontSize: 22, fontWeight: 500 }}>{t.label}</span>
              <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: T.mute, letterSpacing: "0.14em" }}>{(t.pct * 100).toFixed(0)}%</span>
            </div>
            <div className="cl-stress-desc" style={{ fontSize: 13, color: T.ink2, lineHeight: 1.5, flex: 1 }}>{t.desc}</div>
            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <div className="cl-stress-val" style={{ fontFamily: F.display, fontSize: 54, fontWeight: 400, letterSpacing: -1, color: t.survival > 80 ? T.sage : t.survival > 60 ? T.accent : T.claret, lineHeight: 1 }}>{t.survival}%</div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: T.mute, letterSpacing: "0.14em" }}>SURVIVE</div>
              </div>
              <div style={{ height: 3, background: T.cream, marginTop: 8, position: "relative" }}>
                <div style={{ height: "100%", width: t.survival + "%", background: t.survival > 80 ? T.sage : t.survival > 60 ? T.accent : T.claret }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 32, padding: 24, background: T.cream, border: `1px solid ${T.line}` }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: "0.2em", color: T.mute, marginBottom: 10 }}>THE READING</div>
        <div style={{ fontFamily: F.display, fontSize: 20, fontStyle: "italic", lineHeight: 1.45, color: T.ink, maxWidth: 780 }}>
          Your plan survives ordinary weather well but struggles with a deep drawdown late in the cycle. A 12-month cash buffer would raise the worst case from 34% to around 58%.
        </div>
      </div>
    </div>
  )
}

// ─── Events screen ────────────────────────────────────────────────────────────
function EventsScreen({ curS, setScenario }: {
  curS: AtriumScenario; setScenario: (patch: Partial<AtriumScenario>) => void
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const W = 1100, H = 360
  const pad = { t: 80, r: 24, b: 80, l: 24 }
  const innerW = W - pad.l - pad.r
  const xMin = curS.age, xMax = curS.endAge
  const result = simulateAtrium(curS)
  const data = result.path
  const yMax = Math.max(...data.map((d) => d.hi))
  const yMin = Math.min(0, ...data.map((d) => d.lo))
  const x = (a: number) => pad.l + ((a - xMin) / (xMax - xMin || 1)) * innerW
  const y = (v: number) => pad.t + (1 - (v - yMin) / (yMax - yMin || 1)) * (H - pad.t - pad.b)
  const line = data.map((d, i) => (i === 0 ? "M" : "L") + x(d.age).toFixed(1) + "," + y(d.nw).toFixed(1)).join(" ")
  const band = [
    ...data.map((d, i) => (i === 0 ? "M" : "L") + x(d.age).toFixed(1) + "," + y(d.hi).toFixed(1)),
    ...[...data].reverse().map((d) => "L" + x(d.age).toFixed(1) + "," + y(d.lo).toFixed(1)), "Z",
  ].join(" ")

  const onDragMove = useCallback((e: PointerEvent) => {
    if (!draggingId || !svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * W
    const newAge = Math.round(xMin + ((px - pad.l) / innerW) * (xMax - xMin))
    const clamped = Math.max(xMin, Math.min(xMax, newAge))
    setScenario({ events: curS.events.map((ev) => ev.id === draggingId ? { ...ev, age: clamped } : ev) })
  }, [draggingId, curS.events])

  const onDragEnd = useCallback(() => setDraggingId(null), [])

  useEffect(() => {
    if (!draggingId) return
    window.addEventListener("pointermove", onDragMove)
    window.addEventListener("pointerup", onDragEnd)
    return () => { window.removeEventListener("pointermove", onDragMove); window.removeEventListener("pointerup", onDragEnd) }
  }, [draggingId, onDragMove, onDragEnd])

  const addEvent = () => {
    const id = "e" + Date.now()
    setScenario({ events: [...curS.events, { id, age: 50, label: "new event", note: "—", kind: "expense", delta: -10000, dur: 1 }] })
  }
  const delEvent = (id: string) => setScenario({ events: curS.events.filter((e) => e.id !== id) })
  const updEvent = (id: string, patch: Partial<AtriumEvent>) => setScenario({ events: curS.events.map((e) => e.id === id ? { ...e, ...patch } : e) })

  return (
    <div className="cl-screen-pad" style={{ padding: "36px 48px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, gap: 12 }}>
        <div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: "0.2em", color: T.mute, marginBottom: 6 }}>EVENTS</div>
          <div className="cl-head-lg" style={{ fontFamily: F.display, fontSize: 44, letterSpacing: -0.8 }}>A life, as <em style={{ color: T.accent }}>chapters</em>.</div>
          <div className="cl-events-hint" style={{ fontSize: 13, color: T.ink2, marginTop: 8 }}>Drag the dots to try what-ifs. Each event reshapes the curve.</div>
        </div>
        <button onClick={addEvent} style={{ background: T.ink, color: T.paper, border: "none", padding: "12px 22px", fontFamily: FONT_MONO, fontSize: 11, letterSpacing: "0.14em", cursor: "pointer" }}>+ ADD EVENT</button>
      </div>

      <div style={{ background: T.cream, border: `1px solid ${T.line}`, padding: 16, marginBottom: 24 }}>
        <svg ref={svgRef} width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block", userSelect: "none", cursor: draggingId ? "grabbing" : "default" }}>
          <path d={band} fill={T.accent} opacity="0.1" />
          <path d={line} stroke={T.accent} strokeWidth="2" fill="none" />
          <line x1={pad.l} x2={W - pad.r} y1={H - pad.b} y2={H - pad.b} stroke={T.ink} strokeWidth="0.8" />
          {[30, 40, 50, 60, 70, 80, 90].filter((a) => a >= xMin && a <= xMax).map((a) => (
            <g key={a}>
              <line x1={x(a)} x2={x(a)} y1={H - pad.b} y2={H - pad.b + 5} stroke={T.ink2} strokeWidth="0.5" />
              <text x={x(a)} y={H - pad.b + 18} fontSize="10" fill={T.mute} textAnchor="middle" fontFamily={FONT_MONO}>{a}</text>
            </g>
          ))}
          <line x1={x(curS.retireAge)} x2={x(curS.retireAge)} y1={pad.t - 18} y2={H - pad.b} stroke={T.ink} strokeDasharray="3 3" strokeWidth="0.7" opacity="0.5" />
          {curS.events.map((e, i) => {
            const above = i % 2 === 0
            const yL = above ? pad.t - 58 : H - pad.b + 40
            const cy = data.find((d) => d.age === e.age)?.nw ?? 0
            const c = e.kind === "retire" ? T.accent : e.kind === "income-gap" ? T.gold : e.kind === "expense" ? T.accent2 : T.ink2
            return (
              <g key={e.id}>
                <line x1={x(e.age)} x2={x(e.age)} y1={above ? yL + 24 : H - pad.b} y2={above ? y(cy) : yL - 4} stroke={c} strokeWidth="0.7" strokeDasharray="2 2" />
                <circle cx={x(e.age)} cy={y(cy)} r="4" fill={c} stroke={T.paper} strokeWidth="1.8" />
                <text x={x(e.age)} y={yL} fontSize="10" fill={c} textAnchor="middle" fontFamily={FONT_MONO} letterSpacing="0.12em">{e.age}</text>
                <text x={x(e.age)} y={yL + 16} fontSize="14" fill={T.ink} textAnchor="middle" fontFamily={F.display} fontStyle="italic">{e.label}</text>
                <circle cx={x(e.age)} cy={yL + (above ? 26 : -16)} r="10" fill={c} opacity={draggingId === e.id ? 1 : 0.85}
                  style={{ cursor: "grab" }} onPointerDown={(ev) => { ev.preventDefault(); setDraggingId(e.id) }} />
                <text x={x(e.age)} y={yL + (above ? 30 : -12)} fontSize="11" fill={T.paper} textAnchor="middle" fontFamily={FONT_MONO} style={{ pointerEvents: "none" }}>⇄</text>
              </g>
            )
          })}
        </svg>
      </div>

      <div className="cl-events-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
        {curS.events.map((e) => (
          <div key={e.id} style={{ padding: 18, border: `1px solid ${T.line}`, background: T.paper, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <select value={e.kind} onChange={(ev) => updEvent(e.id, { kind: ev.target.value as AtriumEvent["kind"] })} style={{ background: "transparent", border: "none", fontFamily: FONT_MONO, fontSize: 10, letterSpacing: "0.14em", color: T.ink2 }}>
                <option value="anchor">ANCHOR</option>
                <option value="retire">RETIRE</option>
                <option value="income-gap">INCOME GAP</option>
                <option value="expense">EXPENSE</option>
              </select>
              <span onClick={() => delEvent(e.id)} style={{ color: T.mute, cursor: "pointer", fontSize: 14 }}>×</span>
            </div>
            <input value={e.label} onChange={(ev) => updEvent(e.id, { label: ev.target.value })} style={{ fontFamily: F.display, fontStyle: "italic", fontSize: 20, background: "transparent", border: "none", outline: "none", color: T.ink, padding: 0 }} />
            <input value={e.note} onChange={(ev) => updEvent(e.id, { note: ev.target.value })} style={{ fontSize: 12, background: "transparent", border: "none", outline: "none", color: T.ink2, padding: 0 }} />
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <label style={{ fontSize: 11, color: T.mute, display: "flex", alignItems: "center", gap: 4 }}>
                AGE <input type="number" value={e.age} onChange={(ev) => updEvent(e.id, { age: +ev.target.value })} style={{ width: 50, fontFamily: FONT_MONO, background: T.cream, border: `1px solid ${T.line}`, padding: "2px 6px", color: T.ink }} />
              </label>
              <label style={{ fontSize: 11, color: T.mute, display: "flex", alignItems: "center", gap: 4 }}>
                YRS <input type="number" value={e.dur} onChange={(ev) => updEvent(e.id, { dur: +ev.target.value })} style={{ width: 40, fontFamily: FONT_MONO, background: T.cream, border: `1px solid ${T.line}`, padding: "2px 6px", color: T.ink }} />
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Assumptions screen ───────────────────────────────────────────────────────
function AssumptionsScreen({ curS, setScenario }: {
  curS: AtriumScenario; setScenario: (patch: Partial<AtriumScenario>) => void
}) {
  const isMobile = useMobile()
  const fields = [
    { k: "age", label: "Current age", val: curS.age, unit: "years", min: 18, max: 80, step: 1, onChange: (v: number) => setScenario({ age: v }) },
    { k: "retireAge", label: "Retire at", val: curS.retireAge, unit: "years", min: 45, max: 80, step: 1, onChange: (v: number) => setScenario({ retireAge: v }) },
    { k: "endAge", label: "Plan through", val: curS.endAge, unit: "years", min: 70, max: 105, step: 1, onChange: (v: number) => setScenario({ endAge: v }) },
    { k: "income", label: "Household income", val: Math.round(curS.income / 1000), unit: "$K / yr", min: 20, max: 2000, step: 5, onChange: (v: number) => setScenario({ income: v * 1000 }) },
    { k: "save", label: "Save rate", val: Math.round(curS.saveRate * 100), unit: "%", min: 0, max: 70, step: 1, onChange: (v: number) => setScenario({ saveRate: v / 100 }) },
    { k: "spend", label: "Spend in retirement", val: Math.round(curS.spend / 1000), unit: "$K / yr", min: 20, max: 500, step: 5, onChange: (v: number) => setScenario({ spend: v * 1000 }) },
    { k: "nw", label: "Net worth today", val: Math.round(curS.netWorth / 1000), unit: "$K", min: 0, max: 20000, step: 10, onChange: (v: number) => setScenario({ netWorth: v * 1000 }) },
    { k: "ret", label: "Real return", val: +(curS.ret * 100).toFixed(1), unit: "% / yr", min: 1, max: 12, step: 0.1, onChange: (v: number) => setScenario({ ret: v / 100 }) },
    { k: "vol", label: "Volatility", val: +(curS.vol * 100).toFixed(1), unit: "σ %", min: 4, max: 22, step: 0.1, onChange: (v: number) => setScenario({ vol: v / 100 }) },
  ]

  return (
    <div className="cl-screen-pad" style={{ padding: "36px 48px" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: "0.2em", color: T.mute, marginBottom: 6 }}>ASSUMPTIONS</div>
        <div className="cl-head-lg" style={{ fontFamily: F.display, fontSize: 44, letterSpacing: -0.8 }}>The <em style={{ color: T.accent }}>dials.</em></div>
        <div style={{ fontSize: 13, color: T.ink2, marginTop: 8 }}>Every number below is editable. We use real (inflation-adjusted) dollars throughout.</div>
      </div>
      <div className="cl-grid-3col" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {fields.map((f) => (
          <div key={f.k} style={{ padding: 22, background: T.cream, border: `1px solid ${T.line}` }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: "0.16em", color: T.mute, marginBottom: 8 }}>{f.label.toUpperCase()}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 12 }}>
              <div className="cl-assume-val" style={{ fontFamily: F.display, fontSize: 44, fontWeight: 400, letterSpacing: -0.8, color: T.ink, lineHeight: 1 }}>{f.val}</div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: T.mute, letterSpacing: "0.08em" }}>{f.unit}</div>
            </div>
            <input type="range" min={f.min} max={f.max} step={f.step} value={f.val} onChange={(e) => f.onChange(+e.target.value)} style={{ width: "100%", accentColor: T.ink }} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Journal screen ───────────────────────────────────────────────────────────
function JournalScreen({ journal, setJournal }: { journal: JournalEntry[]; setJournal: (j: JournalEntry[]) => void }) {
  const isMobile = useMobile()
  const [draft, setDraft] = useState("")

  const add = () => {
    if (!draft.trim()) return
    const d = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })
    setJournal([{ id: "j" + Date.now(), date: d, note: draft }, ...journal])
    setDraft("")
  }

  const PROMPTS = [
    "What changed this month?",
    "What am I still deciding?",
    "What would I do with one more year?",
    "What is the thing I'm avoiding?",
  ]

  return (
    <div className="cl-grid-2col cl-screen-pad" style={{ padding: "36px 48px", display: "grid", gridTemplateColumns: "1fr 380px", gap: 36 }}>
      <div>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: "0.2em", color: T.mute, marginBottom: 6 }}>JOURNAL</div>
          <div className="cl-head-lg" style={{ fontFamily: F.display, fontSize: 44, letterSpacing: -0.8 }}>Notes to <em style={{ color: T.accent }}>your future self.</em></div>
        </div>
        <div style={{ background: T.cream, border: `1px solid ${T.line}`, padding: 20, marginBottom: 24 }}>
          <textarea
            value={draft} onChange={(e) => setDraft(e.target.value)}
            placeholder="What did you learn today?"
            style={{ width: "100%", minHeight: 100, background: "transparent", border: "none", outline: "none", fontFamily: F.display, fontStyle: "italic", fontSize: 18, color: T.ink, resize: "vertical", boxSizing: "border-box" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
            <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: T.mute, letterSpacing: "0.14em" }}>LOCAL ONLY · NEVER LEAVES YOUR DEVICE</span>
            <button onClick={add} style={{ background: T.ink, color: T.paper, border: "none", padding: "8px 18px", fontFamily: FONT_MONO, fontSize: 11, letterSpacing: "0.14em", cursor: "pointer" }}>ADD ENTRY →</button>
          </div>
        </div>
        {journal.map((e) => (
          <div key={e.id} className="cl-journal-row" style={{ padding: "22px 0", borderBottom: `1px solid ${T.line}`, display: "grid", gridTemplateColumns: "80px 1fr", gap: 20 }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 11, letterSpacing: "0.14em", color: T.mute, paddingTop: 3 }}>{e.date.toUpperCase()}</div>
            <div style={{ fontFamily: F.display, fontStyle: "italic", fontSize: 18, lineHeight: 1.5, color: T.ink }}>{e.note}</div>
          </div>
        ))}
      </div>
      <div>
        <div style={{ background: T.cream, border: `1px solid ${T.line}`, padding: 22 }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: "0.2em", color: T.mute, marginBottom: 12 }}>PROMPTS</div>
          {PROMPTS.map((p) => (
            <div key={p} onClick={() => setDraft(p + " ")} style={{ padding: "10px 0", borderBottom: `1px solid ${T.line}`, fontFamily: F.display, fontStyle: "italic", fontSize: 15, color: T.ink2, cursor: "pointer" }}>
              ↗ {p}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Share screen ─────────────────────────────────────────────────────────────
function ShareScreen({ intake, curS, result }: {
  intake: Intake; curS: AtriumScenario; result: ReturnType<typeof simulateAtrium>
}) {
  const isMobile = useMobile()
  const [copied, setCopied] = useState(false)

  const copyLink = () => {
    const data = { curS, intake }
    const encoded = btoa(JSON.stringify(data))
    navigator.clipboard.writeText(window.location.origin + "?plan=" + encoded)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const W = 240, H = 80
  const path = result.path
  const xMin = path[0]?.age ?? 30, xMax = path[path.length - 1]?.age ?? 90
  const yMax = Math.max(...path.map((d) => d.hi))
  const yMin = Math.min(0, ...path.map((d) => d.lo))
  const px = (a: number) => 8 + ((a - xMin) / (xMax - xMin || 1)) * (W - 16)
  const py = (v: number) => 8 + (1 - (v - yMin) / (yMax - yMin || 1)) * (H - 16)
  const chartLine = path.map((d, i) => (i === 0 ? "M" : "L") + px(d.age).toFixed(1) + "," + py(d.nw).toFixed(1)).join(" ")

  return (
    <div className="cl-grid-2col cl-screen-pad" style={{ padding: "36px 48px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 36 }}>
      <div>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: "0.2em", color: T.mute, marginBottom: 6 }}>SHARE</div>
          <div className="cl-head-lg" style={{ fontFamily: F.display, fontSize: 44, letterSpacing: -0.8 }}>A study, <em style={{ color: T.accent }}>on paper.</em></div>
          <div style={{ fontSize: 13, color: T.ink2, marginTop: 8, maxWidth: 440 }}>Your plan exports as a quiet, beautifully typeset summary. You can also copy a link that encodes everything.</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { t: "Export as PDF", d: "One page per scenario, typeset for printing.", tag: "DOWNLOAD.PDF", action: () => window.print() },
            { t: "Copy shareable link", d: "URL contains the whole plan. No server.", tag: copied ? "COPIED!" : "COPY.LINK", action: copyLink },
            { t: "Email to advisor", d: "Open in your mail client, nothing sent.", tag: "MAIL.TO", action: () => window.open(`mailto:?subject=My Clarifin Study&body=Here is my plan: ${window.location.href}`) },
            { t: "Export as CSV", d: "The full projection, year by year.", tag: "DOWNLOAD.CSV", action: () => {
              const csv = ["age,nw,lo,hi"].concat(result.path.map((d) => `${d.age},${Math.round(d.nw)},${Math.round(d.lo)},${Math.round(d.hi)}`)).join("\n")
              const a = document.createElement("a"); a.href = "data:text/csv," + encodeURIComponent(csv); a.download = "clarifin.csv"; a.click()
            }},
          ].map(({ t, d, tag, action }) => (
            <div key={t} onClick={action} style={{ padding: "16px 20px", border: `1px solid ${T.line}`, background: T.paper, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
              <div>
                <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 500 }}>{t}</div>
                <div style={{ fontSize: 12.5, color: T.ink2, marginTop: 2 }}>{d}</div>
              </div>
              <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: T.accent, letterSpacing: "0.14em" }}>{tag} ↗</span>
            </div>
          ))}
        </div>
      </div>

      {/* PDF preview */}
      <div className="cl-hide-mobile" style={{ display: "block", background: T.paper, border: `1px solid ${T.line2}`, padding: 32, boxShadow: "0 20px 50px rgba(0,0,0,0.08)" }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: "0.22em", color: T.mute, marginBottom: 16 }}>PREVIEW · A4 · PORTRAIT</div>
        <div style={{ borderTop: `1px solid ${T.ink}`, borderBottom: `1px solid ${T.line}`, padding: "14px 0", display: "flex", justifyContent: "space-between", fontFamily: FONT_MONO, fontSize: 9, letterSpacing: "0.18em", color: T.mute, marginBottom: 22 }}>
          <span>CLARIFIN · A STUDY</span>
          <span>{intake.name?.toUpperCase() || "—"} · {curS.name.toUpperCase()}</span>
        </div>
        <div style={{ fontFamily: F.display, fontSize: 36, fontStyle: "italic", lineHeight: 1.2, color: T.ink, marginBottom: 22 }}>
          "{intake.question?.toLowerCase() || "the shape of things"}"
        </div>
        <div style={{ fontFamily: F.display, fontSize: 76, lineHeight: 1, letterSpacing: -1.5, color: T.accent, marginBottom: 4 }}>
          {fmtA(result.atRetire.nw, { short: true })}
        </div>
        <div style={{ fontSize: 13, color: T.ink2, marginBottom: 24 }}>at retirement · age {curS.retireAge} · real dollars</div>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
          <path d={chartLine} stroke={T.accent} strokeWidth="1.5" fill="none" />
        </svg>
        <div style={{ marginTop: 20, fontFamily: F.display, fontStyle: "italic", fontSize: 14, lineHeight: 1.5, color: T.ink2 }}>
          Rendered {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · page 1 of 4
        </div>
      </div>
    </div>
  )
}

// ─── Upgrade modal ────────────────────────────────────────────────────────────
function UpgradeModal({ onClose, onCheckout }: { onClose: () => void; onCheckout: (plan: string) => void }) {
  const isMobile = useMobile()
  const [plan, setPlan] = useState("annual")
  const [stage, setStage] = useState<"form" | "processing" | "success">("form")
  const [card, setCard] = useState({ num: "4242 4242 4242 4242", exp: "12 / 28", cvc: "314", zip: "94110" })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setStage("processing")
    setTimeout(() => {
      setStage("success")
      setTimeout(() => onCheckout(plan), 900)
    }, 1400)
  }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(10,10,9,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backdropFilter: "blur(4px)" }}>
      <div onClick={(e) => e.stopPropagation()} className="cl-upgrade-modal" style={{ background: T.paper, color: T.ink, fontFamily: FONT_BODY, width: "min(960px, 100%)", display: "grid", gridTemplateColumns: "1.05fr 1fr", boxShadow: "0 40px 100px rgba(0,0,0,0.35)", maxHeight: "92vh", overflow: "auto" }}>
        {/* Left feature list */}
        <div className="cl-upgrade-left" style={{ display: "flex", padding: "44px 44px", borderRight: `1px solid ${T.line}`, flexDirection: "column", justifyContent: "space-between", minHeight: 560 }}>
          <div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: "0.22em", color: T.accent, marginBottom: 18 }}>CLARIFIN · PRO</div>
            <div style={{ fontFamily: F.display, fontSize: 56, lineHeight: 1, letterSpacing: -1.5, fontWeight: 400, color: T.ink, marginBottom: 18 }}>
              Seven days,<br /> on the house.
            </div>
            <div style={{ fontFamily: F.display, fontSize: 18, fontStyle: "italic", color: T.ink2, lineHeight: 1.45, marginBottom: 28 }}>
              Then $0.99 a month, or $9.99 a year. Cancel any time, your numbers stay.
            </div>
            <div style={{ borderTop: `1px solid ${T.line}` }}>
              {[
                ["Unlimited scenarios", "Compare a dozen lives, side by side."],
                ["Stress library", "Six historical weather systems, run on every plan."],
                ["Clarifin AI", "Ask in plain language. Get an honest reading."],
                ["Typeset PDF export", "A study, on paper. For you, or your advisor."],
                ["Private by default", "Local-first. Your numbers never leave your device."],
              ].map(([t, d]) => (
                <div key={t} style={{ display: "flex", gap: 16, padding: "14px 0", borderBottom: `1px solid ${T.line}` }}>
                  <div style={{ fontFamily: F.display, fontSize: 14, fontStyle: "italic", color: T.accent, marginTop: 2 }}>◆</div>
                  <div>
                    <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 500, letterSpacing: -0.2 }}>{t}</div>
                    <div style={{ fontSize: 12.5, color: T.ink2, marginTop: 1 }}>{d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 24, fontFamily: FONT_MONO, fontSize: 9.5, letterSpacing: "0.18em", color: T.mute, lineHeight: 1.6 }}>
            NO CHARGE FOR 7 DAYS &nbsp;·&nbsp; CANCEL FROM SETTINGS &nbsp;·&nbsp; YOUR DATA STAYS LOCAL
          </div>
        </div>

        {/* Right — Stripe-style checkout */}
        <div className="cl-upgrade-right" style={{ padding: "44px 44px", background: T.cream, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: "0.22em", color: T.mute }}>SECURE CHECKOUT &nbsp;·&nbsp; STRIPE</div>
            <div onClick={onClose} style={{ cursor: "pointer", fontSize: 18, color: T.ink2 }}>×</div>
          </div>

          {stage === "processing" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
              <div style={{ width: 36, height: 36, border: `2px solid ${T.line2}`, borderTopColor: T.accent, borderRadius: "50%", animation: "spin .9s linear infinite" }} />
              <div style={{ fontFamily: F.display, fontSize: 22, fontStyle: "italic", color: T.ink2 }}>Authorising card…</div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {stage === "success" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, textAlign: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", border: `1.5px solid ${T.accent}`, display: "flex", alignItems: "center", justifyContent: "center", color: T.accent, fontSize: 26 }}>✓</div>
              <div style={{ fontFamily: F.display, fontSize: 36, fontStyle: "italic", color: T.ink, lineHeight: 1.2 }}>You're <em style={{ color: T.accent, fontStyle: "normal" }}>in</em>.</div>
              <div style={{ fontFamily: F.display, fontSize: 16, fontStyle: "italic", color: T.ink2, maxWidth: 280 }}>
                Seven days free, then {plan === "annual" ? "$9.99 / year" : "$0.99 / month"}. Receipt in your inbox.
              </div>
            </div>
          )}

          {stage === "form" && (
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 18, flex: 1 }}>
              <div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 9.5, letterSpacing: "0.18em", color: T.mute, marginBottom: 10 }}>CHOOSE YOUR PLAN</div>
                {[
                  ["annual", "Annual", "$9.99 / year", "Save $1.89 — most popular", true],
                  ["monthly", "Monthly", "$0.99 / month", "7-day trial included", false],
                ].map(([k, label, price, sub, badge]) => (
                  <div key={String(k)} onClick={() => setPlan(String(k))} style={{
                    padding: "14px 16px", border: `1px solid ${plan === k ? T.accent : T.line}`,
                    background: plan === k ? T.paper : "transparent",
                    display: "flex", alignItems: "center", gap: 12, marginBottom: 8, cursor: "pointer",
                  }}>
                    <div style={{ width: 14, height: 14, borderRadius: "50%", border: `1.5px solid ${plan === k ? T.accent : T.line2}`, position: "relative" }}>
                      {plan === k && <div style={{ position: "absolute", inset: 3, borderRadius: "50%", background: T.accent }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontFamily: F.display, fontSize: 17, fontWeight: 500 }}>{label}</span>
                        {badge && <span style={{ fontFamily: FONT_MONO, fontSize: 8.5, letterSpacing: "0.18em", color: T.accent, padding: "2px 6px", border: `1px solid ${T.accent}` }}>POPULAR</span>}
                      </div>
                      <div style={{ fontSize: 11.5, color: T.mute, marginTop: 1, fontStyle: "italic", fontFamily: F.display }}>{sub}</div>
                    </div>
                    <div style={{ fontFamily: F.display, fontSize: 19, color: T.ink }}>{price}</div>
                  </div>
                ))}
              </div>

              {[
                { label: "EMAIL", type: "email", val: "emilia@studio.co", onChange: () => {} },
                { label: "CARD NUMBER", type: "text", val: card.num, onChange: (v: string) => setCard({ ...card, num: v }) },
              ].map(({ label, type, val, onChange }) => (
                <div key={label}>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: "0.18em", color: T.mute, marginBottom: 6 }}>{label}</div>
                  <input type={type} defaultValue={val} onChange={(e) => onChange(e.target.value)} required style={{ width: "100%", background: T.paper, border: `1px solid ${T.line}`, color: T.ink, padding: "11px 12px", fontFamily: FONT_MONO, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                </div>
              ))}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {[
                  { l: "EXP", v: card.exp, f: (v: string) => setCard({ ...card, exp: v }) },
                  { l: "CVC", v: card.cvc, f: (v: string) => setCard({ ...card, cvc: v }) },
                  { l: "ZIP", v: card.zip, f: (v: string) => setCard({ ...card, zip: v }) },
                ].map(({ l, v, f }) => (
                  <div key={l}>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: "0.18em", color: T.mute, marginBottom: 6 }}>{l}</div>
                    <input type="text" value={v} onChange={(e) => f(e.target.value)} required style={{ width: "100%", background: T.paper, border: `1px solid ${T.line}`, color: T.ink, padding: "11px 12px", fontFamily: FONT_MONO, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                  </div>
                ))}
              </div>

              <button type="submit" style={{ background: T.ink, color: T.paper, border: "none", padding: "15px 22px", fontFamily: FONT_MONO, fontSize: 11, letterSpacing: "0.18em", cursor: "pointer", fontWeight: 500, marginTop: 6 }}>
                START 7-DAY TRIAL →
              </button>
              <div style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: "0.16em", color: T.mute, textAlign: "center", marginTop: "auto" }}>
                🔒 PAYMENTS BY STRIPE &nbsp;·&nbsp; PCI DSS &nbsp;·&nbsp; SSL
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Clarifin AI chat ──────────────────────────────────────────────────────────
function ClarifinChat({ intake, curS, result, isPro, onUpgrade }: {
  intake: Intake; curS: AtriumScenario; result: ReturnType<typeof simulateAtrium>;
  isPro: boolean; onUpgrade: () => void
}) {
  const isMobile = useMobile()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: "assistant", content: `Hello, ${intake.name?.split(" ")[0] || "there"}. I'm Clarifin — ask me anything about your plan, or what to try next.` },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const FREE_LIMIT = 5
  const userCount = messages.filter((m) => m.role === "user").length
  const remaining = Math.max(0, FREE_LIMIT - userCount)
  const atLimit = !isPro && remaining === 0

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, open])

  const CHIPS = [
    "What if I retire two years earlier?",
    "How worried should I be about a market drop?",
    "Where is my plan most fragile?",
    "Is my save rate too low for what I want?",
  ]

  const send = async () => {
    const text = input.trim()
    if (!text || loading || atLimit) return
    setInput("")
    const next = [...messages, { role: "user", content: text }]
    setMessages(next)
    setLoading(true)

    // Simple scripted responses (replace with real AI call if available)
    const responses: Record<string, string> = {
      "retire": `Retiring earlier means your savings must stretch further. In your current plan, retiring two years early reduces your nest egg at retirement by roughly ${fmtA(curS.income * curS.saveRate * 2, { short: true })} in missed contributions. Worth comparing — try the Assumptions tab.`,
      "market": `Your plan shows a ${result.ruinAge ? "fragile" : "resilient"} base case. The stress tests tab runs six historical scenarios — I'd focus on the 'deep drawdown' and 'lost decade' cards.`,
      "fragile": `Your largest lever is spend in retirement. At ${fmtA(curS.spend, { short: true })}/yr, a 10% increase adds substantial depletion risk. Save rate is your second lever.`,
      "save": `At ${Math.round(curS.saveRate * 100)}%, you're ${curS.saveRate >= 0.2 ? "above" : "below"} the 20% threshold most planners use. The extra margin you'd get from 5% more saved compounds significantly over ${curS.retireAge - curS.age} years.`,
    }

    const key = Object.keys(responses).find((k) => text.toLowerCase().includes(k)) ?? ""
    const reply = responses[key] ?? "That's worth thinking through carefully. Try adjusting the assumptions in the dials tab to model it directly — the chart will update in real time."

    await new Promise((r) => setTimeout(r, 800))
    setMessages([...next, { role: "assistant", content: reply }])
    setLoading(false)
  }

  return (
    <>
      {!open && (
        <div className="cl-chat-trigger" onClick={() => setOpen(true)} style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 800,
          background: T.ink, color: T.paper, padding: "12px 18px",
          display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
          boxShadow: "0 12px 30px rgba(0,0,0,0.18)", fontFamily: FONT_BODY, fontSize: 13,
          transition: "transform .2s",
        }} onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
           onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}>
          <div style={{ width: 22, height: 22, borderRadius: "50%", border: `1.5px solid ${T.paper}`, position: "relative" }}>
            <div style={{ position: "absolute", inset: 4, borderRadius: "50%", background: T.paper, opacity: 0.6 }} />
          </div>
          <span style={{ fontFamily: F.display, fontStyle: "italic", fontSize: 16, whiteSpace: "nowrap" }}>Ask Clarifin</span>
        </div>
      )}

      {open && (
        <div className="cl-chat-widget" style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 800,
          width: 400, height: 560,
          background: T.paper, color: T.ink,
          border: `1px solid ${T.line2}`, fontFamily: FONT_BODY,
          boxShadow: "0 30px 70px rgba(0,0,0,0.22)",
          display: "flex", flexDirection: "column",
        }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.line}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: T.cream }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", border: `1.5px solid ${T.ink}`, position: "relative" }}>
                <div style={{ position: "absolute", inset: 4, borderRadius: "50%", background: T.ink }} />
              </div>
              <div>
                <div style={{ fontFamily: F.display, fontSize: 17, fontWeight: 500 }}>Clarifin AI</div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: "0.18em", color: T.mute }}>HERE TO HELP YOU THINK</div>
              </div>
            </div>
            <span onClick={() => setOpen(false)} style={{ cursor: "pointer", fontSize: 18, color: T.ink2 }}>×</span>
          </div>

          <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
            {messages.map((m, i) => (
              <div key={i} style={{ marginBottom: 18, display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
                {m.role === "assistant" && (
                  <div style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: "0.18em", color: T.accent, marginBottom: 5 }}>CLARIFIN</div>
                )}
                <div style={{
                  background: m.role === "user" ? T.ink : T.cream,
                  color: m.role === "user" ? T.paper : T.ink,
                  padding: "11px 14px",
                  fontFamily: m.role === "assistant" ? F.display : FONT_BODY,
                  fontSize: m.role === "assistant" ? 15 : 13.5,
                  fontStyle: m.role === "assistant" ? "italic" : "normal",
                  lineHeight: 1.5, maxWidth: "88%",
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: "0.18em", color: T.accent, marginBottom: 5 }}>CLARIFIN</div>
                <div style={{ background: T.cream, padding: "11px 14px", display: "flex", gap: 4 }}>
                  {[0, 1, 2].map((i) => (
                    <span key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: T.ink2, display: "inline-block", animation: `dotbounce 1.2s ${i * 0.15}s infinite ease-in-out` }} />
                  ))}
                </div>
              </div>
            )}
            {messages.length === 1 && !loading && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: "0.18em", color: T.mute, marginBottom: 8 }}>TRY ASKING</div>
                {CHIPS.map((p) => (
                  <div key={p} onClick={() => setInput(p)} style={{ padding: "8px 0", borderBottom: `1px solid ${T.line}`, fontFamily: F.display, fontStyle: "italic", fontSize: 14, color: T.ink2, cursor: "pointer" }}>
                    ↗ {p}
                  </div>
                ))}
              </div>
            )}
          </div>

          {!isPro && (
            <div style={{ padding: "10px 16px", borderTop: `1px solid ${T.line}`, background: atLimit ? T.ink : T.cream, color: atLimit ? T.paper : T.ink2, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <div style={{ fontFamily: F.display, fontStyle: "italic", fontSize: 13, lineHeight: 1.35 }}>
                {atLimit ? <>You've used your <b style={{ fontStyle: "normal" }}>5 free questions.</b> Upgrade for unlimited.</> : <>{remaining} of {FREE_LIMIT} free question{remaining === 1 ? "" : "s"} left.</>}
              </div>
              <div onClick={onUpgrade} style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: "0.18em", padding: "6px 10px", cursor: "pointer", background: atLimit ? T.accent : "transparent", color: atLimit ? T.paper : T.accent, border: atLimit ? "none" : `1px solid ${T.accent}`, whiteSpace: "nowrap", flexShrink: 0 }}>
                UPGRADE&nbsp;→
              </div>
            </div>
          )}

          <div style={{ padding: "14px 16px", borderTop: `1px solid ${T.line}`, display: "flex", gap: 8, background: T.paper, opacity: atLimit ? 0.4 : 1, pointerEvents: atLimit ? "none" : "auto" }}>
            <input
              value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder={atLimit ? "Upgrade to keep asking…" : "Ask anything…"}
              disabled={atLimit}
              style={{ flex: 1, background: T.cream, border: "none", padding: "10px 12px", fontFamily: F.display, fontStyle: "italic", fontSize: 14, color: T.ink, outline: "none" }}
            />
            <button onClick={send} disabled={loading || !input.trim() || atLimit} style={{
              background: T.accent, color: T.paper, border: "none", padding: "0 16px",
              fontFamily: FONT_MONO, fontSize: 11, letterSpacing: "0.16em", cursor: loading ? "wait" : "pointer",
              opacity: loading || !input.trim() || atLimit ? 0.5 : 1,
            }}>SEND</button>
          </div>

          <style>{`@keyframes dotbounce { 0%, 80%, 100% { transform: scale(.6); opacity: .4; } 40% { transform: scale(1); opacity: 1; } }`}</style>
        </div>
      )}
    </>
  )
}

// ─── Profile menu ─────────────────────────────────────────────────────────────
function ProfileMenu({ name, email, onClose, onSignOut }: {
  name: string; email: string; onClose: () => void; onSignOut: () => void
}) {
  const [, navigate] = useLocation()
  const familyMembers = [
    { initials: name.slice(0, 2).toUpperCase() || "ME", label: "You", relation: "primary" },
    { initials: "PA", label: "Partner", relation: "shared view" },
  ]

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 500 }}>
      <div onClick={(e) => e.stopPropagation()} className="cl-profile-menu" style={{
        position: "absolute", top: 60, right: 16,
        width: 280, background: T.paper, border: `1px solid ${T.line2}`,
        boxShadow: "0 20px 50px rgba(0,0,0,0.18)", zIndex: 501,
      }}>
        {/* Header */}
        <div style={{ background: T.cream, padding: "18px 20px", borderBottom: `1px solid ${T.line}` }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: "0.18em", color: T.mute, marginBottom: 6 }}>SIGNED IN AS</div>
          <div style={{ fontFamily: F.display, fontSize: 22, fontWeight: 500, color: T.ink, marginBottom: 2 }}>{name || "Your account"}</div>
          <div style={{ fontFamily: F.display, fontStyle: "italic", fontSize: 13, color: T.ink2 }}>{email}</div>
        </div>

        {/* Actions */}
        {[
          { label: "Account settings", onClick: () => { onClose(); navigate("/app/account") } },
          { label: "Keyboard shortcuts", onClick: onClose },
          { label: "What's new", onClick: onClose },
        ].map(({ label, onClick }) => (
          <div key={label} onClick={onClick} style={{ padding: "13px 20px", borderBottom: `1px solid ${T.line}`, fontFamily: FONT_BODY, fontSize: 14, color: T.ink, cursor: "pointer" }}>
            {label}
          </div>
        ))}

        {/* Family switcher */}
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.line}` }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: "0.18em", color: T.mute, marginBottom: 10 }}>SWITCH PROFILE</div>
          {familyMembers.map((m) => (
            <div key={m.label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, cursor: "pointer" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: T.ink, color: T.paper, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_MONO, fontSize: 10 }}>
                {m.initials}
              </div>
              <div>
                <div style={{ fontFamily: F.display, fontSize: 15, color: T.ink }}>{m.label}</div>
                <div style={{ fontFamily: F.display, fontStyle: "italic", fontSize: 12, color: T.mute }}>{m.relation}</div>
              </div>
            </div>
          ))}
          <div style={{ fontFamily: F.display, fontStyle: "italic", fontSize: 13, color: T.mute, marginTop: 6 }}>
            Family plans coming soon.
          </div>
        </div>

        {/* Sign out */}
        <div onClick={onSignOut} style={{ padding: "13px 20px", fontFamily: FONT_BODY, fontSize: 14, color: T.claret, cursor: "pointer" }}>
          Sign out
        </div>
      </div>
    </div>
  )
}

// ─── Trial pill ───────────────────────────────────────────────────────────────
function TrialPill({ daysLeft, isPro, onUpgrade }: { daysLeft: number; isPro: boolean; onUpgrade: () => void }) {
  if (isPro) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", border: `1px solid ${T.accent}`, fontFamily: FONT_MONO, fontSize: 10, letterSpacing: "0.16em", color: T.accent }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.accent }} />
        PRO &nbsp;·&nbsp; ACTIVE
      </div>
    )
  }
  return (
    <div onClick={onUpgrade} style={{
      display: "flex", alignItems: "center", gap: 12, padding: "10px 18px",
      background: T.ink, color: T.paper, cursor: "pointer",
      fontFamily: FONT_MONO, fontSize: 10.5, letterSpacing: "0.16em", whiteSpace: "nowrap",
    }}>
      <span style={{ fontFamily: F.display, fontStyle: "italic", fontSize: 14, letterSpacing: 0, textTransform: "none" }}>
        {daysLeft} days left
      </span>
      <span style={{ opacity: 0.4 }}>·</span>
      <span>UPGRADE&nbsp;→</span>
    </div>
  )
}

// ─── MAIN PRODUCT PAGE ────────────────────────────────────────────────────────
export default function ProductPage() {
  const { session } = useSupabaseAuth()
  const [, navigate] = useLocation()
  const isMobile = useMobile()

  const [scenarios, setScenarios_] = useState<AtriumScenario[]>(() => {
    const s = loadScenarios()
    return s.length > 0 ? s : [{ ...DEFAULT_SCENARIO }, { ...SECOND_SCENARIO }]
  })
  const [activeId, setActiveId] = useState(() => {
    const s = loadScenarios()
    return (s.length > 0 ? s[0] : DEFAULT_SCENARIO).id
  })
  const [journal, setJournal_] = useState<JournalEntry[]>(() => loadJournal())
  const [intake, setIntake] = useState<Intake>(() => loadIntake())
  const [tab, setTab] = useState("overview")
  const [showProfile, setShowProfile] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [isPro, setIsPro] = useState(false)

  // Persist on change
  const setScenarios = (s: AtriumScenario[]) => { setScenarios_(s); saveScenarios(s) }
  const setJournal = (j: JournalEntry[]) => { setJournal_(j); saveJournal(j) }

  const curS = scenarios.find((s) => s.id === activeId) ?? scenarios[0] ?? { ...DEFAULT_SCENARIO }
  const result = simulateAtrium(curS)

  const setScenario = (patch: Partial<AtriumScenario>) => {
    setScenarios(scenarios.map((s) => s.id === curS.id ? { ...s, ...patch } : s))
  }

  const userEmail = session?.user?.email ?? ""
  const userName = intake.name || userEmail.split("@")[0] || "Your study"

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate("/sign-in")
  }

  const TABS = [
    { id: "overview", label: "OVERVIEW" },
    { id: "compare", label: "COMPARE" },
    { id: "stress", label: "STRESS" },
    { id: "events", label: "EVENTS" },
    { id: "assumptions", label: "ASSUMPTIONS" },
    { id: "journal", label: "JOURNAL" },
    { id: "share", label: "SHARE" },
  ]

  return (
    <div style={{ minHeight: "100vh", background: T.paper, color: T.ink, fontFamily: FONT_BODY, display: "flex", flexDirection: "column" }}>
      {/* ── Top bar ── */}
      <div style={{
        height: 60, display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px", borderBottom: `1px solid ${T.line}`, background: T.paper,
        position: "sticky", top: 0, zIndex: 400, flexShrink: 0,
      }}>
        {/* Left: brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => setTab("overview")}>
          <div style={{ width: 18, height: 18, borderRadius: "50%", border: `1.5px solid ${T.ink}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 7, height: 7, background: T.ink, borderRadius: "50%" }} />
          </div>
          <span style={{ fontFamily: F.display, fontSize: 20, letterSpacing: -0.3, fontWeight: 500 }}>Clarifin</span>
        </div>

        {/* Center: tabs — desktop only (CSS hides on mobile) */}
        <div className="cl-topbar-tabs" style={{ display: "flex", gap: 0, alignItems: "center" }}>
          {TABS.map(({ id, label }) => (
            <div key={id} onClick={() => setTab(id)} style={{
              padding: "0 16px", height: 60, display: "flex", alignItems: "center",
              fontFamily: FONT_MONO, fontSize: 10, letterSpacing: "0.16em",
              cursor: "pointer", color: tab === id ? T.ink : T.mute,
              borderBottom: tab === id ? `2px solid ${T.accent}` : "2px solid transparent",
              transition: "color .2s",
            }}>{label}</div>
          ))}
        </div>

        {/* Right: trial pill + profile */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="cl-trial-pill">
            <TrialPill daysLeft={7} isPro={isPro} onUpgrade={() => setShowUpgrade(true)} />
          </div>
          {!isPro && (
            <div className="cl-upgrade-compact" onClick={() => setShowUpgrade(true)} style={{
              fontFamily: FONT_MONO, fontSize: 9, letterSpacing: "0.14em",
              padding: "5px 10px", background: T.ink, color: T.paper, cursor: "pointer",
            }}>PRO↑</div>
          )}
          <div onClick={() => setShowProfile(true)} style={{
            display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
            padding: "6px 10px", border: `1px solid ${T.line}`,
          }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: T.ink, color: T.paper, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_MONO, fontSize: 10 }}>
              {userName.slice(0, 2).toUpperCase()}
            </div>
            <span className="cl-profile-label" style={{ fontFamily: F.display, fontStyle: "italic", fontSize: 15, color: T.ink }}>{userName}</span>
            <span className="cl-profile-label" style={{ fontFamily: FONT_MONO, fontSize: 10, color: T.mute }}>▾</span>
          </div>
        </div>
      </div>

      {/* ── Mobile tab strip (CSS shows on mobile, hides on desktop) ── */}
      <div className="cl-mobile-tabs" style={{
        overflowX: "auto", borderBottom: `1px solid ${T.line}`,
        background: T.paper, flexShrink: 0,
      }}>
        {TABS.map(({ id, label }) => (
          <div key={id} onClick={() => setTab(id)} style={{
            padding: "0 14px", height: 40, display: "flex", alignItems: "center",
            fontFamily: FONT_MONO, fontSize: 10, letterSpacing: "0.14em",
            cursor: "pointer", color: tab === id ? T.ink : T.mute,
            borderBottom: tab === id ? `2px solid ${T.accent}` : "2px solid transparent",
            whiteSpace: "nowrap", flexShrink: 0,
          }}>{label}</div>
        ))}
      </div>

      {/* ── Scenario selector bar ── */}
      <div className="cl-scenario-bar" style={{
        height: 44, display: "flex", alignItems: "center", gap: 0,
        padding: "0 16px", borderBottom: `1px solid ${T.line}`, background: T.cream,
        flexShrink: 0, overflowX: "auto",
      }}>
        <span style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: "0.18em", color: T.mute, marginRight: 12, flexShrink: 0 }}>SCENARIO</span>
        {scenarios.map((s, i) => (
          <div key={s.id} onClick={() => setActiveId(s.id)} style={{
            padding: "0 12px", height: 44, display: "flex", alignItems: "center", gap: 7,
            fontFamily: F.display, fontSize: 15, cursor: "pointer",
            color: s.id === activeId ? T.ink : T.ink2,
            borderBottom: s.id === activeId ? `2px solid ${SC_COLORS[i % SC_COLORS.length]}` : "2px solid transparent",
            fontWeight: s.id === activeId ? 500 : 400, flexShrink: 0,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: SC_COLORS[i % SC_COLORS.length], flexShrink: 0 }} />
            {s.name}
          </div>
        ))}
        <div onClick={() => { setTab("compare") }} style={{ padding: "0 12px", height: 44, display: "flex", alignItems: "center", fontFamily: FONT_MONO, fontSize: 10, letterSpacing: "0.14em", color: T.mute, cursor: "pointer", flexShrink: 0 }}>
          + ADD
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {tab === "overview" && <OverviewScreen intake={intake} curS={curS} result={result} setTab={setTab} scenarios={scenarios} setActiveId={setActiveId} />}
        {tab === "compare" && <CompareScreen scenarios={scenarios} setScenarios={setScenarios} activeId={activeId} setActiveId={setActiveId} />}
        {tab === "stress" && <StressScreen curS={curS} />}
        {tab === "events" && <EventsScreen curS={curS} setScenario={setScenario} />}
        {tab === "assumptions" && <AssumptionsScreen curS={curS} setScenario={setScenario} />}
        {tab === "journal" && <JournalScreen journal={journal} setJournal={setJournal} />}
        {tab === "share" && <ShareScreen intake={intake} curS={curS} result={result} />}
      </div>

      {/* ── Footer ── */}
      <div className="cl-footer" style={{ display: "flex", borderTop: `1px solid ${T.line}`, padding: "14px 24px", justifyContent: "space-between", alignItems: "center", background: T.paper, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <BrandMark size={14} />
          <span style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: "0.18em", color: T.mute }}>CLARIFIN &nbsp;·&nbsp; A STUDY IN YOUR FINANCIAL FUTURE</span>
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          {["About", "Privacy", "Terms"].map((l) => (
            <span key={l} style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: "0.14em", color: T.mute, cursor: "pointer" }}>{l.toUpperCase()}</span>
          ))}
        </div>
      </div>

      {/* ── Profile dropdown ── */}
      {showProfile && (
        <ProfileMenu
          name={userName}
          email={userEmail}
          onClose={() => setShowProfile(false)}
          onSignOut={handleSignOut}
        />
      )}

      {/* ── Upgrade modal ── */}
      {showUpgrade && (
        <UpgradeModal
          onClose={() => setShowUpgrade(false)}
          onCheckout={(_plan) => { setIsPro(true); setShowUpgrade(false) }}
        />
      )}

      {/* ── Clarifin AI chat ── */}
      <ClarifinChat intake={intake} curS={curS} result={result} isPro={isPro} onUpgrade={() => setShowUpgrade(true)} />
    </div>
  )
}

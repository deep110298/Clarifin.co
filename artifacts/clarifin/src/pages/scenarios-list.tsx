import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Link } from "wouter"
import { customFetch } from "@workspace/api-client-react"
import { AppLayout } from "@/components/app/AppLayout"
import { Plus, Briefcase, Home, GraduationCap, Baby, Plane, Sliders, Trash2, Sparkles } from "lucide-react"

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

interface Scenario {
  id: string
  name: string
  type: string
  createdAt: string
}

interface Me {
  plan: "free" | "plus" | "advisor"
  profileComplete: boolean
}

const TYPE_META: Record<string, { label: string; icon: React.ElementType }> = {
  "job-change": { label: "JOB CHANGE", icon: Briefcase },
  "buy-home": { label: "BUY HOME", icon: Home },
  "school": { label: "EDUCATION", icon: GraduationCap },
  "child": { label: "NEW CHILD", icon: Baby },
  "time-off": { label: "TIME OFF", icon: Plane },
  "custom": { label: "CUSTOM", icon: Sliders },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export default function ScenariosListPage() {
  const qc = useQueryClient()
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  const { data: scenarios = [], isLoading } = useQuery({
    queryKey: ["scenarios"],
    queryFn: () => customFetch<Scenario[]>("/api/scenarios"),
  })

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => customFetch<Me>("/api/me"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => customFetch(`/api/scenarios/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scenarios"] }),
  })

  const handleUpgrade = async () => {
    setCheckoutLoading(true)
    setCheckoutError(null)
    try {
      const r = await customFetch<{ url: string }>("/api/billing/checkout", { method: "POST", body: JSON.stringify({ plan: "plus" }) })
      window.location.href = r.url
    } catch {
      setCheckoutError("Could not start checkout. Please try again.")
      setCheckoutLoading(false)
    }
  }

  const isFree = me?.plan === "free"

  return (
    <AppLayout>
      <div style={{ maxWidth: 960, margin: "0 auto", fontFamily: BODY }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 36 }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.18em", color: T.mute, marginBottom: 8 }}>
              YOUR SCENARIOS
            </div>
            <div style={{ fontFamily: SERIF, fontSize: 48, lineHeight: 1, letterSpacing: -1, color: T.ink }}>
              Your Scenarios.
            </div>
            <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 18, color: T.ink2, marginTop: 8 }}>
              Model any life decision and compare paths.
            </div>
          </div>
          <Link href="/app/scenarios/new">
            <button style={{
              background: T.ink, color: T.paper, border: "none",
              padding: "12px 22px", fontFamily: MONO, fontSize: 11,
              letterSpacing: "0.16em", cursor: "pointer", borderRadius: 0, marginTop: 8,
            }}>
              NEW SCENARIO →
            </button>
          </Link>
        </div>

        {/* Upgrade banner */}
        {isFree && scenarios.length > 1 && (
          <div style={{
            display: "flex", alignItems: "center", gap: 14,
            background: T.ink, color: T.paper, padding: "16px 20px",
            marginBottom: 28, border: `1px solid ${T.line}`,
          }}>
            <Sparkles style={{ width: 18, height: 18, color: T.mute, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.14em", marginBottom: 4 }}>UNLOCK FULL ANALYSIS</div>
              <div style={{ fontSize: 13, color: "rgba(238,238,236,0.65)" }}>
                Upgrade to view complete breakdowns, charts, and retirement projections on all scenarios.
              </div>
            </div>
            <button
              onClick={handleUpgrade}
              disabled={checkoutLoading}
              style={{
                background: T.paper, color: T.ink, border: "none",
                padding: "10px 18px", fontFamily: MONO, fontSize: 11,
                letterSpacing: "0.14em", cursor: checkoutLoading ? "wait" : "pointer",
                flexShrink: 0, borderRadius: 0,
              }}
            >{checkoutLoading ? "LOADING…" : "UPGRADE →"}</button>
          </div>
        )}
        {checkoutError && (
          <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 13, color: "#b15050", marginBottom: 12 }}>
            {checkoutError}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ background: T.panel, height: 180, opacity: 0.5 }} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && scenarios.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontFamily: SERIF, fontSize: 26, fontStyle: "italic", color: T.ink2, marginBottom: 12 }}>
              No scenarios yet.
            </div>
            <div style={{ fontFamily: BODY, fontSize: 14, color: T.mute, marginBottom: 28, maxWidth: 340, margin: "0 auto 28px" }}>
              Create your first scenario to see how a life decision affects your finances.
            </div>
            <Link href="/app/scenarios/new">
              <button style={{
                background: T.ink, color: T.paper, border: "none",
                padding: "13px 26px", fontFamily: MONO, fontSize: 11,
                letterSpacing: "0.16em", cursor: "pointer", borderRadius: 0,
              }}>+ CREATE FIRST SCENARIO</button>
            </Link>
          </div>
        )}

        {/* Scenario grid */}
        {!isLoading && scenarios.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1 }}>
            {scenarios.map((s: Scenario, i: number) => {
              const meta = TYPE_META[s.type] ?? TYPE_META.custom
              const Icon = meta.icon
              return (
                <div
                  key={s.id}
                  className="scenario-card"
                  style={{
                    background: T.panel, border: `1px solid ${T.line}`,
                    padding: "22px 24px", display: "flex", flexDirection: "column",
                    cursor: "pointer", transition: "background 0.2s",
                    position: "relative",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = T.cream; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = T.panel; }}
                >
                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm("Delete this scenario?")) deleteMutation.mutate(s.id)
                    }}
                    style={{
                      position: "absolute", top: 14, right: 14,
                      background: "none", border: "none", cursor: "pointer",
                      color: T.mute, opacity: 0, padding: 4,
                      transition: "opacity 0.2s",
                    }}
                    className="delete-btn"
                  >
                    <Trash2 style={{ width: 14, height: 14 }} />
                  </button>

                  {/* Tag */}
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    fontFamily: MONO, fontSize: 9, letterSpacing: "0.16em", color: T.mute,
                    marginBottom: 14,
                  }}>
                    <Icon style={{ width: 11, height: 11 }} strokeWidth={1.5} />
                    {meta.label}
                  </div>

                  {/* Name */}
                  <div style={{
                    fontFamily: SERIF, fontSize: 22, fontStyle: "italic",
                    lineHeight: 1.3, color: T.ink, flex: 1, marginBottom: 16,
                  }}>
                    {s.name}
                  </div>

                  {/* Footer */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.14em", color: T.mute }}>
                      {formatDate(s.createdAt)}
                    </span>
                    <Link href={`/app/scenarios/${s.id}`}>
                      <span style={{
                        fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em",
                        color: T.ink, textDecoration: "underline", textUnderlineOffset: 3, cursor: "pointer",
                      }}>VIEW ANALYSIS →</span>
                    </Link>
                  </div>
                </div>
              )
            })}

            {/* Add new */}
            <Link href="/app/scenarios/new">
              <div
                style={{
                  border: `1px dashed ${T.line2}`, display: "flex",
                  alignItems: "center", justifyContent: "center", gap: 10,
                  minHeight: 180, cursor: "pointer",
                  transition: "background 0.2s, border-color 0.2s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = T.cream; (e.currentTarget as HTMLElement).style.borderColor = T.ink; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.borderColor = T.line2; }}
              >
                <Plus style={{ width: 16, height: 16, color: T.mute }} />
                <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.16em", color: T.mute }}>
                  NEW SCENARIO
                </span>
              </div>
            </Link>
          </div>
        )}

        {/* Advisor nudge */}
        {scenarios.length > 0 && (
          <div style={{ marginTop: 28, background: T.ink, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Sparkles style={{ width: 18, height: 18, color: T.mute, flexShrink: 0 }} />
              <div>
                <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.16em", color: "rgba(238,238,236,0.6)", marginBottom: 4 }}>
                  ASK CLARIFIN
                </div>
                <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 16, color: T.paper }}>
                  Want a second opinion on any scenario?
                </div>
              </div>
            </div>
            <Link href="/app/advisor">
              <button style={{
                background: T.paper, color: T.ink, border: "none",
                padding: "10px 18px", fontFamily: MONO, fontSize: 11,
                letterSpacing: "0.14em", cursor: "pointer", borderRadius: 0,
              }}>ASK AI →</button>
            </Link>
          </div>
        )}

      </div>

      <style>{`
        .scenario-card:hover .delete-btn { opacity: 1 !important; }
      `}</style>
    </AppLayout>
  )
}

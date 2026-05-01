import { useEffect, useRef } from "react";

// ── Brand mark ───────────────────────────────────────────────
function BrandMark({ size = 30 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      border: "1.5px solid #0a0a09",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      <div style={{ width: size * 0.3, height: size * 0.3, background: "#0a0a09", borderRadius: "50%" }} />
    </div>
  );
}

// ── Hero SVG timeline ────────────────────────────────────────
function HeroTimeline() {
  const events = [
    { a: 34, t: "today", c: "#0a0a09" },
    { a: 41, t: "a quiet year", c: "#7a7a72" },
    { a: 48, t: "eldest at uni", c: "#5a5a55" },
    { a: 58, t: "retire", c: "#0a0a09" },
    { a: 72, t: "care", c: "#33332f" },
    { a: 92, t: "legacy", c: "#7a7a72" },
  ];
  const W = 520, H = 220, pad = 18, yBase = H - 50;
  const xMin = 30, xMax = 95;
  const x = (a: number) => pad + ((a - xMin) / (xMax - xMin)) * (W - pad * 2);

  const nwCurve: { a: number; y: number }[] = [];
  for (let a = xMin; a <= xMax; a += 1) {
    const t = (a - xMin) / (xMax - xMin);
    const v = Math.max(0, 4 * 0.62 * t * (1 - t * 0.85)) - (a > 70 ? (a - 70) * 0.014 : 0);
    nwCurve.push({ a, y: yBase - v * (yBase - 36) });
  }
  const curve = nwCurve.map((p, i) => (i === 0 ? "M" : "L") + x(p.a).toFixed(1) + "," + p.y.toFixed(1)).join(" ");
  const fill = curve + ` L ${x(xMax).toFixed(1)},${yBase} L ${x(xMin).toFixed(1)},${yBase} Z`;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block", maxWidth: 520, margin: "0 auto" }}>
      <path d={fill} fill="#0a0a09" opacity="0.08" />
      <path d={curve} stroke="#0a0a09" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      <line x1={pad} x2={W - pad} y1={yBase} y2={yBase} stroke="#33332f" strokeWidth="0.8" />
      {[30, 40, 50, 60, 70, 80, 90].map((a) => (
        <g key={a}>
          <line x1={x(a)} x2={x(a)} y1={yBase} y2={yBase + 5} stroke="#33332f" strokeWidth="0.5" />
          <text x={x(a)} y={yBase + 17} fontSize="9" fill="rgba(10,10,9,0.55)" textAnchor="middle"
            fontFamily="JetBrains Mono, monospace" letterSpacing="0.08em">{a}</text>
        </g>
      ))}
      {events.map((e, i) => {
        const above = i % 2 === 0;
        const yL = above ? 26 : yBase + 38;
        const cy = nwCurve.find((p) => p.a === e.a)?.y ?? yBase;
        return (
          <g key={e.a}>
            <line x1={x(e.a)} x2={x(e.a)} y1={yBase} y2={above ? yL + 10 : yL - 6}
              stroke={e.c} strokeWidth="0.6" strokeDasharray="2 2" />
            <circle cx={x(e.a)} cy={cy} r="3" fill={e.c} stroke="#dfdfdb" strokeWidth="1.5" />
            <circle cx={x(e.a)} cy={yBase} r="3" fill={e.c} />
            <text x={x(e.a)} y={yL} fontSize="9" fill={e.c} textAnchor="middle"
              fontFamily="JetBrains Mono, monospace" letterSpacing="0.1em">{e.a}</text>
            <text x={x(e.a)} y={yL + 13} fontSize="11" fill="#0a0a09" textAnchor="middle"
              fontFamily="Cormorant Garamond, Georgia, serif" fontStyle="italic">{e.t}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Reveal hook ──────────────────────────────────────────────
function useReveal(rootRef: React.RefObject<Element | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const els = root.querySelectorAll<HTMLElement>("[data-reveal]");
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).style.opacity = "1";
            (entry.target as HTMLElement).style.transform = "none";
            (entry.target as HTMLElement).style.filter = "none";
          }
        });
      },
      { threshold: 0.1 }
    );
    els.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(8px)";
      el.style.filter = "blur(2px)";
      el.style.transition = "opacity 550ms cubic-bezier(.2,.7,.2,1), transform 550ms cubic-bezier(.2,.7,.2,1), filter 550ms cubic-bezier(.2,.7,.2,1)";
      obs.observe(el);
    });
    return () => obs.disconnect();
  }, [rootRef]);
}

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
  gold: "#7a7a72",
};

const MONO = "JetBrains Mono, monospace";
const SERIF = "Cormorant Garamond, Georgia, serif";
const BODY = "Geist, Inter, system-ui, sans-serif";

export default function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  useReveal(rootRef);

  return (
    <div ref={rootRef} style={{
      minHeight: "100vh", background: T.paper, color: T.ink,
      fontFamily: BODY, display: "grid", gridTemplateColumns: "92px 1fr",
    }}>
      {/* Vertical rail */}
      <div style={{
        borderRight: `1px solid ${T.line}`,
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "32px 0", justifyContent: "space-between",
        position: "sticky", top: 0, height: "100vh",
      }}>
        <BrandMark size={30} />
        <div style={{
          writingMode: "vertical-rl", transform: "rotate(180deg)",
          fontFamily: MONO, fontSize: 10, letterSpacing: "0.32em", color: T.ink2,
        }}>
          CLARIFIN — A PERSONAL FINANCE SIMULATOR
        </div>
        <div style={{
          fontFamily: MONO, fontSize: 9, letterSpacing: "0.3em", color: T.mute,
          writingMode: "vertical-rl", transform: "rotate(180deg)",
        }}>
          EST. 2026
        </div>
      </div>

      <div>
        {/* Nav */}
        <div data-reveal style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "22px 48px", borderBottom: `1px solid ${T.line}`,
        }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.2em", color: T.mute }}>
            ISSUE № 04 · APRIL 2026
          </div>
          <div style={{ display: "flex", gap: 34, fontSize: 13.5, color: T.ink2 }}>
            {["The Studio", "The Method", "Examples", "Journal"].map((x) => (
              <span key={x} style={{ cursor: "pointer" }}>{x}</span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <a href="/sign-in" style={{ fontSize: 13, color: T.ink2, textDecoration: "none" }}>Sign in</a>
            <a href="/sign-up" style={{ textDecoration: "none" }}>
              <button style={{
                background: T.ink, color: T.paper, border: "none", padding: "10px 22px",
                fontFamily: MONO, fontSize: 11, letterSpacing: "0.14em", cursor: "pointer",
                borderRadius: 0,
              }}>BEGIN →</button>
            </a>
          </div>
        </div>

        {/* Hero */}
        <div style={{ display: "grid", gridTemplateColumns: "1.05fr 1fr", minHeight: 720 }}>
          {/* Left hero */}
          <div style={{
            padding: "80px 56px 60px",
            display: "flex", flexDirection: "column", justifyContent: "space-between",
            borderRight: `1px solid ${T.line}`,
          }}>
            <div>
              <div data-reveal style={{
                fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.22em",
                color: T.accent, marginBottom: 36, display: "flex", alignItems: "center", gap: 12,
              }}>
                <span style={{ display: "inline-block", width: 24, height: 1, background: T.accent }} />
                ON THINKING IN DECADES
              </div>
              <div data-reveal style={{
                fontFamily: SERIF, fontSize: 140, lineHeight: 0.92, letterSpacing: -4,
                fontWeight: 400, color: T.ink,
              }}>
                What<br /><em style={{ color: T.accent }}>if.</em>
              </div>
              <div data-reveal style={{
                fontFamily: SERIF, fontSize: 28, fontStyle: "italic",
                color: T.ink2, marginTop: 32, maxWidth: 500, lineHeight: 1.3,
              }}>
                Two small words behind<br />most of the expensive decisions<br />of a life.
              </div>
              <div data-reveal style={{
                maxWidth: 480, marginTop: 28, fontSize: 15, lineHeight: 1.65, color: T.ink2,
                fontFamily: BODY,
              }}>
                Clarifin is a simulator for the big what-ifs — the move, the baby, the business,
                the sabbatical, the exit. See them play out, in real dollars, before you commit a single one.
              </div>
            </div>
            <div data-reveal style={{ display: "flex", gap: 22, alignItems: "center", marginTop: 48 }}>
              <a href="/sign-up" style={{ textDecoration: "none" }}>
                <button style={{
                  background: T.ink, color: T.paper, border: "none", padding: "17px 34px",
                  fontFamily: MONO, fontSize: 11.5, letterSpacing: "0.18em", cursor: "pointer",
                  fontWeight: 500, borderRadius: 0,
                }}>RUN MY NUMBERS →</button>
              </a>
              <div style={{ fontSize: 12.5, color: T.mute }}>
                or{" "}
                <span style={{ textDecoration: "underline", textUnderlineOffset: 3, cursor: "pointer" }}>
                  a 90-second tour ↗
                </span>
              </div>
            </div>
          </div>

          {/* Right hero panel */}
          <div data-reveal style={{
            padding: "56px 48px", background: T.cream, position: "relative",
            overflow: "hidden", display: "flex", flexDirection: "column",
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between",
              fontFamily: MONO, fontSize: 10, letterSpacing: "0.22em", color: T.mute, marginBottom: 22,
            }}>
              <span>FIG. 01 — A LIFE, LAID OUT</span>
              <span>AGES 34 → 92</span>
            </div>
            <div style={{
              fontFamily: SERIF, fontSize: 26, fontStyle: "italic",
              lineHeight: 1.3, marginBottom: 32, color: T.ink,
            }}>
              Every decision<br />is also a clock.
            </div>
            <HeroTimeline />
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18,
              marginTop: 32, paddingTop: 26, borderTop: `1px solid ${T.line}`,
            }}>
              {[
                ["Real dollars", "Inflation is stripped out. The numbers you see are the numbers you'll feel."],
                ["No bank login", "You type what you know. Nothing leaves your device."],
                ["Decades at a glance", "Thirty years of your money on one quiet page."],
                ["Yours forever", "Export to PDF or carry your plan offline."],
              ].map(([title, desc]) => (
                <div key={title}>
                  <div style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 500, marginBottom: 4 }}>{title}</div>
                  <div style={{ fontSize: 12.5, color: T.ink2, lineHeight: 1.5 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section II: Questions */}
        <div style={{ padding: "100px 56px", borderTop: `1px solid ${T.line}` }}>
          <div data-reveal style={{
            fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.22em",
            color: T.accent, marginBottom: 18,
          }}>
            II. THE QUESTIONS PEOPLE BRING
          </div>
          <div data-reveal style={{
            fontFamily: SERIF, fontSize: 60, lineHeight: 1.05, letterSpacing: -1.5,
            fontWeight: 400, maxWidth: 960, marginBottom: 52,
          }}>
            Most of them start with <em style={{ color: T.accent }}>"can we afford…"</em><br />
            and end with a feeling. We turn them into numbers.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0 }}>
            {[
              ['"Can I take a year off without derailing retirement?"', "Sabbatical", "14 months"],
              ['"Can we afford a second home in Portugal?"', "Second home", "+$420k"],
              ['"If I leave my job at 45, what do I need saved?"', "Early exit", "$2.8M"],
              ['"Can we swing private school for both kids?"', "Education", "$340k"],
              ['"Should we move closer to family?"', "Relocation", "−$180k"],
              ['"What if the market drops 30% next year?"', "Stress test", "91% OK"],
            ].map(([q, tag, cost], i) => (
              <div
                data-reveal
                key={i}
                style={{
                  padding: "26px 28px",
                  borderTop: `1px solid ${T.line}`,
                  borderBottom: i >= 3 ? `1px solid ${T.line}` : "none",
                  borderRight: i % 3 < 2 ? `1px solid ${T.line}` : "none",
                  cursor: "pointer",
                  minHeight: 180,
                  display: "flex", flexDirection: "column", justifyContent: "space-between",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = T.cream; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <div style={{ fontFamily: SERIF, fontSize: 22, fontStyle: "italic", lineHeight: 1.3, color: T.ink }}>
                  {q}
                </div>
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  marginTop: 20, fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.12em", color: T.mute,
                }}>
                  <span>{(tag as string).toUpperCase()}</span>
                  <span style={{ color: T.accent }}>{cost}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section III: Method */}
        <div style={{ padding: "100px 56px", background: T.cream, borderTop: `1px solid ${T.line}` }}>
          <div data-reveal style={{
            fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.22em",
            color: T.accent, marginBottom: 18,
          }}>
            III. THE METHOD
          </div>
          <div data-reveal style={{
            fontFamily: SERIF, fontSize: 52, lineHeight: 1.05, letterSpacing: -1.2,
            fontWeight: 400, maxWidth: 860, marginBottom: 60,
          }}>
            Three small moves,<br />in sequence, every time.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 40 }}>
            {[
              ["i.", "Sketch", "Tell us who you are. Rough is fine — five numbers, two minutes."],
              ["ii.", "Ask", "Describe the thing you are considering. A year off, a move, an exit."],
              ["iii.", "Read", "We run 10,000 paths through the next 60 years and tell you what survives."],
            ].map(([n, title, desc]) => (
              <div data-reveal key={n as string}>
                <div style={{
                  fontFamily: SERIF, fontSize: 52, fontStyle: "italic",
                  color: T.accent, marginBottom: 12, fontWeight: 400,
                }}>{n}</div>
                <div style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 400, marginBottom: 10, letterSpacing: -0.4 }}>{title}</div>
                <div style={{ fontSize: 14, color: T.ink2, lineHeight: 1.55, maxWidth: 300, fontFamily: BODY }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Editorial quote */}
        <div style={{ padding: "100px 56px", borderTop: `1px solid ${T.line}` }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 80, alignItems: "center" }}>
            <div data-reveal>
              <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.22em", color: T.accent, marginBottom: 18 }}>
                A LETTER FROM THE STUDIO
              </div>
              <div style={{
                fontFamily: SERIF, fontSize: 34, fontStyle: "italic",
                lineHeight: 1.3, letterSpacing: -0.3, color: T.ink,
              }}>
                "The best financial plan is the one you've rehearsed out loud, twice.
                Clarifin is the quiet room for the rehearsal."
              </div>
              <div style={{ marginTop: 24, fontFamily: MONO, fontSize: 11, letterSpacing: "0.15em", color: T.mute }}>
                — E. HALVERSON, FOUNDER
              </div>
            </div>
            <div data-reveal style={{
              aspectRatio: "4/3",
              background: `repeating-linear-gradient(135deg, ${T.cream}, ${T.cream} 10px, ${T.paper} 10px, ${T.paper} 20px)`,
              border: `1px solid ${T.line2}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              position: "relative",
            }}>
              <div style={{
                position: "absolute", inset: 32,
                background: T.panel, border: `1px solid ${T.line2}`,
                display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 28,
              }}>
                <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.2em", color: T.mute }}>
                  PORTRAIT · PLACEHOLDER
                </div>
                <div style={{ fontFamily: SERIF, fontSize: 22, fontStyle: "italic", color: T.ink2 }}>
                  "Founder at desk, late afternoon"
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA band */}
        <div style={{
          padding: "80px 56px", background: T.ink, color: T.paper,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.22em", color: T.mute, marginBottom: 12 }}>
              START ANYWHERE
            </div>
            <div style={{
              fontFamily: SERIF, fontSize: 60, lineHeight: 1, letterSpacing: -1.5, fontWeight: 400,
            }}>
              What would you<br /><em style={{ color: T.mute }}>rehearse</em> first?
            </div>
          </div>
          <a href="/sign-up" style={{ textDecoration: "none" }}>
            <button style={{
              background: T.paper, color: T.ink, border: "none", padding: "22px 40px",
              fontFamily: MONO, fontSize: 12, letterSpacing: "0.18em", cursor: "pointer",
              fontWeight: 500, borderRadius: 0,
            }}>BEGIN A STUDY →</button>
          </a>
        </div>

        {/* Footer */}
        <div style={{
          padding: "36px 56px", background: T.paper, color: T.mute,
          fontFamily: MONO, fontSize: 10, letterSpacing: "0.15em",
          display: "flex", justifyContent: "space-between",
          borderTop: `1px solid ${T.line}`,
        }}>
          <span>CLARIFIN · INDEPENDENT · NOT AN ADVISOR</span>
          <span>PRIVACY · TERMS · CONTACT</span>
        </div>
      </div>
    </div>
  );
}

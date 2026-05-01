import { useMemo, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Plus, Sparkles, Briefcase, Home, GraduationCap, Baby, Plane, Sliders, X, PartyPopper,
} from "lucide-react";
import { AppLayout } from "@/components/app/AppLayout";
import { OnboardingTour, useOnboarding, markOnboardingComplete } from "@/components/app/OnboardingTour";
import { useStore } from "@/lib/store";
import {
  calculateMonthlyTakeHomeWith401k,
  projectNetWorthWithGrowth,
  calculateRetirementTarget,
  estimateRetirementAge,
  formatCurrency,
} from "@/lib/financial-engine";
import { useQuery } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";

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

const PROJECTION_YEARS = [10, 20, 30] as const;

const TYPE_ICONS: Record<string, React.ElementType> = {
  "job-change": Briefcase,
  "buy-home": Home,
  "school": GraduationCap,
  "child": Baby,
  "time-off": Plane,
  "custom": Sliders,
};

interface ApiScenario { id: string; name: string; type: string; createdAt: string }

function MonoLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.18em", color: T.mute, marginBottom: 6 }}>
      {children}
    </div>
  );
}

function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: T.panel, border: `1px solid ${T.line}`,
      padding: "24px 26px", ...style,
    }}>
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const { profile } = useStore();
  const [projYears, setProjYears] = useState<10 | 20 | 30>(30);
  const [showReal, setShowReal] = useState(false);
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(false);
  const shouldShowOnboarding = useOnboarding();
  const [showOnboarding, setShowOnboarding] = useState(shouldShowOnboarding);

  useEffect(() => {
    if (window.location.search.includes("upgraded=1")) {
      setShowUpgradeBanner(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const { data: scenarios = [] } = useQuery({
    queryKey: ["scenarios"],
    queryFn: () => customFetch<ApiScenario[]>("/api/scenarios"),
  });

  const monthlyTakeHome = useMemo(
    () => calculateMonthlyTakeHomeWith401k(
      profile.grossIncome, profile.filingStatus, profile.state, profile.annual401kContrib || 0
    ),
    [profile]
  );

  const totalMonthlyExpenses = useMemo(
    () => profile.housing + profile.transport + profile.food + profile.utilities + profile.healthcare + profile.otherExpenses,
    [profile]
  );

  const monthlySurplus = monthlyTakeHome - totalMonthlyExpenses;
  const totalMonthlySavings = monthlySurplus + (profile.annual401kContrib || 0) / 12 + (profile.annualRothIraContrib || 0) / 12;
  const savingsRate = monthlyTakeHome > 0 ? ((monthlySurplus / monthlyTakeHome) * 100) : 0;
  const totalDebt = profile.creditCardDebt + profile.studentLoans + profile.carLoans + profile.otherDebt;
  const netWorth = profile.emergencyFund + profile.retirementBalance + profile.otherInvestments - totalDebt;

  const retirementTarget = calculateRetirementTarget(totalMonthlyExpenses);
  const retirementProgress = netWorth > 0 ? Math.min(100, Math.round((netWorth / retirementTarget) * 100)) : 0;
  const estimatedRetireAge = estimateRetirementAge(profile.age, netWorth, Math.max(0, totalMonthlySavings), retirementTarget);
  const yearsToRetire = Math.max(0, estimatedRetireAge - profile.age);

  const projData = useMemo(() => {
    const current = projectNetWorthWithGrowth(netWorth, totalMonthlySavings, projYears, 0.07, 0.03, 0.025, showReal);
    return current.map((pt) => ({ year: `Year ${pt.year}`, value: pt.netWorth }));
  }, [netWorth, totalMonthlySavings, projYears, showReal]);

  return (
    <AppLayout>
      {showOnboarding && (
        <OnboardingTour onClose={() => { markOnboardingComplete(); setShowOnboarding(false); }} />
      )}
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* Upgrade banner */}
        {showUpgradeBanner && (
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            background: T.ink, color: T.paper, padding: "14px 20px",
            marginBottom: 28, border: `1px solid ${T.line}`,
          }}>
            <PartyPopper style={{ width: 18, height: 18, color: T.mute, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.14em" }}>WELCOME TO CLARIFIN PLUS</span>
              <span style={{ fontSize: 13, color: "rgba(238,238,236,0.7)", marginLeft: 12 }}>
                Unlimited scenarios, AI Advisor, and all Plus features. Your 7-day trial has started.
              </span>
            </div>
            <button
              onClick={() => setShowUpgradeBanner(false)}
              style={{ background: "none", border: "none", cursor: "pointer", color: T.mute, padding: 4 }}
            >
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>
        )}

        {/* Page label */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.2em", color: T.mute, marginBottom: 8 }}>
            FINANCIAL OVERVIEW
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
            <div style={{ fontFamily: SERIF, fontSize: 60, lineHeight: 1, letterSpacing: -1.5, color: T.ink }}>
              {formatCurrency(netWorth)}
            </div>
            <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.18em", color: T.mute }}>AT PRESENT</div>
          </div>
        </div>

        {/* KPI grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, marginBottom: 28 }}>
          {[
            { label: "MONTHLY TAKE-HOME", value: formatCurrency(monthlyTakeHome), sub: `${formatCurrency(profile.grossIncome)} / yr` },
            { label: "MONTHLY SURPLUS", value: formatCurrency(monthlySurplus), sub: `${savingsRate.toFixed(0)}% savings rate` },
            { label: "TOTAL DEBT", value: formatCurrency(totalDebt), sub: "Across all accounts" },
          ].map((kpi) => (
            <Panel key={kpi.label}>
              <MonoLabel>{kpi.label}</MonoLabel>
              <div style={{ fontFamily: SERIF, fontSize: 40, lineHeight: 1.05, letterSpacing: -0.8, color: T.ink, marginBottom: 4 }}>
                {kpi.value}
              </div>
              <div style={{ fontSize: 12, color: T.mute, fontFamily: BODY }}>{kpi.sub}</div>
            </Panel>
          ))}
        </div>

        {/* Main content row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, marginBottom: 24 }}>

          {/* Net Worth Projection */}
          <Panel>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <MonoLabel>NET WORTH PROJECTION</MonoLabel>
                <div style={{ fontFamily: SERIF, fontSize: 22, color: T.ink }}>Wealth over time</div>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                {PROJECTION_YEARS.map((y) => (
                  <button
                    key={y}
                    onClick={() => setProjYears(y)}
                    style={{
                      padding: "5px 12px", fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em",
                      border: `1px solid ${projYears === y ? T.ink : T.line2}`,
                      background: projYears === y ? T.ink : "transparent",
                      color: projYears === y ? T.paper : T.mute,
                      cursor: "pointer", borderRadius: 0,
                    }}
                  >{y}yr</button>
                ))}
                <button
                  onClick={() => setShowReal(!showReal)}
                  style={{
                    padding: "5px 12px", fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em",
                    border: `1px solid ${showReal ? T.ink : T.line2}`,
                    background: showReal ? T.ink : "transparent",
                    color: showReal ? T.paper : T.mute,
                    cursor: "pointer", borderRadius: 0,
                  }}
                >INF-ADJ</button>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={projData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="inkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0a0a09" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0a0a09" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,10,9,0.08)" vertical={false} />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 9, fill: T.mute, fontFamily: "JetBrains Mono, monospace" }}
                  axisLine={false} tickLine={false}
                  interval={Math.floor(projData.length / 4)}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: T.mute, fontFamily: "JetBrains Mono, monospace" }}
                  axisLine={false} tickLine={false}
                  tickFormatter={(v) => {
                    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
                    if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
                    return `$${v}`;
                  }}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12, border: `1px solid ${T.line}`,
                    borderRadius: 0, boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    background: T.panel, fontFamily: "JetBrains Mono, monospace",
                  }}
                  formatter={(v: number) => [formatCurrency(v), "Net Worth"]}
                />
                <Area type="monotone" dataKey="value" stroke="#0a0a09" strokeWidth={1.5} fill="url(#inkGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>

            <div style={{
              marginTop: 16, display: "flex", justifyContent: "space-between",
              fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em", color: T.mute,
            }}>
              <span>{formatCurrency(monthlySurplus)}/mo surplus</span>
              <span>saving {savingsRate.toFixed(0)}% · 7% avg return assumed</span>
            </div>
          </Panel>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Retirement */}
            <Panel>
              <MonoLabel>RETIREMENT</MonoLabel>
              <div style={{ fontFamily: SERIF, fontSize: 22, color: T.ink, marginBottom: 14 }}>
                Age {estimatedRetireAge}
              </div>
              <div style={{
                height: 3, background: T.cream, marginBottom: 10, position: "relative",
              }}>
                <div style={{
                  position: "absolute", left: 0, top: 0, height: "100%",
                  width: `${retirementProgress}%`, background: T.ink,
                  transition: "width 0.5s",
                }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 9, letterSpacing: "0.14em", color: T.mute, marginBottom: 16 }}>
                <span>{retirementProgress}% OF GOAL</span>
                <span>TARGET {formatCurrency(retirementTarget, true)}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, paddingTop: 14, borderTop: `1px solid ${T.line}` }}>
                {[
                  { label: "SAVINGS/MO", value: formatCurrency(totalMonthlySavings, true) },
                  { label: "CURRENT AGE", value: String(profile.age) },
                  { label: "YRS TO GO", value: String(yearsToRetire) },
                ].map(({ label, value }) => (
                  <div key={label} style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: SERIF, fontSize: 20, color: T.ink, lineHeight: 1 }}>{value}</div>
                    <div style={{ fontFamily: MONO, fontSize: 8, letterSpacing: "0.14em", color: T.mute, marginTop: 4 }}>{label}</div>
                  </div>
                ))}
              </div>
            </Panel>

            {/* Scenarios mini */}
            <Panel style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <MonoLabel>SCENARIOS</MonoLabel>
                <Link href="/app/scenarios">
                  <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.14em", color: T.ink, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}>
                    VIEW ALL →
                  </span>
                </Link>
              </div>

              {scenarios.length === 0 ? (
                <div style={{ textAlign: "center", padding: "16px 0" }}>
                  <Sparkles style={{ width: 20, height: 20, color: T.mute, margin: "0 auto 8px" }} />
                  <div style={{ fontFamily: SERIF, fontSize: 16, color: T.ink, marginBottom: 4 }}>No scenarios yet</div>
                  <div style={{ fontFamily: BODY, fontSize: 12, color: T.mute, marginBottom: 14 }}>Model your next financial move</div>
                  <Link href="/app/scenarios/new">
                    <button style={{
                      background: T.ink, color: T.paper, border: "none",
                      padding: "8px 16px", fontFamily: MONO, fontSize: 10,
                      letterSpacing: "0.14em", cursor: "pointer", borderRadius: 0,
                    }}>+ NEW SCENARIO</button>
                  </Link>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {scenarios.slice(0, 4).map((s: ApiScenario) => {
                    const Icon = TYPE_ICONS[s.type] ?? Sliders;
                    return (
                      <Link key={s.id} href={`/app/scenarios/${s.id}`}>
                        <div
                          style={{
                            display: "flex", alignItems: "center", gap: 10,
                            padding: "10px 8px", cursor: "pointer",
                            borderBottom: `1px solid ${T.line}`,
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = T.cream; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                        >
                          <Icon style={{ width: 14, height: 14, color: T.mute, flexShrink: 0 }} strokeWidth={1.5} />
                          <span style={{ flex: 1, fontFamily: SERIF, fontSize: 15, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {s.name}
                          </span>
                          <span style={{ fontFamily: MONO, fontSize: 9, color: T.mute }}>→</span>
                        </div>
                      </Link>
                    );
                  })}
                  <Link href="/app/scenarios/new">
                    <div
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "10px 8px", cursor: "pointer", marginTop: 4,
                        border: `1px dashed ${T.line2}`,
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = T.ink; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = T.line2; }}
                    >
                      <Plus style={{ width: 13, height: 13, color: T.mute }} />
                      <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", color: T.mute }}>NEW SCENARIO</span>
                    </div>
                  </Link>
                </div>
              )}
            </Panel>

            {/* AI Advisor link */}
            <Link href="/app/advisor">
              <div style={{
                background: T.ink, color: T.paper, padding: "18px 20px",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
              }}>
                <Sparkles style={{ width: 18, height: 18, color: T.mute, flexShrink: 0 }} />
                <div>
                  <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.16em", color: "rgba(238,238,236,0.6)", marginBottom: 4 }}>
                    ASK CLARIFIN
                  </div>
                  <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 15, color: T.paper }}>
                    A context-aware financial coach.
                  </div>
                </div>
                <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 11, color: "rgba(238,238,236,0.5)" }}>→</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Budget breakdown */}
        <Panel>
          <MonoLabel>MONTHLY BUDGET BREAKDOWN</MonoLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginTop: 16 }}>
            {[
              { label: "HOUSING", value: profile.housing },
              { label: "TRANSPORT", value: profile.transport },
              { label: "FOOD", value: profile.food },
              { label: "UTILITIES", value: profile.utilities },
              { label: "HEALTHCARE", value: profile.healthcare },
              { label: "OTHER", value: profile.otherExpenses },
            ].map((item) => {
              const pct = monthlyTakeHome > 0 ? (item.value / monthlyTakeHome) * 100 : 0;
              return (
                <div key={item.label} style={{ padding: "14px 12px", background: T.paper, border: `1px solid ${T.line}` }}>
                  <div style={{ fontFamily: MONO, fontSize: 8, letterSpacing: "0.16em", color: T.mute, marginBottom: 8 }}>
                    {item.label}
                  </div>
                  <div style={{ fontFamily: SERIF, fontSize: 22, color: T.ink, marginBottom: 10, lineHeight: 1 }}>
                    {formatCurrency(item.value)}
                  </div>
                  <div style={{ height: 2, background: T.cream, position: "relative" }}>
                    <div style={{
                      position: "absolute", left: 0, top: 0, height: "100%",
                      width: `${Math.min(100, pct)}%`, background: T.ink,
                    }} />
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 8, letterSpacing: "0.12em", color: T.mute, marginTop: 6 }}>
                    {pct.toFixed(0)}%
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

      </div>
    </AppLayout>
  );
}

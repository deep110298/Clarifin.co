import { useMemo, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, PiggyBank,
  ArrowUpRight, ArrowDownRight, Plus, Search, SlidersHorizontal,
  Sparkles, Briefcase, Home, GraduationCap, Baby, Plane, Sliders, PartyPopper, X,
} from "lucide-react";
import { AppLayout } from "@/components/app/AppLayout";
import { useStore } from "@/lib/store";
import {
  calculateMonthlyTakeHomeWith401k,
  projectNetWorthWithGrowth,
  calculateRetirementTarget,
  estimateRetirementAge,
  formatCurrency,
} from "@/lib/financial-engine";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";

const PROJECTION_YEARS = [10, 20, 30] as const;

const SCENARIO_COLORS = [
  "bg-[#FFF3CD] text-[#B45309]",
  "bg-[#DBEAFE] text-[#1D4ED8]",
  "bg-[#DCFCE7] text-[#15803D]",
  "bg-[#FCE7F3] text-[#BE185D]",
  "bg-[#EDE9FE] text-[#6D28D9]",
];

const TYPE_ICONS: Record<string, React.ElementType> = {
  "job-change": Briefcase,
  "buy-home": Home,
  "school": GraduationCap,
  "child": Baby,
  "time-off": Plane,
  "custom": Sliders,
};

interface ApiScenario { id: string; name: string; type: string; createdAt: string }

export default function DashboardPage() {
  const { profile } = useStore();
  const [projYears, setProjYears] = useState<10 | 20 | 30>(30);
  const [showReal, setShowReal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(false);
  const [, navigate] = useLocation();

  // Show success banner when returning from Stripe checkout
  useEffect(() => {
    if (window.location.search.includes("upgraded=1")) {
      setShowUpgradeBanner(true);
      // Clean the URL without a reload
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // Always fetch fresh scenarios from the API so a page refresh shows correct data
  const { data: scenarios = [] } = useQuery({
    queryKey: ["scenarios"],
    queryFn: () => customFetch<ApiScenario[]>("/api/scenarios"),
  });

  const monthlyTakeHome = useMemo(
    () => calculateMonthlyTakeHomeWith401k(
      profile.grossIncome,
      profile.filingStatus,
      profile.state,
      profile.annual401kContrib || 0
    ),
    [profile]
  );

  const totalMonthlyExpenses = useMemo(
    () => profile.housing + profile.transport + profile.food + profile.utilities + profile.healthcare + profile.otherExpenses,
    [profile]
  );

  // Cash surplus after taxes, 401k deduction, and expenses
  const monthlySurplus = monthlyTakeHome - totalMonthlyExpenses;
  // Total savings for projection = cash surplus + Roth IRA (post-tax, but still savings)
  // 401k is already deducted from take-home so we add it back as retirement savings
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
    return current.map((pt) => ({
      year: `Year ${pt.year}`,
      value: pt.netWorth,
    }));
  }, [netWorth, totalMonthlySavings, projYears, showReal]);

  const quickCards = [
    {
      label: "Net Worth",
      value: formatCurrency(netWorth),
      sub: netWorth >= 0 ? "Positive equity" : "Net liability",
      icon: DollarSign,
      bg: "bg-[#FFF9E6]",
      iconColor: "text-[#F59E0B]",
      up: netWorth >= 0,
    },
    {
      label: "Monthly Take-Home",
      value: formatCurrency(monthlyTakeHome),
      sub: `${formatCurrency(profile.grossIncome)} / yr`,
      icon: TrendingUp,
      bg: "bg-[#EFF6FF]",
      iconColor: "text-[#3B82F6]",
      up: true,
    },
    {
      label: "Monthly Surplus",
      value: formatCurrency(monthlySurplus),
      sub: `${savingsRate.toFixed(0)}% savings rate`,
      icon: PiggyBank,
      bg: "bg-[#F0FDF4]",
      iconColor: "text-[#22C55E]",
      up: monthlySurplus >= 0,
    },
    {
      label: "Total Debt",
      value: formatCurrency(totalDebt),
      sub: "Across all accounts",
      icon: TrendingDown,
      bg: "bg-[#FFF1F2]",
      iconColor: "text-[#F43F5E]",
      up: false,
    },
  ];

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Upgrade success banner */}
        {showUpgradeBanner && (
          <div className="flex items-center gap-3 bg-[#1A1A2E] text-white rounded-2xl px-5 py-4 shadow-sm">
            <PartyPopper className="w-5 h-5 text-[#FACC15] shrink-0" />
            <div className="flex-1">
              <span className="font-semibold">Welcome to Clarifin Plus!</span>
              <span className="text-white/70 text-sm ml-2">You now have unlimited scenarios, AI Advisor, and all Plus features. Your 7-day trial has started.</span>
            </div>
            <button onClick={() => setShowUpgradeBanner(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>
        )}

        {/* Action bar */}
        <div className="flex items-center gap-3">
          <Link href="/app/scenarios/new">
            <button className="flex items-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-[#1A1A2E] text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shadow-sm">
              <Plus className="w-4 h-4" /> Add new
            </button>
          </Link>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#9CA3AF] shadow-sm flex-1 max-w-xs">
            <Search className="w-4 h-4 shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search scenarios..."
              className="flex-1 bg-transparent outline-none text-[#1A1A2E] placeholder-[#9CA3AF] text-sm"
            />
          </div>
          <button
            onClick={() => window.location.href = '/app/scenarios'}
            className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#9CA3AF]" />
          </button>
        </div>

        {/* Quick cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickCards.map((c) => (
            <div key={c.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col items-center text-center gap-2">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-1", c.bg)}>
                <c.icon className={cn("w-6 h-6", c.iconColor)} strokeWidth={1.8} />
              </div>
              <div className="text-lg font-bold text-[#1A1A2E]">{c.value}</div>
              <div className="text-xs font-semibold text-[#6B7280]">{c.label}</div>
              <div className="text-[11px] text-[#9CA3AF]">{c.sub}</div>
            </div>
          ))}
        </div>

        {/* Retirement Progress */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-[#1A1A2E]">Retirement Progress</h2>
              <p className="text-xs text-[#9CA3AF] mt-0.5">Rule of 25 · 4% safe withdrawal rate</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-[#1A1A2E]">Age {estimatedRetireAge}</div>
              <div className="text-xs text-[#9CA3AF]">Estimated retirement age</div>
            </div>
          </div>
          <div className="space-y-2 mb-5">
            <div className="flex justify-between text-sm">
              <span className="text-[#6B7280]">{formatCurrency(Math.max(0, netWorth), true)} saved</span>
              <span className="font-semibold text-[#1A1A2E]">{retirementProgress}% of goal</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#FACC15] rounded-full transition-all duration-500" style={{ width: `${retirementProgress}%` }} />
            </div>
            <div className="flex justify-between text-xs text-[#9CA3AF]">
              <span>$0</span>
              <span>Target: {formatCurrency(retirementTarget, true)}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
            {[
              { label: "Monthly savings", value: formatCurrency(totalMonthlySavings, true) + "/mo" },
              { label: "Current age", value: String(profile.age) },
              { label: "Years to retire", value: yearsToRetire + " yrs" },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <div className="text-sm font-bold text-[#1A1A2E]">{value}</div>
                <div className="text-[10px] text-[#9CA3AF] mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Main content row */}
        <div className="grid lg:grid-cols-3 gap-5">

          {/* Expenditure chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-[#1A1A2E]">Net Worth Projection</h2>
                <p className="text-xs text-[#9CA3AF] mt-0.5">7% avg annual return assumed</p>
              </div>
              <div className="flex gap-1.5 flex-wrap justify-end">
                {PROJECTION_YEARS.map((y) => (
                  <button
                    key={y}
                    onClick={() => setProjYears(y)}
                    className={cn(
                      "px-3 py-1 text-xs font-semibold rounded-lg transition-colors",
                      projYears === y ? "bg-[#FACC15] text-[#1A1A2E]" : "bg-gray-100 text-[#9CA3AF] hover:bg-gray-200"
                    )}
                  >
                    {y}yr
                  </button>
                ))}
                <div className="flex gap-1 ml-1">
                  <button
                    onClick={() => setShowReal(false)}
                    className={cn(
                      "px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors",
                      !showReal ? "bg-[#1A1A2E] text-white" : "bg-gray-100 text-[#9CA3AF] hover:bg-gray-200"
                    )}
                  >
                    Nominal
                  </button>
                  <button
                    onClick={() => setShowReal(true)}
                    className={cn(
                      "px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors",
                      showReal ? "bg-[#1A1A2E] text-white" : "bg-gray-100 text-[#9CA3AF] hover:bg-gray-200"
                    )}
                  >
                    Inflation-adj.
                  </button>
                </div>
              </div>
            </div>

            {/* Big number */}
            <div className="mb-4">
              <div className="text-3xl font-bold text-[#1A1A2E]">{formatCurrency(netWorth)}</div>
              <div className={cn("flex items-center gap-1 text-sm font-medium mt-1", netWorth >= 0 ? "text-[#22C55E]" : "text-[#F43F5E]")}>
                {netWorth >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {netWorth >= 0 ? "Positive net worth" : "Net liability"}
              </div>
            </div>

            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={projData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FACC15" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#FACC15" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} interval={Math.floor(projData.length / 4)} />
                <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={(v) => {
                  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
                  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
                  return `$${v}`;
                }} />
                <Tooltip contentStyle={{ fontSize: 12, border: "1px solid #F3F4F6", borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} formatter={(v: number) => [formatCurrency(v), "Net Worth"]} />
                <Area type="monotone" dataKey="value" stroke="#FACC15" strokeWidth={3} fill="url(#grad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>

            <div className="mt-3 flex items-center justify-between text-xs text-[#9CA3AF]">
              <span className="font-semibold text-[#1A1A2E]">{formatCurrency(monthlySurplus)}/mo surplus</span>
              <span>saving {savingsRate.toFixed(0)}% of income · Assumes 3% annual salary growth</span>
            </div>
          </div>

          {/* Scenarios list (investments style) */}
          <div className="flex flex-col gap-4">
            {/* Scenarios */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex-1">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-[#1A1A2E]">Scenarios</h2>
                <Link href="/app/scenarios">
                  <button className="text-xs text-[#FACC15] font-bold hover:underline flex items-center gap-1">
                    View all <ArrowUpRight className="w-3 h-3" />
                  </button>
                </Link>
              </div>
              <div className="space-y-3">
                {scenarios.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="w-10 h-10 rounded-xl bg-[#FFF9E6] flex items-center justify-center mx-auto mb-3">
                      <Sparkles className="w-5 h-5 text-[#F59E0B]" />
                    </div>
                    <p className="text-sm font-semibold text-[#1A1A2E] mb-1">Model your next move</p>
                    <p className="text-xs text-[#9CA3AF] mb-4 max-w-[160px] mx-auto">See exactly how a job change, home purchase, or career break affects your wealth.</p>
                    <Link href="/app/scenarios/new">
                      <button className="bg-[#FACC15] hover:bg-yellow-300 text-[#1A1A2E] text-xs font-bold px-4 py-2 rounded-xl transition-colors">
                        + Create first scenario
                      </button>
                    </Link>
                  </div>
                ) : (
                  scenarios.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 4).map((s, i) => {
                    const Icon = TYPE_ICONS[s.type] ?? Sliders;
                    const colorClass = SCENARIO_COLORS[i % SCENARIO_COLORS.length];
                    return (
                      <Link key={s.id} href={`/app/scenarios/${s.id}`}>
                        <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0", colorClass)}>
                            <Icon style={{ width: 16, height: 16 }} strokeWidth={2} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-[#1A1A2E] truncate">{s.name}</div>
                            <div className="text-xs text-[#9CA3AF]">{s.type.replace("-", " ")}</div>
                          </div>
                          <ArrowUpRight className="w-4 h-4 text-[#D1D5DB] shrink-0" />
                        </div>
                      </Link>
                    );
                  })
                )}
                <Link href="/app/scenarios/new">
                  <div className="flex items-center gap-3 p-2.5 rounded-xl border border-dashed border-gray-200 hover:border-[#FACC15] cursor-pointer transition-colors mt-1">
                    <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center">
                      <Plus className="w-4 h-4 text-[#9CA3AF]" />
                    </div>
                    <span className="text-sm text-[#9CA3AF] font-medium">New scenario</span>
                  </div>
                </Link>
              </div>
            </div>

            {/* Dark balance card */}
            <div className="bg-[#1A1A2E] rounded-2xl p-5 text-white shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-white/50 font-medium uppercase tracking-widest">Total Balance</p>
                <button
                  onClick={() => window.location.href = '/app/profile'}
                  className="w-7 h-7 bg-white/10 rounded-full flex items-center justify-center"
                >
                  <ArrowUpRight className="w-3.5 h-3.5 text-white/60" />
                </button>
              </div>
              <div className="text-2xl font-bold mb-4">{formatCurrency(netWorth)}</div>
              <div className="flex gap-2 mb-4">
                {[
                  { label: "Income", value: formatCurrency(monthlyTakeHome), up: true },
                  { label: "Expenses", value: formatCurrency(totalMonthlyExpenses), up: false },
                ].map((item) => (
                  <div key={item.label} className="flex-1 bg-white/10 rounded-xl p-3">
                    <div className={cn("text-xs font-medium mb-1", item.up ? "text-[#FACC15]" : "text-[#F87171]")}>{item.label}</div>
                    <div className="text-sm font-bold text-white">{item.value}</div>
                  </div>
                ))}
              </div>
              <Link href="/app/advisor">
                <div className="flex items-center gap-2 bg-[#FACC15] rounded-xl p-3 cursor-pointer hover:bg-yellow-300 transition-colors">
                  <Sparkles className="w-4 h-4 text-[#1A1A2E]" strokeWidth={2} />
                  <div>
                    <p className="text-xs font-bold text-[#1A1A2E]">AI Advisor</p>
                    <p className="text-[10px] text-[#1A1A2E]/70">Ask anything about your finances</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Budget breakdown */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-[#1A1A2E] mb-5">Monthly Budget Breakdown</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: "Housing", value: profile.housing, color: "bg-[#FFF9E6]", bar: "bg-[#F59E0B]" },
              { label: "Transport", value: profile.transport, color: "bg-[#EFF6FF]", bar: "bg-[#3B82F6]" },
              { label: "Food", value: profile.food, color: "bg-[#F0FDF4]", bar: "bg-[#22C55E]" },
              { label: "Utilities", value: profile.utilities, color: "bg-[#FFF1F2]", bar: "bg-[#F43F5E]" },
              { label: "Healthcare", value: profile.healthcare, color: "bg-[#F5F3FF]", bar: "bg-[#8B5CF6]" },
              { label: "Other", value: profile.otherExpenses, color: "bg-[#F0FDFA]", bar: "bg-[#14B8A6]" },
            ].map((item) => {
              const pct = monthlyTakeHome > 0 ? (item.value / monthlyTakeHome) * 100 : 0;
              return (
                <div key={item.label} className={cn("rounded-2xl p-4", item.color)}>
                  <div className="text-[10px] uppercase tracking-widest text-[#9CA3AF] font-semibold mb-2">{item.label}</div>
                  <div className="text-xl font-bold text-[#1A1A2E] mb-3">{formatCurrency(item.value)}</div>
                  <div className="h-1.5 bg-black/10 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", item.bar)} style={{ width: `${Math.min(100, pct)}%` }} />
                  </div>
                  <div className="text-xs text-[#9CA3AF] mt-2">{pct.toFixed(0)}% of income</div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </AppLayout>
  );
}

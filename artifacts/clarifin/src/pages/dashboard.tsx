import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, PiggyBank,
  ArrowRight, Plus, Sparkles,
} from "lucide-react";
import { AppLayout } from "@/components/app/AppLayout";
import { useStore } from "@/lib/store";
import {
  calculateMonthlyTakeHome,
  projectNetWorth,
  formatCurrency,
} from "@/lib/financial-engine";
import { cn } from "@/lib/utils";

const PROJECTION_YEARS = [10, 20, 30] as const;

const SCENARIO_TYPE_LABELS: Record<string, string> = {
  "job-change": "Job Change",
  "buy-home": "Buy Home",
  "school": "Go Back to School",
  "child": "New Child",
  "time-off": "Time Off",
  "custom": "Custom",
};

export default function DashboardPage() {
  const { profile, scenarios } = useStore();
  const [projYears, setProjYears] = useState<10 | 20 | 30>(30);

  const monthlyTakeHome = useMemo(
    () => calculateMonthlyTakeHome(profile.grossIncome, profile.filingStatus, profile.state),
    [profile]
  );

  const totalMonthlyExpenses = useMemo(
    () =>
      profile.housing +
      profile.transport +
      profile.food +
      profile.utilities +
      profile.healthcare +
      profile.otherExpenses,
    [profile]
  );

  const monthlySurplus = monthlyTakeHome - totalMonthlyExpenses + profile.monthlyRetirementContrib;
  const savingsRate = monthlyTakeHome > 0 ? ((monthlySurplus / monthlyTakeHome) * 100) : 0;
  const totalDebt = profile.creditCardDebt + profile.studentLoans + profile.carLoans + profile.otherDebt;
  const netWorth = profile.emergencyFund + profile.retirementBalance + profile.otherInvestments - totalDebt;

  const projData = useMemo(() => {
    const current = projectNetWorth(netWorth, monthlySurplus, projYears);
    const optimistic = projectNetWorth(netWorth, monthlySurplus * 1.4, projYears, 0.07);
    return current.map((pt, i) => ({
      year: `Year ${pt.year}`,
      "Current": pt.netWorth,
      "Optimized": optimistic[i].netWorth,
    }));
  }, [netWorth, monthlySurplus, projYears]);

  const metrics = [
    {
      label: "Net Worth",
      value: formatCurrency(netWorth),
      sub: netWorth >= 0 ? "positive equity" : "net liability",
      icon: DollarSign,
      positive: true,
      arrowUp: netWorth >= 0,
    },
    {
      label: "Monthly Take-Home",
      value: formatCurrency(monthlyTakeHome),
      sub: `${formatCurrency(profile.grossIncome)} / yr`,
      icon: TrendingUp,
      positive: true,
      arrowUp: true,
    },
    {
      label: "Monthly Surplus",
      value: formatCurrency(monthlySurplus),
      sub: `${savingsRate.toFixed(0)}% savings rate`,
      icon: PiggyBank,
      positive: true,
      arrowUp: monthlySurplus >= 0,
    },
    {
      label: "Total Debt",
      value: formatCurrency(totalDebt),
      sub: "across all accounts",
      icon: TrendingDown,
      positive: false,
      arrowUp: false,
    },
  ];

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-5">

        {/* Metric cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((m) => (
            <div key={m.label} className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center",
                  m.positive ? "bg-[#E8F5EE]" : "bg-[#FFF3ED]"
                )}>
                  <m.icon className={cn(m.positive ? "text-[#4D8F6A]" : "text-[#E07B4A]")} strokeWidth={1.5} style={{ width: 18, height: 18 }} />
                </div>
                <ArrowRight
                  className={cn("w-4 h-4 -rotate-45", m.arrowUp ? "text-[#4D8F6A]" : "text-[#E07B4A]")}
                  strokeWidth={2}
                />
              </div>
              <div className="text-2xl font-bold text-[#1A2C20] tracking-tight">{m.value}</div>
              <div className="text-xs text-[#9BAA9E] mt-1">{m.label}</div>
              <div className="text-xs text-[#6B7A72] mt-0.5 font-medium">{m.sub}</div>
            </div>
          ))}
        </div>

        {/* Chart + Scenarios row */}
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Projection chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="font-bold text-[#1A2C20]">Net Worth Projection</h2>
                <p className="text-xs text-[#9BAA9E] mt-0.5">7% avg annual return assumed</p>
              </div>
              <div className="flex gap-1.5">
                {PROJECTION_YEARS.map((y) => (
                  <button
                    key={y}
                    onClick={() => setProjYears(y)}
                    className={cn(
                      "px-3 py-1 text-xs font-medium rounded-full transition-colors",
                      projYears === y
                        ? "bg-[#4D8F6A] text-white"
                        : "bg-[#F4FAF6] text-[#9BAA9E] hover:text-[#4D8F6A]"
                    )}
                  >
                    {y}yr
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={projData} margin={{ top: 12, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="gradCurrent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4D8F6A" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#4D8F6A" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradOptimized" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4D8F6A" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#4D8F6A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F7F2" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#9BAA9E" }} axisLine={false} tickLine={false} interval={Math.floor(projData.length / 5)} />
                <YAxis tick={{ fontSize: 11, fill: "#9BAA9E" }} axisLine={false} tickLine={false} tickFormatter={(v) => {
                  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
                  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
                  return `$${v}`;
                }} />
                <Tooltip contentStyle={{ fontSize: 12, border: "1px solid #E8F5EE", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", color: "#1A2C20" }} formatter={(v: number) => formatCurrency(v)} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 16, color: "#9BAA9E" }} />
                <Area type="monotone" dataKey="Current" stroke="#4D8F6A" strokeWidth={2} fill="url(#gradCurrent)" />
                <Area type="monotone" dataKey="Optimized" stroke="#4D8F6A" strokeWidth={2} fill="url(#gradOptimized)" strokeDasharray="5 3" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Scenarios panel */}
          <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[#1A2C20]">Scenarios</h2>
              <Link href="/app/scenarios">
                <button className="text-xs text-[#4D8F6A] hover:underline font-medium flex items-center gap-1">
                  View all <ArrowRight className="w-3 h-3" />
                </button>
              </Link>
            </div>

            <div className="space-y-0 flex-1">
              {scenarios.slice(0, 4).map((s) => (
                <Link key={s.id} href={`/app/scenarios/${s.id}`}>
                  <div className="group flex items-center justify-between py-3 border-b border-gray-50 cursor-pointer">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[#1A2C20] truncate">{s.name}</div>
                      <div className="text-xs text-[#9BAA9E]">{SCENARIO_TYPE_LABELS[s.type]}</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#9BAA9E] group-hover:text-[#4D8F6A] shrink-0 ml-2 transition-colors" />
                  </div>
                </Link>
              ))}
              <Link href="/app/scenarios/new">
                <div className="flex items-center gap-2 py-3 cursor-pointer text-[#9BAA9E] hover:text-[#4D8F6A] transition-colors border border-dashed border-[#D4EAD9] rounded-xl px-3 mt-2">
                  <Plus className="w-3.5 h-3.5" />
                  <span className="text-sm">New scenario</span>
                </div>
              </Link>
            </div>

            <Link href="/app/advisor">
              <div className="mt-4 p-4 bg-[#4D8F6A] rounded-xl text-white cursor-pointer hover:bg-[#3D7A5A] transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4" strokeWidth={1.5} />
                  <span className="text-sm font-semibold">AI Advisor</span>
                </div>
                <p className="text-sm text-white/80">Ask anything about your finances →</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Monthly Budget Breakdown */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-[#1A2C20] mb-5">Monthly Budget Breakdown</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: "Housing", value: profile.housing },
              { label: "Transport", value: profile.transport },
              { label: "Food", value: profile.food },
              { label: "Utilities", value: profile.utilities },
              { label: "Healthcare", value: profile.healthcare },
              { label: "Other", value: profile.otherExpenses },
            ].map((item) => {
              const pct = monthlyTakeHome > 0 ? (item.value / monthlyTakeHome) * 100 : 0;
              return (
                <div key={item.label} className="bg-[#F8FCF9] rounded-xl p-4">
                  <div className="text-[10px] uppercase tracking-widest text-[#9BAA9E] font-medium mb-2">{item.label}</div>
                  <div className="text-xl font-bold text-[#1A2C20] tracking-tight mb-3">{formatCurrency(item.value)}</div>
                  <div className="h-1.5 bg-[#E8F5EE] rounded-full overflow-hidden">
                    <div className="h-full bg-[#4D8F6A] rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%` }} />
                  </div>
                  <div className="text-xs text-[#9BAA9E] mt-2">{pct.toFixed(0)}% of income</div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4">
            <div className="bg-[#F8FCF9] rounded-xl p-4">
              <div className="text-xs text-[#9BAA9E] mb-1">Total Expenses</div>
              <div className="text-xl font-bold text-[#1A2C20]">{formatCurrency(totalMonthlyExpenses)}</div>
            </div>
            <div className="bg-[#F8FCF9] rounded-xl p-4">
              <div className="text-xs text-[#9BAA9E] mb-1">Take-Home</div>
              <div className="text-xl font-bold text-[#1A2C20]">{formatCurrency(monthlyTakeHome)}</div>
            </div>
            <div className="bg-[#E8F5EE] rounded-xl p-4">
              <div className="text-xs text-[#4D8F6A] font-medium mb-1">Monthly Surplus</div>
              <div className={cn("text-xl font-bold", monthlySurplus >= 0 ? "text-[#4D8F6A]" : "text-[#E07B4A]")}>
                {formatCurrency(monthlySurplus)}
              </div>
            </div>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}

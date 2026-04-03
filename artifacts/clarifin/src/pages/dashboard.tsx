import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, PiggyBank,
  GitCompare, ArrowRight, Plus, Zap,
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

  // Core financials from profile
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

  // Projection data
  const projData = useMemo(() => {
    const current = projectNetWorth(netWorth, monthlySurplus, projYears);
    // Optimistic: assume 10% raise scenario
    const optimistic = projectNetWorth(netWorth, monthlySurplus * 1.4, projYears, 0.07);
    return current.map((pt, i) => ({
      year: `Year ${pt.year}`,
      "Current path": pt.netWorth,
      "Optimized path": optimistic[i].netWorth,
    }));
  }, [netWorth, monthlySurplus, projYears]);

  const metrics = [
    {
      label: "Net Worth",
      value: formatCurrency(netWorth),
      sub: netWorth >= 0 ? "positive equity" : "net liability",
      icon: DollarSign,
      color: netWorth >= 0 ? "text-[#1D9E75]" : "text-red-500",
      bg: netWorth >= 0 ? "bg-[#1D9E75]/10" : "bg-red-50",
    },
    {
      label: "Monthly Take-Home",
      value: formatCurrency(monthlyTakeHome),
      sub: `${formatCurrency(profile.grossIncome)} gross / yr`,
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Monthly Surplus",
      value: formatCurrency(monthlySurplus),
      sub: `${savingsRate.toFixed(0)}% savings rate`,
      icon: PiggyBank,
      color: monthlySurplus >= 0 ? "text-[#1D9E75]" : "text-red-500",
      bg: monthlySurplus >= 0 ? "bg-[#1D9E75]/10" : "bg-red-50",
    },
    {
      label: "Total Debt",
      value: formatCurrency(totalDebt),
      sub: "across all accounts",
      icon: TrendingDown,
      color: "text-orange-500",
      bg: "bg-orange-50",
    },
  ];

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0D1B2A]">Your Financial Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Based on ${profile.grossIncome.toLocaleString()} gross income · {profile.state} · {profile.filingStatus}
            </p>
          </div>
          <Link href="/app/scenarios/new">
            <button className="flex items-center gap-2 bg-[#1D9E75] hover:bg-[#178f68] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <Plus className="w-4 h-4" />
              New Scenario
            </button>
          </Link>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((m) => (
            <div key={m.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{m.label}</span>
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", m.bg)}>
                  <m.icon className={cn("w-4 h-4", m.color)} />
                </div>
              </div>
              <div className={cn("text-2xl font-bold", m.color)}>{m.value}</div>
              <div className="text-xs text-gray-400 mt-1">{m.sub}</div>
            </div>
          ))}
        </div>

        {/* Chart + Scenarios row */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Projection chart */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-[#0D1B2A]">Net Worth Projection</h2>
                <p className="text-xs text-gray-400">7% avg annual return assumed</p>
              </div>
              <div className="flex gap-1">
                {PROJECTION_YEARS.map((y) => (
                  <button
                    key={y}
                    onClick={() => setProjYears(y)}
                    className={cn(
                      "px-3 py-1 text-xs rounded-md font-medium transition-colors",
                      projYears === y
                        ? "bg-[#0D1B2A] text-white"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    )}
                  >
                    {y}yr
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={projData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="gradCurrent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D1B2A" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0D1B2A" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradOptimized" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1D9E75" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#1D9E75" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  interval={Math.floor(projData.length / 5)}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => {
                    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
                    if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
                    return `$${v}`;
                  }}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                  formatter={(v: number) => formatCurrency(v)}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Area
                  type="monotone"
                  dataKey="Current path"
                  stroke="#0D1B2A"
                  strokeWidth={2}
                  fill="url(#gradCurrent)"
                />
                <Area
                  type="monotone"
                  dataKey="Optimized path"
                  stroke="#1D9E75"
                  strokeWidth={2}
                  fill="url(#gradOptimized)"
                  strokeDasharray="5 3"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Scenarios sidebar */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[#0D1B2A]">Scenarios</h2>
              <Link href="/app/scenarios">
                <button className="text-xs text-[#1D9E75] hover:underline font-medium flex items-center gap-1">
                  View all <ArrowRight className="w-3 h-3" />
                </button>
              </Link>
            </div>

            {scenarios.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                <GitCompare className="w-10 h-10 text-gray-200 mb-3" />
                <p className="text-sm text-gray-400 mb-4">No scenarios yet</p>
                <Link href="/app/scenarios/new">
                  <button className="text-sm bg-[#1D9E75] hover:bg-[#178f68] text-white px-4 py-2 rounded-lg font-medium">
                    Create first scenario
                  </button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2 flex-1">
                {scenarios.slice(0, 4).map((s) => (
                  <Link key={s.id} href={`/app/scenarios/${s.id}`}>
                    <div className="group flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-[#1D9E75]/30 hover:bg-[#1D9E75]/5 cursor-pointer transition-colors">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-[#0D1B2A] truncate">{s.name}</div>
                        <div className="text-xs text-gray-400">{SCENARIO_TYPE_LABELS[s.type]}</div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#1D9E75] shrink-0 ml-2 transition-colors" />
                    </div>
                  </Link>
                ))}

                <Link href="/app/scenarios/new">
                  <div className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-gray-200 hover:border-[#1D9E75]/40 cursor-pointer text-gray-400 hover:text-[#1D9E75] transition-colors mt-1">
                    <Plus className="w-3.5 h-3.5" />
                    <span className="text-sm">New scenario</span>
                  </div>
                </Link>
              </div>
            )}

            {/* AI advisor nudge */}
            <Link href="/app/advisor">
              <div className="mt-4 p-3 rounded-lg bg-[#0D1B2A] text-white cursor-pointer hover:bg-[#1a2e40] transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-3.5 h-3.5 text-[#1D9E75]" />
                  <span className="text-xs font-semibold text-[#1D9E75]">AI Advisor</span>
                </div>
                <p className="text-xs text-white/70">Ask anything about your financial picture</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Expense breakdown */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-semibold text-[#0D1B2A] mb-4">Monthly Budget Breakdown</h2>
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
                <div key={item.label} className="text-center">
                  <div className="text-lg font-bold text-[#0D1B2A]">{formatCurrency(item.value)}</div>
                  <div className="text-xs text-gray-400 mb-2">{item.label}</div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#1D9E75] rounded-full"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{pct.toFixed(0)}% of income</div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
            <span className="text-gray-500">Total monthly expenses</span>
            <span className="font-semibold text-[#0D1B2A]">{formatCurrency(totalMonthlyExpenses)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Monthly take-home</span>
            <span className="font-semibold text-blue-600">{formatCurrency(monthlyTakeHome)}</span>
          </div>
          <div className="flex items-center justify-between text-sm font-semibold border-t border-gray-100 pt-2 mt-1">
            <span className={monthlySurplus >= 0 ? "text-[#1D9E75]" : "text-red-500"}>Monthly surplus</span>
            <span className={monthlySurplus >= 0 ? "text-[#1D9E75]" : "text-red-500"}>
              {formatCurrency(monthlySurplus)}
            </span>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

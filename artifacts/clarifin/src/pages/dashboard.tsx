import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, PiggyBank,
  GitCompare, ArrowRight, Plus,
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
      positive: netWorth >= 0,
    },
    {
      label: "Monthly Take-Home",
      value: formatCurrency(monthlyTakeHome),
      sub: `${formatCurrency(profile.grossIncome)} gross / yr`,
      icon: TrendingUp,
      positive: true,
    },
    {
      label: "Monthly Surplus",
      value: formatCurrency(monthlySurplus),
      sub: `${savingsRate.toFixed(0)}% savings rate`,
      icon: PiggyBank,
      positive: monthlySurplus >= 0,
    },
    {
      label: "Total Debt",
      value: formatCurrency(totalDebt),
      sub: "across all accounts",
      icon: TrendingDown,
      positive: false,
    },
  ];

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-medium tracking-tight text-[#0F172A]">Financial Dashboard</h1>
            <p className="text-sm text-[#94A3B8] mt-1 font-light">
              ${profile.grossIncome.toLocaleString()} gross income &middot; {profile.state} &middot; {profile.filingStatus}
            </p>
          </div>
          <Link href="/app/scenarios/new">
            <button className="flex items-center gap-2 bg-[#0F172A] hover:bg-[#1E293B] text-white px-4 py-2 text-sm font-medium transition-colors">
              <Plus className="w-3.5 h-3.5" />
              New Scenario
            </button>
          </Link>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((m) => (
            <div key={m.label} className="bg-white border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-medium text-[#94A3B8] uppercase tracking-widest">{m.label}</span>
                <m.icon className="w-4 h-4 text-[#CBD5E1]" strokeWidth={1.5} />
              </div>
              <div className={cn(
                "text-2xl font-medium tracking-tight",
                m.positive ? "text-[#0F172A]" : "text-[#475569]"
              )}>
                {m.value}
              </div>
              <div className="text-xs text-[#94A3B8] mt-1.5 font-light">{m.sub}</div>
            </div>
          ))}
        </div>

        {/* Chart + Scenarios row */}
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Projection chart */}
          <div className="lg:col-span-2 bg-white border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-medium text-[#0F172A] tracking-tight">Net Worth Projection</h2>
                <p className="text-xs text-[#94A3B8] mt-0.5 font-light">7% avg annual return assumed</p>
              </div>
              <div className="flex gap-1">
                {PROJECTION_YEARS.map((y) => (
                  <button
                    key={y}
                    onClick={() => setProjYears(y)}
                    className={cn(
                      "px-3 py-1 text-xs font-medium transition-colors",
                      projYears === y
                        ? "bg-[#0F172A] text-white"
                        : "bg-[#F8F9FA] text-[#94A3B8] hover:text-[#475569]"
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
                    <stop offset="5%" stopColor="#0F172A" stopOpacity={0.08} />
                    <stop offset="95%" stopColor="#0F172A" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradOptimized" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#64748B" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#64748B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 11, fill: "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
                  interval={Math.floor(projData.length / 5)}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => {
                    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
                    if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
                    return `$${v}`;
                  }}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    border: "1px solid #E2E8F0",
                    borderRadius: 0,
                    boxShadow: "none",
                    color: "#0F172A",
                  }}
                  formatter={(v: number) => formatCurrency(v)}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11, paddingTop: 12, color: "#94A3B8" }}
                />
                <Area
                  type="monotone"
                  dataKey="Current path"
                  stroke="#0F172A"
                  strokeWidth={1.5}
                  fill="url(#gradCurrent)"
                />
                <Area
                  type="monotone"
                  dataKey="Optimized path"
                  stroke="#64748B"
                  strokeWidth={1.5}
                  fill="url(#gradOptimized)"
                  strokeDasharray="5 3"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Scenarios */}
          <div className="bg-white border border-gray-100 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-medium text-[#0F172A] tracking-tight">Scenarios</h2>
              <Link href="/app/scenarios">
                <button className="text-xs text-[#94A3B8] hover:text-[#475569] font-medium flex items-center gap-1 transition-colors">
                  View all <ArrowRight className="w-3 h-3" />
                </button>
              </Link>
            </div>

            {scenarios.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                <GitCompare className="w-8 h-8 text-[#E2E8F0] mb-3" strokeWidth={1.5} />
                <p className="text-sm text-[#94A3B8] mb-4 font-light">No scenarios yet</p>
                <Link href="/app/scenarios/new">
                  <button className="text-sm bg-[#0F172A] hover:bg-[#1E293B] text-white px-4 py-2 font-medium transition-colors">
                    Create first scenario
                  </button>
                </Link>
              </div>
            ) : (
              <div className="space-y-1.5 flex-1">
                {scenarios.slice(0, 4).map((s) => (
                  <Link key={s.id} href={`/app/scenarios/${s.id}`}>
                    <div className="group flex items-center justify-between p-3 border border-gray-100 hover:border-[#0F172A]/20 hover:bg-[#F8F9FA] cursor-pointer transition-colors">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-[#0F172A] truncate">{s.name}</div>
                        <div className="text-xs text-[#94A3B8] font-light">{SCENARIO_TYPE_LABELS[s.type]}</div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-[#CBD5E1] group-hover:text-[#475569] shrink-0 ml-2 transition-colors" />
                    </div>
                  </Link>
                ))}

                <Link href="/app/scenarios/new">
                  <div className="flex items-center gap-2 p-3 border border-dashed border-gray-200 hover:border-[#475569] cursor-pointer text-[#CBD5E1] hover:text-[#475569] transition-colors mt-1">
                    <Plus className="w-3.5 h-3.5" />
                    <span className="text-sm">New scenario</span>
                  </div>
                </Link>
              </div>
            )}

            {/* AI advisor */}
            <Link href="/app/advisor">
              <div className="mt-4 p-4 bg-[#0F172A] text-white cursor-pointer hover:bg-[#1E293B] transition-colors">
                <p className="text-xs uppercase tracking-widest text-white/40 font-medium mb-1">AI Advisor</p>
                <p className="text-sm text-white/70 font-light">Ask anything about your financial picture</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Expense breakdown */}
        <div className="bg-white border border-gray-100 p-6">
          <h2 className="font-medium text-[#0F172A] tracking-tight mb-6">Monthly Budget Breakdown</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
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
                <div key={item.label}>
                  <div className="text-xs uppercase tracking-widest text-[#94A3B8] font-medium mb-2">{item.label}</div>
                  <div className="text-xl font-medium text-[#0F172A] tracking-tight mb-2">{formatCurrency(item.value)}</div>
                  <div className="h-0.5 bg-[#F1F5F9] overflow-hidden">
                    <div
                      className="h-full bg-[#0F172A] transition-all"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                  <div className="text-xs text-[#94A3B8] mt-1.5 font-light">{pct.toFixed(0)}% of income</div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-5 border-t border-gray-100 space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#94A3B8] font-light">Total monthly expenses</span>
              <span className="font-medium text-[#0F172A]">{formatCurrency(totalMonthlyExpenses)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#94A3B8] font-light">Monthly take-home</span>
              <span className="font-medium text-[#0F172A]">{formatCurrency(monthlyTakeHome)}</span>
            </div>
            <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
              <span className="font-medium text-[#0F172A]">Monthly surplus</span>
              <span className={cn("font-medium", monthlySurplus >= 0 ? "text-[#0F172A]" : "text-[#475569]")}>
                {formatCurrency(monthlySurplus)}
              </span>
            </div>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}

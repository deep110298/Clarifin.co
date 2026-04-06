import { useMemo, useState } from "react"
import { useParams, useLocation, Link } from "wouter"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { customFetch } from "@workspace/api-client-react"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts"
import { ArrowLeft, Trash2, TrendingUp, TrendingDown, Award, AlertCircle, Clock, PiggyBank, DollarSign } from "lucide-react"
import { AppLayout } from "@/components/app/AppLayout"
import {
  calculateMonthlyTakeHome, calculateMortgagePayment, projectNetWorth,
  estimateRetirementAge, formatCurrency,
} from "@/lib/financial-engine"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

interface Scenario {
  id: string
  name: string
  type: string
  current: Record<string, unknown>
  proposed: Record<string, unknown>
  createdAt: string
}

const TYPE_LABELS: Record<string, string> = {
  "job-change": "Job Change", "buy-home": "Buy a Home", "school": "Back to School",
  "child": "New Child", "time-off": "Time Off", "custom": "Custom",
}

export default function ScenarioDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [, navigate] = useLocation()
  const qc = useQueryClient()
  const { profile } = useStore()
  const [projYears, setProjYears] = useState<10 | 20 | 30>(30)

  const { data: scenario, isLoading, isError } = useQuery({
    queryKey: ["scenario", id],
    queryFn: () => customFetch<Scenario>(`/api/scenarios/${id}`),
    enabled: !!id,
  })

  const deleteMutation = useMutation({
    mutationFn: () => customFetch(`/api/scenarios/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scenarios"] })
      navigate("/app/scenarios")
    },
  })

  const analysis = useMemo(() => {
    if (!scenario) return null

    const curr = scenario.current
    const prop = scenario.proposed

    const currIncome = Number(curr.income) || profile.grossIncome
    const propIncome = Number(prop.income) || currIncome
    const currState = (curr.state as string) || profile.state
    const propState = (prop.state as string) || currState

    const currTakeHome = calculateMonthlyTakeHome(currIncome, profile.filingStatus, currState)
    const propTakeHome = calculateMonthlyTakeHome(propIncome, profile.filingStatus, propState)

    const currMonthlyHousing = Number(curr.monthlyHousing ?? curr.housing) || profile.housing
    let propMonthlyHousing = Number(prop.monthlyHousing ?? prop.housing) || 0

    if (scenario.type === "buy-home" && !prop.monthlyHousing) {
      const homePrice = Number(prop.homePurchasePrice) || 0
      const down = Number(prop.downPayment) || 0
      const rate = (Number(prop.mortgageRate) || 6.8) / 100
      const term = Number(prop.loanTermYears) || 30
      const propertyTax = (Number(prop.propertyTax) || 0) / 12
      const mortgage = calculateMortgagePayment(homePrice - down, rate, term)
      propMonthlyHousing = mortgage + propertyTax + (homePrice * 0.01) / 12
    }

    const otherExpenses = profile.transport + profile.food + profile.utilities + profile.healthcare + profile.otherExpenses
    const currSurplus = currTakeHome - currMonthlyHousing - otherExpenses
    const propSurplus = propTakeHome - propMonthlyHousing - otherExpenses

    const startNetWorth =
      profile.emergencyFund + profile.retirementBalance + profile.otherInvestments -
      (profile.creditCardDebt + profile.studentLoans + profile.carLoans + profile.otherDebt)

    const projCurr = projectNetWorth(startNetWorth, currSurplus, projYears)
    const projProp = projectNetWorth(startNetWorth, propSurplus, projYears)
    const retireCurr = estimateRetirementAge(profile.age, startNetWorth, Math.max(0, currSurplus))
    const retireProp = estimateRetirementAge(profile.age, startNetWorth, Math.max(0, propSurplus))
    const diff20 = (projProp[Math.min(20, projProp.length - 1)]?.netWorth ?? 0) - (projCurr[Math.min(20, projCurr.length - 1)]?.netWorth ?? 0)
    const propWins = propSurplus >= currSurplus

    const projData = projCurr.map((pt, i) => ({
      year: `Yr ${pt.year}`,
      "Current": pt.netWorth,
      "New Scenario": projProp[i]?.netWorth ?? 0,
    }))

    return { currTakeHome, propTakeHome, currMonthlyHousing, propMonthlyHousing, currSurplus, propSurplus, retireCurr, retireProp, diff20, propWins, projData, otherExpenses }
  }, [scenario, profile, projYears])

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-5xl mx-auto space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-xl h-40 animate-pulse border border-gray-100" />)}
        </div>
      </AppLayout>
    )
  }

  if (isError || !scenario) {
    return (
      <AppLayout>
        <div className="max-w-5xl mx-auto text-center py-20">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="font-semibold text-[#1A2C20] mb-2">Scenario not found</h2>
          <Link href="/app/scenarios"><button className="text-[#4D8F6A] text-sm hover:underline">← Back to scenarios</button></Link>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Link href="/app/scenarios">
              <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-[#1A2C20]">{scenario.name}</h1>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{TYPE_LABELS[scenario.type] ?? "Scenario"}</span>
              </div>
              <p className="text-sm text-gray-400 mt-0.5">
                Created {new Date(scenario.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </div>
          <button
            onClick={() => { if (confirm("Delete this scenario?")) deleteMutation.mutate() }}
            className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>

        {analysis && (
          <>
            {/* Verdict card */}
            <div className={cn(
              "rounded-xl border p-5 flex items-start gap-4",
              analysis.propWins ? "bg-[#4D8F6A]/8 border-[#4D8F6A]/20" : "bg-orange-50 border-orange-200"
            )}>
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", analysis.propWins ? "bg-[#4D8F6A]" : "bg-orange-400")}>
                {analysis.propWins ? <Award className="w-5 h-5 text-white" /> : <AlertCircle className="w-5 h-5 text-white" />}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-[#1A2C20]">
                    {analysis.propWins ? "New scenario wins financially" : "Current path is stronger"}
                  </h3>
                  {analysis.propWins ? <TrendingUp className="w-4 h-4 text-[#4D8F6A]" /> : <TrendingDown className="w-4 h-4 text-orange-500" />}
                </div>
                <p className="text-sm text-gray-600">
                  {analysis.propWins
                    ? `The new scenario puts ${formatCurrency(analysis.propSurplus - analysis.currSurplus)}/month more in your pocket. Over 20 years, this compounds to approximately ${formatCurrency(analysis.diff20)} in additional net worth.${analysis.retireProp < analysis.retireCurr ? ` You'd retire ${analysis.retireCurr - analysis.retireProp} years earlier at age ${analysis.retireProp}.` : ""}`
                    : `The current path generates ${formatCurrency(analysis.currSurplus - analysis.propSurplus)}/month more surplus. The new scenario would cost you roughly ${formatCurrency(Math.abs(analysis.diff20))} over 20 years.`
                  }
                </p>
              </div>
            </div>

            {/* Comparison + Chart */}
            <div className="grid lg:grid-cols-5 gap-5">
              {/* Comparison table */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <h2 className="font-semibold text-[#1A2C20] text-sm mb-4">Monthly Breakdown</h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-400 uppercase">
                      <th className="text-left pb-2 font-medium">Item</th>
                      <th className="text-right pb-2 font-medium">Current</th>
                      <th className="text-right pb-2 font-medium text-[#4D8F6A]">New</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {[
                      { label: "Take-home/mo", curr: analysis.currTakeHome, prop: analysis.propTakeHome },
                      { label: "Housing/mo", curr: analysis.currMonthlyHousing, prop: analysis.propMonthlyHousing },
                      { label: "Other expenses", curr: analysis.otherExpenses, prop: null },
                    ].map(row => (
                      <tr key={row.label} className="text-gray-700">
                        <td className="py-2 text-gray-500 text-xs">{row.label}</td>
                        <td className="py-2 text-right font-medium">{formatCurrency(row.curr)}</td>
                        <td className="py-2 text-right font-medium">
                          {row.prop !== null ? (
                            <span className={row.prop > row.curr ? "text-[#4D8F6A]" : row.prop < row.curr ? "text-red-500" : ""}>
                              {formatCurrency(row.prop)}
                            </span>
                          ) : <span className="text-gray-400">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-gray-200">
                      <td className="pt-3 text-xs font-semibold text-[#1A2C20]">Net monthly</td>
                      <td className="pt-3 text-right font-bold text-[#1A2C20]">{formatCurrency(analysis.currSurplus)}</td>
                      <td className="pt-3 text-right font-bold" style={{ color: analysis.propSurplus >= analysis.currSurplus ? "#1D9E75" : "#ef4444" }}>
                        {formatCurrency(analysis.propSurplus)}
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* Milestones */}
                <div className="mt-5 pt-4 border-t border-gray-100 space-y-3">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Key Milestones</h3>
                  {[
                    { icon: Clock, label: "Retire (current path)", value: `Age ${analysis.retireCurr}`, highlight: false },
                    { icon: Clock, label: "Retire (new scenario)", value: `Age ${analysis.retireProp}`, highlight: analysis.retireProp < analysis.retireCurr },
                    { icon: PiggyBank, label: "20-year net worth diff", value: formatCurrency(analysis.diff20), highlight: analysis.diff20 > 0 },
                  ].map(m => (
                    <div key={m.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <m.icon className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-500">{m.label}</span>
                      </div>
                      <span className={cn("text-xs font-semibold", m.highlight ? "text-[#4D8F6A]" : "text-[#1A2C20]")}>{m.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Projection chart */}
              <div className="lg:col-span-3 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-semibold text-[#1A2C20] text-sm">Net Worth Projection</h2>
                    <p className="text-xs text-gray-400">7% avg annual return</p>
                  </div>
                  <div className="flex gap-1">
                    {([10, 20, 30] as const).map(y => (
                      <button key={y} onClick={() => setProjYears(y)} className={cn(
                        "px-2.5 py-1 text-xs rounded-md font-medium transition-colors",
                        projYears === y ? "bg-[#1A2C20] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      )}>{y}yr</button>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={analysis.projData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="gcurr2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0D1B2A" stopOpacity={0.12} />
                        <stop offset="95%" stopColor="#0D1B2A" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gprop2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1D9E75" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#1D9E75" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="year" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} interval={Math.floor(analysis.projData.length / 5)} />
                    <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false}
                      tickFormatter={v => v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${(v / 1_000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} formatter={(v: number) => formatCurrency(v)} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area type="monotone" dataKey="Current" stroke="#0D1B2A" strokeWidth={2} fill="url(#gcurr2)" />
                    <Area type="monotone" dataKey="New Scenario" stroke="#1D9E75" strokeWidth={2} fill="url(#gprop2)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bottom actions */}
            <div className="flex gap-3">
              <Link href="/app/scenarios/new">
                <button className="flex items-center gap-2 border border-gray-200 hover:border-[#4D8F6A]/40 text-gray-600 hover:text-[#4D8F6A] px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
                  <DollarSign className="w-4 h-4" /> New scenario
                </button>
              </Link>
              <Link href="/app/advisor">
                <button className="flex items-center gap-2 bg-[#1A2C20] hover:bg-[#1a2e40] text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
                  Ask AI advisor
                </button>
              </Link>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}

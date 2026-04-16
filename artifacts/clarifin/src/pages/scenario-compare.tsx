import { useMemo, useState } from "react"
import { Link } from "wouter"
import { useQuery } from "@tanstack/react-query"
import { customFetch } from "@workspace/api-client-react"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts"
import { ArrowLeft, CheckSquare, Square } from "lucide-react"
import { AppLayout } from "@/components/app/AppLayout"
import {
  calculateMonthlyTakeHomeWith401k,
  calculateMonthlyTakeHome,
  calculateMortgagePayment,
  calculateRetirementTarget,
  projectNetWorthPhased,
  estimateRetirementAgePhased,
  formatCurrency,
  type SurplusPhase,
} from "@/lib/financial-engine"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

interface ApiScenario {
  id: string
  name: string
  type: string
  current: Record<string, unknown>
  proposed: Record<string, unknown>
  createdAt: string
}

const CHART_COLORS = ["#1A1A2E", "#FACC15", "#22C55E", "#3B82F6"]

function getScenarioAnalysis(scenario: ApiScenario, profile: ReturnType<typeof useStore>["profile"]) {
  const curr = scenario.current
  const prop = scenario.proposed

  const currIncome = Number(curr.income) || profile.grossIncome
  const currState = (curr.state as string) || profile.state
  const otherExpenses = profile.transport + profile.food + profile.utilities + profile.healthcare + profile.otherExpenses
  const currTakeHome = calculateMonthlyTakeHomeWith401k(currIncome, profile.filingStatus, currState, profile.annual401kContrib || 0)
  const currMonthlyHousing = Number(curr.monthlyHousing ?? curr.housing) || profile.housing
  const currSurplus = currTakeHome - currMonthlyHousing - otherExpenses

  let propTakeHome = currTakeHome
  let propMonthlyHousing = Number(prop.monthlyHousing ?? prop.housing) || currMonthlyHousing
  let propScenarioCosts = Number(prop.scenarioCosts) || 0

  if (scenario.type === "buy-home") {
    if (!prop.monthlyHousing) {
      const homePrice = Number(prop.homePurchasePrice) || 0
      const down = Number(prop.downPayment) || 0
      const rate = (Number(prop.mortgageRate) || 6.8) / 100
      const term = Number(prop.loanTermYears) || 30
      const propertyTax = (Number(prop.propertyTax) || 0) / 12
      const mortgage = calculateMortgagePayment(homePrice - down, rate, term)
      propMonthlyHousing = mortgage + propertyTax + (homePrice * 0.01) / 12
    }
  } else if (scenario.type === "job-change" || scenario.type === "custom") {
    const propIncome = Number(prop.income) || currIncome
    const propState = (prop.state as string) || currState
    propTakeHome = calculateMonthlyTakeHome(propIncome, profile.filingStatus, propState)
  } else if (scenario.type === "child") {
    const leaveIncome = prop.leaveIncome != null ? Number(prop.leaveIncome) : currIncome
    const blendedAnnualIncome = leaveIncome * 0.25 + currIncome * 0.75
    propTakeHome = calculateMonthlyTakeHome(blendedAnnualIncome, profile.filingStatus, currState)
    propMonthlyHousing = currMonthlyHousing
    const monthlyChildcare = Number(prop.monthlyChildcare) || 0
    const monthlyExtras = Number(prop.monthlyExtras) || 0
    propScenarioCosts = monthlyChildcare + monthlyExtras
  } else if (scenario.type === "school") {
    const incomeWhileInSchool = Number(prop.incomeWhileInSchool) || 0
    const annualTuition = Number(prop.annualTuition) || 0
    propTakeHome = calculateMonthlyTakeHome(incomeWhileInSchool, profile.filingStatus, currState)
    propMonthlyHousing = currMonthlyHousing
    propScenarioCosts = annualTuition / 12
  } else if (scenario.type === "time-off") {
    const partTimeIncome = Number(prop.partTimeIncome) || 0
    const extraMonthlyCost = Number(prop.extraMonthlyCost) || 0
    propTakeHome = calculateMonthlyTakeHome(partTimeIncome, profile.filingStatus, currState)
    propMonthlyHousing = currMonthlyHousing
    propScenarioCosts = extraMonthlyCost
  }

  const propSurplus = propTakeHome - propMonthlyHousing - otherExpenses - propScenarioCosts

  // Build phased surplus
  let propPhases: SurplusPhase[] = [{ monthlySurplus: propSurplus, years: 30 }]

  if (scenario.type === "child") {
    const LEAVE_YEARS = 1
    const CHILDCARE_YEARS = 5
    const monthlyChildcare = Number(prop.monthlyChildcare) || 0
    const monthlyExtras = Number(prop.monthlyExtras) || 0
    const fullTakeHome = calculateMonthlyTakeHome(currIncome, profile.filingStatus, currState)
    const surplusChildcareFullIncome = fullTakeHome - currMonthlyHousing - otherExpenses - monthlyChildcare - monthlyExtras
    const surplusAfterChildcare = fullTakeHome - currMonthlyHousing - otherExpenses
    propPhases = [
      { monthlySurplus: propSurplus, years: LEAVE_YEARS },
      { monthlySurplus: surplusChildcareFullIncome, years: CHILDCARE_YEARS - LEAVE_YEARS },
      { monthlySurplus: surplusAfterChildcare, years: 30 - CHILDCARE_YEARS },
    ].filter(p => p.years > 0)
  } else if (scenario.type === "school") {
    const durationYears = Math.max(1, Math.round(Number(prop.durationYears) || 2))
    const salaryAfter = Number(prop.salaryAfter) || currIncome
    const takeHomeAfter = calculateMonthlyTakeHome(salaryAfter, profile.filingStatus, currState)
    const surplusAfterSchool = takeHomeAfter - currMonthlyHousing - otherExpenses
    propPhases = [
      { monthlySurplus: propSurplus, years: Math.min(durationYears, 30) },
      { monthlySurplus: surplusAfterSchool, years: Math.max(0, 30 - durationYears) },
    ].filter(p => p.years > 0)
  } else if (scenario.type === "time-off") {
    const offMonths = Number(prop.months) || 6
    const offYears = Math.max(1, Math.ceil(offMonths / 12))
    const salaryAfter = Number(prop.salaryAfter) || currIncome
    const extraMonthlyCost = Number(prop.extraMonthlyCost) || 0
    const takeHomeAfter = calculateMonthlyTakeHome(salaryAfter, profile.filingStatus, currState)
    const surplusAfterReturn = takeHomeAfter - currMonthlyHousing - otherExpenses
    propPhases = [
      { monthlySurplus: propSurplus, years: Math.min(offYears, 30) },
      { monthlySurplus: surplusAfterReturn, years: Math.max(0, 30 - offYears) },
    ].filter(p => p.years > 0)
  }

  const startNetWorth =
    profile.emergencyFund + profile.retirementBalance + profile.otherInvestments -
    (profile.creditCardDebt + profile.studentLoans + profile.carLoans + profile.otherDebt)
  const oneTimeCostProp =
    scenario.type === "child" ? (Number(prop.oneTimeCost) || 0) :
    scenario.type === "job-change" ? (Number(prop.movingCost) || 0) :
    scenario.type === "buy-home" ? (Number(prop.downPayment) || 0) : 0
  const startNetWorthProp = startNetWorth - oneTimeCostProp

  const longTermPropExpenses = (propMonthlyHousing + otherExpenses) * 12
  const retirementTargetProp = calculateRetirementTarget(longTermPropExpenses / 12)
  const proj30 = projectNetWorthPhased(startNetWorthProp, propPhases)
  const netWorth30yr = proj30[proj30.length - 1]?.netWorth ?? 0
  const retireAge = estimateRetirementAgePhased(profile.age, startNetWorthProp, propPhases, retirementTargetProp)

  return { monthlySurplus: propSurplus, currSurplus, retireAge, netWorth30yr, proj30 }
}

export default function ScenarioComparePage() {
  const { profile } = useStore()
  const [selected, setSelected] = useState<string[]>([])

  const { data: scenarios = [], isLoading } = useQuery({
    queryKey: ["scenarios"],
    queryFn: () => customFetch<ApiScenario[]>("/api/scenarios"),
  })

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      if (prev.length >= 3) return prev
      return [...prev, id]
    })
  }

  // Current path financials
  const startNetWorth = profile.emergencyFund + profile.retirementBalance + profile.otherInvestments -
    (profile.creditCardDebt + profile.studentLoans + profile.carLoans + profile.otherDebt)
  const currTakeHome = calculateMonthlyTakeHomeWith401k(profile.grossIncome, profile.filingStatus, profile.state, profile.annual401kContrib || 0)
  const totalMonthlyExpenses = profile.housing + profile.transport + profile.food + profile.utilities + profile.healthcare + profile.otherExpenses
  const currSurplus = currTakeHome - totalMonthlyExpenses

  const currProj30 = useMemo(
    () => projectNetWorthPhased(startNetWorth, [{ monthlySurplus: currSurplus, years: 30 }]),
    [startNetWorth, currSurplus]
  )

  const currRetireAge = useMemo(
    () => estimateRetirementAgePhased(
      profile.age, startNetWorth,
      [{ monthlySurplus: currSurplus, years: 30 }],
      calculateRetirementTarget(totalMonthlyExpenses)
    ),
    [profile.age, startNetWorth, currSurplus, totalMonthlyExpenses]
  )

  const analyses = useMemo(() => {
    return scenarios
      .filter(s => selected.includes(s.id))
      .map(s => ({
        scenario: s,
        analysis: getScenarioAnalysis(s, profile),
      }))
  }, [scenarios, selected, profile])

  const chartData = useMemo(() => {
    if (analyses.length === 0) return []
    return currProj30.map((pt, i) => {
      const row: Record<string, number | string> = {
        year: `Yr ${pt.year}`,
        "Current Path": pt.netWorth,
      }
      analyses.forEach(({ scenario, analysis }) => {
        row[scenario.name] = analysis.proj30[i]?.netWorth ?? 0
      })
      return row
    })
  }, [analyses, currProj30])

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/app/scenarios">
            <button className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A2E]">Compare Scenarios</h1>
            <p className="text-sm text-gray-400 mt-0.5">Select up to 3 scenarios to compare side by side</p>
          </div>
        </div>

        {/* Scenario selector */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-[#1A1A2E] text-sm mb-4">Select scenarios ({selected.length}/3)</h2>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : scenarios.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-400 mb-3">No scenarios yet</p>
              <Link href="/app/scenarios/new">
                <button className="bg-[#FACC15] text-[#1A1A2E] text-xs font-bold px-4 py-2 rounded-xl">+ Create first</button>
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {scenarios.map(s => {
                const isSelected = selected.includes(s.id)
                const isDisabled = !isSelected && selected.length >= 3
                return (
                  <button
                    key={s.id}
                    onClick={() => !isDisabled && toggleSelect(s.id)}
                    disabled={isDisabled}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all",
                      isSelected
                        ? "border-[#FACC15] bg-[#FFF9E6]"
                        : isDisabled
                        ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                        : "border-gray-100 hover:border-[#FACC15]/40 hover:bg-[#FFFDF0] cursor-pointer"
                    )}
                  >
                    {isSelected
                      ? <CheckSquare className="w-4 h-4 text-[#F59E0B] shrink-0" />
                      : <Square className="w-4 h-4 text-gray-300 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-[#1A1A2E] truncate">{s.name}</div>
                      <div className="text-xs text-gray-400">{s.type.replace("-", " ")}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Comparison panel */}
        {analyses.length >= 2 && (
          <>
            {/* Side-by-side table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h2 className="font-bold text-[#1A1A2E]">Side-by-Side Comparison</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Metric</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide text-center">Current Path</th>
                      {analyses.map(({ scenario }, i) => (
                        <th key={scenario.id} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-center" style={{ color: CHART_COLORS[i + 1] }}>
                          {scenario.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {[
                      {
                        label: "Monthly surplus",
                        curr: formatCurrency(currSurplus),
                        vals: analyses.map(a => ({
                          text: formatCurrency(a.analysis.monthlySurplus),
                          positive: a.analysis.monthlySurplus >= currSurplus,
                        })),
                      },
                      {
                        label: "Est. retire age",
                        curr: `Age ${currRetireAge}`,
                        vals: analyses.map(a => ({
                          text: `Age ${a.analysis.retireAge}`,
                          positive: a.analysis.retireAge <= currRetireAge,
                        })),
                      },
                      {
                        label: "30-yr net worth",
                        curr: formatCurrency(currProj30[currProj30.length - 1]?.netWorth ?? 0, true),
                        vals: analyses.map(a => ({
                          text: formatCurrency(a.analysis.netWorth30yr, true),
                          positive: a.analysis.netWorth30yr >= (currProj30[currProj30.length - 1]?.netWorth ?? 0),
                        })),
                      },
                    ].map(row => (
                      <tr key={row.label} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3.5 text-xs text-gray-400 font-medium">{row.label}</td>
                        <td className="px-4 py-3.5 text-center font-semibold text-[#1A1A2E] text-sm">{row.curr}</td>
                        {row.vals.map((v, i) => (
                          <td key={i} className={cn("px-4 py-3.5 text-center font-semibold text-sm", v.positive ? "text-[#22C55E]" : "text-[#F43F5E]")}>
                            {v.text}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Projection chart */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-[#1A1A2E] mb-1">30-Year Net Worth Projection</h2>
              <p className="text-xs text-gray-400 mb-5">7% average annual return · Includes current path for reference</p>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <defs>
                    {["Current Path", ...analyses.map(a => a.scenario.name)].map((name, i) => (
                      <linearGradient key={name} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS[i]} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={CHART_COLORS[i]} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="year" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} interval={Math.floor(chartData.length / 5)} />
                  <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false}
                    tickFormatter={v => v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${(v / 1_000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 12, border: "1px solid #e5e7eb", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                    formatter={(v: number) => formatCurrency(v)}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="Current Path" stroke={CHART_COLORS[0]} strokeWidth={2} fill={`url(#grad-0)`} strokeDasharray="4 2" />
                  {analyses.map(({ scenario }, i) => (
                    <Area
                      key={scenario.id}
                      type="monotone"
                      dataKey={scenario.name}
                      stroke={CHART_COLORS[i + 1]}
                      strokeWidth={2.5}
                      fill={`url(#grad-${i + 1})`}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {analyses.length === 1 && (
          <div className="text-center py-8 text-sm text-gray-400">
            Select at least one more scenario to compare.
          </div>
        )}

        {analyses.length === 0 && scenarios.length > 0 && (
          <div className="text-center py-8 text-sm text-gray-400">
            Select 2 or 3 scenarios above to see the comparison.
          </div>
        )}
      </div>
    </AppLayout>
  )
}

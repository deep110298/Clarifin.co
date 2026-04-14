import { useMemo } from "react"
import { useParams, Link } from "wouter"
import { useQuery } from "@tanstack/react-query"
import { customFetch } from "@workspace/api-client-react"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts"
import { AlertCircle, Award, TrendingDown, Clock, DollarSign, PiggyBank } from "lucide-react"
import {
  calculateMonthlyTakeHome, calculateMortgagePayment, calculateRetirementTarget,
  projectNetWorth, projectNetWorthPhased, estimateRetirementAge, estimateRetirementAgePhased,
  formatCurrency, type SurplusPhase,
} from "@/lib/financial-engine"
import { cn } from "@/lib/utils"

interface SharedScenario {
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

// Default financial assumptions for shared view (no profile available)
const DEFAULTS = {
  grossIncome: 75000,
  filingStatus: "single" as const,
  state: "TX",
  age: 35,
  housing: 1800,
  transport: 400,
  food: 600,
  utilities: 200,
  healthcare: 150,
  otherExpenses: 300,
  emergencyFund: 10000,
  retirementBalance: 25000,
  otherInvestments: 5000,
  creditCardDebt: 0,
  studentLoans: 0,
  carLoans: 0,
  otherDebt: 0,
}

export default function SharedScenarioPage() {
  const { token } = useParams<{ token: string }>()

  const { data: scenario, isLoading, isError } = useQuery({
    queryKey: ["shared-scenario", token],
    queryFn: () => customFetch<SharedScenario>(`/api/shared/${token}`),
    enabled: !!token,
    retry: false,
  })

  const analysis = useMemo(() => {
    if (!scenario) return null

    const curr = scenario.current
    const prop = scenario.proposed
    const profile = DEFAULTS

    const currIncome = Number(curr.income) || profile.grossIncome
    const currState = (curr.state as string) || profile.state
    const otherExpenses = profile.transport + profile.food + profile.utilities + profile.healthcare + profile.otherExpenses
    const currTakeHome = calculateMonthlyTakeHome(currIncome, profile.filingStatus, currState)
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
      const leaveIncome = Number(prop.leaveIncome) || currIncome
      const blendedAnnualIncome = leaveIncome * 0.25 + currIncome * 0.75
      propTakeHome = calculateMonthlyTakeHome(blendedAnnualIncome, profile.filingStatus, currState)
      propMonthlyHousing = currMonthlyHousing
      propScenarioCosts = (Number(prop.monthlyChildcare) || 0) + (Number(prop.monthlyExtras) || 0)
    } else if (scenario.type === "school") {
      propTakeHome = calculateMonthlyTakeHome(Number(prop.incomeWhileInSchool) || 0, profile.filingStatus, currState)
      propMonthlyHousing = currMonthlyHousing
      propScenarioCosts = (Number(prop.annualTuition) || 0) / 12
    } else if (scenario.type === "time-off") {
      propTakeHome = calculateMonthlyTakeHome(Number(prop.partTimeIncome) || 0, profile.filingStatus, currState)
      propMonthlyHousing = currMonthlyHousing
      propScenarioCosts = Number(prop.extraMonthlyCost) || 0
    }

    const propSurplus = propTakeHome - propMonthlyHousing - otherExpenses - propScenarioCosts
    const startNetWorth = profile.emergencyFund + profile.retirementBalance + profile.otherInvestments -
      (profile.creditCardDebt + profile.studentLoans + profile.carLoans + profile.otherDebt)

    // Build phased projections — temporary costs expire after fixed years
    const PROJ_YEARS = 30
    let propPhases: SurplusPhase[] = [{ monthlySurplus: propSurplus, years: PROJ_YEARS }]

    if (scenario.type === "child") {
      const CHILDCARE_YEARS = 5
      const takeHomeAfter = calculateMonthlyTakeHome(currIncome, profile.filingStatus, currState)
      const surplusAfter = takeHomeAfter - currMonthlyHousing - otherExpenses
      propPhases = [
        { monthlySurplus: propSurplus, years: CHILDCARE_YEARS },
        { monthlySurplus: surplusAfter, years: PROJ_YEARS - CHILDCARE_YEARS },
      ]
    } else if (scenario.type === "school") {
      const durationYears = Math.max(1, Math.round(Number(prop.durationYears) || 2))
      const takeHomeAfter = calculateMonthlyTakeHome(Number(prop.salaryAfter) || currIncome, profile.filingStatus, currState)
      const surplusAfter = takeHomeAfter - currMonthlyHousing - otherExpenses
      propPhases = [
        { monthlySurplus: propSurplus, years: Math.min(durationYears, PROJ_YEARS) },
        { monthlySurplus: surplusAfter, years: Math.max(0, PROJ_YEARS - durationYears) },
      ].filter(p => p.years > 0)
    } else if (scenario.type === "time-off") {
      const offYears = Math.max(1, Math.ceil((Number(prop.months) || 6) / 12))
      const takeHomeAfter = calculateMonthlyTakeHome(Number(prop.salaryAfter) || currIncome, profile.filingStatus, currState)
      const surplusAfter = takeHomeAfter - currMonthlyHousing - otherExpenses
      propPhases = [
        { monthlySurplus: propSurplus, years: Math.min(offYears, PROJ_YEARS) },
        { monthlySurplus: surplusAfter, years: Math.max(0, PROJ_YEARS - offYears) },
      ].filter(p => p.years > 0)
    }

    const currAnnualExpenses = (currMonthlyHousing + otherExpenses) * 12
    const longTermPropExpenses = (propMonthlyHousing + otherExpenses) * 12
    const retirementTargetCurr = calculateRetirementTarget(currAnnualExpenses / 12)
    const retirementTargetProp = calculateRetirementTarget(longTermPropExpenses / 12)

    const projCurr = projectNetWorth(startNetWorth, currSurplus, PROJ_YEARS)
    const projProp = projectNetWorthPhased(startNetWorth, propPhases)

    const retireCurr = estimateRetirementAge(profile.age, startNetWorth, Math.max(0, currSurplus), retirementTargetCurr)
    const retireProp = estimateRetirementAgePhased(profile.age, startNetWorth, propPhases, retirementTargetProp)

    const propWins = propSurplus >= currSurplus
    const projData = projCurr.map((pt, i) => ({
      year: `Yr ${pt.year}`,
      "Current Path": pt.netWorth,
      "New Scenario": projProp[i]?.netWorth ?? 0,
    }))

    return { currTakeHome, propTakeHome, currMonthlyHousing, propMonthlyHousing, propScenarioCosts, currSurplus, propSurplus, retireCurr, retireProp, propWins, projData, otherExpenses }
  }, [scenario])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F8F8] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#FACC15] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (isError || !scenario) {
    return (
      <div className="min-h-screen bg-[#F8F8F8] flex flex-col items-center justify-center gap-4 p-6 text-center">
        <AlertCircle className="w-12 h-12 text-gray-300" />
        <h2 className="text-xl font-bold text-[#1A1A2E]">Link not found or expired</h2>
        <p className="text-gray-500 text-sm max-w-sm">This share link may have been revoked by its owner. Ask them for a new link.</p>
        <Link href="/">
          <button className="mt-4 px-5 py-2.5 bg-[#FACC15] hover:bg-yellow-300 text-[#1A1A2E] text-sm font-semibold rounded-xl transition-colors">
            Go to Clarifin
          </button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-[#FACC15] rounded-full flex items-center justify-center">
            <span className="text-[#1A1A2E] font-bold text-xs">C</span>
          </div>
          <span className="font-bold text-[#1A1A2E]">Clarifin</span>
          <span className="text-gray-300">·</span>
          <span className="text-sm text-gray-500">Shared scenario</span>
        </div>
        <Link href="/sign-up">
          <button className="px-4 py-2 bg-[#FACC15] hover:bg-yellow-300 text-[#1A1A2E] text-sm font-semibold rounded-xl transition-colors">
            Try Clarifin free →
          </button>
        </Link>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-5">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-[#1A1A2E]">{scenario.name}</h1>
            <span className="text-xs bg-[#FFF9E6] text-[#1A1A2E] border border-yellow-200 px-2.5 py-0.5 rounded-full font-medium">
              {TYPE_LABELS[scenario.type] ?? "Scenario"}
            </span>
          </div>
          <p className="text-sm text-gray-400">
            Shared read-only · Created {new Date(scenario.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
          <p className="text-xs text-gray-400 mt-1">Note: projections use estimated baseline numbers since this is a read-only view.</p>
        </div>

        {analysis && (
          <>
            {/* Verdict */}
            <div className={cn(
              "rounded-2xl border p-5 flex items-start gap-4",
              analysis.propWins ? "bg-[#FFF9E6] border-yellow-200" : "bg-orange-50 border-orange-200"
            )}>
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", analysis.propWins ? "bg-[#FACC15]" : "bg-orange-400")}>
                {analysis.propWins ? <Award className="w-5 h-5 text-[#1A1A2E]" /> : <TrendingDown className="w-5 h-5 text-white" />}
              </div>
              <div>
                <p className="font-semibold text-[#1A1A2E]">
                  {analysis.propWins ? "This scenario improves monthly cash flow" : "This scenario reduces monthly cash flow"}
                </p>
                <p className="text-sm text-gray-600 mt-0.5">
                  Monthly surplus changes from <strong>{formatCurrency(analysis.currSurplus)}</strong> to <strong>{formatCurrency(analysis.propSurplus)}</strong>
                  {" "}({analysis.propSurplus >= analysis.currSurplus ? "+" : ""}{formatCurrency(analysis.propSurplus - analysis.currSurplus)}/mo)
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: DollarSign, label: "Current take-home", value: formatCurrency(analysis.currTakeHome) + "/mo", color: "text-gray-600" },
                { icon: DollarSign, label: "Scenario take-home", value: formatCurrency(analysis.propTakeHome) + "/mo", color: "text-[#1A1A2E]" },
                { icon: PiggyBank, label: "Current surplus", value: formatCurrency(analysis.currSurplus) + "/mo", color: analysis.currSurplus >= 0 ? "text-green-600" : "text-red-500" },
                { icon: Clock, label: "Retirement age", value: analysis.retireProp === Infinity ? "70+" : `~${analysis.retireProp}`, color: "text-[#1A1A2E]" },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-400">{label}</span>
                  </div>
                  <p className={cn("text-xl font-bold tabular-nums", color)}>{value}</p>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-semibold text-[#1A1A2E] mb-4">30-Year Net Worth Projection</h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={analysis.projData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="currGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E5E7EB" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#E5E7EB" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="propGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FACC15" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#FACC15" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="year" tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} axisLine={false} interval={4} />
                  <YAxis tickFormatter={v => `$${Math.round(v / 1000)}k`} tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} axisLine={false} width={55} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: 12, border: "1px solid #F3F4F6", fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="Current Path" stroke="#9CA3AF" strokeWidth={2} fill="url(#currGrad)" dot={false} />
                  <Area type="monotone" dataKey="New Scenario" stroke="#FACC15" strokeWidth={2.5} fill="url(#propGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {/* CTA */}
        <div className="bg-[#1A1A2E] rounded-2xl p-6 text-center">
          <p className="text-white font-semibold text-lg mb-1">Want to model your own financial decisions?</p>
          <p className="text-gray-400 text-sm mb-4">Clarifin lets you compare scenarios like job changes, home purchases, and more — free to start.</p>
          <Link href="/sign-up">
            <button className="px-6 py-2.5 bg-[#FACC15] hover:bg-yellow-300 text-[#1A1A2E] font-semibold rounded-xl transition-colors">
              Get started free →
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}

import { useMemo, useState, useRef } from "react"
import { useParams, useLocation, Link } from "wouter"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { customFetch } from "@workspace/api-client-react"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts"
import {
  ArrowLeft, Trash2, TrendingUp, TrendingDown, Award, AlertCircle,
  Clock, PiggyBank, DollarSign, Zap, SlidersHorizontal, Sparkles, Pencil,
  Share2, Copy, Check, X, Link as LinkIcon, Printer,
} from "lucide-react"
import { AppLayout } from "@/components/app/AppLayout"
import {
  calculateMonthlyTakeHome, calculateMonthlyTakeHomeWith401k, calculateMortgagePayment, calculateRetirementTarget,
  projectNetWorth, projectNetWorthPhased, estimateRetirementAge, estimateRetirementAgePhased,
  formatCurrency, type SurplusPhase,
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

function SliderRow({
  label, value, min, max, step, format, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number;
  format: (v: number) => string; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-600 font-medium">{label}</span>
        <span className={cn(
          "text-sm font-bold tabular-nums",
          value > 0 ? "text-[#22C55E]" : value < 0 ? "text-red-500" : "text-gray-400"
        )}>
          {value > 0 ? "+" : ""}{format(value)}
        </span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #FACC15 0%, #FACC15 ${((value - min) / (max - min)) * 100}%, #e5e7eb ${((value - min) / (max - min)) * 100}%, #e5e7eb 100%)`,
        }}
      />
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-gray-300">{format(min)}</span>
        <span className="text-[10px] text-gray-300">{format(max)}</span>
      </div>
    </div>
  )
}

export default function ScenarioDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [, navigate] = useLocation()
  const qc = useQueryClient()
  const { profile } = useStore()
  const [projYears, setProjYears] = useState<10 | 20 | 30>(30)
  const [whatIf, setWhatIf] = useState({ incomeBoost: 0, savingsBoost: 0 })
  const [showWhatIf, setShowWhatIf] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState("")
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareLink, setShareLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const shareLinkRef = useRef<HTMLInputElement>(null)

  const { data: scenario, isLoading, isError } = useQuery({
    queryKey: ["scenario", id],
    queryFn: () => customFetch<Scenario>(`/api/scenarios/${id}`),
    enabled: !!id,
  })

  // Free plan: only the first (oldest) scenario is fully viewable
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => customFetch<{ plan: string; profileComplete: boolean }>("/api/me"),
  })
  const { data: allScenarios = [] } = useQuery({
    queryKey: ["scenarios"],
    queryFn: () => customFetch<{ id: string; createdAt: string }[]>("/api/scenarios"),
  })
  const isFree = me?.plan === "free"
  // Sort oldest first — free users can view the first one they created
  const sortedIds = [...allScenarios].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map(s => s.id)
  const isLocked = isFree && sortedIds.length > 1 && sortedIds[0] !== id

  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const handleUpgrade = async () => {
    setCheckoutLoading(true)
    try {
      const r = await customFetch<{ url: string }>("/api/billing/checkout", { method: "POST", body: JSON.stringify({ plan: "plus" }) })
      if (r.url) window.location.href = r.url
    } finally {
      setCheckoutLoading(false)
    }
  }

  const deleteMutation = useMutation({
    mutationFn: () => customFetch(`/api/scenarios/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scenarios"] })
      navigate("/app/scenarios")
    },
    onError: () => {
      alert("Failed to delete scenario. Please try again.")
    },
  })

  const renameMutation = useMutation({
    mutationFn: (name: string) =>
      customFetch(`/api/scenarios/${id}`, { method: "PATCH", body: JSON.stringify({ name }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scenario", id] })
      qc.invalidateQueries({ queryKey: ["scenarios"] })
      setEditingName(false)
    },
  })

  const shareMutation = useMutation({
    mutationFn: () => customFetch<{ token: string }>(`/api/scenarios/${id}/share`, { method: "POST" }),
    onSuccess: (data) => {
      const url = `${window.location.origin}/shared/${data.token}`
      setShareLink(url)
    },
  })

  const revokeMutation = useMutation({
    mutationFn: () => customFetch(`/api/scenarios/${id}/share`, { method: "DELETE" }),
    onSuccess: () => {
      setShareLink(null)
      setShowShareModal(false)
      qc.invalidateQueries({ queryKey: ["scenario", id] })
    },
  })

  const handleOpenShare = () => {
    setShowShareModal(true)
    if (!shareLink) shareMutation.mutate()
  }

  const handleCopyLink = () => {
    if (!shareLink) return
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const startRename = () => {
    setNameInput(scenario?.name ?? "")
    setEditingName(true)
  }

  const submitRename = () => {
    const trimmed = nameInput.trim()
    if (trimmed && trimmed !== scenario?.name) renameMutation.mutate(trimmed)
    else setEditingName(false)
  }

  const analysis = useMemo(() => {
    if (!scenario) return null

    const curr = scenario.current
    const prop = scenario.proposed

    const currIncome = Number(curr.income) || profile.grossIncome
    const currState = (curr.state as string) || profile.state
    const otherExpenses = profile.transport + profile.food + profile.utilities + profile.healthcare + profile.otherExpenses

    const currTakeHome = calculateMonthlyTakeHomeWith401k(currIncome, profile.filingStatus, currState, profile.annual401kContrib || 0)
    const currMonthlyHousing = Number(curr.monthlyHousing ?? curr.housing) || profile.housing
    const currSurplus = currTakeHome - currMonthlyHousing - otherExpenses

    // ── Proposed: derive correctly per scenario type ──────────────────────
    let propTakeHome = currTakeHome
    // Default housing to CURRENT housing (not 0) — scenarios that don't change housing should not gain a free $0 housing entry
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
      // income unchanged for buy-home

    } else if (scenario.type === "job-change" || scenario.type === "custom") {
      const propIncome = Number(prop.income) || currIncome
      const propState = (prop.state as string) || currState
      propTakeHome = calculateMonthlyTakeHome(propIncome, profile.filingStatus, propState)
      // propMonthlyHousing already set above from prop.monthlyHousing || currMonthlyHousing

    } else if (scenario.type === "child") {
      // Year ~1: income reduced during parental leave (blended avg ≈ 3 months leave in first year)
      const leaveIncome = prop.leaveIncome != null ? Number(prop.leaveIncome) : currIncome
      const blendedAnnualIncome = leaveIncome * 0.25 + currIncome * 0.75
      propTakeHome = calculateMonthlyTakeHome(blendedAnnualIncome, profile.filingStatus, currState)
      propMonthlyHousing = currMonthlyHousing
      const monthlyChildcare = Number(prop.monthlyChildcare) || 0
      const monthlyExtras = Number(prop.monthlyExtras) || 0
      propScenarioCosts = monthlyChildcare + monthlyExtras

    } else if (scenario.type === "school") {
      // Phase 1: in-school (reduced income + tuition)
      const incomeWhileInSchool = Number(prop.incomeWhileInSchool) || 0
      const annualTuition = Number(prop.annualTuition) || 0
      propTakeHome = calculateMonthlyTakeHome(incomeWhileInSchool, profile.filingStatus, currState)
      propMonthlyHousing = currMonthlyHousing
      propScenarioCosts = annualTuition / 12

    } else if (scenario.type === "time-off") {
      // Phase 1: time off (reduced/no income + extra costs)
      const partTimeIncome = Number(prop.partTimeIncome) || 0
      const extraMonthlyCost = Number(prop.extraMonthlyCost) || 0
      propTakeHome = calculateMonthlyTakeHome(partTimeIncome, profile.filingStatus, currState)
      propMonthlyHousing = currMonthlyHousing
      propScenarioCosts = extraMonthlyCost
    }

    // Immediate surplus (Phase 1) — shown in verdict card and stat tiles
    const propSurplus = propTakeHome - propMonthlyHousing - otherExpenses - propScenarioCosts

    // ── Build phased surplus schedule for accurate long-term projections ─────
    // Child/school/time-off have temporary costs — after they end, surplus recovers.
    // Treating these as permanent (the old bug) causes retirement age to be wildly overstated.
    let propPhases: SurplusPhase[] = [{ monthlySurplus: propSurplus, years: projYears }]

    if (scenario.type === "child") {
      const LEAVE_YEARS = 1       // parental leave affects only the first year
      const CHILDCARE_YEARS = 5   // full-cost childcare ages 0–5
      const monthlyChildcare = Number(prop.monthlyChildcare) || 0
      const monthlyExtras = Number(prop.monthlyExtras) || 0
      const fullTakeHome = calculateMonthlyTakeHome(currIncome, profile.filingStatus, currState)
      // Years 2–5: leave ends, full income resumes — but childcare costs continue
      const surplusChildcareFullIncome = fullTakeHome - currMonthlyHousing - otherExpenses - monthlyChildcare - monthlyExtras
      // Years 6+: full income, no childcare costs
      const surplusAfterChildcare = fullTakeHome - currMonthlyHousing - otherExpenses
      propPhases = [
        { monthlySurplus: propSurplus,               years: Math.min(LEAVE_YEARS, projYears) },
        { monthlySurplus: surplusChildcareFullIncome, years: Math.min(CHILDCARE_YEARS - LEAVE_YEARS, Math.max(0, projYears - LEAVE_YEARS)) },
        { monthlySurplus: surplusAfterChildcare,      years: Math.max(0, projYears - CHILDCARE_YEARS) },
      ].filter(p => p.years > 0)

    } else if (scenario.type === "school") {
      const durationYears = Math.max(1, Math.round(Number(prop.durationYears) || 2))
      const salaryAfter = Number(prop.salaryAfter) || currIncome
      // After graduation: higher salary, no tuition
      const takeHomeAfter = calculateMonthlyTakeHome(salaryAfter, profile.filingStatus, currState)
      const surplusAfterSchool = takeHomeAfter - currMonthlyHousing - otherExpenses
      propPhases = [
        { monthlySurplus: propSurplus, years: Math.min(durationYears, projYears) },
        { monthlySurplus: surplusAfterSchool, years: Math.max(0, projYears - durationYears) },
      ].filter(p => p.years > 0)

    } else if (scenario.type === "time-off") {
      const offMonths = Number(prop.months) || 6
      const offYears = Math.max(1, Math.ceil(offMonths / 12))
      const salaryAfter = Number(prop.salaryAfter) || currIncome
      const extraMonthlyCost = Number(prop.extraMonthlyCost) || 0
      // After returning to work: full salary, no extra costs
      const takeHomeAfter = calculateMonthlyTakeHome(salaryAfter, profile.filingStatus, currState)
      const surplusAfterReturn = takeHomeAfter - currMonthlyHousing - otherExpenses
      propPhases = [
        { monthlySurplus: propSurplus, years: Math.min(offYears, projYears) },
        { monthlySurplus: surplusAfterReturn, years: Math.max(0, projYears - offYears) },
      ].filter(p => p.years > 0)
    }

    // What-If adjusted surplus (applied to all phases)
    const whatIfExtraTakeHome = (whatIf.incomeBoost / 12) * 0.72
    const whatIfBoost = whatIfExtraTakeHome + whatIf.savingsBoost
    const whatIfSurplus = propSurplus + whatIfBoost
    const whatIfPhases: SurplusPhase[] = propPhases.map(p => ({ ...p, monthlySurplus: p.monthlySurplus + whatIfBoost }))

    const startNetWorth =
      profile.emergencyFund + profile.retirementBalance + profile.otherInvestments -
      (profile.creditCardDebt + profile.studentLoans + profile.carLoans + profile.otherDebt)

    // One-time upfront costs are real cash outflows on day 1 — deduct from proposed starting position
    const oneTimeCostProp =
      scenario.type === "child"      ? (Number(prop.oneTimeCost) || 0) :
      scenario.type === "job-change" ? (Number(prop.movingCost)  || 0) :
      scenario.type === "buy-home"   ? (Number(prop.downPayment) || 0) : 0
    const startNetWorthProp = startNetWorth - oneTimeCostProp

    // Rule of 25: retirement target uses long-term (post-cost) expense level
    const currAnnualExpenses = (currMonthlyHousing + otherExpenses) * 12
    const longTermPropExpenses = (propMonthlyHousing + otherExpenses) * 12 // no temporary costs in retirement target
    const retirementTargetCurr = calculateRetirementTarget(currAnnualExpenses / 12)
    const retirementTargetProp = calculateRetirementTarget(longTermPropExpenses / 12)

    const projCurr = projectNetWorth(startNetWorth, currSurplus, projYears)
    const projProp = projectNetWorthPhased(startNetWorthProp, propPhases)
    const projWhatIf = projectNetWorthPhased(startNetWorthProp, whatIfPhases)

    const retireCurr = estimateRetirementAge(profile.age, startNetWorth, Math.max(0, currSurplus), retirementTargetCurr)
    const retireProp = estimateRetirementAgePhased(profile.age, startNetWorthProp, propPhases, retirementTargetProp)
    const retireWhatIf = estimateRetirementAgePhased(profile.age, startNetWorthProp, whatIfPhases, retirementTargetProp)

    const diff20 = (projProp[Math.min(20, projProp.length - 1)]?.netWorth ?? 0) - (projCurr[Math.min(20, projCurr.length - 1)]?.netWorth ?? 0)
    const diff30WhatIf = (projWhatIf[projWhatIf.length - 1]?.netWorth ?? 0) - (projProp[projProp.length - 1]?.netWorth ?? 0)
    const propWins = propSurplus >= currSurplus

    // Opportunity cost: use long-term (post-cost) surplus diff to avoid overstating childcare impact
    const longTermPropSurplus = propPhases[propPhases.length - 1]?.monthlySurplus ?? propSurplus
    const surplusDiff = Math.abs(longTermPropSurplus - currSurplus)
    const opportunityCostFV = surplusDiff > 0
      ? surplusDiff * ((Math.pow(1 + 0.07 / 12, 30 * 12) - 1) / (0.07 / 12))
      : 0

    const projData = projCurr.map((pt, i) => {
      const row: Record<string, number | string> = {
        year: `Yr ${pt.year}`,
        "Current Path": pt.netWorth,
        "New Scenario": projProp[i]?.netWorth ?? 0,
      }
      if (showWhatIf && (whatIf.incomeBoost !== 0 || whatIf.savingsBoost !== 0)) {
        row["What-If Optimized"] = projWhatIf[i]?.netWorth ?? 0
      }
      return row
    })

    return {
      currTakeHome, propTakeHome, currMonthlyHousing, propMonthlyHousing, propScenarioCosts,
      currSurplus, propSurplus, whatIfSurplus, whatIfExtraTakeHome,
      retireCurr, retireProp, retireWhatIf,
      retirementTargetCurr, retirementTargetProp,
      diff20, diff30WhatIf, propWins,
      projData, otherExpenses,
      opportunityCostFV, surplusDiff,
    }
  }, [scenario, profile, projYears, whatIf, showWhatIf])

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-5xl mx-auto space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-2xl h-40 animate-pulse border border-gray-100" />)}
        </div>
      </AppLayout>
    )
  }

  if (isError || !scenario) {
    return (
      <AppLayout>
        <div className="max-w-5xl mx-auto text-center py-20">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="font-semibold text-[#1A1A2E] mb-2">Scenario not found</h2>
          <Link href="/app/scenarios">
            <button className="text-[#FACC15] text-sm hover:underline">← Back to scenarios</button>
          </Link>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <style>{`
        @media print {
          [data-no-print] { display: none !important; }
          body { background: white !important; }
          .shadow-sm { box-shadow: none !important; }
        }
      `}</style>
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Link href="/app/scenarios">
              <button data-no-print className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                {editingName ? (
                  <input
                    autoFocus
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    onBlur={submitRename}
                    onKeyDown={e => { if (e.key === "Enter") submitRename(); if (e.key === "Escape") setEditingName(false) }}
                    className="text-2xl font-bold text-[#1A1A2E] border-b-2 border-[#FACC15] outline-none bg-transparent w-72"
                  />
                ) : (
                  <button onClick={startRename} className="group flex items-center gap-1.5">
                    <h1 className="text-2xl font-bold text-[#1A1A2E]">{scenario.name}</h1>
                    <Pencil className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#FACC15] transition-colors" />
                  </button>
                )}
                <span className="text-xs bg-[#FFF9E6] text-[#1A1A2E] border border-yellow-200 px-2.5 py-0.5 rounded-full font-medium">
                  {TYPE_LABELS[scenario.type] ?? "Scenario"}
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-0.5">
                Created {new Date(scenario.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2" data-no-print>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#1A1A2E] hover:bg-gray-100 px-3 py-2 rounded-xl transition-colors"
            >
              <Printer className="w-4 h-4" /> Export PDF
            </button>
            <button
              onClick={handleOpenShare}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#1A1A2E] hover:bg-gray-100 px-3 py-2 rounded-xl transition-colors"
            >
              <Share2 className="w-4 h-4" /> Share
            </button>
            <button
              onClick={() => { if (confirm("Delete this scenario?")) deleteMutation.mutate() }}
              className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-xl transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        </div>

        {/* Share modal */}
        {showShareModal && (
          <div data-no-print className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowShareModal(false)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold text-[#1A1A2E]">Share with family</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Anyone with the link can view this scenario — read-only, no account needed.</p>
                </div>
                <button onClick={() => setShowShareModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {shareMutation.isPending && (
                <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
                  <div className="w-4 h-4 border-2 border-[#FACC15] border-t-transparent rounded-full animate-spin" />
                  Generating link…
                </div>
              )}

              {shareLink && !shareMutation.isPending && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <LinkIcon className="w-4 h-4 text-gray-400 shrink-0" />
                    <input
                      ref={shareLinkRef}
                      readOnly
                      value={shareLink}
                      className="flex-1 text-sm text-gray-600 bg-transparent outline-none truncate"
                    />
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className={cn(
                      "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                      copied
                        ? "bg-green-100 text-green-700"
                        : "bg-[#FACC15] hover:bg-yellow-300 text-[#1A1A2E]"
                    )}
                  >
                    {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy link</>}
                  </button>
                  <p className="text-xs text-gray-400 text-center">Send this link via text, email, or any messaging app.</p>
                  <div className="border-t border-gray-100 pt-3">
                    <button
                      onClick={() => revokeMutation.mutate()}
                      disabled={revokeMutation.isPending}
                      className="text-xs text-red-400 hover:text-red-600 hover:underline disabled:opacity-50 transition-colors"
                    >
                      {revokeMutation.isPending ? "Revoking…" : "Revoke link (disable sharing)"}
                    </button>
                  </div>
                </div>
              )}

              {shareMutation.isError && (
                <p className="text-sm text-red-500">Failed to generate link. Please try again.</p>
              )}
            </div>
          </div>
        )}

        {/* ── Paywall overlay for locked scenarios ── */}
        {isLocked && (
          <div className="relative">
            {/* Blurred preview */}
            <div className="pointer-events-none select-none blur-sm opacity-40 space-y-5">
              <div className="rounded-2xl border border-yellow-200 bg-[#FFF9E6] p-5 h-28" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[1,2,3,4].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 h-24" />)}
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-6 h-64" />
            </div>
            {/* Upgrade prompt */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 max-w-sm w-full text-center mx-4">
                <div className="w-14 h-14 bg-[#FFF9E6] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-7 h-7 text-[#F59E0B]" />
                </div>
                <h2 className="text-lg font-bold text-[#1A1A2E] mb-2">Unlock full analysis</h2>
                <p className="text-sm text-gray-500 mb-6">
                  You've built this scenario — upgrade to Plus to see the full breakdown, retirement projection, net worth chart, and what-if explorer.
                </p>
                <button
                  onClick={handleUpgrade}
                  disabled={checkoutLoading}
                  className="w-full bg-[#FACC15] hover:bg-yellow-300 text-[#1A1A2E] font-bold py-3 rounded-xl transition-colors disabled:opacity-60 mb-3"
                >
                  {checkoutLoading ? "Loading..." : "Upgrade to Plus — $7/mo"}
                </button>
                <p className="text-xs text-gray-400">7-day free trial · Cancel anytime</p>
              </div>
            </div>
          </div>
        )}

        {analysis && !isLocked && (
          <>
            {/* ── Verdict card ── */}
            <div className={cn(
              "rounded-2xl border p-5 flex items-start gap-4",
              analysis.propWins
                ? "bg-[#FFF9E6] border-yellow-200"
                : "bg-orange-50 border-orange-200"
            )}>
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                analysis.propWins ? "bg-[#FACC15]" : "bg-orange-400"
              )}>
                {analysis.propWins
                  ? <Award className="w-5 h-5 text-[#1A1A2E]" />
                  : <AlertCircle className="w-5 h-5 text-white" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-[#1A1A2E]">
                    {analysis.propWins ? "New scenario wins financially" : "Current path is stronger"}
                  </h3>
                  {analysis.propWins
                    ? <TrendingUp className="w-4 h-4 text-green-500" />
                    : <TrendingDown className="w-4 h-4 text-orange-500" />}
                </div>
                <p className="text-sm text-gray-600">
                  {analysis.propWins
                    ? `This move puts ${formatCurrency(analysis.propSurplus - analysis.currSurplus)}/month more in your pocket. Over 20 years, that difference compounds to approximately ${formatCurrency(analysis.diff20)} in additional net worth.${analysis.retireProp < analysis.retireCurr ? ` You'd retire ${analysis.retireCurr - analysis.retireProp} years earlier at age ${analysis.retireProp}.` : ""}`
                    : `Your current path generates ${formatCurrency(analysis.currSurplus - analysis.propSurplus)}/month more surplus. Switching would cost you roughly ${formatCurrency(Math.abs(analysis.diff20))} over 20 years.`}
                </p>
              </div>
            </div>

            {/* ── Opportunity Cost card ── */}
            {analysis.surplusDiff > 50 && (
              <div className="bg-[#1A1A2E] rounded-2xl p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                <div className="w-10 h-10 rounded-xl bg-[#FACC15] flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-[#1A1A2E]" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-white/50 uppercase tracking-widest mb-1 font-medium">Opportunity Cost</p>
                  <p className="text-white font-bold text-base leading-snug">
                    The {formatCurrency(analysis.surplusDiff)}/mo difference, invested at 7%, grows to{" "}
                    <span className="text-[#FACC15]">{formatCurrency(analysis.opportunityCostFV)}</span> over 30 years.
                  </p>
                  <p className="text-white/50 text-xs mt-1">
                    {analysis.propWins
                      ? "That's the compounding power of this decision — every extra dollar of surplus snowballs."
                      : "That's what you'd give up by switching away from your current path."}
                  </p>
                </div>
                {/* Mini visual bar */}
                <div className="hidden sm:flex flex-col gap-2 shrink-0 w-32">
                  <div>
                    <p className="text-[10px] text-white/40 mb-1">Today</p>
                    <div className="h-2 rounded-full bg-white/10 w-full overflow-hidden">
                      <div className="h-full bg-white/30 rounded-full" style={{ width: "15%" }} />
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/40 mb-1">30 years</p>
                    <div className="h-2 rounded-full bg-white/10 w-full overflow-hidden">
                      <div className="h-full bg-[#FACC15] rounded-full" style={{ width: "100%" }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Comparison table + Chart ── */}
            <div className="grid lg:grid-cols-5 gap-5">
              {/* Comparison table */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h2 className="font-bold text-[#1A1A2E] text-sm mb-4">Monthly Breakdown</h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-400 uppercase">
                      <th className="text-left pb-2 font-medium">Item</th>
                      <th className="text-right pb-2 font-medium">Current</th>
                      <th className="text-right pb-2 font-medium text-[#1A1A2E]">New</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {[
                      { label: "Take-home/mo", curr: analysis.currTakeHome, prop: analysis.propTakeHome },
                      { label: "Housing/mo", curr: analysis.currMonthlyHousing, prop: analysis.propMonthlyHousing },
                      { label: "Other expenses", curr: analysis.otherExpenses, prop: null },
                      ...(analysis.propScenarioCosts > 0 ? [{ label: "Scenario costs", curr: 0, prop: analysis.propScenarioCosts }] : []),
                    ].map(row => (
                      <tr key={row.label} className="text-gray-700">
                        <td className="py-2 text-gray-400 text-xs">{row.label}</td>
                        <td className="py-2 text-right font-medium text-sm">{formatCurrency(row.curr)}</td>
                        <td className="py-2 text-right font-medium text-sm">
                          {row.prop !== null ? (
                            <span className={row.prop > row.curr ? "text-green-500" : row.prop < row.curr ? "text-red-500" : ""}>
                              {formatCurrency(row.prop)}
                            </span>
                          ) : <span className="text-gray-300">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-100">
                      <td className="pt-3 text-xs font-bold text-[#1A1A2E]">Net monthly</td>
                      <td className="pt-3 text-right font-bold text-[#1A1A2E]">{formatCurrency(analysis.currSurplus)}</td>
                      <td className="pt-3 text-right font-bold" style={{ color: analysis.propSurplus >= analysis.currSurplus ? "#22C55E" : "#ef4444" }}>
                        {formatCurrency(analysis.propSurplus)}
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* Milestones */}
                <div className="mt-5 pt-4 border-t border-gray-100 space-y-3">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Key Milestones</h3>
                  {[
                    { icon: Clock, label: "Retire (current path)", value: `Age ${analysis.retireCurr}`, highlight: false },
                    { icon: Clock, label: "Retire (new scenario)", value: `Age ${analysis.retireProp}`, highlight: analysis.retireProp < analysis.retireCurr },
                    { icon: PiggyBank, label: "Retirement target", value: formatCurrency(analysis.retirementTargetProp, true), highlight: false },
                    { icon: PiggyBank, label: "20-yr net worth delta", value: formatCurrency(analysis.diff20), highlight: analysis.diff20 > 0 },
                  ].map(m => (
                    <div key={m.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <m.icon className="w-3.5 h-3.5 text-gray-300" />
                        <span className="text-xs text-gray-400">{m.label}</span>
                      </div>
                      <span className={cn("text-xs font-bold", m.highlight ? "text-[#FACC15]" : "text-[#1A1A2E]")}>
                        {m.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Projection chart */}
              <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-bold text-[#1A1A2E] text-sm">Net Worth Projection</h2>
                    <p className="text-xs text-gray-400">7% avg return · Retirement target = 25× annual expenses</p>
                  </div>
                  <div className="flex gap-1">
                    {([10, 20, 30] as const).map(y => (
                      <button key={y} onClick={() => setProjYears(y)} className={cn(
                        "px-2.5 py-1 text-xs rounded-lg font-medium transition-colors",
                        projYears === y ? "bg-[#1A1A2E] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      )}>{y}yr</button>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={analysis.projData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="gcurr" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#94A3B8" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gprop" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FACC15" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#FACC15" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gwhatif" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22C55E" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="year" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} interval={Math.floor(analysis.projData.length / 5)} />
                    <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false}
                      tickFormatter={v => v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${(v / 1_000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 12, border: "1px solid #e5e7eb", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                      formatter={(v: number) => formatCurrency(v)}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="Current Path" stroke="#94A3B8" strokeWidth={2} fill="url(#gcurr)" strokeDasharray="4 2" />
                    <Area type="monotone" dataKey="New Scenario" stroke="#FACC15" strokeWidth={2.5} fill="url(#gprop)" />
                    {showWhatIf && (whatIf.incomeBoost !== 0 || whatIf.savingsBoost !== 0) && (
                      <Area type="monotone" dataKey="What-If Optimized" stroke="#22C55E" strokeWidth={2} fill="url(#gwhatif)" />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ── What-If Explorer ── */}
            <div data-no-print className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <button
                onClick={() => setShowWhatIf(v => !v)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#FFF9E6] flex items-center justify-center">
                    <SlidersHorizontal className="w-4 h-4 text-[#1A1A2E]" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-[#1A1A2E]">What-If Explorer</p>
                    <p className="text-xs text-gray-400">Adjust variables to see how your projection changes in real time</p>
                  </div>
                </div>
                <div className={cn("transition-transform text-gray-400", showWhatIf && "rotate-180")}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </button>

              {showWhatIf && (
                <div className="px-5 pb-5 border-t border-gray-100">
                  <div className="grid sm:grid-cols-2 gap-6 mt-5">
                    <SliderRow
                      label="Extra annual income"
                      value={whatIf.incomeBoost}
                      min={-20000} max={50000} step={1000}
                      format={v => v === 0 ? "$0" : `${formatCurrency(Math.abs(v))}`}
                      onChange={v => setWhatIf(w => ({ ...w, incomeBoost: v }))}
                    />
                    <SliderRow
                      label="Extra monthly savings"
                      value={whatIf.savingsBoost}
                      min={-500} max={2000} step={50}
                      format={v => v === 0 ? "$0/mo" : `${formatCurrency(Math.abs(v))}/mo`}
                      onChange={v => setWhatIf(w => ({ ...w, savingsBoost: v }))}
                    />
                  </div>

                  {(whatIf.incomeBoost !== 0 || whatIf.savingsBoost !== 0) && (
                    <div className="mt-5 grid sm:grid-cols-3 gap-3">
                      {[
                        {
                          label: "Optimized monthly surplus",
                          value: formatCurrency(analysis.whatIfSurplus),
                          delta: formatCurrency(analysis.whatIfSurplus - analysis.propSurplus) + "/mo more",
                          positive: analysis.whatIfSurplus > analysis.propSurplus,
                        },
                        {
                          label: "Retire age (optimized)",
                          value: `Age ${analysis.retireWhatIf}`,
                          delta: analysis.retireProp > analysis.retireWhatIf
                            ? `${analysis.retireProp - analysis.retireWhatIf} yrs earlier`
                            : "same timeline",
                          positive: analysis.retireProp > analysis.retireWhatIf,
                        },
                        {
                          label: `${projYears}-yr net worth boost`,
                          value: formatCurrency(Math.abs(analysis.diff30WhatIf)),
                          delta: analysis.diff30WhatIf > 0 ? "more than base" : "less than base",
                          positive: analysis.diff30WhatIf > 0,
                        },
                      ].map(stat => (
                        <div key={stat.label} className="bg-[#F8F9FC] rounded-xl p-3.5">
                          <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
                          <p className="text-base font-bold text-[#1A1A2E]">{stat.value}</p>
                          <p className={cn("text-xs font-medium mt-0.5", stat.positive ? "text-green-500" : "text-red-400")}>
                            {stat.delta}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => setWhatIf({ incomeBoost: 0, savingsBoost: 0 })}
                      className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      Reset sliders
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Bottom actions ── */}
            <div className="flex gap-3" data-no-print>
              <Link href="/app/scenarios/new">
                <button className="flex items-center gap-2 border border-gray-200 hover:border-[#FACC15] hover:text-[#1A1A2E] text-gray-600 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
                  <DollarSign className="w-4 h-4" /> New scenario
                </button>
              </Link>
              <Link href="/app/advisor">
                <button className="flex items-center gap-2 bg-[#1A1A2E] hover:bg-[#2d2d4e] text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
                  <Zap className="w-4 h-4 text-[#FACC15]" /> Ask AI advisor
                </button>
              </Link>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}

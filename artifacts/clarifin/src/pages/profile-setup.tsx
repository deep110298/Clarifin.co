import { useState, useEffect } from "react"
import { useLocation } from "wouter"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { customFetch } from "@workspace/api-client-react"
import { AppLayout } from "@/components/app/AppLayout"
import { CheckCircle, ChevronRight, ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
]

interface ProfileData {
  grossIncome: number
  filingStatus: "single" | "married" | "head"
  state: string
  age: number
  expenses: { housing: number; transport: number; food: number; utilities: number; healthcare: number; other: number }
  savings: { emergency: number; retirement: number; monthlyContrib: number; investments: number }
  debt: { creditCard: number; studentLoans: number; carLoans: number; other: number }
}

const DEFAULT: ProfileData = {
  grossIncome: 75000,
  filingStatus: "single",
  state: "TX",
  age: 30,
  expenses: { housing: 1800, transport: 400, food: 600, utilities: 200, healthcare: 150, other: 300 },
  savings: { emergency: 10000, retirement: 25000, monthlyContrib: 500, investments: 5000 },
  debt: { creditCard: 0, studentLoans: 0, carLoans: 0, other: 0 },
}

function NumberInput({ label, value, onChange, prefix = "$", hint }: {
  label: string; value: number; onChange: (v: number) => void; prefix?: string; hint?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-400 mb-1">{hint}</p>}
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{prefix}</span>}
        <input
          type="number"
          min={0}
          value={value || ""}
          onChange={e => onChange(Number(e.target.value) || 0)}
          className={cn(
            "w-full border border-gray-200 rounded-2xl py-2.5 text-sm text-[#1A2C20] bg-white focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 focus:border-[#4D8F6A]",
            prefix ? "pl-7 pr-3" : "px-3"
          )}
        />
      </div>
    </div>
  )
}

const STEPS = ["Income", "Expenses", "Savings & Debt"]

export default function ProfileSetupPage() {
  const [, navigate] = useLocation()
  const qc = useQueryClient()
  const [step, setStep] = useState(0)
  const [data, setData] = useState<ProfileData>(DEFAULT)

  // Load existing profile
  const { data: existing } = useQuery({
    queryKey: ["profile"],
    queryFn: () => customFetch<ProfileData | null>("/api/profile"),
  })

  useEffect(() => {
    if (existing) setData(existing as ProfileData)
  }, [existing])

  const mutation = useMutation({
    mutationFn: (body: ProfileData) =>
      customFetch("/api/profile", { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] })
      qc.invalidateQueries({ queryKey: ["me"] })
      navigate("/app/dashboard")
    },
  })

  const setField = <K extends keyof ProfileData>(key: K, value: ProfileData[K]) =>
    setData(d => ({ ...d, [key]: value }))

  const setNested = <K extends "expenses" | "savings" | "debt">(section: K, key: string, value: number) =>
    setData(d => ({ ...d, [section]: { ...(d[section] as Record<string,number>), [key]: value } }))

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1A2C20]">Set up your financial profile</h1>
          <p className="text-gray-500 text-sm mt-1">This is the foundation for all your scenarios. Takes about 3 minutes.</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0",
                i < step ? "bg-[#4D8F6A] text-white" :
                i === step ? "bg-[#1A2C20] text-white" :
                "bg-gray-100 text-gray-400"
              )}>
                {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              <span className={cn("text-sm font-medium", i === step ? "text-[#1A2C20]" : "text-gray-400")}>{label}</span>
              {i < STEPS.length - 1 && <div className="flex-1 h-px bg-gray-200 ml-2" />}
            </div>
          ))}
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">

          {/* Step 1: Income */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-[#1A2C20] mb-4">Income & Employment</h2>
              <NumberInput label="Annual Gross Income" value={data.grossIncome} onChange={v => setField("grossIncome", v)} hint="Before taxes and deductions" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Filing Status</label>
                <select
                  value={data.filingStatus}
                  onChange={e => setField("filingStatus", e.target.value as ProfileData["filingStatus"])}
                  className="w-full border border-gray-200 rounded-2xl px-3 py-2.5 text-sm text-[#1A2C20] bg-white focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 focus:border-[#4D8F6A]"
                >
                  <option value="single">Single</option>
                  <option value="married">Married Filing Jointly</option>
                  <option value="head">Head of Household</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <select
                    value={data.state}
                    onChange={e => setField("state", e.target.value)}
                    className="w-full border border-gray-200 rounded-2xl px-3 py-2.5 text-sm text-[#1A2C20] bg-white focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 focus:border-[#4D8F6A]"
                  >
                    {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <NumberInput label="Current Age" value={data.age} onChange={v => setField("age", v)} prefix="" />
              </div>
            </div>
          )}

          {/* Step 2: Expenses */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-[#1A2C20] mb-4">Monthly Expenses</h2>
              <div className="grid grid-cols-2 gap-4">
                <NumberInput label="Housing (rent/mortgage)" value={data.expenses.housing} onChange={v => setNested("expenses", "housing", v)} />
                <NumberInput label="Transportation" value={data.expenses.transport} onChange={v => setNested("expenses", "transport", v)} />
                <NumberInput label="Food & Groceries" value={data.expenses.food} onChange={v => setNested("expenses", "food", v)} />
                <NumberInput label="Utilities & Subscriptions" value={data.expenses.utilities} onChange={v => setNested("expenses", "utilities", v)} />
                <NumberInput label="Healthcare" value={data.expenses.healthcare} onChange={v => setNested("expenses", "healthcare", v)} />
                <NumberInput label="Other Expenses" value={data.expenses.other} onChange={v => setNested("expenses", "other", v)} />
              </div>
              <div className="pt-3 border-t border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total monthly expenses</span>
                  <span className="font-semibold text-[#1A2C20]">
                    ${Object.values(data.expenses).reduce((a, b) => a + b, 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Savings & Debt */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-semibold text-[#1A2C20] mb-4">Savings & Investments</h2>
                <div className="grid grid-cols-2 gap-4">
                  <NumberInput label="Emergency Fund" value={data.savings.emergency} onChange={v => setNested("savings", "emergency", v)} hint="Target: 3–6 months expenses" />
                  <NumberInput label="401k / IRA Balance" value={data.savings.retirement} onChange={v => setNested("savings", "retirement", v)} />
                  <NumberInput label="Monthly Retirement Contribution" value={data.savings.monthlyContrib} onChange={v => setNested("savings", "monthlyContrib", v)} hint="Including employer match" />
                  <NumberInput label="Other Investments" value={data.savings.investments} onChange={v => setNested("savings", "investments", v)} hint="Brokerage, crypto, etc." />
                </div>
              </div>
              <div>
                <h2 className="font-semibold text-[#1A2C20] mb-4">Debt</h2>
                <div className="grid grid-cols-2 gap-4">
                  <NumberInput label="Credit Card Debt" value={data.debt.creditCard} onChange={v => setNested("debt", "creditCard", v)} />
                  <NumberInput label="Student Loans" value={data.debt.studentLoans} onChange={v => setNested("debt", "studentLoans", v)} />
                  <NumberInput label="Car Loans" value={data.debt.carLoans} onChange={v => setNested("debt", "carLoans", v)} />
                  <NumberInput label="Other Debt" value={data.debt.other} onChange={v => setNested("debt", "other", v)} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#4D8F6A] hover:bg-[#3D7A5A] text-white text-sm font-medium transition-colors"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => mutation.mutate(data)}
              disabled={mutation.isPending}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#4D8F6A] hover:bg-[#3D7A5A] text-white text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {mutation.isPending ? "Saving..." : "Complete setup"}
              {!mutation.isPending && <CheckCircle className="w-4 h-4" />}
            </button>
          )}
        </div>

        {mutation.isError && (
          <p className="mt-3 text-sm text-red-500 text-center">Something went wrong. Please try again.</p>
        )}
      </div>
    </AppLayout>
  )
}

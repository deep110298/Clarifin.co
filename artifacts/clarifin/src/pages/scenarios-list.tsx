import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Link } from "wouter"
import { customFetch } from "@workspace/api-client-react"
import { AppLayout } from "@/components/app/AppLayout"
import {
  Plus, GitCompare, ArrowRight, Briefcase, Home, GraduationCap,
  Baby, Plane, Sliders, Trash2, AlertCircle, Zap, Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Scenario {
  id: string
  name: string
  type: string
  createdAt: string
}

interface Me {
  plan: "free" | "plus" | "advisor"
  profileComplete: boolean
}

const TYPE_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  "job-change": { label: "Job Change", icon: Briefcase, color: "bg-blue-100 text-blue-700" },
  "buy-home": { label: "Buy a Home", icon: Home, color: "bg-purple-100 text-purple-700" },
  "school": { label: "Back to School", icon: GraduationCap, color: "bg-orange-100 text-orange-700" },
  "child": { label: "New Child", icon: Baby, color: "bg-pink-100 text-pink-700" },
  "time-off": { label: "Time Off", icon: Plane, color: "bg-cyan-100 text-cyan-700" },
  "custom": { label: "Custom", icon: Sliders, color: "bg-gray-100 text-gray-700" },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export default function ScenariosListPage() {
  const qc = useQueryClient()
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  const { data: scenarios = [], isLoading } = useQuery({
    queryKey: ["scenarios"],
    queryFn: () => customFetch<Scenario[]>("/api/scenarios"),
  })

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => customFetch<Me>("/api/me"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => customFetch(`/api/scenarios/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scenarios"] }),
  })

  const handleUpgrade = async () => {
    setCheckoutLoading(true)
    setCheckoutError(null)
    try {
      const r = await customFetch<{ url: string }>("/api/billing/checkout", { method: "POST", body: JSON.stringify({ plan: "plus" }) })
      window.location.href = r.url
    } catch {
      setCheckoutError("Could not start checkout. Please try again.")
      setCheckoutLoading(false)
    }
  }

  const isFree = me?.plan === "free"

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A2E]">Your Scenarios</h1>
            <p className="text-sm text-gray-500 mt-0.5">Model any life decision and compare paths side by side.</p>
          </div>
          <div className="flex items-center gap-2">
            {scenarios.length >= 2 && (
              <Link href="/app/scenarios/compare">
                <button className="flex items-center gap-2 border border-gray-200 hover:border-[#FACC15] text-gray-600 hover:text-[#1A1A2E] px-4 py-2 rounded-2xl text-sm font-medium transition-colors bg-white">
                  <GitCompare className="w-4 h-4" /> Compare
                </button>
              </Link>
            )}
            <Link href="/app/scenarios/new">
              <button className="flex items-center gap-2 bg-[#FACC15] hover:bg-yellow-300 text-[#1A1A2E] px-4 py-2 rounded-2xl text-sm font-bold transition-colors">
                <Plus className="w-4 h-4" /> New scenario
              </button>
            </Link>
          </div>
        </div>

        {/* Free plan banner — shown when they have scenarios they can't fully view */}
        {isFree && scenarios.length > 1 && (
          <><div className="flex items-start gap-3 bg-[#1A1A2E] rounded-2xl p-4">
            <Sparkles className="w-5 h-5 text-[#FACC15] shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Unlock full analysis with Plus</p>
              <p className="text-xs text-white/60 mt-0.5">You can build unlimited scenarios free. Upgrade to $7/mo to view the full breakdown, charts, and retirement projections on all of them.</p>
            </div>
            <button
              onClick={handleUpgrade}
              disabled={checkoutLoading}
              className="shrink-0 text-xs bg-[#FACC15] hover:bg-yellow-300 text-[#1A1A2E] px-3 py-1.5 rounded-xl font-bold transition-colors disabled:opacity-60"
            >
              {checkoutLoading ? "Loading..." : "Upgrade — $7/mo"}
            </button>
          </div>
          {checkoutError && <p className="text-xs text-red-500 mt-2 px-1">{checkoutError}</p>}
          </>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-36 animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && scenarios.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <GitCompare className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="font-semibold text-[#1A1A2E] mb-2">No scenarios yet</h3>
            <p className="text-sm text-gray-400 max-w-xs mb-6">
              Create your first scenario to see how a life decision affects your finances over 30 years.
            </p>
            <Link href="/app/scenarios/new">
              <button className="flex items-center gap-2 bg-[#FACC15] hover:bg-yellow-300 text-[#1A1A2E] px-5 py-2.5 rounded-2xl font-bold text-sm transition-colors">
                <Plus className="w-4 h-4" /> Create first scenario
              </button>
            </Link>
          </div>
        )}

        {/* Scenario grid */}
        {!isLoading && scenarios.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {scenarios.map(s => {
              const meta = TYPE_META[s.type] ?? TYPE_META.custom
              const Icon = meta.icon
              return (
                <div key={s.id} className="group bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:border-[#FACC15]/30 hover:shadow-md transition-all flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full", meta.color)}>
                      <Icon className="w-3.5 h-3.5" />
                      {meta.label}
                    </span>
                    <button
                      onClick={() => { if (confirm("Delete this scenario?")) deleteMutation.mutate(s.id) }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="font-semibold text-[#1A1A2E] mb-1 line-clamp-2">{s.name}</h3>
                  <p className="text-xs text-gray-400 mb-4">{formatDate(s.createdAt)}</p>
                  <div className="mt-auto">
                    <Link href={`/app/scenarios/${s.id}`}>
                      <button className="w-full flex items-center justify-center gap-2 border border-gray-200 hover:border-[#FACC15] hover:text-[#FACC15] text-gray-600 py-2 rounded-xl text-sm font-medium transition-colors">
                        View analysis <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </Link>
                  </div>
                </div>
              )
            })}

            {/* Add new card */}
            {!atLimit && (
              <Link href="/app/scenarios/new">
                <div className="flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#FACC15]/40 hover:bg-[#FACC15]/5 p-5 h-full min-h-36 cursor-pointer transition-all group">
                  <Plus className="w-8 h-8 text-gray-300 group-hover:text-[#FACC15] transition-colors" />
                  <span className="text-sm text-gray-400 group-hover:text-[#FACC15] font-medium transition-colors">New scenario</span>
                </div>
              </Link>
            )}
          </div>
        )}

        {/* Advisor nudge */}
        {scenarios.length > 0 && (
          <div className="bg-[#1A1A2E] rounded-2xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FACC15]/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-[#FACC15]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Want a second opinion?</p>
                <p className="text-xs text-white/50">Ask the AI advisor to compare your scenarios or dig into the numbers.</p>
              </div>
            </div>
            <Link href="/app/advisor">
              <button className="shrink-0 text-sm bg-[#FACC15] hover:bg-yellow-300 text-white px-4 py-2 rounded-xl font-medium transition-colors">
                Ask AI
              </button>
            </Link>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

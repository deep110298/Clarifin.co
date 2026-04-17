import { useState } from "react"
import { useLocation } from "wouter"
import { X, GitCompare, TrendingUp, MessageSquare, BarChart3, ChevronRight, ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"

const STEPS = [
  {
    icon: "👋",
    title: "Welcome to Clarifin",
    subtitle: "Your personal financial simulator",
    body: "Clarifin helps you make smarter life decisions by showing you the real financial impact before you commit. Whether you're thinking about a new job, buying a home, going back to school, or starting a family — we run the numbers so you don't have to guess.",
    cta: null,
  },
  {
    icon: <GitCompare className="w-8 h-8 text-[#FACC15]" />,
    title: "Build scenarios",
    subtitle: "Model any life decision in minutes",
    body: "Pick a scenario type — job change, buy a home, new child, time off, and more. Fill in a few numbers and instantly see how the decision affects your monthly take-home, savings, and net worth over 30 years.",
    cta: null,
  },
  {
    icon: <TrendingUp className="w-8 h-8 text-[#FACC15]" />,
    title: "See the real impact",
    subtitle: "Retirement age, net worth, monthly surplus",
    body: "Every scenario shows you your estimated retirement age, a 30-year net worth projection, and exactly how much more (or less) you'll have each month. We use real tax math, cost-of-living adjustments, and the Rule of 25 for retirement targets.",
    cta: null,
  },
  {
    icon: <BarChart3 className="w-8 h-8 text-[#FACC15]" />,
    title: "Compare side by side",
    subtitle: "Which path is actually better?",
    body: "Once you've built multiple scenarios, compare them on one screen. See which path builds wealth faster, retires you earlier, or costs you less over 20 years. Great for big decisions where both options seem reasonable.",
    cta: null,
  },
  {
    icon: <MessageSquare className="w-8 h-8 text-[#FACC15]" />,
    title: "Ask the AI Advisor",
    subtitle: "Get a second opinion on your numbers",
    body: "Not sure how to interpret the results? Ask the AI Advisor. It knows your financial profile and all your scenarios — just ask it anything like \"Which scenario helps me retire earliest?\" or \"Is this job change worth the relocation cost?\"",
    cta: null,
  },
]

const STORAGE_KEY = "clarifin_onboarding_complete"

export function useOnboarding() {
  const hasSeenOnboarding = typeof window !== "undefined"
    ? localStorage.getItem(STORAGE_KEY) === "true"
    : true
  return !hasSeenOnboarding
}

export function markOnboardingComplete() {
  localStorage.setItem(STORAGE_KEY, "true")
}

export function OnboardingTour({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0)
  const [, navigate] = useLocation()

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  const handleFinish = () => {
    markOnboardingComplete()
    onClose()
    navigate("/app/scenarios/new")
  }

  const handleSkip = () => {
    markOnboardingComplete()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Progress bar */}
        <div className="flex gap-1 p-4 pb-0">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-all duration-300",
                i <= step ? "bg-[#FACC15]" : "bg-gray-100"
              )}
            />
          ))}
        </div>

        {/* Close */}
        <div className="flex justify-end px-4 pt-3">
          <button onClick={handleSkip} className="text-gray-300 hover:text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-8 pb-8 text-center">
          {/* Icon */}
          <div className="flex items-center justify-center mb-5">
            {typeof current.icon === "string" ? (
              <div className="w-16 h-16 bg-[#FFF9E6] rounded-2xl flex items-center justify-center text-3xl">
                {current.icon}
              </div>
            ) : (
              <div className="w-16 h-16 bg-[#FFF9E6] rounded-2xl flex items-center justify-center">
                {current.icon}
              </div>
            )}
          </div>

          <p className="text-xs font-semibold text-[#FACC15] uppercase tracking-widest mb-1">{current.subtitle}</p>
          <h2 className="text-2xl font-bold text-[#1A1A2E] mb-3">{current.title}</h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-8">{current.body}</p>

          {/* Actions */}
          {isLast ? (
            <button
              onClick={handleFinish}
              className="w-full bg-[#FACC15] hover:bg-yellow-300 text-[#1A1A2E] font-bold py-3.5 rounded-2xl transition-colors text-sm"
            >
              Build my first scenario →
            </button>
          ) : (
            <div className="flex gap-3">
              {step > 0 && (
                <button
                  onClick={() => setStep(s => s - 1)}
                  className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 px-4 py-3 rounded-2xl transition-colors border border-gray-100"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              )}
              <button
                onClick={() => setStep(s => s + 1)}
                className="flex-1 flex items-center justify-center gap-1.5 bg-[#1A1A2E] hover:bg-[#1a2e40] text-white font-semibold py-3 rounded-2xl transition-colors text-sm"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <button onClick={handleSkip} className="mt-4 text-xs text-gray-300 hover:text-gray-500 transition-colors">
            Skip tour
          </button>
        </div>
      </div>
    </div>
  )
}

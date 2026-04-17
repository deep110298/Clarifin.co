import { useState } from "react"
import { useLocation } from "wouter"
import { useQuery } from "@tanstack/react-query"
import { Link } from "wouter"
import { customFetch } from "@workspace/api-client-react"
import { AppLayout } from "@/components/app/AppLayout"
import { useStore } from "@/lib/store"
import { supabase, useAppUser } from "@/lib/supabase"
import { Mail, Lock, Trash2, GitCompare, AlertTriangle, ArrowRight, CheckCircle, Pencil, X } from "lucide-react"

interface Scenario {
  id: string
  name: string
  type: string
  createdAt: string
}

const TYPE_LABELS: Record<string, string> = {
  "job-change": "Job Change",
  "buy-home": "Buy a Home",
  "school": "Back to School",
  "child": "New Child",
  "time-off": "Time Off",
  "custom": "Custom",
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

type EmailStep = "idle" | "entering" | "sent" | "done"

export default function AccountPage() {
  const { email: currentEmail, signOut } = useAppUser()
  const { resetStore } = useStore()
  const [, navigate] = useLocation()

  // Email change state
  const [emailStep, setEmailStep] = useState<EmailStep>("idle")
  const [newEmail, setNewEmail] = useState("")
  const [emailError, setEmailError] = useState<string | null>(null)
  const [emailLoading, setEmailLoading] = useState(false)

  // Password state
  const [passwordSent, setPasswordSent] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteInput, setDeleteInput] = useState("")
  const [deleting, setDeleting] = useState(false)

  const { data: scenarios = [], isLoading } = useQuery({
    queryKey: ["scenarios"],
    queryFn: () => customFetch<Scenario[]>("/api/scenarios"),
  })

  const handleSendEmailChange = async () => {
    if (!newEmail.trim() || !newEmail.includes("@")) {
      setEmailError("Enter a valid email address.")
      return
    }
    if (newEmail.trim().toLowerCase() === currentEmail?.toLowerCase()) {
      setEmailError("That's already your current email.")
      return
    }
    setEmailError(null)
    setEmailLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail.trim() })
      if (error) throw error
      setEmailStep("sent")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Try again."
      setEmailError(msg)
    } finally {
      setEmailLoading(false)
    }
  }

  const handleCancelEmailChange = () => {
    setEmailStep("idle")
    setNewEmail("")
    setEmailError(null)
  }

  const handlePasswordReset = async () => {
    if (!currentEmail) return
    setPasswordLoading(true)
    try {
      await supabase.auth.resetPasswordForEmail(currentEmail, {
        redirectTo: `${window.location.origin}/app/account`,
      })
      setPasswordSent(true)
    } catch {
      setPasswordSent(true)
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteInput !== "DELETE") return
    setDeleting(true)
    try {
      await customFetch("/api/me", { method: "DELETE" })
      resetStore()
      await signOut()
      navigate("/")
    } catch {
      setDeleting(false)
    }
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Account Details</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your login info and account data.</p>
        </div>

        {/* Email */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Mail className="w-4 h-4 text-blue-500" />
            </div>
            <h2 className="font-semibold text-[#1A1A2E]">Email</h2>
          </div>

          {emailStep === "idle" && (
            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 mb-3">
              <p className="text-sm text-gray-700">{currentEmail}</p>
              <button
                onClick={() => setEmailStep("entering")}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#1A1A2E] hover:text-[#FACC15] transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" /> Change
              </button>
            </div>
          )}

          {emailStep === "entering" && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">Enter your new email. We'll send a confirmation link to verify it.</p>
              <input
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                placeholder="New email address"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FACC15]/30 focus:border-[#FACC15]"
                onKeyDown={e => e.key === "Enter" && handleSendEmailChange()}
              />
              {emailError && <p className="text-xs text-red-500">{emailError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleSendEmailChange}
                  disabled={emailLoading}
                  className="text-sm font-semibold bg-[#FACC15] hover:bg-yellow-300 text-[#1A1A2E] px-4 py-2 rounded-xl transition-colors disabled:opacity-60"
                >
                  {emailLoading ? "Sending..." : "Send confirmation link"}
                </button>
                <button onClick={handleCancelEmailChange} className="text-sm text-gray-400 hover:text-gray-600 px-3 py-2 rounded-xl transition-colors flex items-center gap-1">
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
              </div>
            </div>
          )}

          {emailStep === "sent" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 bg-blue-50 rounded-xl px-4 py-3">
                <CheckCircle className="w-4 h-4 text-blue-500 shrink-0" />
                <p className="text-sm text-blue-700">
                  Confirmation link sent to <strong>{newEmail}</strong>. Click the link in that email to confirm your new address.
                </p>
              </div>
              <button onClick={handleCancelEmailChange} className="text-xs text-gray-400 hover:text-gray-600 underline">
                Back
              </button>
            </div>
          )}
        </div>

        {/* Password */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
              <Lock className="w-4 h-4 text-purple-500" />
            </div>
            <h2 className="font-semibold text-[#1A1A2E]">Password</h2>
          </div>
          {passwordSent ? (
            <div className="flex items-center gap-2 bg-green-50 rounded-xl px-4 py-3">
              <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
              <p className="text-sm text-green-700">Reset link sent to <strong>{currentEmail}</strong>. Check your inbox.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-3">We'll send a password reset link to your current email.</p>
              <button
                onClick={handlePasswordReset}
                disabled={passwordLoading}
                className="text-sm font-semibold text-[#1A1A2E] bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl transition-colors disabled:opacity-60"
              >
                {passwordLoading ? "Sending..." : "Send reset link"}
              </button>
            </>
          )}
        </div>

        {/* Scenario history */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center">
              <GitCompare className="w-4 h-4 text-[#FACC15]" />
            </div>
            <h2 className="font-semibold text-[#1A1A2E]">Scenario History</h2>
          </div>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-10 rounded-xl bg-gray-100 animate-pulse" />)}
            </div>
          ) : scenarios.length === 0 ? (
            <p className="text-sm text-gray-400">No scenarios yet.</p>
          ) : (
            <div className="space-y-1">
              {scenarios.map(s => (
                <Link key={s.id} href={`/app/scenarios/${s.id}`}>
                  <div className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group">
                    <div>
                      <p className="text-sm font-medium text-[#1A1A2E]">{s.name}</p>
                      <p className="text-xs text-gray-400">{TYPE_LABELS[s.type] ?? "Custom"} · {formatDate(s.createdAt)}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#FACC15] transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Danger zone */}
        <div className="bg-white rounded-2xl border border-red-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <Trash2 className="w-4 h-4 text-red-500" />
            </div>
            <h2 className="font-semibold text-red-600">Delete Account</h2>
          </div>
          {!showDeleteConfirm ? (
            <>
              <p className="text-sm text-gray-500 mb-3">Permanently delete your account and all your scenarios. This cannot be undone.</p>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="text-sm font-semibold text-red-500 border border-red-200 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors"
              >
                Delete my account
              </button>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-2 bg-red-50 rounded-xl p-3">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">This will permanently delete your account, all scenarios, and cancel any active subscription. Type <strong>DELETE</strong> to confirm.</p>
              </div>
              <input
                type="text"
                value={deleteInput}
                onChange={e => setDeleteInput(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="w-full border border-red-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteInput !== "DELETE" || deleting}
                  className="text-sm font-semibold bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl transition-colors disabled:opacity-40"
                >
                  {deleting ? "Deleting..." : "Confirm delete"}
                </button>
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeleteInput("") }}
                  className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

import { Switch, Route, Router as WouterRouter } from "wouter"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip"
import { StoreProvider } from "@/lib/store"
import { useEffect } from "react"
import { useLocation } from "wouter"
import { SupabaseAuthProvider, useSupabaseAuth } from "@/lib/supabase"
import NotFound from "@/pages/not-found"
import LandingPage from "@/pages/landing"
import DashboardPage from "@/pages/dashboard"
import ScenarioBuilderPage from "@/pages/scenario-builder"
import ScenarioDetailPage from "@/pages/scenario-detail"
import ScenarioComparePage from "@/pages/scenario-compare"
import ScenariosListPage from "@/pages/scenarios-list"
import AdvisorPage from "@/pages/advisor"
import ProfileSetupPage from "@/pages/profile-setup"
import SignInPage from "@/pages/sign-in"
import SignUpPage from "@/pages/sign-up"
import SharedScenarioPage from "@/pages/shared-scenario"
import AccountPage from "@/pages/account"

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
})

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useSupabaseAuth()
  const [, navigate] = useLocation()

  useEffect(() => {
    if (!loading && !session) navigate("/sign-in")
  }, [loading, session])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#FACC15] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (!session) return null
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/sign-in" component={SignInPage} />
      <Route path="/sign-up" component={SignUpPage} />
      <Route path="/shared/:token" component={SharedScenarioPage} />

      <Route path="/app/dashboard">
        <ProtectedRoute><DashboardPage /></ProtectedRoute>
      </Route>
      <Route path="/app/profile">
        <ProtectedRoute><ProfileSetupPage /></ProtectedRoute>
      </Route>
      <Route path="/app/account">
        <ProtectedRoute><AccountPage /></ProtectedRoute>
      </Route>
      <Route path="/app/scenarios/new">
        <ProtectedRoute><ScenarioBuilderPage /></ProtectedRoute>
      </Route>
      <Route path="/app/scenarios/compare">
        <ProtectedRoute><ScenarioComparePage /></ProtectedRoute>
      </Route>
      <Route path="/app/scenarios/:id">
        <ProtectedRoute><ScenarioDetailPage /></ProtectedRoute>
      </Route>
      <Route path="/app/scenarios">
        <ProtectedRoute><ScenariosListPage /></ProtectedRoute>
      </Route>
      <Route path="/app/advisor">
        <ProtectedRoute><AdvisorPage /></ProtectedRoute>
      </Route>
      <Route path="/app">
        <ProtectedRoute><DashboardPage /></ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  )
}

function App() {
  return (
    <SupabaseAuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <StoreProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <AppRoutes />
            </WouterRouter>
            <Toaster />
          </StoreProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </SupabaseAuthProvider>
  )
}

export default App

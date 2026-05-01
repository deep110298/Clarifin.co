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
import SignInPage from "@/pages/sign-in"
import OnboardingPage from "@/pages/onboarding"
import ProductPage from "@/pages/product"
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
      <div style={{ minHeight: "100vh", background: "#eeeeec", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, letterSpacing: "0.22em", color: "rgba(10,10,9,0.55)" }}>
          ONE MOMENT…
        </div>
      </div>
    )
  }
  if (!session) return null
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={LandingPage} />
      <Route path="/sign-in" component={SignInPage} />
      <Route path="/sign-up" component={SignInPage} />

      {/* Protected routes */}
      <Route path="/app/onboarding">
        <ProtectedRoute><OnboardingPage /></ProtectedRoute>
      </Route>
      <Route path="/app/account">
        <ProtectedRoute><AccountPage /></ProtectedRoute>
      </Route>
      <Route path="/app">
        <ProtectedRoute><ProductPage /></ProtectedRoute>
      </Route>
      <Route path="/app/*">
        <ProtectedRoute><ProductPage /></ProtectedRoute>
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

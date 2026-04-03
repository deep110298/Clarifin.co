import { Switch, Route, Router as WouterRouter } from "wouter"
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn, useAuth } from "@clerk/clerk-react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip"
import { StoreProvider } from "@/lib/store"
import { useEffect } from "react"
import NotFound from "@/pages/not-found"
import LandingPage from "@/pages/landing"
import DashboardPage from "@/pages/dashboard"
import ScenarioBuilderPage from "@/pages/scenario-builder"
import ScenarioDetailPage from "@/pages/scenario-detail"
import ScenariosListPage from "@/pages/scenarios-list"
import AdvisorPage from "@/pages/advisor"
import ProfileSetupPage from "@/pages/profile-setup"
import SignInPage from "@/pages/sign-in"
import SignUpPage from "@/pages/sign-up"

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
})

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined

// Bridges Clerk's getToken to the customFetch auth getter in main.tsx
function ClerkTokenBridge() {
  const { getToken } = useAuth()
  useEffect(() => {
    ;(window as Window & { __clerkGetToken?: () => Promise<string | null> }).__clerkGetToken = () => getToken()
    return () => {
      delete (window as Window & { __clerkGetToken?: () => Promise<string | null> }).__clerkGetToken
    }
  }, [getToken])
  return null
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut><RedirectToSignIn /></SignedOut>
    </>
  )
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/sign-in" component={SignInPage} />
      <Route path="/sign-up" component={SignUpPage} />

      <Route path="/app/dashboard">
        <ProtectedRoute><DashboardPage /></ProtectedRoute>
      </Route>
      <Route path="/app/profile">
        <ProtectedRoute><ProfileSetupPage /></ProtectedRoute>
      </Route>
      <Route path="/app/scenarios/new">
        <ProtectedRoute><ScenarioBuilderPage /></ProtectedRoute>
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
    <ClerkProvider publishableKey={PUBLISHABLE_KEY ?? "pk_test_placeholder"}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <StoreProvider>
            <ClerkTokenBridge />
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <AppRoutes />
            </WouterRouter>
            <Toaster />
          </StoreProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  )
}

export default App

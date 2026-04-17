import { createClient, type Session, type User } from "@supabase/supabase-js"
import { createContext, useContext, useEffect, useState } from "react"

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string
)

interface AuthContextValue {
  session: Session | null
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
})

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useSupabaseAuth() {
  return useContext(AuthContext)
}

// Thin wrapper matching what components previously got from useUser/useClerk
export function useAppUser() {
  const { user, signOut } = useSupabaseAuth()
  const fullName = user?.user_metadata?.full_name as string | undefined
  const firstName = fullName?.split(" ")[0] ?? user?.email?.split("@")[0] ?? null
  const lastName = fullName?.split(" ").slice(1).join(" ") ?? null
  return {
    firstName,
    lastName,
    displayName: fullName ?? firstName ?? "Account",
    email: user?.email ?? null,
    imageUrl: (user?.user_metadata?.avatar_url as string | undefined) ?? null,
    signOut,
  }
}

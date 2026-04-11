import { SignUp } from "@clerk/clerk-react"
import { Sparkles } from "lucide-react"

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-[#1D9E75] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-[#0D1B2A]">Clarifin</span>
        </div>
        <p className="text-gray-500 text-sm">Create your free account</p>
      </div>
      <SignUp
        signInUrl="/sign-in"
        afterSignUpUrl="/app/profile"
        appearance={{
          variables: {
            colorPrimary: "#1D9E75",
            colorBackground: "#ffffff",
            fontFamily: "Plus Jakarta Sans, sans-serif",
            borderRadius: "0.75rem",
          },
        }}
      />
    </div>
  )
}

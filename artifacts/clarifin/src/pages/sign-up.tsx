import { SignUp } from "@clerk/clerk-react"
import logoImg from "@/assets/logo.png"

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 mb-2">
          <img src={logoImg} alt="Clarifin" className="w-9 h-9 rounded-lg object-cover" />
          <span className="text-2xl font-bold text-[#0D1B2A]">Clarifin</span>
        </div>
        <p className="text-gray-500 text-sm">Create your free account</p>
      </div>
      <SignUp
        signInUrl="/sign-in"
        afterSignUpUrl="/app/profile"
        appearance={{
          variables: {
            colorPrimary: "#1A1A2E",
            colorBackground: "#ffffff",
            fontFamily: "Plus Jakarta Sans, sans-serif",
            borderRadius: "0.75rem",
          },
        }}
      />
    </div>
  )
}

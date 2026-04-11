import { useUser } from "@clerk/clerk-react"
import { cn } from "@/lib/utils"

interface UserAvatarProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

const SIZE = {
  sm: "w-7 h-7 text-xs",
  md: "w-9 h-9 text-sm",
  lg: "w-16 h-16 text-xl",
}

export function UserAvatar({ size = "md", className }: UserAvatarProps) {
  const { user } = useUser()
  const initials =
    user?.firstName?.[0] ??
    user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() ??
    "U"

  if (user?.imageUrl) {
    return (
      <img
        src={user.imageUrl}
        alt={user.firstName ?? "Profile"}
        className={cn("rounded-full object-cover shrink-0", SIZE[size], className)}
      />
    )
  }

  return (
    <div className={cn(
      "rounded-full bg-[#FACC15] flex items-center justify-center text-[#1A1A2E] font-bold shrink-0",
      SIZE[size],
      className
    )}>
      {initials}
    </div>
  )
}

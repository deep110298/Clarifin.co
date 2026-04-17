import { useAppUser } from "@/lib/supabase"
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
  const { firstName, email, imageUrl } = useAppUser()
  const initial = firstName?.[0]?.toUpperCase() ?? email?.[0]?.toUpperCase() ?? "U"

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={firstName ?? "Profile"}
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
      {initial}
    </div>
  )
}

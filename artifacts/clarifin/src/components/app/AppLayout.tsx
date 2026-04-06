import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, GitCompare, MessageSquare, User,
  LogOut,
} from "lucide-react";
import logoImg from "@/assets/logo.png";
import { useUser, useClerk } from "@clerk/clerk-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/scenarios", label: "Scenarios", icon: GitCompare },
  { href: "/app/advisor", label: "AI Advisor", icon: MessageSquare },
  { href: "/app/profile", label: "My Profile", icon: User },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();

  const initials = user?.firstName?.[0] ?? user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() ?? "U";
  const displayName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.firstName ?? user?.emailAddresses?.[0]?.emailAddress ?? "Account";
  const pageLabel = NAV.find((n) => location === n.href || location.startsWith(n.href + "/"))?.label ?? "";

  return (
    <div className="flex min-h-screen bg-[#EEF4EF]">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-100 shrink-0">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-gray-100">
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer">
              <img src={logoImg} alt="Clarifin" className="w-8 h-8 object-contain" />
              <span className="text-lg font-semibold text-[#1A2C20] tracking-tight">Clarifin</span>
            </div>
          </Link>
        </div>

        {/* User profile */}
        <div className="px-6 py-5 border-b border-gray-100 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-[#E8F5EE] flex items-center justify-center text-[#4D8F6A] font-semibold text-sm mb-2">
            {initials}
          </div>
          <div className="text-sm font-semibold text-[#1A2C20]">{displayName}</div>
          <div className="text-xs text-[#9BAA9E] mt-0.5">Member</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = location === href || location.startsWith(href + "/");
            return (
              <Link key={href} href={href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-colors",
                    active
                      ? "bg-[#E8F5EE] text-[#4D8F6A]"
                      : "text-[#6B7A72] hover:bg-[#F4FAF6] hover:text-[#1A2C20]"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                  <span>{label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={() => signOut({ redirectUrl: "/" })}
            className="flex items-center gap-2 px-4 py-2 w-full text-sm text-[#9BAA9E] hover:text-[#6B7A72] transition-colors"
          >
            <LogOut className="w-4 h-4" strokeWidth={1.5} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
          {/* Mobile logo */}
          <Link href="/">
            <div className="lg:hidden flex items-center gap-2 cursor-pointer">
              <img src={logoImg} alt="Clarifin" className="w-7 h-7 object-contain" />
              <span className="font-semibold text-[#1A2C20]">Clarifin</span>
            </div>
          </Link>
          {/* Page title — desktop */}
          <div className="hidden lg:block text-base font-semibold text-[#1A2C20]">
            {pageLabel}
          </div>
          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link href="/app/scenarios/new">
              <button className="flex items-center gap-1.5 bg-[#4D8F6A] hover:bg-[#3D7A5A] text-white text-sm font-medium px-4 py-2 rounded-full transition-colors">
                + New Scenario
              </button>
            </Link>
            <div className="w-8 h-8 rounded-full bg-[#E8F5EE] flex items-center justify-center text-[#4D8F6A] text-xs font-semibold">
              {initials}
            </div>
          </div>
        </header>

        {/* Mobile nav */}
        <nav className="lg:hidden flex bg-white border-b border-gray-100 px-2">
          {NAV.slice(0, 4).map(({ href, label, icon: Icon }) => {
            const active = location === href || location.startsWith(href + "/");
            return (
              <Link key={href} href={href}>
                <div
                  className={cn(
                    "flex flex-col items-center gap-1 px-3 py-3 text-xs font-medium cursor-pointer border-b-2 transition-colors",
                    active
                      ? "border-[#4D8F6A] text-[#4D8F6A]"
                      : "border-transparent text-[#9BAA9E] hover:text-[#6B7A72]"
                  )}
                >
                  <Icon className="w-4 h-4" strokeWidth={1.5} />
                  {label}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}

import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, GitCompare, MessageSquare, User,
  ChevronRight, Sparkles, LogOut,
} from "lucide-react";
import { useUser, useClerk } from "@clerk/clerk-react";
import { customFetch } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/scenarios", label: "Scenarios", icon: GitCompare },
  { href: "/app/advisor", label: "AI Advisor", icon: MessageSquare, badge: "AI" },
  { href: "/app/profile", label: "My Profile", icon: User },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();

  const initials = user?.firstName?.[0] ?? user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() ?? "U";

  const handleUpgrade = () => {
    customFetch<{ url: string }>("/api/billing/checkout", { method: "POST", body: JSON.stringify({ plan: "plus" }) })
      .then(r => { window.location.href = r.url })
      .catch(console.error);
  };

  return (
    <div className="flex min-h-screen bg-[#F4F6F8]">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-[#0D1B2A] text-white shrink-0">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-white/10">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-7 h-7 rounded-md bg-[#1D9E75] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-semibold tracking-tight">Clarifin</span>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ href, label, icon: Icon, badge }) => {
            const active = location === href || location.startsWith(href + "/");
            return (
              <Link key={href} href={href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-colors",
                    active
                      ? "bg-[#1D9E75]/20 text-[#1D9E75]"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1">{label}</span>
                  {badge && (
                    <span className="text-[10px] font-semibold bg-[#1D9E75]/30 text-[#1D9E75] px-1.5 py-0.5 rounded">
                      {badge}
                    </span>
                  )}
                  {active && <ChevronRight className="w-3 h-3 opacity-60" />}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom CTA */}
        <div className="p-4 border-t border-white/10 space-y-3">
          <div className="rounded-lg bg-[#1D9E75]/10 border border-[#1D9E75]/20 p-3">
            <p className="text-xs text-white/60 mb-1">Free plan</p>
            <p className="text-xs text-white/80 font-medium mb-2">Upgrade to run unlimited scenarios</p>
            <button onClick={handleUpgrade} className="w-full text-xs bg-[#1D9E75] hover:bg-[#178f68] text-white py-1.5 rounded-md font-medium transition-colors">
              Upgrade to Plus
            </button>
          </div>
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#1D9E75]/20 flex items-center justify-center text-xs font-bold text-[#1D9E75]">
                {initials}
              </div>
              <span className="text-xs text-white/60 truncate max-w-[100px]">
                {user?.firstName ?? user?.emailAddresses?.[0]?.emailAddress ?? "Account"}
              </span>
            </div>
            <button onClick={() => signOut({ redirectUrl: "/" })} className="p-1.5 text-white/30 hover:text-white/70 transition-colors" title="Sign out">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="bg-[#0D1B2A] text-white px-6 py-4 flex items-center justify-between shrink-0">
          {/* Mobile logo */}
          <Link href="/">
            <div className="lg:hidden flex items-center gap-2 cursor-pointer">
              <div className="w-6 h-6 rounded bg-[#1D9E75] flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-semibold">Clarifin</span>
            </div>
          </Link>
          {/* Page breadcrumb — desktop */}
          <div className="hidden lg:block text-sm text-white/50">
            {NAV.find((n) => location === n.href || location.startsWith(n.href + "/"))?.label ?? ""}
          </div>
          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link href="/app/scenarios/new">
              <button className="hidden sm:flex items-center gap-1.5 text-sm bg-[#1D9E75] hover:bg-[#178f68] text-white px-3 py-1.5 rounded-lg font-medium transition-colors">
                <GitCompare className="w-3.5 h-3.5" />
                New scenario
              </button>
            </Link>
            <div className="w-8 h-8 rounded-full bg-[#1D9E75]/20 border border-[#1D9E75]/30 flex items-center justify-center text-sm font-semibold text-[#1D9E75]">
              {initials}
            </div>
          </div>
        </header>

        {/* Mobile nav */}
        <nav className="lg:hidden flex bg-white border-b border-gray-200 px-2">
          {NAV.slice(0, 4).map(({ href, label, icon: Icon }) => {
            const active = location === href || location.startsWith(href + "/");
            return (
              <Link key={href} href={href}>
                <div
                  className={cn(
                    "flex flex-col items-center gap-1 px-3 py-3 text-xs font-medium cursor-pointer border-b-2 transition-colors",
                    active
                      ? "border-[#1D9E75] text-[#1D9E75]"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}

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
  { href: "/app/advisor", label: "AI Advisor", icon: MessageSquare, badge: "AI" },
  { href: "/app/profile", label: "My Profile", icon: User },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();

  const initials = user?.firstName?.[0] ?? user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() ?? "U";

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-[#0F172A] text-white shrink-0">
        {/* Logo */}
        <div className="px-6 py-7 border-b border-white/10">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <img src={logoImg} alt="Clarifin" className="w-8 h-8 object-contain invert" />
              <span className="text-lg font-semibold tracking-tight">Clarifin</span>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-5 space-y-0.5">
          {NAV.map(({ href, label, icon: Icon, badge }) => {
            const active = location === href || location.startsWith(href + "/");
            return (
              <Link key={href} href={href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 text-sm font-medium cursor-pointer transition-colors",
                    active
                      ? "text-white bg-white/10"
                      : "text-white/50 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                  <span className="flex-1">{label}</span>
                  {badge && (
                    <span className="text-[10px] font-semibold bg-white/10 text-white/60 px-1.5 py-0.5">
                      {badge}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom user row */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 flex items-center justify-center bg-white/10 text-xs font-semibold text-white">
                {initials}
              </div>
              <span className="text-xs text-white/50 truncate max-w-[100px]">
                {user?.firstName ?? user?.emailAddresses?.[0]?.emailAddress ?? "Account"}
              </span>
            </div>
            <button
              onClick={() => signOut({ redirectUrl: "/" })}
              className="p-1.5 text-white/30 hover:text-white/70 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="bg-[#0F172A] text-white px-6 py-4 flex items-center justify-between shrink-0 border-b border-white/10">
          {/* Mobile logo */}
          <Link href="/">
            <div className="lg:hidden flex items-center gap-2 cursor-pointer">
              <img src={logoImg} alt="Clarifin" className="w-7 h-7 object-contain invert" />
              <span className="font-semibold">Clarifin</span>
            </div>
          </Link>
          {/* Page label — desktop */}
          <div className="hidden lg:block text-xs uppercase tracking-widest text-white/30 font-medium">
            {NAV.find((n) => location === n.href || location.startsWith(n.href + "/"))?.label ?? ""}
          </div>
          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link href="/app/scenarios/new">
              <button className="hidden sm:flex items-center gap-1.5 text-xs bg-white text-[#0F172A] hover:bg-white/90 px-3 py-1.5 font-medium transition-colors">
                + New scenario
              </button>
            </Link>
            <div className="w-7 h-7 flex items-center justify-center bg-white/10 text-xs font-semibold text-white">
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
                      ? "border-[#0F172A] text-[#0F172A]"
                      : "border-transparent text-[#94A3B8] hover:text-[#475569]"
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

import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, GitCompare, MessageSquare, User,
  LogOut, Settings, Zap, ChevronDown, UserCircle,
} from "lucide-react";
import logoImg from "@/assets/logo.png";
import { useUser, useClerk } from "@clerk/clerk-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "./UserAvatar";
import { customFetch } from "@workspace/api-client-react";
import { useState, useEffect, useRef } from "react";
import { useStore } from "@/lib/store";

const NAV = [
  { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/scenarios", label: "Scenarios", icon: GitCompare },
  { href: "/app/advisor", label: "AI Advisor", icon: MessageSquare },
  { href: "/app/profile", label: "My Profile", icon: User },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { profile, resetStore } = useStore();
  const [upgrading, setUpgrading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    // Use setTimeout so this listener doesn't fire on the same click that opened the dropdown
    const timer = setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [dropdownOpen]);

  // Redirect to profile setup if profile isn't complete yet (skip for profile page itself)
  useEffect(() => {
    if (!profile.isComplete && location !== "/app/profile") {
      navigate("/app/profile");
    }
  }, [profile.isComplete, location]);

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const { url } = await customFetch<{ url: string }>("/api/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ plan: "plus" }),
      });
      window.location.href = url;
    } catch {
      setUpgrading(false);
    }
  };

  const displayName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.firstName ?? user?.emailAddresses?.[0]?.emailAddress ?? "Account";
  const pageLabel = NAV.find((n) => location === n.href || location.startsWith(n.href + "/"))?.label ?? "";

  return (
    <div className="flex min-h-screen bg-[#F8F9FC]">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-100 shrink-0">
        {/* Logo */}
        <div className="px-6 py-6">
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer">
              <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
                <img src={logoImg} alt="Clarifin" className="w-full h-full object-cover" />
              </div>
              <span className="text-lg font-bold text-[#1A1A2E] tracking-tight">Clarifin</span>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = location === href || location.startsWith(href + "/");
            return (
              <Link key={href} href={href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium cursor-pointer transition-all",
                    active
                      ? "bg-[#FACC15] text-[#1A1A2E] shadow-sm"
                      : "text-[#9CA3AF] hover:bg-gray-50 hover:text-[#1A1A2E]"
                  )}
                >
                  <Icon className="w-4.5 h-4.5 shrink-0" strokeWidth={active ? 2.5 : 1.8} style={{ width: 18, height: 18 }} />
                  <span>{label}</span>
                </div>
              </Link>
            );
          })}
          <button
            onClick={() => navigate("/app/profile")}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium cursor-pointer transition-all mt-4",
              location === "/app/profile"
                ? "bg-[#FACC15] text-[#1A1A2E] shadow-sm"
                : "text-[#9CA3AF] hover:bg-gray-50 hover:text-[#1A1A2E]"
            )}
          >
            <Settings style={{ width: 18, height: 18 }} strokeWidth={location === "/app/profile" ? 2.5 : 1.8} />
            <span>Settings</span>
          </button>
        </nav>

        {/* Upgrade CTA */}
        <div className="mx-4 mb-4 rounded-2xl bg-[#1A1A2E] p-4 text-white">
          <div className="w-8 h-8 rounded-lg bg-[#FACC15] flex items-center justify-center mb-3">
            <Zap className="w-4 h-4 text-[#1A1A2E]" strokeWidth={2.5} />
          </div>
          <p className="text-xs text-white/60 mb-1">Want unlimited scenarios?</p>
          <p className="text-sm font-semibold mb-3">Upgrade to Plus</p>
          <button
            onClick={handleUpgrade}
            disabled={upgrading}
            className="w-full bg-[#FACC15] text-[#1A1A2E] text-xs font-bold py-2 rounded-lg hover:bg-yellow-300 transition-colors disabled:opacity-60"
          >
            {upgrading ? "Loading..." : "Upgrade to Plus"}
          </button>
        </div>

        {/* Sign out */}
        <div className="px-4 pb-4">
          <button
            onClick={() => { resetStore(); signOut({ redirectUrl: "/" }); }}
            className="flex items-center gap-2 px-4 py-2.5 w-full text-sm text-[#9CA3AF] hover:text-[#1A1A2E] hover:bg-gray-50 rounded-xl transition-colors"
          >
            <LogOut style={{ width: 16, height: 16 }} strokeWidth={1.8} />
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
              <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0">
                <img src={logoImg} alt="Clarifin" className="w-full h-full object-cover" />
              </div>
              <span className="font-bold text-[#1A1A2E]">Clarifin</span>
            </div>
          </Link>
          {/* Welcome — desktop */}
          <div className="hidden lg:block">
            <p className="text-xs text-[#9CA3AF] font-medium">Welcome Back!</p>
            <p className="text-base font-bold text-[#1A1A2E]">{displayName}</p>
          </div>
          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link href="/app/scenarios/new">
              <button className="hidden sm:flex items-center gap-1.5 bg-[#FACC15] hover:bg-yellow-300 text-[#1A1A2E] text-sm font-bold px-4 py-2 rounded-xl transition-colors">
                + Add new
              </button>
            </Link>

            {/* Profile dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex items-center gap-1.5 focus:outline-none"
              >
                <UserAvatar size="md" className="ring-2 ring-transparent hover:ring-[#FACC15] transition-all" />
                <ChevronDown className={cn("w-3.5 h-3.5 text-gray-400 transition-transform", dropdownOpen && "rotate-180")} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                  {/* User info header */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-[#1A1A2E] truncate">{displayName}</p>
                    <p className="text-xs text-gray-400 truncate">{user?.emailAddresses?.[0]?.emailAddress}</p>
                  </div>

                  {/* Menu items */}
                  <div className="py-1.5">
                    <Link href="/app/account">
                      <button
                        onClick={() => setDropdownOpen(false)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-[#1A1A2E] transition-colors"
                      >
                        <UserCircle className="w-4 h-4 shrink-0" />
                        Account details
                      </button>
                    </Link>
                    <button
                      onClick={() => { resetStore(); signOut({ redirectUrl: "/" }); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4 shrink-0" />
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile nav */}
        <nav className="lg:hidden flex bg-white border-b border-gray-100 px-2">
          {NAV.slice(0, 4).map(({ href, label, icon: Icon }) => {
            const active = location === href || location.startsWith(href + "/");
            return (
              <Link key={href} href={href}>
                <div className={cn(
                  "flex flex-col items-center gap-1 px-3 py-3 text-xs font-medium cursor-pointer border-b-2 transition-colors",
                  active ? "border-[#FACC15] text-[#1A1A2E]" : "border-transparent text-[#9CA3AF]"
                )}>
                  <Icon style={{ width: 16, height: 16 }} strokeWidth={1.8} />
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

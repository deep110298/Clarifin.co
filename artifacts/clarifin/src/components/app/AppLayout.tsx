import { Link, useLocation } from "wouter";
import { LogOut, ChevronDown, Zap } from "lucide-react";
import { useAppUser } from "@/lib/supabase";
import { useState, useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { customFetch } from "@workspace/api-client-react";

const T = {
  paper: "#eeeeec",
  cream: "#dfdfdb",
  panel: "#f4f4f1",
  ink: "#0a0a09",
  ink2: "#33332f",
  line: "rgba(10,10,9,0.12)",
  line2: "rgba(10,10,9,0.26)",
  accent: "#0a0a09",
  mute: "rgba(10,10,9,0.55)",
};

const MONO = "JetBrains Mono, monospace";
const SERIF = "Cormorant Garamond, Georgia, serif";
const BODY = "Geist, Inter, system-ui, sans-serif";

const NAV = [
  { href: "/app/dashboard", label: "OVERVIEW" },
  { href: "/app/scenarios", label: "SCENARIOS" },
  { href: "/app/advisor", label: "AI ADVISOR" },
  { href: "/app/profile", label: "MY PROFILE" },
];

function BrandMark({ size = 20 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      border: "1.5px solid #0a0a09",
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <div style={{ width: size * 0.35, height: size * 0.35, background: "#0a0a09", borderRadius: "50%" }} />
    </div>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const { displayName, email, signOut } = useAppUser();
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
    const timer = setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [dropdownOpen]);

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

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: T.paper, fontFamily: BODY }}>
      {/* Top bar */}
      <header style={{
        height: 60, background: T.panel, borderBottom: `1px solid ${T.line}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 32px", flexShrink: 0, position: "sticky", top: 0, zIndex: 40,
      }}>
        {/* Left: brand */}
        <Link href="/">
          <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", textDecoration: "none" }}>
            <BrandMark size={20} />
            <span style={{ fontFamily: SERIF, fontSize: 18, color: T.ink, lineHeight: 1 }}>Clarifin</span>
            <span style={{ color: T.line2, fontSize: 14, margin: "0 2px" }}>·</span>
            {/* User dropdown trigger */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDropdownOpen((o) => !o); }}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 4, padding: 0,
                }}
              >
                <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 15, color: T.ink2 }}>
                  {displayName || "Account"}
                </span>
                <ChevronDown
                  style={{
                    width: 13, height: 13, color: T.mute,
                    transform: dropdownOpen ? "rotate(180deg)" : "none",
                    transition: "transform 0.2s",
                  }}
                />
              </button>

              {dropdownOpen && (
                <div style={{
                  position: "absolute", left: 0, top: "calc(100% + 8px)",
                  width: 280, background: T.panel, border: `1px solid ${T.line}`,
                  boxShadow: "0 20px 60px rgba(0,0,0,0.25)", zIndex: 50,
                }}>
                  {/* Header */}
                  <div style={{
                    padding: "14px 18px", background: T.cream,
                    borderBottom: `1px solid ${T.line}`,
                  }}>
                    <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.18em", color: T.mute, marginBottom: 6 }}>
                      SIGNED IN AS
                    </div>
                    <div style={{ fontFamily: SERIF, fontSize: 18, color: T.ink, marginBottom: 2 }}>{displayName}</div>
                    <div style={{ fontSize: 12, color: T.ink2, fontFamily: BODY }}>{email}</div>
                  </div>

                  {/* Actions */}
                  <div style={{ padding: "8px 0" }}>
                    <Link href="/app/profile">
                      <button
                        onClick={() => setDropdownOpen(false)}
                        style={{
                          width: "100%", textAlign: "left", padding: "11px 18px",
                          background: "none", border: "none", cursor: "pointer",
                          fontFamily: BODY, fontSize: 13, color: T.ink2,
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = T.cream; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "none"; }}
                      >
                        Account settings
                        <span style={{ fontFamily: MONO, fontSize: 9, color: T.mute }}>→</span>
                      </button>
                    </Link>
                    <button
                      onClick={handleUpgrade}
                      disabled={upgrading}
                      style={{
                        width: "100%", textAlign: "left", padding: "11px 18px",
                        background: "none", border: "none", cursor: "pointer",
                        fontFamily: BODY, fontSize: 13, color: T.ink2,
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = T.cream; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "none"; }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Zap style={{ width: 13, height: 13 }} />
                        {upgrading ? "Loading…" : "Upgrade to Plus"}
                      </span>
                      <span style={{ fontFamily: MONO, fontSize: 9, color: T.mute }}>→</span>
                    </button>
                    <div style={{ margin: "8px 18px", borderTop: `1px solid ${T.line}` }} />
                    <button
                      onClick={() => { resetStore(); signOut().then(() => navigate("/")); }}
                      style={{
                        width: "100%", textAlign: "left", padding: "11px 18px",
                        background: "none", border: "none", cursor: "pointer",
                        fontFamily: BODY, fontSize: 13, color: "#5a3a3a",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#fdf0f0"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "none"; }}
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Link>

        {/* Center: tab nav */}
        <nav style={{ display: "flex", gap: 0 }}>
          {NAV.map(({ href, label }) => {
            const active = location === href || location.startsWith(href + "/");
            return (
              <Link key={href} href={href}>
                <div style={{
                  padding: "0 20px", height: 60, display: "flex", alignItems: "center",
                  fontFamily: MONO, fontSize: 11, letterSpacing: "0.16em",
                  color: active ? T.ink : T.mute, cursor: "pointer",
                  borderBottom: active ? `2px solid ${T.accent}` : "2px solid transparent",
                  transition: "color 0.2s, border-color 0.2s",
                  whiteSpace: "nowrap",
                  boxSizing: "border-box",
                }}
                  onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.color = T.ink2; }}
                  onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.color = T.mute; }}
                >
                  {label}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Right: add new */}
        <Link href="/app/scenarios/new">
          <button style={{
            background: T.ink, color: T.paper, border: "none",
            padding: "10px 20px", fontFamily: MONO, fontSize: 11,
            letterSpacing: "0.16em", cursor: "pointer", borderRadius: 0,
            fontWeight: 500,
          }}>
            + ADD NEW
          </button>
        </Link>
      </header>

      {/* Mobile nav */}
      <nav style={{
        display: "none",
        background: T.panel, borderBottom: `1px solid ${T.line}`, padding: "0 16px",
        overflowX: "auto",
      }} className="mobile-nav">
        {NAV.map(({ href, label }) => {
          const active = location === href || location.startsWith(href + "/");
          return (
            <Link key={href} href={href}>
              <div style={{
                display: "inline-flex", alignItems: "center", height: 44,
                padding: "0 12px", fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em",
                color: active ? T.ink : T.mute, cursor: "pointer",
                borderBottom: active ? `2px solid ${T.accent}` : "2px solid transparent",
                whiteSpace: "nowrap",
              }}>
                {label}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Content */}
      <main style={{ flex: 1, padding: "32px 40px", overflow: "auto" }}>
        {children}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: `1px solid ${T.line}`, padding: "18px 40px",
        background: T.paper, display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 14, height: 14, borderRadius: "50%", border: `1px solid ${T.line2}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 5, height: 5, background: T.ink, borderRadius: "50%" }} />
          </div>
          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.15em", color: T.mute }}>
            © 2026 · CLARIFIN
          </span>
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          {["Terms", "Privacy", "Help", "hello@clarifin.co"].map((item) => (
            <span key={item} style={{
              fontFamily: SERIF, fontStyle: "italic", fontSize: 12.5, color: T.ink2, cursor: "pointer",
            }}>{item}</span>
          ))}
        </div>
      </footer>

      <style>{`
        @media (max-width: 1024px) {
          .mobile-nav { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

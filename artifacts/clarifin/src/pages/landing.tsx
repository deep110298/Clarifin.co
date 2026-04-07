import { ArrowRight, TrendingUp, Home, PiggyBank, BarChart3, Zap, Shield, Target, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoImg from "@/assets/logo.png";

// Mini dashboard mockup shown in hero
function DashboardMockup() {
  return (
    <div className="w-full bg-[#F8F9FC] rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
      {/* Topbar */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-gray-400 font-medium">Welcome Back!</p>
          <p className="text-xs font-bold text-[#1A1A2E]">Alex Johnson</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-[#FACC15] text-[#1A1A2E] text-[10px] font-bold px-2.5 py-1 rounded-lg">+ Add new</div>
          <div className="w-6 h-6 rounded-full bg-[#FACC15] flex items-center justify-center text-[#1A1A2E] text-[9px] font-bold">AJ</div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="hidden sm:flex flex-col w-32 bg-white border-r border-gray-100 py-3 px-2 gap-1">
          {[
            { label: "Dashboard", active: true },
            { label: "Scenarios", active: false },
            { label: "AI Advisor", active: false },
            { label: "My Profile", active: false },
          ].map((item) => (
            <div
              key={item.label}
              className={`px-2 py-1.5 rounded-lg text-[9px] font-medium ${
                item.active ? "bg-[#FACC15] text-[#1A1A2E]" : "text-gray-400"
              }`}
            >
              {item.label}
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 p-3 space-y-3">
          {/* Quick stat cards */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Net Worth", value: "$284,500", color: "bg-[#FFF9E6]", accent: "#FACC15" },
              { label: "Savings Rate", value: "34%", color: "bg-[#EFF6FF]", accent: "#3B82F6" },
              { label: "Monthly Delta", value: "+$2,840", color: "bg-[#F0FDF4]", accent: "#22C55E" },
              { label: "Fire Number", value: "$1.2M", color: "bg-[#FFF1F2]", accent: "#F43F5E" },
            ].map((card) => (
              <div key={card.label} className={`${card.color} rounded-xl p-2`}>
                <p className="text-[8px] text-gray-500 font-medium">{card.label}</p>
                <p className="text-sm font-bold text-[#1A1A2E] mt-0.5">{card.value}</p>
              </div>
            ))}
          </div>

          {/* Chart area */}
          <div className="bg-white rounded-xl p-3 border border-gray-100">
            <p className="text-[9px] font-semibold text-[#1A1A2E] mb-2">Wealth Projection</p>
            <div className="h-16 flex items-end gap-0.5">
              {[20, 28, 24, 35, 40, 38, 50, 55, 60, 58, 70, 80].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end">
                  <div
                    className="rounded-t-sm"
                    style={{
                      height: `${h}%`,
                      background: i === 11 ? "#FACC15" : `rgba(250, 204, 21, ${0.2 + i * 0.05})`,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Use case illustration cards
function UseCaseCard({ icon, color, bg, title, subtitle }: {
  icon: React.ReactNode; color: string; bg: string; title: string; subtitle: string;
}) {
  return (
    <div className={`${bg} rounded-2xl p-6 aspect-[4/3] flex flex-col justify-between`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center`} style={{ background: color }}>
        {icon}
      </div>
      <div>
        <p className="text-lg font-bold text-[#1A1A2E] leading-tight">{title}</p>
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      </div>
      {/* Mini chart decoration */}
      <div className="flex items-end gap-1 h-8">
        {[40, 55, 45, 65, 70, 80, 90].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-sm"
            style={{ height: `${h}%`, background: color, opacity: 0.3 + i * 0.1 }}
          />
        ))}
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FC] text-[#1A1A2E] font-sans">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-5 md:px-12 lg:px-24 bg-white border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#FACC15] flex items-center justify-center">
            <img src={logoImg} alt="Clarifin" className="w-5 h-5 object-contain" />
          </div>
          <span className="text-lg font-bold text-[#1A1A2E] tracking-tight">Clarifin</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
          <a href="#features" className="hover:text-[#1A1A2E] transition-colors">Features</a>
          <a href="#use-cases" className="hover:text-[#1A1A2E] transition-colors">Use Cases</a>
          <a href="#methodology" className="hover:text-[#1A1A2E] transition-colors">How It Works</a>
        </div>
        <div className="flex items-center gap-3">
          <a href="/sign-in" className="hidden md:block text-sm font-medium text-gray-500 hover:text-[#1A1A2E] transition-colors">
            Sign in
          </a>
          <a href="/sign-up">
            <button className="bg-[#FACC15] hover:bg-yellow-300 text-[#1A1A2E] text-sm font-bold px-5 py-2.5 rounded-xl transition-colors">
              Get started
            </button>
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-20 pb-24 md:px-12 lg:px-24 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
        <div className="flex-1 space-y-8">
          <div className="inline-flex items-center gap-2 bg-[#FFF9E6] border border-yellow-200 rounded-full px-4 py-1.5">
            <Zap className="w-3.5 h-3.5 text-[#FACC15]" strokeWidth={2.5} />
            <span className="text-xs font-semibold text-[#1A1A2E]">AI-powered financial simulation</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] text-[#1A1A2E]">
            Clarity before <br />
            <span className="text-[#FACC15]" style={{ WebkitTextStroke: "1px #D4A800" }}>commitment.</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-lg leading-relaxed">
            Test financial decisions in a safe environment. Compare debt strategies, model mortgages, and simulate retirement paths — before risking real capital.
          </p>
          <div className="flex items-center gap-4">
            <a href="/sign-up">
              <button className="bg-[#1A1A2E] hover:bg-[#2d2d4e] text-white font-bold px-8 py-3.5 rounded-xl transition-colors text-sm">
                Run your first scenario
              </button>
            </a>
            <a href="/sign-in" className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-[#1A1A2E] transition-colors group">
              Sign in <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
          {/* Social proof */}
          <div className="flex items-center gap-6 pt-2">
            {[
              { value: "47k+", label: "Scenarios run" },
              { value: "94%", label: "Feel confident" },
              { value: "$2.4M", label: "Avg. modeled" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-xl font-bold text-[#1A1A2E]">{s.value}</p>
                <p className="text-xs text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 w-full max-w-xl">
          <DashboardMockup />
        </div>
      </section>

      {/* Philosophy banner */}
      <section className="bg-[#1A1A2E] py-20">
        <div className="px-6 md:px-12 lg:px-24 max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-5">A rational approach to wealth.</h2>
          <p className="text-lg text-white/60 leading-relaxed">
            Financial anxiety stems from uncertainty. By wrapping sophisticated modeling tools in a simple interface, we help you replace assumptions with mathematics.
          </p>
        </div>
      </section>

      {/* Use Cases */}
      <section id="use-cases" className="px-6 py-24 md:px-12 lg:px-24 max-w-7xl mx-auto">
        <p className="text-xs font-bold text-[#FACC15] uppercase tracking-widest mb-3">Decisions worth simulating</p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-[#1A1A2E]">Three life-changing scenarios.</h2>
        <p className="text-gray-500 text-lg mb-14 max-w-xl">
          The biggest financial crossroads people face. Clarifin gives you the model before you make the move.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <UseCaseCard
              icon={<TrendingUp className="w-6 h-6 text-[#1A1A2E]" strokeWidth={2} />}
              color="#FACC15"
              bg="bg-[#FFF9E6]"
              title="Pay off debt vs. invest"
              subtitle="Model the true opportunity cost of carrying debt."
            />
            <div className="mt-4">
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-1.5">01 / Debt</p>
              <p className="text-sm text-gray-500 leading-relaxed">
                See exactly how much interest costs you over time, and whether investing beats paying down early.
              </p>
            </div>
          </div>
          <div>
            <UseCaseCard
              icon={<PiggyBank className="w-6 h-6 text-white" strokeWidth={2} />}
              color="#3B82F6"
              bg="bg-[#EFF6FF]"
              title="When does work become optional?"
              subtitle="Find your exact financial independence date."
            />
            <div className="mt-4">
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-1.5">02 / Retirement</p>
              <p className="text-sm text-gray-500 leading-relaxed">
                Simulate savings rates, returns, and inflation to find when you hit your number.
              </p>
            </div>
          </div>
          <div>
            <UseCaseCard
              icon={<Home className="w-6 h-6 text-white" strokeWidth={2} />}
              color="#22C55E"
              bg="bg-[#F0FDF4]"
              title="Buy vs. rent, for your market"
              subtitle="Factor taxes, maintenance, and opportunity cost."
            />
            <div className="mt-4">
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-1.5">03 / Real Estate</p>
              <p className="text-sm text-gray-500 leading-relaxed">
                Make the most consequential purchase of your life with confidence, not guesswork.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Yellow CTA strip */}
      <section className="bg-[#FACC15] py-16">
        <div className="px-6 md:px-12 lg:px-24 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#1A1A2E] tracking-tight">Ready to run your first scenario?</h2>
            <p className="text-[#1A1A2E]/70 mt-2">Free to start. No credit card required.</p>
          </div>
          <a href="/sign-up">
            <button className="bg-[#1A1A2E] text-white font-bold px-8 py-3.5 rounded-xl hover:bg-[#2d2d4e] transition-colors text-sm whitespace-nowrap">
              Start simulating →
            </button>
          </a>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-24 md:px-12 lg:px-24 max-w-7xl mx-auto">
        <p className="text-xs font-bold text-[#FACC15] uppercase tracking-widest mb-3">Features</p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-14 text-[#1A1A2E]">Built for serious decisions.</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <Compass className="w-5 h-5 text-[#1A1A2E]" strokeWidth={1.8} />,
              bg: "bg-[#FFF9E6]",
              title: "Scenario Comparison",
              body: "Run Plan A vs. Plan B side by side. See exactly which path builds more wealth over your chosen horizon.",
            },
            {
              icon: <Target className="w-5 h-5 text-white" strokeWidth={1.8} />,
              bg: "bg-[#1A1A2E]",
              title: "Retirement Trajectories",
              body: "Model savings rates, expected returns, and inflation scenarios to understand precisely when work becomes optional.",
              dark: true,
            },
            {
              icon: <Shield className="w-5 h-5 text-[#1A1A2E]" strokeWidth={1.8} />,
              bg: "bg-[#FFF9E6]",
              title: "Real Estate Economics",
              body: "Factor maintenance, taxes, insurance, and opportunity cost. Make the buy vs. rent decision with empirical data.",
            },
          ].map((f, i) => (
            <div key={i} className={`${f.bg} rounded-2xl p-8 space-y-5`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${f.dark ? "bg-[#FACC15]" : "bg-[#1A1A2E]"}`}>
                {f.icon}
              </div>
              <h3 className={`text-xl font-bold tracking-tight ${f.dark ? "text-white" : "text-[#1A1A2E]"}`}>{f.title}</h3>
              <p className={`leading-relaxed text-sm ${f.dark ? "text-white/60" : "text-gray-500"}`}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Methodology */}
      <section id="methodology" className="px-6 py-24 md:px-12 lg:px-24 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Left: visual mockup */}
          <div className="bg-[#1A1A2E] rounded-2xl p-6 space-y-4">
            <p className="text-white/50 text-xs font-medium uppercase tracking-widest">AI Advisor</p>
            <div className="space-y-3">
              {[
                { q: true, text: "Should I pay off my student loans or invest in my 401k?" },
                { q: false, text: "Great question! Based on your 6.8% loan rate vs. an expected 8% market return, investing likely wins — but let's model both." },
                { q: true, text: "What's my FIRE number at current savings rate?" },
                { q: false, text: "At $3,200/mo savings with 7% returns, you hit $1.2M in 14.3 years. Increasing to $4,000/mo cuts that to 11.8 years." },
              ].map((msg, i) => (
                <div key={i} className={`flex ${msg.q ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                    msg.q ? "bg-[#FACC15] text-[#1A1A2E] font-medium" : "bg-white/10 text-white/80"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <div className="flex-1 bg-white/10 rounded-xl px-3 py-2 text-xs text-white/40">Ask a question...</div>
              <div className="w-8 h-8 bg-[#FACC15] rounded-xl flex items-center justify-center">
                <ArrowRight className="w-3.5 h-3.5 text-[#1A1A2E]" />
              </div>
            </div>
          </div>

          {/* Right: copy */}
          <div className="space-y-8">
            <p className="text-xs font-bold text-[#FACC15] uppercase tracking-widest">How it works</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-[1.1] text-[#1A1A2E]">
              Signal, not noise.
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed">
              Most financial tools keep you endlessly engaged. Clarifin is designed to give you a clear answer — so you can close the app and get back to your life.
            </p>
            <ul className="space-y-4">
              {[
                "Deterministic forecasting models",
                "Tax-adjusted compounding",
                "AI advisor trained on financial planning",
                "Historical sequence-of-returns analysis",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-[#1A1A2E] font-medium">
                  <div className="w-5 h-5 rounded-full bg-[#FACC15] flex items-center justify-center shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#1A1A2E]" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-y border-gray-100 py-16">
        <div className="px-6 md:px-12 lg:px-24 max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
          {[
            { value: "47k+", label: "Scenarios simulated" },
            { value: "12 min", label: "Avg. time to clarity" },
            { value: "94%", label: "Feel more confident" },
            { value: "$2.4M", label: "Avg. net worth modeled" },
          ].map((stat, i) => (
            <div key={i} className="space-y-1">
              <p className="text-4xl font-bold text-[#1A1A2E]">{stat.value}</p>
              <p className="text-xs text-gray-400 uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-28 text-center px-6">
        <div className="max-w-xl mx-auto space-y-7">
          <div className="w-14 h-14 rounded-2xl bg-[#FACC15] flex items-center justify-center mx-auto">
            <img src={logoImg} alt="Clarifin" className="w-8 h-8 object-contain" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[#1A1A2E]">Ready for clarity?</h2>
          <p className="text-lg text-gray-500 max-w-md mx-auto">
            Join thousands of thoughtful people who use Clarifin to chart their financial future.
          </p>
          <a href="/sign-up">
            <button className="bg-[#FACC15] hover:bg-yellow-300 text-[#1A1A2E] font-bold px-10 py-4 rounded-xl transition-colors text-base mt-2 inline-block">
              Begin simulation →
            </button>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-10 md:px-12 lg:px-24 border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#FACC15] flex items-center justify-center">
              <img src={logoImg} alt="Clarifin" className="w-4 h-4 object-contain" />
            </div>
            <span className="text-base font-bold text-[#1A1A2E] tracking-tight">Clarifin</span>
          </div>
          <div className="flex gap-8 text-sm text-gray-400">
            <a href="#" className="hover:text-[#1A1A2E] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#1A1A2E] transition-colors">Terms</a>
            <a href="#methodology" className="hover:text-[#1A1A2E] transition-colors">How It Works</a>
          </div>
          <div className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} Clarifin. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

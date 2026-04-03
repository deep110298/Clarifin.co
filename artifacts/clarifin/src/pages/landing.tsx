import { ArrowRight, Compass, Shield, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#0F172A] font-sans selection:bg-[#94A3B8] selection:text-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-8 md:px-12 lg:px-24">
        <div className="text-xl font-medium tracking-tight">Clarifin.</div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#475569]">
          <a href="#features" className="hover:text-[#0F172A] transition-colors">Features</a>
          <a href="#use-cases" className="hover:text-[#0F172A] transition-colors">Use Cases</a>
          <a href="#methodology" className="hover:text-[#0F172A] transition-colors">Methodology</a>
        </div>
        <div className="hidden md:flex items-center gap-4 text-sm font-medium text-[#475569]">
          <a href="/sign-in" className="hover:text-[#0F172A] transition-colors">Sign in</a>
        </div>
        <a href="/sign-up">
          <Button variant="outline" className="rounded-none border-[#0F172A] text-[#0F172A] hover:bg-[#0F172A] hover:text-white transition-colors">
            Start simulation
          </Button>
        </a>
      </nav>

      {/* Hero */}
      <section className="px-6 py-20 md:px-12 lg:px-24 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
        <div className="flex-1 space-y-10">
          <h1 className="text-5xl md:text-7xl font-medium tracking-tighter leading-[1.1]">
            Clarity before <br /> commitment.
          </h1>
          <p className="text-lg md:text-xl text-[#475569] max-w-lg leading-relaxed font-light">
            Test financial decisions in a controlled environment. Compare debt strategies, model mortgages, and simulate retirement paths without risking real capital.
          </p>
          <div className="flex items-center gap-4">
            <a href="/sign-up">
              <Button className="rounded-none bg-[#0F172A] text-white hover:bg-[#1E293B] px-8 py-6 text-base">
                Run your first scenario
              </Button>
            </a>
            <a href="/sign-in">
              <Button variant="ghost" className="rounded-none text-[#0F172A] hover:bg-transparent hover:text-[#475569] px-4 py-6 text-base group">
                Sign in <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </a>
          </div>
        </div>
        <div className="flex-1 w-full">
          <img
            src="/images/clarifin-hero-calm.png"
            alt="Abstract representation of financial clarity"
            className="w-full h-auto object-cover aspect-[4/3]"
          />
        </div>
      </section>

      {/* Philosophy */}
      <section className="py-24 bg-white border-y border-gray-100">
        <div className="px-6 md:px-12 lg:px-24 max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-medium tracking-tight mb-6">A rational approach to wealth.</h2>
          <p className="text-lg text-[#475569] leading-relaxed font-light">
            We believe that financial anxiety stems from uncertainty. By providing sophisticated modeling tools wrapped in an uncompromisingly simple interface, we help you replace assumptions with mathematics.
          </p>
        </div>
      </section>

      {/* Use Cases */}
      <section id="use-cases" className="px-6 py-24 md:px-12 lg:px-24 max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-medium tracking-tight mb-4">Decisions worth simulating.</h2>
        <p className="text-[#475569] font-light text-lg mb-16 max-w-xl">
          Three of the biggest financial crossroads people face. Clarifin gives you the model before you make the move.
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              num: "01",
              label: "Debt",
              title: "Pay it off vs. invest the difference",
              body: "Model the true opportunity cost of carrying debt against the expected returns of putting that money to work.",
              img: "/images/clarifin-usecase-debt.png",
              alt: "Debt payoff strategy",
            },
            {
              num: "02",
              label: "Retirement",
              title: "When does work become optional?",
              body: "Simulate savings rates, expected returns, and inflation to find your exact financial independence date.",
              img: "/images/clarifin-usecase-retirement.png",
              alt: "Retirement planning",
            },
            {
              num: "03",
              label: "Real Estate",
              title: "Buy vs. rent, modeled for your market",
              body: "Factor in taxes, maintenance, and opportunity cost to make the most consequential purchase of your life with confidence.",
              img: "/images/clarifin-usecase-home.png",
              alt: "Home buying decision",
            },
          ].map((item) => (
            <div key={item.num} className="space-y-5">
              <div className="overflow-hidden aspect-[4/3]">
                <img
                  src={item.img}
                  alt={item.alt}
                  className="w-full h-full object-cover grayscale-[10%] hover:grayscale-0 transition-all duration-500"
                />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-[#94A3B8] mb-2">{item.num} / {item.label}</p>
                <h3 className="text-xl font-medium tracking-tight mb-2">{item.title}</h3>
                <p className="text-sm text-[#475569] leading-relaxed font-light">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Full-bleed divider */}
      <div className="w-full overflow-hidden" style={{ maxHeight: "320px" }}>
        <img
          src="/images/clarifin-divider.png"
          alt="Calm water surface"
          className="w-full h-full object-cover"
          style={{ objectPosition: "center center" }}
        />
      </div>

      {/* Features */}
      <section id="features" className="px-6 py-24 md:px-12 lg:px-24 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-12 md:gap-8">
          {[
            {
              icon: <Compass className="w-6 h-6" strokeWidth={1.5} />,
              title: "Scenario Comparison",
              body: "Run Scenario A and Scenario B side by side. See exactly which path builds more wealth over your chosen horizon.",
            },
            {
              icon: <Target className="w-6 h-6" strokeWidth={1.5} />,
              title: "Retirement Trajectories",
              body: "Model various savings rates, expected returns, and inflation scenarios to understand precisely when work becomes optional.",
            },
            {
              icon: <Shield className="w-6 h-6" strokeWidth={1.5} />,
              title: "Real Estate Economics",
              body: "Factor in maintenance, taxes, insurance, and opportunity cost. Make the buy vs. rent decision based on empirical data for your specific market.",
            },
          ].map((f, i) => (
            <div key={i} className="space-y-6">
              <div className="w-12 h-12 flex items-center justify-center bg-[#F1F5F9] text-[#64748B]">
                {f.icon}
              </div>
              <h3 className="text-xl font-medium tracking-tight">{f.title}</h3>
              <p className="text-[#475569] leading-relaxed font-light text-sm md:text-base">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Signal not noise */}
      <section id="methodology" className="px-6 py-12 md:px-12 lg:px-24 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <img
              src="/images/clarifin-app-calm.png"
              alt="Clarifin interface showing clean data visualization"
              className="w-full h-auto object-cover"
            />
          </div>
          <div className="space-y-8">
            <h2 className="text-3xl md:text-5xl font-medium tracking-tight leading-[1.1]">
              Signal, not noise.
            </h2>
            <p className="text-lg text-[#475569] leading-relaxed font-light">
              Most financial tools are designed to keep you engaged, constantly checking daily fluctuations. Clarifin is designed to give you an answer, so you can close the app and get back to your life.
            </p>
            <ul className="space-y-4">
              {[
                "Deterministic forecasting models",
                "Tax-adjusted compounding",
                "Historical sequence of returns analysis",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-[#0F172A] font-medium">
                  <div className="w-1.5 h-1.5 bg-[#64748B]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-white border-y border-gray-100">
        <div className="px-6 md:px-12 lg:px-24 max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          {[
            { value: "47k+", label: "Scenarios simulated" },
            { value: "12 min", label: "Avg. time to clarity" },
            { value: "94%", label: "Feel more confident" },
            { value: "$2.4M", label: "Avg. net worth modeled" },
          ].map((stat, i) => (
            <div key={i} className="space-y-2">
              <p className="text-4xl md:text-5xl font-medium tracking-tight">{stat.value}</p>
              <p className="text-sm text-[#94A3B8] uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 text-center px-6">
        <div className="max-w-2xl mx-auto space-y-8">
          <h2 className="text-4xl md:text-5xl font-medium tracking-tight">Ready for clarity?</h2>
          <p className="text-lg text-[#475569] font-light max-w-md mx-auto">
            Join thousands of thoughtful professionals who use Clarifin to chart their financial future.
          </p>
          <Button className="rounded-none bg-[#0F172A] text-white hover:bg-[#1E293B] px-12 py-6 text-lg mt-4">
            Begin simulation
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 md:px-12 lg:px-24 border-t border-gray-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-xl font-medium tracking-tight">Clarifin.</div>
          <div className="flex gap-8 text-sm text-[#64748B]">
            <a href="#" className="hover:text-[#0F172A] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#0F172A] transition-colors">Terms</a>
            <a href="#methodology" className="hover:text-[#0F172A] transition-colors">Methodology</a>
          </div>
          <div className="text-sm text-[#94A3B8]">
            &copy; {new Date().getFullYear()} Clarifin. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

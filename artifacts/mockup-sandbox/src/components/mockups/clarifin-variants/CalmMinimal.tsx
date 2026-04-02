import { ArrowRight, Compass, Shield, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CalmMinimal() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#0F172A] font-sans selection:bg-[#94A3B8] selection:text-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-8 md:px-12 lg:px-24">
        <div className="text-xl font-medium tracking-tight">Clarifin.</div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#475569]">
          <a href="#features" className="hover:text-[#0F172A] transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-[#0F172A] transition-colors">Methodology</a>
          <a href="#pricing" className="hover:text-[#0F172A] transition-colors">Pricing</a>
        </div>
        <Button variant="outline" className="rounded-none border-[#0F172A] text-[#0F172A] hover:bg-[#0F172A] hover:text-white transition-colors">
          Start simulation
        </Button>
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
            <Button className="rounded-none bg-[#0F172A] text-white hover:bg-[#1E293B] px-8 py-6 text-base">
              Run your first scenario
            </Button>
            <Button variant="ghost" className="rounded-none text-[#0F172A] hover:bg-transparent hover:text-[#475569] px-4 py-6 text-base group">
              View methodology <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
        <div className="flex-1 w-full">
          <img 
            src="/__mockup/images/clarifin-hero-calm.png" 
            alt="Abstract representation of financial clarity" 
            className="w-full h-auto object-cover aspect-[4/3]"
          />
        </div>
      </section>

      {/* Philosophy */}
      <section className="py-24 bg-white border-y border-gray-100">
        <div className="px-6 md:px-12 lg:px-24 max-w-7xl mx-auto text-center max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-medium tracking-tight mb-6">A rational approach to wealth.</h2>
          <p className="text-lg text-[#475569] leading-relaxed font-light">
            We believe that financial anxiety stems from uncertainty. By providing sophisticated modeling tools wrapped in an uncompromisingly simple interface, we help you replace assumptions with mathematics.
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-24 md:px-12 lg:px-24 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-12 md:gap-8">
          <div className="space-y-6">
            <div className="w-12 h-12 flex items-center justify-center bg-[#F1F5F9] text-[#64748B]">
              <Compass className="w-6 h-6" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-medium tracking-tight">Debt vs. Investing</h3>
            <p className="text-[#475569] leading-relaxed font-light text-sm md:text-base">
              Compare the long-term impact of aggressively paying down a mortgage versus investing the difference in the market. See the math, not the emotion.
            </p>
          </div>
          <div className="space-y-6">
            <div className="w-12 h-12 flex items-center justify-center bg-[#F1F5F9] text-[#64748B]">
              <Target className="w-6 h-6" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-medium tracking-tight">Retirement Trajectories</h3>
            <p className="text-[#475569] leading-relaxed font-light text-sm md:text-base">
              Model various savings rates, expected returns, and inflation scenarios to understand precisely when work becomes optional.
            </p>
          </div>
          <div className="space-y-6">
            <div className="w-12 h-12 flex items-center justify-center bg-[#F1F5F9] text-[#64748B]">
              <Shield className="w-6 h-6" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-medium tracking-tight">Real Estate Economics</h3>
            <p className="text-[#475569] leading-relaxed font-light text-sm md:text-base">
              Factor in maintenance, taxes, insurance, and opportunity cost. Make the buy vs. rent decision based on empirical data for your specific market.
            </p>
          </div>
        </div>
      </section>

      {/* Visual Section */}
      <section className="px-6 py-12 md:px-12 lg:px-24 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <img 
              src="/__mockup/images/clarifin-app-calm.png" 
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
                "Historical sequence of returns analysis"
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

      {/* Testimonial / Lifestyle */}
      <section className="py-24 bg-[#0F172A] text-white">
        <div className="px-6 md:px-12 lg:px-24 max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <p className="text-2xl md:text-3xl font-light leading-relaxed text-slate-300">
              "For the first time, I actually understand the trade-offs of my financial decisions. It's like having a fiduciary built into my browser."
            </p>
            <div>
              <p className="font-medium text-white">Sarah Jenkins</p>
              <p className="text-slate-400 text-sm">Director of Engineering</p>
            </div>
          </div>
          <div>
             <img 
              src="/__mockup/images/clarifin-lifestyle-calm.png" 
              alt="Serene minimalist workspace" 
              className="w-full h-auto object-cover opacity-90 grayscale-[20%]"
            />
          </div>
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
            <a href="#" className="hover:text-[#0F172A]">Privacy</a>
            <a href="#" className="hover:text-[#0F172A]">Terms</a>
            <a href="#" className="hover:text-[#0F172A]">Methodology</a>
          </div>
          <div className="text-sm text-[#94A3B8]">
            &copy; {new Date().getFullYear()} Clarifin. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, TrendingUp, ShieldCheck, Zap } from "lucide-react";

export function BoldDark() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 selection:bg-teal-500/30 font-sans overflow-x-hidden">
      {/* Decorative ambient elements */}
      <div className="fixed top-20 -left-10 text-[10rem] font-bold text-white/[0.02] tracking-tighter pointer-events-none select-none z-0">
        $47,000
      </div>
      <div className="fixed bottom-40 -right-20 text-[12rem] font-bold text-white/[0.02] tracking-tighter pointer-events-none select-none z-0">
        8.5% APY
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-zinc-950/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-teal-400 flex items-center justify-center">
              <Zap className="w-4 h-4 text-zinc-950" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Clarifin</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Wall of Love</a>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="text-zinc-300 hover:text-white hover:bg-white/5">Log in</Button>
            <Button className="bg-teal-400 text-zinc-950 hover:bg-teal-300 rounded-full font-bold px-6">
              Start Simulating
            </Button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-20">
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center pt-20 pb-32">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-b from-teal-500/10 via-zinc-950/50 to-zinc-950"></div>
          </div>
          
          <div className="container mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-16 items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-400/10 border border-teal-400/20 text-teal-400 text-sm font-semibold tracking-wide uppercase mb-8">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
                The ultimate financial simulator
              </div>
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8 text-white">
                Test your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-lime-400">
                  future.
                </span>
              </h1>
              <p className="text-xl text-zinc-400 mb-12 max-w-lg leading-relaxed">
                Compare paying off debt vs investing, model mortgage terms, and simulate retirement paths. Know exactly what happens before you commit a single dollar.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-teal-400 text-zinc-950 hover:bg-teal-300 rounded-full h-14 px-8 text-lg font-bold">
                  Start Your Simulation
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button size="lg" variant="outline" className="h-14 px-8 rounded-full border-zinc-800 text-white hover:bg-zinc-900 text-lg">
                  View Demo
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -inset-4 bg-teal-500/20 blur-3xl rounded-full opacity-50"></div>
              <img 
                src="/__mockup/images/clarifin-hero.png" 
                alt="Abstract financial visualization" 
                className="relative z-10 rounded-2xl border border-white/10 shadow-2xl"
              />
              
              {/* Floating UI Elements */}
              <div className="absolute -left-12 top-1/4 bg-zinc-900/90 backdrop-blur border border-white/10 p-4 rounded-xl shadow-2xl z-20 animate-bounce" style={{ animationDuration: '3s' }}>
                <div className="text-xs text-zinc-400 mb-1">Projected Net Worth</div>
                <div className="text-2xl font-bold text-teal-400">$2.4M</div>
              </div>
              <div className="absolute -right-8 bottom-1/4 bg-zinc-900/90 backdrop-blur border border-white/10 p-4 rounded-xl shadow-2xl z-20 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
                <div className="text-xs text-zinc-400 mb-1">Debt Free By</div>
                <div className="text-2xl font-bold text-white">2028</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-32 bg-zinc-950 relative border-t border-white/5">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mb-24">
              <h2 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6">
                Clarity in <br />a world of noise.
              </h2>
              <p className="text-xl text-zinc-400">
                Stop guessing. Clarifin's powerful simulation engine runs thousands of scenarios to show you exactly where your money is going.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl hover:bg-zinc-900 transition-colors group">
                <div className="w-14 h-14 rounded-2xl bg-teal-400/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-7 h-7 text-teal-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Debt vs Invest</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Should you pay down your 4% mortgage or invest in the S&P 500? See the exact mathematical outcome of both paths over 30 years.
                </p>
              </div>
              
              <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl hover:bg-zinc-900 transition-colors group">
                <div className="w-14 h-14 rounded-2xl bg-lime-400/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-7 h-7 text-lime-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Mortgage Modeling</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Test different down payments, interest rates, and extra principal payments to find the optimal way to buy your dream home.
                </p>
              </div>

              <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl hover:bg-zinc-900 transition-colors group">
                <div className="w-14 h-14 rounded-2xl bg-teal-400/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-7 h-7 text-teal-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Retirement Paths</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Run Monte Carlo simulations on your portfolio to ensure you never run out of money, no matter what the market does.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Deep Dive Section */}
        <section className="py-32 bg-zinc-900 border-y border-white/5 overflow-hidden">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <div>
                <img 
                  src="/__mockup/images/clarifin-feature1.png" 
                  alt="Financial projection graph" 
                  className="rounded-2xl border border-white/10 shadow-2xl shadow-teal-500/10"
                />
              </div>
              <div>
                <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-8 text-white">
                  See the unseen.
                </h2>
                <p className="text-xl text-zinc-400 mb-8 leading-relaxed">
                  Most people make $500,000 decisions based on gut feelings and simple calculators. Clarifin visualizes compound interest, tax implications, and inflation dynamically.
                </p>
                <ul className="space-y-6">
                  {[
                    "Instant visual feedback on every variable change",
                    "Factor in historical inflation and market returns",
                    "Compare multiple scenarios side-by-side"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-4 text-lg text-zinc-300 font-medium">
                      <div className="w-6 h-6 rounded-full bg-lime-400/20 flex items-center justify-center flex-shrink-0">
                        <div className="w-2 h-2 rounded-full bg-lime-400"></div>
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-32 bg-zinc-950 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-teal-500/5 blur-[120px] rounded-full pointer-events-none"></div>
          
          <div className="container mx-auto px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6">
                Used by the <span className="text-teal-400">obsessed</span>.
              </h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  quote: "I thought I needed to pay off my 3% mortgage ASAP. Clarifin showed me I was leaving $1.2M on the table by not investing that extra cash.",
                  author: "Sarah J.",
                  role: "Software Engineer"
                },
                {
                  quote: "Finally, a tool that respects my intelligence. The side-by-side scenario comparison is exactly how my brain works.",
                  author: "Marcus T.",
                  role: "Product Manager"
                },
                {
                  quote: "It's like having a quant work out your personal finances. The visual impact of small changes in savings rate is mind-blowing.",
                  author: "Elena R.",
                  role: "Small Business Owner"
                }
              ].map((t, i) => (
                <div key={i} className="p-8 rounded-3xl bg-zinc-900 border border-white/5 hover:border-teal-400/30 transition-colors">
                  <div className="text-teal-400 text-4xl font-serif mb-4">"</div>
                  <p className="text-lg text-zinc-300 mb-8 leading-relaxed">
                    {t.quote}
                  </p>
                  <div>
                    <div className="font-bold text-white">{t.author}</div>
                    <div className="text-sm text-zinc-500">{t.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-32 bg-teal-400 text-zinc-950 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/20 blur-[100px] rounded-full mix-blend-overlay pointer-events-none"></div>
          
          <div className="container mx-auto px-6 relative z-10 text-center">
            <h2 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 max-w-4xl mx-auto leading-none">
              Stop guessing. Start simulating.
            </h2>
            <p className="text-2xl font-medium text-teal-900 mb-12 max-w-2xl mx-auto">
              Join thousands of people making mathematically perfect financial decisions.
            </p>
            <Button size="lg" className="bg-zinc-950 text-white hover:bg-zinc-900 rounded-full h-16 px-10 text-xl font-bold shadow-2xl shadow-zinc-950/20">
              Get Started for Free
              <ArrowRight className="ml-2 w-6 h-6" />
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-zinc-950 py-12 border-t border-white/5">
          <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-teal-400" />
              <span className="text-xl font-bold tracking-tight text-white">Clarifin</span>
            </div>
            <div className="text-sm text-zinc-500">
              © {new Date().getFullYear()} Clarifin Simulator. All rights reserved.
            </div>
            <div className="flex gap-6 text-sm text-zinc-400">
              <a href="#" className="hover:text-white">Privacy</a>
              <a href="#" className="hover:text-white">Terms</a>
              <a href="#" className="hover:text-white">Contact</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

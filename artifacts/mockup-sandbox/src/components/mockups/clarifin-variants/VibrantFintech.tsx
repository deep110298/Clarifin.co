import { useState } from "react";
import { 
  ArrowRight, 
  BarChart3, 
  ChevronRight, 
  PieChart, 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  Wallet,
  Play,
  CheckCircle2,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function VibrantFintech() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-500/30 text-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md border-b border-slate-200/50 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center">
                <PieChart className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-900 to-indigo-600">
                Clarifin
              </span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">How it Works</a>
              <a href="#testimonials" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Testimonials</a>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <Button variant="ghost" className="text-sm font-medium">Log in</Button>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 shadow-lg shadow-indigo-600/20">
                Get Started
              </Button>
            </div>

            <button 
              className="md:hidden p-2 text-slate-600"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-1 shadow-lg">
            <a href="#features" className="block px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-md">Features</a>
            <a href="#how-it-works" className="block px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-md">How it Works</a>
            <a href="#testimonials" className="block px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-md">Testimonials</a>
            <div className="pt-4 flex flex-col gap-2">
              <Button variant="outline" className="w-full">Log in</Button>
              <Button className="w-full bg-indigo-600">Get Started</Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3">
          <div className="w-[800px] h-[800px] rounded-full bg-gradient-to-br from-indigo-400/20 to-cyan-300/20 blur-3xl opacity-50 mix-blend-multiply" />
        </div>
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3">
          <div className="w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-violet-400/20 to-fuchsia-300/20 blur-3xl opacity-50 mix-blend-multiply" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 mb-8">
              <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
              <span className="text-sm font-semibold text-indigo-700">Clarifin 2.0 is now live</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 leading-[1.1]">
              See your financial future <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500">
                before you commit.
              </span>
            </h1>
            <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Don't guess. Simulate. Clarifin lets you test financial decisions—from paying off debt to investing and buying a home—so you can choose the best path forward.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="h-14 px-8 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/20 text-lg w-full sm:w-auto transition-transform hover:scale-105">
                Start Simulating Free <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 rounded-full text-lg w-full sm:w-auto border-slate-300 hover:bg-slate-50">
                <Play className="mr-2 w-5 h-5 text-indigo-600" /> Watch Demo
              </Button>
            </div>
          </div>

          <div className="mt-20 relative mx-auto max-w-5xl perspective-1000">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-transparent z-10 h-full w-full pointer-events-none" />
            <div className="relative rounded-2xl border border-slate-200/50 bg-white/50 backdrop-blur-xl shadow-2xl p-2 transform rotate-x-12 hover:rotate-x-0 transition-transform duration-700">
              <img 
                src="/__mockup/images/vibrant-hero.png" 
                alt="Clarifin Dashboard Mockup" 
                className="rounded-xl w-full h-auto shadow-sm"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Logos */}
      <section className="py-10 border-y border-slate-200/50 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6">Trusted by ambitious professionals at</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 grayscale">
            <div className="text-2xl font-bold font-serif">Acme Corp</div>
            <div className="text-2xl font-bold italic">Globex</div>
            <div className="text-2xl font-bold tracking-tighter">Soylent</div>
            <div className="text-2xl font-black uppercase">Initech</div>
            <div className="text-2xl font-semibold">Umbrella</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-slate-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
              Powerful tools for <br/> complex decisions
            </h2>
            <p className="text-lg text-slate-600">
              Stop using confusing spreadsheets. Clarifin's simulation engine handles the math so you can focus on the strategy.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 rounded-3xl border-0 shadow-lg shadow-slate-200/50 bg-white group hover:-translate-y-2 transition-transform duration-300">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-7 h-7 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Debt vs. Invest</h3>
              <p className="text-slate-600 leading-relaxed">
                Should you pay off that 5% loan or invest in the market? Run the numbers side-by-side over 10, 20, or 30 years.
              </p>
            </Card>

            <Card className="p-8 rounded-3xl border-0 shadow-lg shadow-slate-200/50 bg-white group hover:-translate-y-2 transition-transform duration-300">
              <div className="w-14 h-14 rounded-2xl bg-cyan-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-7 h-7 text-cyan-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Mortgage Modeler</h3>
              <p className="text-slate-600 leading-relaxed">
                Compare 15-year vs 30-year terms, test extra principal payments, and see exactly when you'll own your home outright.
              </p>
            </Card>

            <Card className="p-8 rounded-3xl border-0 shadow-lg shadow-slate-200/50 bg-white group hover:-translate-y-2 transition-transform duration-300">
              <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Wallet className="w-7 h-7 text-violet-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Retirement Paths</h3>
              <p className="text-slate-600 leading-relaxed">
                Model different savings rates and market returns to find out exactly when work becomes optional.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Showcase Section 1 */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 text-cyan-700 text-sm font-semibold mb-6">
                <Zap className="w-4 h-4" /> Real-time calculations
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight leading-tight">
                Instantly see the impact of every dollar.
              </h2>
              <p className="text-lg text-slate-600 mb-8">
                Adjust a slider and watch your net worth curve change 30 years in the future. Our high-performance simulation engine recalculates complex tax and interest scenarios in milliseconds.
              </p>
              
              <ul className="space-y-4 mb-8">
                {[
                  "Drag-and-drop scenario building",
                  "Historical market data integration",
                  "Tax-bracket aware forecasting"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                    <CheckCircle2 className="w-6 h-6 text-indigo-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <Button variant="link" className="text-indigo-600 font-semibold text-lg p-0 h-auto hover:text-indigo-700">
                Explore the engine <ChevronRight className="ml-1 w-5 h-5" />
              </Button>
            </div>
            
            <div className="lg:w-1/2 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400/20 to-indigo-500/20 rounded-3xl blur-3xl transform rotate-6 scale-105"></div>
              <img 
                src="/__mockup/images/vibrant-feature-1.png" 
                alt="Data Visualization" 
                className="relative rounded-3xl shadow-2xl border border-white/50 w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-slate-900" />
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-slate-900" />
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3">
          <div className="w-[600px] h-[600px] rounded-full bg-cyan-500/20 blur-3xl mix-blend-screen" />
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tight">
            Ready to design your <br/> financial future?
          </h2>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            Join thousands of users who have found clarity and confidence in their financial decisions with Clarifin.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="h-14 px-8 rounded-full bg-white hover:bg-slate-50 text-indigo-900 shadow-xl text-lg font-bold w-full sm:w-auto transition-transform hover:scale-105">
              Create Free Account
            </Button>
            <p className="text-sm text-slate-400 mt-4 sm:mt-0 sm:ml-4">
              No credit card required. <br className="hidden sm:block"/> Takes 30 seconds.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center">
                  <PieChart className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl tracking-tight text-white">
                  Clarifin
                </span>
              </div>
              <p className="text-sm leading-relaxed mb-6">
                Clarity before commitment. <br/> The modern financial simulator.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Calculators</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <p>© {new Date().getFullYear()} Clarifin Inc. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

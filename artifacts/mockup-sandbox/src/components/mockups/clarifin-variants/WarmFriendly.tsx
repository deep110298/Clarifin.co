import { ArrowRight, Coffee, Heart, Sprout, TrendingUp, ShieldCheck, Check, Star } from "lucide-react";
import { Button } from "../../ui/button";
import { Card, CardContent } from "../../ui/card";

export function WarmFriendly() {
  return (
    <div className="min-h-screen bg-[#faf7f2] text-[#4a3b32] font-sans selection:bg-[#f3d9c4] selection:text-[#4a3b32]">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#d97736] flex items-center justify-center text-white">
            <Heart size={18} fill="currentColor" />
          </div>
          <span className="text-xl font-bold tracking-tight text-[#4a3b32]">Clarifin</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-[#6d5c53] font-medium">
          <a href="#features" className="hover:text-[#d97736] transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-[#d97736] transition-colors">How it works</a>
          <a href="#stories" className="hover:text-[#d97736] transition-colors">Stories</a>
        </div>
        <div className="flex items-center gap-4">
          <button className="hidden md:block text-[#6d5c53] font-medium hover:text-[#d97736] transition-colors">Log in</button>
          <Button className="bg-[#d97736] hover:bg-[#c4652c] text-white rounded-full px-6 font-medium border-0 shadow-sm">
            Try for free
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-8 max-w-xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#f3d9c4]/50 text-[#b55c22] text-sm font-medium">
            <Coffee size={16} />
            <span>Take a breath. Money doesn't have to be scary.</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight text-[#3d2e25] tracking-tight">
            Play with your money before you commit.
          </h1>
          <p className="text-lg md:text-xl text-[#6d5c53] leading-relaxed">
            Clarifin is a friendly sandbox for your financial decisions. Compare paying off debt versus investing, model a mortgage, or plan retirement—all in a safe, judgment-free space.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button className="bg-[#d97736] hover:bg-[#c4652c] text-white rounded-full px-8 py-6 text-lg font-medium border-0 shadow-sm h-auto">
              Start playing around
            </Button>
            <Button variant="outline" className="rounded-full px-8 py-6 text-lg font-medium border-[#e6decb] text-[#6d5c53] hover:bg-[#f3ead9] h-auto bg-white">
              See how it works
            </Button>
          </div>
          <div className="flex items-center gap-4 text-sm text-[#8c7b70]">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-[#faf7f2] bg-[#e6decb]" />
              ))}
            </div>
            <p>Joined by 10,000+ people finding peace of mind</p>
          </div>
        </div>
        <div className="relative">
          <div className="absolute inset-0 bg-[#f3d9c4] rounded-[3rem] transform rotate-3 scale-105"></div>
          <img 
            src="/__mockup/images/warm-hero.png" 
            alt="Cozy workspace" 
            className="relative z-10 w-full rounded-[2.5rem] shadow-xl border-4 border-white object-cover aspect-[4/3]"
          />
        </div>
      </section>

      {/* Social Proof */}
      <section className="bg-white/60 py-12 border-y border-[#e6decb]">
        <div className="container mx-auto px-6 text-center">
          <p className="text-[#8c7b70] font-medium mb-6">Trusted by people who used to hate spreadsheets</p>
          <div className="flex flex-wrap justify-center gap-12 opacity-60 grayscale contrast-125">
            {/* Logos represented by text for simplicity */}
            <span className="text-2xl font-bold font-serif">The Morning Brew</span>
            <span className="text-2xl font-bold tracking-widest">FORBES</span>
            <span className="text-2xl font-bold italic">TechCrunch</span>
            <span className="text-2xl font-bold">FastCompany</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-6 py-24">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-4xl font-extrabold text-[#3d2e25]">A safe space to ask "What if?"</h2>
          <p className="text-xl text-[#6d5c53]">No jargon, no pressure. Just clear answers to your biggest money questions.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <Sprout size={24} className="text-[#658d55]" />,
              title: "Debt vs. Investing",
              desc: "Should you pay off that 5% loan or put it in the market? See the actual numbers over 10 years.",
              color: "bg-[#e8f0e6]"
            },
            {
              icon: <Heart size={24} className="text-[#b55c22]" />,
              title: "Life Milestones",
              desc: "Model how buying a house, taking a sabbatical, or having a kid affects your long-term picture.",
              color: "bg-[#f3d9c4]/50"
            },
            {
              icon: <ShieldCheck size={24} className="text-[#597a8c]" />,
              title: "Retirement Reality",
              desc: "Find out exactly what you need to save to live comfortably. No complex math required.",
              color: "bg-[#e1eaf0]"
            }
          ].map((feature, i) => (
            <Card key={i} className="border-0 shadow-sm rounded-3xl bg-white overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-8 space-y-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${feature.color}`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-[#3d2e25]">{feature.title}</h3>
                <p className="text-[#6d5c53] leading-relaxed">{feature.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Split Feature */}
      <section className="container mx-auto px-6 py-16 md:py-24">
        <div className="bg-white rounded-[3rem] p-8 md:p-16 shadow-sm border border-[#e6decb] grid md:grid-cols-2 gap-16 items-center">
          <div>
            <img 
              src="/__mockup/images/warm-feature.png" 
              alt="Organic growth chart" 
              className="w-full rounded-[2rem] shadow-sm border-4 border-[#faf7f2]"
            />
          </div>
          <div className="space-y-6">
            <h2 className="text-4xl font-extrabold text-[#3d2e25]">See your future unfold.</h2>
            <p className="text-lg text-[#6d5c53] leading-relaxed">
              Our visual simulator takes your current numbers and paints a picture of your future. Drag sliders, change assumptions, and watch the charts update instantly. It's like a time machine for your bank account.
            </p>
            <ul className="space-y-4 pt-4">
              {["Visual, interactive timelines", "Adjust for inflation automatically", "Compare multiple scenarios side-by-side"].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-[#4a3b32] font-medium">
                  <div className="w-6 h-6 rounded-full bg-[#d97736] flex items-center justify-center text-white shrink-0">
                    <Check size={14} />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section id="stories" className="bg-[#f3d9c4]/30 py-24">
        <div className="container mx-auto px-6 max-w-4xl text-center space-y-8">
          <div className="flex justify-center gap-1 text-[#d97736]">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} size={24} fill="currentColor" />
            ))}
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-[#3d2e25] leading-tight">
            "I used to get anxiety just looking at my bank app. Clarifin made planning my finances feel like a cozy Sunday morning puzzle."
          </h2>
          <div className="flex flex-col items-center gap-4 pt-4">
            <img 
              src="/__mockup/images/warm-testimonial.png" 
              alt="Sarah M." 
              className="w-20 h-20 rounded-full border-4 border-white shadow-sm object-cover"
            />
            <div>
              <p className="font-bold text-[#4a3b32] text-lg">Sarah Jenkins</p>
              <p className="text-[#8c7b70]">Freelance Designer</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-24 text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-4xl md:text-5xl font-extrabold text-[#3d2e25]">Ready to find some clarity?</h2>
          <p className="text-xl text-[#6d5c53]">Join thousands of people who are making better financial decisions without the stress. It's free to try.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <Button className="bg-[#d97736] hover:bg-[#c4652c] text-white rounded-full px-8 py-6 text-lg font-medium border-0 shadow-sm h-auto inline-flex items-center gap-2">
              Start your free trial <ArrowRight size={20} />
            </Button>
          </div>
          <p className="text-sm text-[#8c7b70]">No credit card required. Cancel anytime.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e6decb] py-12 text-center text-[#8c7b70]">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Heart size={16} className="text-[#d97736]" fill="currentColor" />
            <span className="font-bold text-[#4a3b32]">Clarifin</span>
          </div>
          <p>© {new Date().getFullYear()} Clarifin. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-[#d97736] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#d97736] transition-colors">Terms</a>
            <a href="#" className="hover:text-[#d97736] transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

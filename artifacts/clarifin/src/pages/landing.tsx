import { motion } from "framer-motion";
import { ArrowRight, BarChart3, CheckCircle2, Compass, LineChart, PieChart, ShieldCheck, Sparkles, Target, Wallet, Home as HomeIcon, Baby, Briefcase, HelpCircle, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function LandingPage() {
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-background flex flex-col overflow-x-hidden">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="h-6 w-6 text-primary" />
            <span className="font-display font-semibold text-lg tracking-wide text-foreground">Clarifin</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#problem" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Why Clarifin?</a>
            <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">How it works</a>
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#use-cases" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Use Cases</a>
            <a href="#faq" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="hidden sm:inline-flex text-muted-foreground">Log in</Button>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6">
              Get Started
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-16">
        {/* Section 1: Hero */}
        <section className="relative pt-24 pb-32 md:pt-32 md:pb-48 overflow-hidden">
          <div className="container mx-auto px-6 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
              <motion.div 
                className="max-w-2xl"
                initial="initial"
                animate="animate"
                variants={staggerContainer}
              >
                <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary mb-6">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-sm font-medium">Clarity before commitment</span>
                </motion.div>
                
                <motion.h1 variants={fadeIn} className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] mb-6 text-foreground">
                  See your financial future <span className="text-primary italic font-light">before</span> it happens.
                </motion.h1>
                
                <motion.p variants={fadeIn} className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed max-w-lg">
                  Clarifin helps you simulate complex financial decisions in a calm, distraction-free space. Test scenarios, understand the impact, and decide with confidence.
                </motion.p>
                
                <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-center gap-4">
                  <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground rounded-full h-14 px-8 text-base">
                    Try the Simulator Free <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <p className="text-sm text-muted-foreground">No credit card required.</p>
                </motion.div>
              </motion.div>

              <motion.div 
                className="relative"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <div className="relative rounded-[2rem] overflow-hidden aspect-[4/3] md:aspect-square lg:aspect-[4/3] shadow-2xl ring-1 ring-border/50">
                  <div className="absolute inset-0 bg-gradient-to-tr from-secondary/5 to-transparent z-10" />
                  <img 
                    src="/images/hero-abstract.png" 
                    alt="Abstract financial simulation" 
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Floating elements */}
                <div className="absolute -left-8 top-1/4 bg-background/95 backdrop-blur-xl p-4 rounded-2xl shadow-xl ring-1 ring-border/50 animate-[bounce_8s_infinite]">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Target className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Scenario A</p>
                      <p className="text-sm font-bold">Invest $500/mo</p>
                    </div>
                  </div>
                </div>
                <div className="absolute -right-6 bottom-1/4 bg-background/95 backdrop-blur-xl p-4 rounded-2xl shadow-xl ring-1 ring-border/50 animate-[bounce_7s_infinite_0.5s]">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center">
                      <Wallet className="h-5 w-5 text-secondary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Scenario B</p>
                      <p className="text-sm font-bold">Pay off 7% debt</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
          {/* Background decoration */}
          <div className="absolute top-0 right-0 -z-10 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl opacity-50 translate-x-1/3 -translate-y-1/4" />
          <div className="absolute bottom-0 left-0 -z-10 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-3xl opacity-50 -translate-x-1/4 translate-y-1/4" />
        </section>

        {/* Section 2: The Problem / Empathy */}
        <section id="problem" className="py-24 bg-secondary/5">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Money shouldn't be a guessing game.</h2>
              <p className="text-lg text-muted-foreground">
                Spreadsheets are messy. Bank apps only show the past. We built Clarifin to give you a clear, calm space to map out your future—without the corporate jargon or anxiety-inducing charts.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <LineChart className="h-6 w-6 text-primary" />,
                  title: "See the ripple effects",
                  description: "Understand how a decision today impacts your net worth 5, 10, or 30 years from now."
                },
                {
                  icon: <PieChart className="h-6 w-6 text-primary" />,
                  title: "Compare side-by-side",
                  description: "Should you buy or rent? Invest or pay down the mortgage? Put them head-to-head instantly."
                },
                {
                  icon: <ShieldCheck className="h-6 w-6 text-primary" />,
                  title: "Safe, private exploration",
                  description: "No linked bank accounts required to start. Just pure, private simulation of your possibilities."
                }
              ].map((feature, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="bg-background rounded-3xl p-8 shadow-sm ring-1 ring-border/50 hover:shadow-md transition-shadow"
                >
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 3: Step-by-Step / How it works */}
        <section id="how-it-works" className="py-32">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center mb-20">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Simulate your life in three steps.</h2>
              <p className="text-lg text-muted-foreground">It’s easier than building a spreadsheet from scratch.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-12 relative">
              <div className="hidden md:block absolute top-1/2 left-[16.6%] right-[16.6%] h-px bg-border/80 -translate-y-1/2 z-0" />
              
              {[
                {
                  step: "01",
                  title: "Build your baseline",
                  desc: "Enter your current income, expenses, assets, and debts. We keep it simple."
                },
                {
                  step: "02",
                  title: "Create scenarios",
                  desc: "Add a new house, a baby, or a career change. Toggle variables to see what changes."
                },
                {
                  step: "03",
                  title: "Compare outcomes",
                  desc: "View clear, readable comparisons of your net worth over time."
                }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2, duration: 0.6 }}
                  className="relative z-10 flex flex-col items-center text-center bg-background p-6 rounded-3xl"
                >
                  <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mb-6 shadow-sm ring-4 ring-background">
                    <span className="text-xl font-bold text-secondary">{item.step}</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 4: Interactive / Visual Features */}
        <section id="features" className="py-24 bg-primary/5 relative overflow-hidden">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="order-2 lg:order-1"
              >
                <div className="relative rounded-[2rem] overflow-hidden aspect-[4/3] shadow-2xl ring-1 ring-border/50">
                  <img 
                    src="/images/clarity-path.png" 
                    alt="Path to clarity" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="order-1 lg:order-2"
              >
                <h2 className="text-3xl md:text-5xl font-bold mb-6">Find your path through the noise.</h2>
                <p className="text-lg text-muted-foreground mb-8">
                  We stripped away the aggressive trading interfaces and complex jargon to build a tool that feels like a quiet room. A place where you can sit down, lay out your options, and find the path that lets you sleep at night.
                </p>

                <ul className="space-y-4">
                  {[
                    "Intuitive drag-and-drop timeline builder",
                    "Real-time tax and inflation adjustments",
                    "Plain-English explanations of complex concepts",
                    "Exportable reports to share with partners"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                      <span className="text-foreground font-medium text-lg">{item}</span>
                    </li>
                  ))}
                </ul>

                <Button variant="link" className="mt-8 px-0 text-secondary hover:text-secondary/80 text-base font-semibold group">
                  Explore all features 
                  <ArrowUpRight className="ml-1 h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </Button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Section 5: Specific Use Cases */}
        <section id="use-cases" className="py-32">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">What will you simulate?</h2>
              <p className="text-lg text-muted-foreground">Every major life choice has a financial dimension. Clarifin helps you prepare for all of them.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: <HomeIcon className="h-8 w-8 text-primary" />, title: "Buying a Home", desc: "Should I put down 10% or 20%? 15-year or 30-year mortgage? How does HOA affect long-term wealth?" },
                { icon: <Baby className="h-8 w-8 text-secondary" />, title: "Starting a Family", desc: "Simulate the impact of daycare costs, lost income from leave, and 529 plan contributions." },
                { icon: <Briefcase className="h-8 w-8 text-primary" />, title: "Career Change", desc: "Is taking a pay cut for a job with better equity worth it? Simulate stock vesting schedules over time." }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="bg-card border border-border p-8 rounded-[2rem] hover:border-primary/30 transition-colors group cursor-pointer"
                >
                  <div className="mb-6">{item.icon}</div>
                  <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground mb-8">{item.desc}</p>
                  <div className="text-primary font-medium flex items-center group-hover:translate-x-2 transition-transform">
                    Try this scenario <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 6: Testimonial / Mood Section */}
        <section className="py-24 bg-primary/5">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <BarChart3 className="h-12 w-12 text-primary/40 mb-8" />
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground leading-tight">
                  "Finally, a financial tool that doesn't make my heart race. It's just... calm. And clear."
                </h2>
                <p className="text-lg text-muted-foreground font-medium">
                  — Sarah J., Early Adopter
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative rounded-[2rem] overflow-hidden aspect-[4/3] shadow-lg ring-1 ring-border/50"
              >
                <img 
                  src="/images/feature-calm.png" 
                  alt="Peaceful workspace" 
                  className="w-full h-full object-cover"
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Section 7: FAQ */}
        <section id="faq" className="py-32">
          <div className="container mx-auto px-6 max-w-4xl">
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center p-3 bg-secondary/10 rounded-full mb-6">
                <HelpCircle className="h-8 w-8 text-secondary" />
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Common Questions</h2>
              <p className="text-lg text-muted-foreground">Everything you need to know about Clarifin.</p>
            </div>

            <Accordion type="single" collapsible className="w-full">
              {[
                { q: "Do I need to link my bank accounts?", a: "No. You can manually enter your starting numbers. If you prefer automated tracking later, we offer optional, read-only bank connections via Plaid, but it is never required." },
                { q: "How accurate are the simulations?", a: "Our models account for historic inflation rates, federal and state tax brackets, and compound interest. While no tool can predict the exact future, Clarifin gives you a highly realistic estimate of your trajectory." },
                { q: "Can I share my scenarios with my partner?", a: "Yes. You can invite collaborators to your workspace so you can build and review scenarios together in real-time." },
                { q: "Is my data secure?", a: "We use bank-level 256-bit encryption. We never sell your data to third parties or use it to target you with credit card offers." }
              ].map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border-border">
                  <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline hover:text-primary transition-colors py-6">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-base leading-relaxed pb-6">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Section 8: Final CTA */}
        <section className="py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-secondary" />
          {/* Subtle background texture */}
          <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent" />
          
          <div className="container mx-auto px-6 relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl mx-auto bg-white/5 backdrop-blur-md border border-white/10 p-12 md:p-16 rounded-[3rem]"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready for financial clarity?
              </h2>
              <p className="text-xl text-white/80 mb-10 leading-relaxed">
                Stop guessing. Start simulating. Join thousands of people making better financial decisions with Clarifin.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground rounded-full h-14 px-8 text-lg font-medium shadow-xl shadow-primary/20">
                  Start Simulating Now
                </Button>
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/20 text-white hover:bg-white/10 hover:text-white rounded-full h-14 px-8 text-lg font-medium backdrop-blur-sm">
                  View Demo
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-background border-t border-border py-12 md:py-16">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
            <div className="flex items-center gap-2">
              <Compass className="h-8 w-8 text-primary" />
              <span className="font-display font-semibold text-2xl tracking-wide">Clarifin</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
              <div className="flex flex-col gap-3">
                <span className="font-bold text-foreground">Product</span>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Simulator</a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Pricing</a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Security</a>
              </div>
              <div className="flex flex-col gap-3">
                <span className="font-bold text-foreground">Company</span>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">About</a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Blog</a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Careers</a>
              </div>
              <div className="flex flex-col gap-3">
                <span className="font-bold text-foreground">Resources</span>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Guides</a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Help Center</a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Contact</a>
              </div>
              <div className="flex flex-col gap-3">
                <span className="font-bold text-foreground">Legal</span>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Privacy</a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Terms</a>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Clarifin Inc. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-muted-foreground">
              <span className="text-sm">Built with clarity in mind.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

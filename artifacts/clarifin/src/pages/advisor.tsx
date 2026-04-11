import { useState, useRef, useEffect, FormEvent } from "react";
import { Send, Sparkles, User, TrendingUp, DollarSign, Home, GraduationCap, RefreshCw } from "lucide-react";
import { AppLayout } from "@/components/app/AppLayout";
import { useStore } from "@/lib/store";
import type { ChatMessage } from "@/lib/store";
import { calculateMonthlyTakeHome, formatCurrency } from "@/lib/financial-engine";
import { cn } from "@/lib/utils";
import { customFetch } from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// ── Mock AI responses ──────────────────────────────────────────────────────
// Wire this to the Claude API by replacing `getMockResponse` with a fetch
// to POST /api/advisor with { messages, profile }. The API server should
// call Anthropic's Messages API with the financial profile as system context.

function getMockResponse(question: string, ctx: { monthlyTakeHome: number; monthlySurplus: number; netWorth: number }): string {
  const q = question.toLowerCase();

  if (q.includes("travel") || q.includes("time off") || q.includes("sabbatical") || q.includes("6 months")) {
    return `Taking 6 months off has a real but manageable cost. Here's the math on your situation:\n\n**Direct income loss:** You'd forgo roughly ${formatCurrency(ctx.monthlyTakeHome * 6)} in take-home pay.\n\n**Savings gap:** Based on your current ${formatCurrency(ctx.monthlySurplus)}/month surplus, you'd miss out on ~${formatCurrency(ctx.monthlySurplus * 6)} in contributions.\n\n**Total cost over 20 years:** When you factor in lost compounding at 7%, a 6-month break today costs approximately ${formatCurrency(ctx.monthlySurplus * 6 * 3.8)} in future net worth.\n\n**My take:** This is likely worth it if it prevents burnout or enables a career pivot. I'd recommend building a 6-month emergency buffer first. Would you like me to model a specific scenario?`;
  }

  if (q.includes("house") || q.includes("home") || q.includes("mortgage") || q.includes("buy") || q.includes("rent")) {
    return `The rent vs. buy decision is more nuanced than most people think. A few things to consider:\n\n**Break-even point:** In most markets, you need to stay 5–7 years for buying to beat renting financially. This assumes ~2.5% annual appreciation and accounts for transaction costs.\n\n**The opportunity cost:** Every dollar in a down payment isn't invested in the market. A $100k down payment at 7% average annual return would grow to ~$550k in 30 years.\n\n**Your current situation:** With ${formatCurrency(ctx.netWorth)} in net worth, you'd want to ensure your down payment doesn't eliminate your emergency fund.\n\n**My recommendation:** Use the Scenario Builder to model a specific property. Input the home price, down payment, and your local mortgage rate — I can help you interpret the results.`;
  }

  if (q.includes("retire") || q.includes("fire") || q.includes("financial independence")) {
    const yearsToMillion = ctx.monthlySurplus > 0 ? Math.ceil(Math.log(1_000_000 / Math.max(ctx.netWorth, 1)) / Math.log(1.07)) : 99;
    return `Here's your retirement picture based on current numbers:\n\n**Current monthly surplus:** ${formatCurrency(ctx.monthlySurplus)}\n**Estimated net worth:** ${formatCurrency(ctx.netWorth)}\n\n**Rule of 25:** For financial independence, you need 25x your annual expenses saved. That's roughly ${formatCurrency(12 * (ctx.monthlyTakeHome - ctx.monthlySurplus) * 25)} in your case.\n\n**Key levers:**\n- Increasing your savings rate by 5% is worth more than a 5% raise — model it in Scenarios.\n- Employer 401k match is an instant 50–100% return. Max it first.\n- The earlier you invest, the more compounding works for you.\n\nWould you like me to model what happens if you increase your retirement contributions?`;
  }

  if (q.includes("debt") || q.includes("student loan") || q.includes("credit card") || q.includes("pay off")) {
    return `The "pay off debt vs. invest" question has a mathematical answer:\n\n**The rule:** If your debt interest rate > expected investment return, pay off debt first. If it's lower, invest the difference.\n\n**In practice:**\n- Credit card debt (18–25% APR) → always pay off first\n- Student loans (4–7%) → borderline — pay minimum, invest the rest\n- Mortgage (6–7%) → roughly equal to market returns; both are fine\n\n**Your situation:** Every extra $1,000 toward high-interest debt gives you a guaranteed return equal to that interest rate. The stock market averages 7–10% but isn't guaranteed.\n\n**My recommendation:** Eliminate any credit card debt immediately (it's a guaranteed 20%+ return). For student loans, make minimum payments and invest the surplus in a low-cost index fund.`;
  }

  if (q.includes("raise") || q.includes("salary") || q.includes("job offer") || q.includes("negotiate")) {
    return `Salary negotiations are one of the highest-ROI financial moves you can make. Here's why:\n\n**The lifetime effect:** A $10,000 raise today — assuming 3% annual increases — compounds to **${formatCurrency(10000 * 30 * 1.5)}+** in total additional lifetime earnings.\n\n**After-tax reality:** A $10k gross raise is roughly ${formatCurrency(10000 * 0.68)} after federal/FICA taxes — still significant.\n\n**How to use Clarifin:** Go to Scenario Builder → Job Change. Enter your current salary vs. the offer. I'll show you the true 20-year impact after taxes and any cost-of-living difference.\n\n**Negotiation tip:** Your first offer is almost never the best offer. Counter at 10–15% above the offer. The worst they say is no.`;
  }

  return `That's a great question. To give you the most accurate answer, I'd need a bit more context about your specific situation.\n\nHere's what I know from your financial profile:\n- **Monthly take-home:** ${formatCurrency(ctx.monthlyTakeHome)}\n- **Monthly surplus:** ${formatCurrency(ctx.monthlySurplus)}\n- **Net worth:** ${formatCurrency(ctx.netWorth)}\n\nTo model the specific impact of what you're asking, try the Scenario Builder — it lets you input exact numbers and see the 30-year projection side by side.\n\nIf you can tell me more about your specific decision (amounts, timelines, alternatives), I can give you a much more precise analysis.`;
}

const SUGGESTED = [
  { icon: TrendingUp, text: "What if I took 6 months off to travel?" },
  { icon: Home, text: "Should I buy a home or keep renting?" },
  { icon: DollarSign, text: "Should I pay off debt or invest?" },
  { icon: GraduationCap, text: "How does going back to school affect retirement?" },
];

// ── Message bubble ─────────────────────────────────────────────────────────
function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div className={cn(
        "w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-sm font-semibold",
        isUser ? "bg-[#1A1A2E] text-white" : "bg-[#FACC15] text-[#1A1A2E]"
      )}>
        {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
      </div>
      <div className={cn(
        "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
        isUser
          ? "bg-[#1A1A2E] text-white rounded-tr-sm"
          : "bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm"
      )}>
        {msg.content.split("\n").map((line, i) => {
          if (line.startsWith("**") && line.endsWith("**")) {
            return <p key={i} className="font-semibold mt-2 mb-0.5">{line.slice(2, -2)}</p>;
          }
          if (line.startsWith("- ") || line.startsWith("• ")) {
            return <p key={i} className="ml-3">• {line.slice(2)}</p>;
          }
          // inline bold
          const parts = line.split(/\*\*(.*?)\*\*/g);
          return (
            <p key={i} className={i > 0 ? "mt-1" : ""}>
              {parts.map((part, j) =>
                j % 2 === 1 ? <strong key={j}>{part}</strong> : part
              )}
            </p>
          );
        })}
      </div>
    </div>
  );
}

// ── Typing indicator ───────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-full bg-[#FACC15] flex items-center justify-center">
        <Sparkles className="w-4 h-4 text-[#1A1A2E]" />
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center h-5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── DB chat message shape ──────────────────────────────────────────────────
interface DbChatMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

function dbMsgToChat(m: DbChatMessage): ChatMessage {
  return { id: m.id, role: m.role as "user" | "assistant", content: m.content, timestamp: m.createdAt };
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function AdvisorPage() {
  const { profile, scenarios, chatHistory, addChatMessage, clearChat } = useStore();
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const totalDebt = profile.creditCardDebt + profile.studentLoans + profile.carLoans + profile.otherDebt;
  const netWorth = profile.emergencyFund + profile.retirementBalance + profile.otherInvestments - totalDebt;
  const monthlyTakeHome = calculateMonthlyTakeHome(profile.grossIncome, profile.filingStatus, profile.state);
  const totalExpenses = profile.housing + profile.transport + profile.food + profile.utilities + profile.healthcare + profile.otherExpenses;
  const monthlySurplus = monthlyTakeHome - totalExpenses;

  useQuery({ queryKey: ["me"], queryFn: () => customFetch<{ plan: string }>("/api/me") });

  // Load chat history from DB on mount; seed local store if it's empty
  const { data: dbHistory } = useQuery({
    queryKey: ["chat"],
    queryFn: () => customFetch<DbChatMessage[]>("/api/chat"),
  });

  useEffect(() => {
    if (dbHistory && chatHistory.length === 0 && dbHistory.length > 0) {
      dbHistory.forEach(m => addChatMessage(dbMsgToChat(m)));
    }
  }, [dbHistory]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isTyping]);

  const handleClearChat = async () => {
    clearChat();
    try {
      await customFetch("/api/chat", { method: "DELETE" });
      qc.invalidateQueries({ queryKey: ["chat"] });
    } catch {
      // best-effort
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };
    addChatMessage(userMsg);
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: chatHistory.slice(-10).map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (res.status === 402) {
        addChatMessage({
          id: `msg-${Date.now()}-gate`,
          role: "assistant",
          content: "You've used your **5 free questions**. Upgrade to Pro to unlock unlimited AI Advisor conversations and get the most out of your financial planning.",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const { reply } = await res.json() as { reply: string };
      addChatMessage({
        id: `msg-${Date.now()}-ai`,
        role: "assistant",
        content: reply,
        timestamp: new Date().toISOString(),
      });
    } catch {
      addChatMessage({
        id: `msg-${Date.now()}-err`,
        role: "assistant",
        content: "Something went wrong connecting to the AI. Please check your connection and try again.",
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto h-[calc(100vh-130px)] flex gap-5">
        {/* Left: Profile panel */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0 space-y-4">
          {/* Profile summary */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#1A1A2E] flex items-center justify-center text-white font-bold">
                D
              </div>
              <div>
                <div className="text-sm font-semibold text-[#1A1A2E]">Your Profile</div>
                <div className="text-xs text-gray-400">{profile.state} · {profile.filingStatus}</div>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { label: "Gross Income", value: formatCurrency(profile.grossIncome) },
                { label: "Take-home/mo", value: formatCurrency(monthlyTakeHome) },
                { label: "Monthly surplus", value: formatCurrency(monthlySurplus), positive: monthlySurplus >= 0 },
                { label: "Net Worth", value: formatCurrency(netWorth), positive: netWorth >= 0 },
                { label: "Total Debt", value: formatCurrency(totalDebt) },
              ].map(({ label, value, positive }) => (
                <div key={label} className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">{label}</span>
                  <span className={cn(
                    "font-semibold",
                    positive === true ? "text-green-500" : positive === false ? "text-red-500" : "text-[#1A1A2E]"
                  )}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Scenarios */}
          {scenarios.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Your Scenarios</div>
              <div className="space-y-1">
                {scenarios.slice(0, 4).map((s) => (
                  <div
                    key={s.id}
                    className="text-xs text-gray-600 hover:text-[#FACC15] cursor-pointer py-1 truncate transition-colors"
                    onClick={() => sendMessage(`Tell me about my "${s.name}" scenario`)}
                  >
                    → {s.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested questions */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Suggested questions</div>
            <div className="space-y-1.5">
              {SUGGESTED.map(({ icon: Icon, text }) => (
                <button
                  key={text}
                  onClick={() => sendMessage(text)}
                  className="w-full text-left text-xs text-gray-600 hover:text-[#FACC15] flex items-start gap-2 py-1.5 hover:bg-[#FACC15]/5 rounded-xl px-2 transition-colors"
                >
                  <Icon className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#FACC15]" />
                  {text}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Right: Chat */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-w-0">
          {/* Chat header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-[#1A1A2E]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#FACC15]/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[#FACC15]" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Clarifin AI Advisor</div>
                <div className="text-xs text-white/50">Context-aware financial coach</div>
              </div>
            </div>
            <button
              onClick={handleClearChat}
              className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors"
              title="Clear chat"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Clear
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#F4F6F8]">
            {chatHistory.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-14 h-14 rounded-2xl bg-[#FACC15]/10 flex items-center justify-center mb-4">
                  <Sparkles className="w-7 h-7 text-[#FACC15]" />
                </div>
                <h3 className="font-semibold text-[#1A1A2E] mb-2">Ask me anything about your finances</h3>
                <p className="text-sm text-gray-400 max-w-xs mb-6">
                  I know your financial profile and can model the impact of any life decision.
                </p>
                <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                  {SUGGESTED.map(({ icon: Icon, text }) => (
                    <button
                      key={text}
                      onClick={() => sendMessage(text)}
                      className="text-left text-xs bg-white border border-gray-200 hover:border-[#FACC15]/30 hover:bg-[#FACC15]/5 rounded-2xl p-3 flex items-start gap-2 transition-colors"
                    >
                      <Icon className="w-4 h-4 text-[#FACC15] shrink-0 mt-0.5" />
                      <span className="text-gray-600">{text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {chatHistory.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}

            {isTyping && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex items-center gap-3 p-4 border-t border-gray-100 bg-white">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your finances..."
              disabled={isTyping}
              className="flex-1 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FACC15]/30 focus:border-[#FACC15] disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="w-10 h-10 rounded-2xl bg-[#FACC15] hover:bg-yellow-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            >
              <Send className="w-4 h-4 text-[#1A1A2E]" />
            </button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}

import { useState, useRef, useEffect, FormEvent } from "react";
import { Send, Sparkles, User, TrendingUp, DollarSign, Home, GraduationCap, RefreshCw } from "lucide-react";
import { AppLayout } from "@/components/app/AppLayout";
import { UserAvatar } from "@/components/app/UserAvatar";
import { useStore } from "@/lib/store";
import type { ChatMessage } from "@/lib/store";
import { calculateMonthlyTakeHome, formatCurrency } from "@/lib/financial-engine";
import { cn } from "@/lib/utils";
import { customFetch } from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const SUGGESTED = [
  { icon: TrendingUp, text: "What if I took 6 months off to travel?" },
  { icon: Home, text: "Should I buy a home or keep renting?" },
  { icon: DollarSign, text: "Should I pay off debt or invest?" },
  { icon: GraduationCap, text: "How does going back to school affect retirement?" },
];

// ── Inline markdown renderer (bold only) ───────────────────────────────────
function InlineText({ text }: { text: string }) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return (
    <>
      {parts.map((part, j) =>
        j % 2 === 1 ? <strong key={j}>{part}</strong> : part
      )}
    </>
  );
}

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
          // Divider
          if (/^---+$/.test(line.trim())) {
            return <hr key={i} className="my-2 border-gray-200" />;
          }
          // Heading line (standalone **text**)
          if (/^\*\*[^*]+\*\*$/.test(line.trim())) {
            return <p key={i} className="font-semibold mt-2 mb-0.5"><InlineText text={line.trim().slice(2, -2)} /></p>;
          }
          // Bullet — strip leading `- ` or `• ` then render with inline bold
          if (line.startsWith("- ") || line.startsWith("• ")) {
            return (
              <p key={i} className="ml-3 mt-0.5">
                <span className="mr-1.5">•</span>
                <InlineText text={line.slice(2)} />
              </p>
            );
          }
          // Blank line → spacing
          if (line.trim() === "") {
            return <div key={i} className="h-1" />;
          }
          // Default paragraph with inline bold
          return (
            <p key={i} className={i > 0 ? "mt-1" : ""}>
              <InlineText text={line} />
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
    try {
      await customFetch("/api/chat", { method: "DELETE" });
      clearChat(); // only clear local state after server confirms deletion
      qc.invalidateQueries({ queryKey: ["chat"] });
    } catch {
      // best-effort: if DELETE fails, leave messages as-is so UI stays consistent
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };
    addChatMessage(userMsg);
    setInput("");
    setIsTyping(true);

    try {
      // Use customFetch so Clerk auth token is included in the request
      const { reply } = await customFetch<{ reply: string }>("/api/advisor", {
        method: "POST",
        body: JSON.stringify({
          message: text,
          history: chatHistory.slice(-10).map(m => ({ role: m.role, content: m.content })),
        }),
      });
      addChatMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        content: reply,
        timestamp: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      const content = status === 402
        ? "You've used your **5 free questions**. Upgrade to Plus to unlock unlimited AI Advisor conversations."
        : "Something went wrong connecting to the AI. Please check your connection and try again.";
      addChatMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        content,
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
              <UserAvatar size="md" />
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

import { useState, useRef, useEffect, FormEvent } from "react";
import { Send, Sparkles, User, TrendingUp, DollarSign, Home, GraduationCap, RefreshCw } from "lucide-react";
import { AppLayout } from "@/components/app/AppLayout";
import { useStore } from "@/lib/store";
import type { ChatMessage } from "@/lib/store";
import { calculateMonthlyTakeHome, formatCurrency } from "@/lib/financial-engine";
import { customFetch } from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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

const SUGGESTED = [
  { icon: TrendingUp, text: "What if I took 6 months off to travel?" },
  { icon: Home, text: "Should I buy a home or keep renting?" },
  { icon: DollarSign, text: "Should I pay off debt or invest?" },
  { icon: GraduationCap, text: "How does going back to school affect retirement?" },
];

// ── Inline markdown renderer ─────────────────────────────────
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

// ── Message bubble ────────────────────────────────────────────
function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", gap: 12, flexDirection: isUser ? "row-reverse" : "row" }}>
      {/* Avatar */}
      <div style={{
        width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
        background: isUser ? T.ink : T.cream,
        display: "flex", alignItems: "center", justifyContent: "center",
        border: `1px solid ${T.line}`,
      }}>
        {isUser
          ? <User style={{ width: 13, height: 13, color: T.paper }} />
          : <Sparkles style={{ width: 13, height: 13, color: T.ink }} />
        }
      </div>
      {/* Bubble */}
      <div style={{
        maxWidth: "78%", padding: "12px 16px",
        background: isUser ? T.ink : T.panel,
        border: `1px solid ${isUser ? "transparent" : T.line}`,
        color: isUser ? T.paper : T.ink,
        fontFamily: BODY, fontSize: 13.5, lineHeight: 1.6,
      }}>
        {msg.content.split("\n").map((line, i) => {
          if (/^---+$/.test(line.trim())) return <hr key={i} style={{ margin: "8px 0", borderColor: T.line }} />;
          if (/^\*\*[^*]+\*\*$/.test(line.trim())) {
            return <p key={i} style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", margin: "8px 0 4px" }}>
              <InlineText text={line.trim().slice(2, -2)} />
            </p>;
          }
          if (line.startsWith("- ") || line.startsWith("• ")) {
            return <p key={i} style={{ marginLeft: 12, marginTop: 4 }}>
              <span style={{ marginRight: 6 }}>·</span>
              <InlineText text={line.slice(2)} />
            </p>;
          }
          if (line.trim() === "") return <div key={i} style={{ height: 6 }} />;
          return <p key={i} style={{ marginTop: i > 0 ? 4 : 0 }}><InlineText text={line} /></p>;
        })}
      </div>
    </div>
  );
}

// ── Typing indicator ──────────────────────────────────────────
function TypingIndicator() {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <div style={{
        width: 28, height: 28, borderRadius: "50%", background: T.cream,
        border: `1px solid ${T.line}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Sparkles style={{ width: 13, height: 13, color: T.ink }} />
      </div>
      <div style={{ background: T.panel, border: `1px solid ${T.line}`, padding: "12px 16px" }}>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                width: 5, height: 5, borderRadius: "50%", background: T.mute,
                display: "inline-block", animation: "bounce 1.2s infinite",
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface DbChatMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

function dbMsgToChat(m: DbChatMessage): ChatMessage {
  return { id: m.id, role: m.role as "user" | "assistant", content: m.content, timestamp: m.createdAt };
}

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

  const { data: dbHistory } = useQuery({
    queryKey: ["chat"],
    queryFn: () => customFetch<DbChatMessage[]>("/api/chat"),
  });

  useEffect(() => {
    if (dbHistory && chatHistory.length === 0 && dbHistory.length > 0) {
      dbHistory.forEach((m: DbChatMessage) => addChatMessage(dbMsgToChat(m)));
    }
  }, [dbHistory]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isTyping]);

  const handleClearChat = async () => {
    try {
      await customFetch("/api/chat", { method: "DELETE" });
      clearChat();
      qc.invalidateQueries({ queryKey: ["chat"] });
    } catch {
      // best-effort
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
        : "Something went wrong. Please check your connection and try again.";
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
      <div style={{ maxWidth: 1100, margin: "0 auto", height: "calc(100vh - 170px)", display: "flex", gap: 20, fontFamily: BODY }}>

        {/* Left sidebar */}
        <aside style={{ width: 240, flexShrink: 0, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Label + heading */}
          <div>
            <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.18em", color: T.mute, marginBottom: 6 }}>
              ASK CLARIFIN
            </div>
            <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 20, color: T.ink, lineHeight: 1.3 }}>
              A context-aware financial coach.
            </div>
          </div>

          {/* Profile summary */}
          <div style={{ background: T.panel, border: `1px solid ${T.line}`, padding: "16px 18px" }}>
            <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.16em", color: T.mute, marginBottom: 10 }}>
              YOUR PROFILE
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Gross Income", value: formatCurrency(profile.grossIncome) },
                { label: "Take-home/mo", value: formatCurrency(monthlyTakeHome) },
                { label: "Monthly surplus", value: formatCurrency(monthlySurplus) },
                { label: "Net Worth", value: formatCurrency(netWorth) },
                { label: "Total Debt", value: formatCurrency(totalDebt) },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11.5, color: T.ink2 }}>{label}</span>
                  <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", color: T.ink }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested prompts */}
          <div style={{ background: T.panel, border: `1px solid ${T.line}`, padding: "16px 18px" }}>
            <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.16em", color: T.mute, marginBottom: 12 }}>
              SUGGESTED QUESTIONS
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {SUGGESTED.map(({ icon: Icon, text }) => (
                <button
                  key={text}
                  onClick={() => sendMessage(text)}
                  style={{
                    textAlign: "left", background: "none", border: `1px solid ${T.line}`,
                    padding: "9px 12px", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 8,
                    transition: "background 0.15s, border-color 0.15s",
                    borderRadius: 0,
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = T.cream; (e.currentTarget as HTMLElement).style.borderColor = T.ink; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "none"; (e.currentTarget as HTMLElement).style.borderColor = T.line; }}
                >
                  <Icon style={{ width: 12, height: 12, color: T.mute, flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontFamily: BODY, fontSize: 12, color: T.ink2, lineHeight: 1.4 }}>{text}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Chat area */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          background: T.panel, border: `1px solid ${T.line}`, overflow: "hidden",
          minWidth: 0,
        }}>
          {/* Chat header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 20px", background: T.ink, borderBottom: `1px solid rgba(238,238,236,0.1)`,
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Sparkles style={{ width: 16, height: 16, color: T.mute }} />
              <div>
                <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.16em", color: "rgba(238,238,236,0.6)" }}>
                  CLARIFIN AI ADVISOR
                </div>
              </div>
            </div>
            <button
              onClick={handleClearChat}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "none", border: "none", cursor: "pointer",
                fontFamily: MONO, fontSize: 9, letterSpacing: "0.14em",
                color: "rgba(238,238,236,0.45)",
              }}
            >
              <RefreshCw style={{ width: 12, height: 12 }} />
              CLEAR
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
            {chatHistory.length === 0 && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", padding: "40px 20px" }}>
                <Sparkles style={{ width: 28, height: 28, color: T.mute, marginBottom: 16 }} />
                <div style={{ fontFamily: SERIF, fontSize: 26, color: T.ink, marginBottom: 8 }}>Ask me anything.</div>
                <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 16, color: T.ink2, maxWidth: 320, lineHeight: 1.5 }}>
                  I know your financial profile and can model the impact of any life decision.
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
          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex", alignItems: "center", gap: 0,
              borderTop: `1px solid ${T.line}`, flexShrink: 0,
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your finances…"
              disabled={isTyping}
              style={{
                flex: 1, border: "none", background: T.paper,
                padding: "16px 20px", fontFamily: BODY, fontSize: 14, color: T.ink,
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              style={{
                width: 56, height: 52, background: T.ink, border: "none",
                cursor: !input.trim() || isTyping ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                opacity: !input.trim() || isTyping ? 0.4 : 1,
                flexShrink: 0, borderRadius: 0,
              }}
            >
              <Send style={{ width: 16, height: 16, color: T.paper }} />
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-4px); }
        }
      `}</style>
    </AppLayout>
  );
}

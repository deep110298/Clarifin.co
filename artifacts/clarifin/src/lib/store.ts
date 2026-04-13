import { createContext, useContext, useState, useEffect, useCallback, ReactNode, createElement } from "react";

// ── Types ──────────────────────────────────────────────────────────────────

export type FilingStatus = "single" | "married" | "head";

export interface FinancialProfile {
  // Income
  grossIncome: number;
  filingStatus: FilingStatus;
  state: string;
  age: number;
  // Monthly expenses
  housing: number;
  transport: number;
  food: number;
  utilities: number;
  healthcare: number;
  otherExpenses: number;
  // Savings & debt
  emergencyFund: number;
  retirementBalance: number;
  monthlyRetirementContrib: number;
  otherInvestments: number;
  creditCardDebt: number;
  studentLoans: number;
  carLoans: number;
  otherDebt: number;
  isComplete: boolean;
}

export type ScenarioType =
  | "job-change"
  | "buy-home"
  | "school"
  | "child"
  | "time-off"
  | "custom";

export interface Scenario {
  id: string;
  name: string;
  type: ScenarioType;
  createdAt: string;
  current: {
    income: number;
    city: string;
    monthlyHousing: number;
    [key: string]: unknown;
  };
  proposed: {
    income: number;
    city: string;
    monthlyHousing: number;
    movingCost?: number;
    homePurchasePrice?: number;
    downPayment?: number;
    mortgageRate?: number;
    loanTermYears?: number;
    [key: string]: unknown;
  };
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

// ── Defaults ──────────────────────────────────────────────────────────────

const DEFAULT_PROFILE: FinancialProfile = {
  grossIncome: 0,
  filingStatus: "single",
  state: "TX",
  age: 30,
  housing: 0,
  transport: 0,
  food: 0,
  utilities: 0,
  healthcare: 0,
  otherExpenses: 0,
  emergencyFund: 0,
  retirementBalance: 0,
  monthlyRetirementContrib: 0,
  otherInvestments: 0,
  creditCardDebt: 0,
  studentLoans: 0,
  carLoans: 0,
  otherDebt: 0,
  isComplete: false,
};


// ── Context ───────────────────────────────────────────────────────────────

interface AppStore {
  profile: FinancialProfile;
  scenarios: Scenario[];
  chatHistory: ChatMessage[];
  setProfile: (p: Partial<FinancialProfile>) => void;
  addScenario: (s: Scenario) => void;
  updateScenario: (id: string, updates: Partial<Scenario>) => void;
  deleteScenario: (id: string) => void;
  addChatMessage: (msg: ChatMessage) => void;
  clearChat: () => void;
}

const StoreContext = createContext<AppStore | null>(null);

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<FinancialProfile>(() =>
    load("clarifin_profile", DEFAULT_PROFILE)
  );
  const [scenarios, setScenarios] = useState<Scenario[]>(() =>
    load("clarifin_scenarios", [])
  );
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() =>
    load("clarifin_chat", [])
  );

  useEffect(() => { save("clarifin_profile", profile); }, [profile]);
  useEffect(() => { save("clarifin_scenarios", scenarios); }, [scenarios]);
  useEffect(() => { save("clarifin_chat", chatHistory); }, [chatHistory]);

  const setProfile = useCallback((updates: Partial<FinancialProfile>) => {
    setProfileState((p) => ({ ...p, ...updates }));
  }, []);

  const addScenario = useCallback((s: Scenario) => {
    setScenarios((prev) => [s, ...prev]);
  }, []);

  const updateScenario = useCallback((id: string, updates: Partial<Scenario>) => {
    setScenarios((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  }, []);

  const deleteScenario = useCallback((id: string) => {
    setScenarios((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const addChatMessage = useCallback((msg: ChatMessage) => {
    setChatHistory((prev) => [...prev, msg]);
  }, []);

  const clearChat = useCallback(() => setChatHistory([]), []);

  const value: AppStore = {
    profile,
    scenarios,
    chatHistory,
    setProfile,
    addScenario,
    updateScenario,
    deleteScenario,
    addChatMessage,
    clearChat,
  };

  return createElement(StoreContext.Provider, { value }, children);
}

export function useStore(): AppStore {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

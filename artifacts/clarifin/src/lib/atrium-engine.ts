// Clarifin Atrium — simulation engine + design tokens (TypeScript port)

export const T = {
  paper: "#eeeeec",
  cream: "#dfdfdb",
  panel: "#f4f4f1",
  ink: "#0a0a09",
  ink2: "#33332f",
  line: "rgba(10,10,9,0.12)",
  line2: "rgba(10,10,9,0.26)",
  accent: "#0a0a09",
  accent2: "#5a5a55",
  gold: "#7a7a72",
  sage: "#3a3a35",
  claret: "#5a3a3a",
  mute: "rgba(10,10,9,0.55)",
};

export const F = {
  display: '"Cormorant Garamond", "EB Garamond", Georgia, serif',
};
export const FONT_BODY = '"Geist", "Inter", system-ui, sans-serif';
export const FONT_MONO = '"JetBrains Mono", ui-monospace, monospace';

export interface AtriumEvent {
  id: string;
  age: number;
  label: string;
  note: string;
  kind: "anchor" | "retire" | "income-gap" | "expense";
  delta: number;
  dur: number;
}

export interface AtriumScenario {
  id: string;
  name: string;
  age: number;
  retireAge: number;
  endAge: number;
  income: number;
  saveRate: number;
  spend: number;
  netWorth: number;
  ret: number;
  vol: number;
  preset: string;
  events: AtriumEvent[];
}

export interface PathPoint {
  age: number;
  nw: number;
  lo: number;
  hi: number;
  contrib: number;
  withdraw: number;
  working: boolean;
}

export interface AtriumResult {
  path: PathPoint[];
  ruinAge: number | null;
  peak: PathPoint;
  atRetire: PathPoint;
  legacy: number;
  scenario: AtriumScenario;
}

export const DEFAULT_EVENTS: AtriumEvent[] = [
  { id: "e0", age: 34, label: "today", note: "household, 2 incomes", kind: "anchor", delta: 0, dur: 0 },
  { id: "e1", age: 41, label: "a quiet year", note: "12 months off, unpaid", kind: "income-gap", delta: -200000, dur: 1 },
  { id: "e2", age: 48, label: "eldest at uni", note: "4 years · private", kind: "expense", delta: -55000, dur: 4 },
  { id: "e3", age: 58, label: "retire", note: "travel + garden", kind: "retire", delta: 0, dur: 0 },
  { id: "e4", age: 72, label: "care reserve", note: "+20% annual spend", kind: "expense", delta: -16000, dur: 20 },
  { id: "e5", age: 92, label: "legacy", note: "pass to family", kind: "anchor", delta: 0, dur: 0 },
];

export const DEFAULT_SCENARIO: AtriumScenario = {
  id: "s-baseline",
  name: "Baseline",
  age: 34,
  retireAge: 58,
  endAge: 92,
  income: 220000,
  saveRate: 0.28,
  spend: 84000,
  netWorth: 312000,
  ret: 0.066,
  vol: 0.11,
  preset: "balanced",
  events: DEFAULT_EVENTS,
};

export const SECOND_SCENARIO: AtriumScenario = {
  ...DEFAULT_SCENARIO,
  id: "s-early",
  name: "Early retirement",
  retireAge: 52,
  saveRate: 0.35,
};

export function simulateAtrium(s: AtriumScenario): AtriumResult {
  const years = s.endAge - s.age + 1;
  const path: PathPoint[] = [];
  let nw = s.netWorth;

  for (let i = 0; i < years; i++) {
    const a = s.age + i;
    const working = a < s.retireAge;
    let contrib = working ? s.income * s.saveRate : 0;
    let withdraw = working ? 0 : s.spend;

    s.events.forEach((e) => {
      if (e.kind === "income-gap" && a >= e.age && a < e.age + e.dur) {
        contrib = 0;
        withdraw += Math.abs(e.delta);
      }
      if (e.kind === "expense" && a >= e.age && a < e.age + e.dur) {
        withdraw += Math.abs(e.delta);
      }
    });

    nw = nw * (1 + s.ret) + contrib - withdraw;
    const t = i + 1;
    const sigma = s.vol * Math.sqrt(t);
    path.push({
      age: a,
      nw,
      lo: nw * Math.exp(-sigma),
      hi: nw * Math.exp(sigma),
      contrib,
      withdraw,
      working,
    });
  }

  const ruinAge = path.find((p) => p.nw < 0)?.age ?? null;
  const peak = path.reduce((m, p) => (p.nw > m.nw ? p : m), path[0]);
  const atRetire = path.find((p) => p.age === s.retireAge) ?? path[0];
  const legacy = path[path.length - 1]?.nw ?? 0;
  return { path, ruinAge, peak, atRetire, legacy, scenario: s };
}

export function fmtA(n: number | null | undefined, opts: { short?: boolean } = {}): string {
  const { short = false } = opts;
  if (n === null || n === undefined || isNaN(n)) return "—";
  const neg = n < 0;
  const abs = Math.abs(n);
  let out: string;
  if (short) {
    if (abs >= 1e6) out = "$" + (abs / 1e6).toFixed(abs >= 1e7 ? 1 : 2) + "M";
    else if (abs >= 1e3) out = "$" + (abs / 1e3).toFixed(0) + "k";
    else out = "$" + abs.toFixed(0);
  } else {
    out = "$" + abs.toLocaleString("en-US", { maximumFractionDigits: 0 });
  }
  return neg ? "−" + out : out;
}

export interface JournalEntry {
  id: string;
  date: string;
  note: string;
}

export interface Intake {
  question: string;
  name: string;
  age: number;
  income: number;
  saveRate: number;
  spend: number;
  netWorth: number;
}

export const DEFAULT_INTAKE: Intake = {
  question: "",
  name: "",
  age: 34,
  income: 220,
  saveRate: 28,
  spend: 84,
  netWorth: 312,
};

export const QUESTION_OPTIONS = [
  "Take a year off",
  "Buy a home",
  "Start a business",
  "Retire early",
  "Fund a child's education",
  "Move abroad",
];

// localStorage helpers
const LS_SCENARIOS = "clarifin_scenarios";
const LS_JOURNAL = "clarifin_journal";
const LS_INTAKE = "clarifin_intake";

export function loadScenarios(): AtriumScenario[] {
  try {
    const raw = localStorage.getItem(LS_SCENARIOS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [{ ...DEFAULT_SCENARIO }, { ...SECOND_SCENARIO }];
}

export function saveScenarios(scenarios: AtriumScenario[]) {
  localStorage.setItem(LS_SCENARIOS, JSON.stringify(scenarios));
}

export function loadJournal(): JournalEntry[] {
  try {
    const raw = localStorage.getItem(LS_JOURNAL);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveJournal(journal: JournalEntry[]) {
  localStorage.setItem(LS_JOURNAL, JSON.stringify(journal));
}

export function loadIntake(): Intake {
  try {
    const raw = localStorage.getItem(LS_INTAKE);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { ...DEFAULT_INTAKE };
}

export function saveIntake(intake: Intake) {
  localStorage.setItem(LS_INTAKE, JSON.stringify(intake));
}

export function intakeToScenario(intake: Intake, base: AtriumScenario): AtriumScenario {
  return {
    ...base,
    age: intake.age,
    income: intake.income * 1000,
    saveRate: intake.saveRate / 100,
    spend: intake.spend * 1000,
    netWorth: intake.netWorth * 1000,
  };
}

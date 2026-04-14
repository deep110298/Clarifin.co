// Clarifin Financial Engine — pure functions, no side effects

// ── Tax brackets (2024, single filer) ─────────────────────────────────────
const BRACKETS_SINGLE = [
  { min: 0, max: 11600, rate: 0.10 },
  { min: 11601, max: 47150, rate: 0.12 },
  { min: 47151, max: 100525, rate: 0.22 },
  { min: 100526, max: 191950, rate: 0.24 },
  { min: 191951, max: 243725, rate: 0.32 },
  { min: 243726, max: 609350, rate: 0.35 },
  { min: 609351, max: Infinity, rate: 0.37 },
];

const BRACKETS_MARRIED = [
  { min: 0, max: 23200, rate: 0.10 },
  { min: 23201, max: 94300, rate: 0.12 },
  { min: 94301, max: 201050, rate: 0.22 },
  { min: 201051, max: 383900, rate: 0.24 },
  { min: 383901, max: 487450, rate: 0.32 },
  { min: 487451, max: 731200, rate: 0.35 },
  { min: 731201, max: Infinity, rate: 0.37 },
];

const STANDARD_DEDUCTION = { single: 14600, married: 29200, head: 21900 };

export type FilingStatus = "single" | "married" | "head";

export function calculateFederalTax(gross: number, filing: FilingStatus): number {
  const deduction = STANDARD_DEDUCTION[filing];
  const taxable = Math.max(0, gross - deduction);
  const brackets = filing === "married" ? BRACKETS_MARRIED : BRACKETS_SINGLE;

  let tax = 0;
  for (const b of brackets) {
    if (taxable <= b.min - 1) break;
    const slice = Math.min(taxable, b.max) - (b.min - 1);
    tax += slice * b.rate;
  }
  return Math.round(tax);
}

// ── FICA ───────────────────────────────────────────────────────────────────
export function calculateFICA(gross: number): number {
  const ssCap = 168600;
  const ss = Math.min(gross, ssCap) * 0.062;
  const medicare = gross * 0.0145;
  const additionalMedicare = gross > 200000 ? (gross - 200000) * 0.009 : 0;
  return Math.round(ss + medicare + additionalMedicare);
}

// ── State tax (simplified flat rates) ─────────────────────────────────────
const STATE_RATES: Record<string, number> = {
  AK: 0.00, FL: 0.00, NV: 0.00, NH: 0.00, SD: 0.00,
  TN: 0.00, TX: 0.00, WA: 0.00, WY: 0.00,
  AL: 0.05, AZ: 0.025, AR: 0.044, CA: 0.093, CO: 0.044,
  CT: 0.065, DE: 0.066, GA: 0.055, HI: 0.11, ID: 0.058,
  IL: 0.0495, IN: 0.032, IA: 0.06, KS: 0.057, KY: 0.045,
  LA: 0.06, ME: 0.075, MD: 0.0575, MA: 0.05, MI: 0.0425,
  MN: 0.0985, MS: 0.05, MO: 0.054, MT: 0.069, NE: 0.0684,
  NJ: 0.0897, NM: 0.059, NY: 0.0685, NC: 0.0525, ND: 0.029,
  OH: 0.04, OK: 0.05, OR: 0.099, PA: 0.0307, RI: 0.0599,
  SC: 0.07, UT: 0.0465, VT: 0.0875, VA: 0.0575, WV: 0.065,
  WI: 0.0765,
};

export function calculateStateTax(gross: number, state: string): number {
  const rate = STATE_RATES[state.toUpperCase()] ?? 0.05;
  return Math.round(gross * rate);
}

// ── Monthly take-home ──────────────────────────────────────────────────────
export function calculateMonthlyTakeHome(
  gross: number,
  filing: FilingStatus,
  state: string
): number {
  const federal = calculateFederalTax(gross, filing);
  const fica = calculateFICA(gross);
  const stateTax = calculateStateTax(gross, state);
  return Math.round((gross - federal - fica - stateTax) / 12);
}

export function calculateAnnualTakeHome(
  gross: number,
  filing: FilingStatus,
  state: string
): number {
  return calculateMonthlyTakeHome(gross, filing, state) * 12;
}

// ── Net worth projection ───────────────────────────────────────────────────
export function projectNetWorth(
  startingNetWorth: number,
  monthlySurplus: number,
  years: number,
  annualReturn = 0.07
): { year: number; netWorth: number }[] {
  const monthlyRate = annualReturn / 12;
  const result: { year: number; netWorth: number }[] = [];
  let balance = startingNetWorth;

  for (let y = 0; y <= years; y++) {
    result.push({ year: y, netWorth: Math.round(balance) });
    for (let m = 0; m < 12; m++) {
      balance = balance * (1 + monthlyRate) + monthlySurplus;
    }
  }
  return result;
}

/**
 * Phased net worth projection — correctly handles temporary costs (childcare,
 * tuition, time-off) that expire after a fixed number of years.
 * Each phase specifies a monthly surplus and how many years it lasts.
 */
export interface SurplusPhase {
  monthlySurplus: number;
  years: number;
}

export function projectNetWorthPhased(
  startingNetWorth: number,
  phases: SurplusPhase[],
  annualReturn = 0.07
): { year: number; netWorth: number }[] {
  const monthlyRate = annualReturn / 12;
  const result: { year: number; netWorth: number }[] = [];
  let balance = startingNetWorth;
  let globalYear = 0;

  result.push({ year: 0, netWorth: Math.round(balance) });

  for (const phase of phases) {
    for (let y = 0; y < phase.years; y++) {
      for (let m = 0; m < 12; m++) {
        balance = balance * (1 + monthlyRate) + phase.monthlySurplus;
      }
      globalYear++;
      result.push({ year: globalYear, netWorth: Math.round(balance) });
    }
  }

  return result;
}

// ── Mortgage payment ───────────────────────────────────────────────────────
export function calculateMortgagePayment(
  principal: number,
  annualRate: number,
  termYears: number
): number {
  const r = annualRate / 12;
  const n = termYears * 12;
  if (r === 0) return Math.round(principal / n);
  const payment = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  return Math.round(payment);
}

// ── Retirement target (Rule of 25) ────────────────────────────────────────
// 25x annual expenses = the nest egg that supports a 4% safe withdrawal rate.
// A person spending $5,000/month needs $1.5M to retire, not a flat $1M.
export function calculateRetirementTarget(monthlyExpenses: number): number {
  return Math.round(monthlyExpenses * 12 * 25);
}

// ── Retirement age estimator ───────────────────────────────────────────────
export function estimateRetirementAge(
  currentAge: number,
  currentSavings: number,
  monthlySavings: number,
  targetAmount: number,
  annualReturn = 0.07
): number {
  const monthlyRate = annualReturn / 12;
  let balance = currentSavings;
  let months = 0;

  while (balance < targetAmount && months < 600) {
    balance = balance * (1 + monthlyRate) + monthlySavings;
    months++;
  }

  return currentAge + Math.ceil(months / 12);
}

/**
 * Phased retirement age estimator — correctly models scenarios where costs
 * are temporary (childcare ends at year 5, school ends after graduation, etc.)
 * The last phase is extended to fill the full 50-year (600 month) horizon.
 */
export function estimateRetirementAgePhased(
  currentAge: number,
  currentSavings: number,
  phases: SurplusPhase[],
  targetAmount: number,
  annualReturn = 0.07
): number {
  const monthlyRate = annualReturn / 12;
  let balance = currentSavings;
  let months = 0;
  const MAX_MONTHS = 600; // 50-year cap

  for (let pi = 0; pi < phases.length; pi++) {
    const phase = phases[pi];
    // Last phase runs until target hit or cap reached
    const phaseMonths = pi === phases.length - 1 ? MAX_MONTHS : phase.years * 12;
    for (let m = 0; m < phaseMonths && months < MAX_MONTHS; m++) {
      balance = balance * (1 + monthlyRate) + phase.monthlySurplus;
      months++;
      if (balance >= targetAmount) {
        return currentAge + Math.ceil(months / 12);
      }
    }
  }

  return currentAge + Math.ceil(months / 12);
}

// ── Cost of living index (national avg = 100) ─────────────────────────────
export const CITY_COL: Record<string, number> = {
  "New York, NY": 187,
  "San Francisco, CA": 194,
  "Los Angeles, CA": 173,
  "Seattle, WA": 150,
  "Boston, MA": 162,
  "Washington, DC": 155,
  "Miami, FL": 123,
  "Denver, CO": 130,
  "Chicago, IL": 107,
  "Austin, TX": 118,
  "Nashville, TN": 110,
  "Atlanta, GA": 106,
  "Phoenix, AZ": 108,
  "Dallas, TX": 112,
  "Houston, TX": 109,
  "Portland, OR": 134,
  "Minneapolis, MN": 112,
  "San Diego, CA": 160,
  "Charlotte, NC": 105,
  "Columbus, OH": 96,
  "Indianapolis, IN": 92,
  "Kansas City, MO": 95,
  "Salt Lake City, UT": 118,
  "Raleigh, NC": 108,
  "Tampa, FL": 113,
};

// ── Format helpers ─────────────────────────────────────────────────────────
export function formatCurrency(n: number, compact = false): string {
  if (compact && Math.abs(n) >= 1_000_000) {
    return "$" + (n / 1_000_000).toFixed(1) + "M";
  }
  if (compact && Math.abs(n) >= 1_000) {
    return "$" + (n / 1_000).toFixed(0) + "k";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDiff(n: number): string {
  const sign = n >= 0 ? "+" : "";
  return sign + formatCurrency(n);
}

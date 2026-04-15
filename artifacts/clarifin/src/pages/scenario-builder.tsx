import { useState, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import {
  ArrowRight, Briefcase, Home, GraduationCap, Baby, Plane, Sliders,
  TrendingUp, TrendingDown, Award, AlertCircle,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { AppLayout } from "@/components/app/AppLayout";
import { useStore } from "@/lib/store";
import type { ScenarioType, Scenario } from "@/lib/store";
import {
  calculateMonthlyTakeHome,
  calculateMortgagePayment,
  calculateRetirementTarget,
  projectNetWorth, projectNetWorthPhased,
  estimateRetirementAge, estimateRetirementAgePhased,
  CITY_COL,
  formatCurrency,
  formatDiff,
  type SurplusPhase,
} from "@/lib/financial-engine";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";

const SCENARIO_TYPES: { id: ScenarioType; label: string; icon: React.ElementType; desc: string }[] = [
  { id: "job-change", label: "Job Change", icon: Briefcase, desc: "New offer or relocation" },
  { id: "buy-home", label: "Buy a Home", icon: Home, desc: "Rent vs. mortgage" },
  { id: "school", label: "Go Back to School", icon: GraduationCap, desc: "Degree or bootcamp" },
  { id: "child", label: "Have a Child", icon: Baby, desc: "First or additional child" },
  { id: "time-off", label: "Take Time Off", icon: Plane, desc: "Sabbatical or travel" },
  { id: "custom", label: "Custom", icon: Sliders, desc: "Model any scenario" },
];

const CITIES = Object.keys(CITY_COL).sort();
const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

interface FieldProps {
  label: string;
  prefix?: string;
  suffix?: string;
  value: number | string;
  onChange: (v: string) => void;
  type?: "number" | "select" | "text";
  options?: string[];
  placeholder?: string;
  min?: number;
  helpText?: string;
}

function Field({ label, prefix, suffix, value, onChange, type = "number", options, placeholder, min, helpText }: FieldProps) {
  if (type === "select") {
    return (
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#1A1A2E] bg-white focus:outline-none focus:ring-2 focus:ring-[#FACC15]/30 focus:border-[#FACC15]"
        >
          {options?.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        {helpText && <p className="text-[11px] text-gray-400 mt-1">{helpText}</p>}
      </div>
    );
  }

  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">{prefix}</span>
        )}
        <input
          type={type}
          min={min}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full border border-gray-200 rounded-lg py-2 text-sm text-[#1A1A2E] bg-white focus:outline-none focus:ring-2 focus:ring-[#FACC15]/30 focus:border-[#FACC15]",
            prefix ? "pl-7 pr-3" : suffix ? "pl-3 pr-10" : "px-3"
          )}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">{suffix}</span>
        )}
      </div>
      {helpText && <p className="text-[11px] text-gray-400 mt-1">{helpText}</p>}
    </div>
  );
}

// ── Job Change fields ──────────────────────────────────────────────────────
function JobChangeFields({
  curr, setCurr, prop, setProp,
}: {
  curr: Record<string, string | number>;
  setCurr: (k: string, v: string) => void;
  prop: Record<string, string | number>;
  setProp: (k: string, v: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Current Situation</h3>
        <Field label="Annual Salary" prefix="$" value={curr.income} onChange={(v) => setCurr("income", v)} min={0} />
        <Field label="City" type="select" options={CITIES} value={curr.city as string} onChange={(v) => setCurr("city", v)} />
        <Field label="Monthly Housing Cost" prefix="$" value={curr.housing} onChange={(v) => setCurr("housing", v)} min={0} helpText="Rent or mortgage payment" />
        <Field label="State (for taxes)" type="select" options={US_STATES} value={curr.state as string} onChange={(v) => setCurr("state", v)} />
      </div>
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-[#1A1A2E] uppercase tracking-wide">New Scenario</h3>
        <Field label="New Salary" prefix="$" value={prop.income} onChange={(v) => setProp("income", v)} min={0} />
        <Field label="New City" type="select" options={CITIES} value={prop.city as string} onChange={(v) => setProp("city", v)} />
        <Field label="New Monthly Housing Cost" prefix="$" value={prop.housing} onChange={(v) => setProp("housing", v)} min={0} helpText="Rent or mortgage in new location" />
        <Field label="State (for taxes)" type="select" options={US_STATES} value={prop.state as string} onChange={(v) => setProp("state", v)} />
        <Field label="One-time Moving Cost" prefix="$" value={prop.movingCost} onChange={(v) => setProp("movingCost", v)} min={0} />
      </div>
    </div>
  );
}

// ── Buy Home fields ────────────────────────────────────────────────────────
function BuyHomeFields({
  curr, setCurr, prop, setProp,
}: {
  curr: Record<string, string | number>;
  setCurr: (k: string, v: string) => void;
  prop: Record<string, string | number>;
  setProp: (k: string, v: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Current (Renting)</h3>
        <Field label="Monthly Rent" prefix="$" value={curr.housing} onChange={(v) => setCurr("housing", v)} min={0} />
        <Field label="Annual Income" prefix="$" value={curr.income} onChange={(v) => setCurr("income", v)} min={0} />
        <Field label="State" type="select" options={US_STATES} value={curr.state as string} onChange={(v) => setCurr("state", v)} />
      </div>
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-[#1A1A2E] uppercase tracking-wide">New Scenario (Buying)</h3>
        <Field label="Home Purchase Price" prefix="$" value={prop.homePrice} onChange={(v) => setProp("homePrice", v)} min={0} />
        <Field label="Down Payment" prefix="$" value={prop.downPayment} onChange={(v) => setProp("downPayment", v)} min={0} />
        <Field label="Mortgage Rate (%)" value={prop.mortgageRate} onChange={(v) => setProp("mortgageRate", v)} min={0} helpText="Current 30-yr avg ~6.8%" />
        <Field label="Loan Term" type="select" options={["30", "15"]} value={prop.loanTerm as string} onChange={(v) => setProp("loanTerm", v)} />
        <Field label="Annual Property Tax" prefix="$" value={prop.propertyTax} onChange={(v) => setProp("propertyTax", v)} min={0} />
      </div>
    </div>
  );
}

// ── Child fields ───────────────────────────────────────────────────────────
function ChildFields({
  prop, setProp,
}: {
  prop: Record<string, string | number>;
  setProp: (k: string, v: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
        <p className="font-semibold mb-1">How this works</p>
        <p className="text-xs text-blue-600">Your income and housing stay the same. We add your estimated child costs to calculate how much less you can save each month — and what that means for your retirement timeline.</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Monthly Childcare / Daycare"
          prefix="$"
          value={prop.monthlyChildcare}
          onChange={(v) => setProp("monthlyChildcare", v)}
          min={0}
          helpText="US avg: $1,200–$2,200/mo depending on city"
        />
        <Field
          label="Monthly Baby Essentials"
          prefix="$"
          value={prop.monthlyExtras}
          onChange={(v) => setProp("monthlyExtras", v)}
          min={0}
          helpText="Diapers, formula, clothing, gear (~$400–$800/mo)"
        />
        <Field
          label="One-time Birth / Setup Cost"
          prefix="$"
          value={prop.oneTimeCost}
          onChange={(v) => setProp("oneTimeCost", v)}
          min={0}
          helpText="Hospital, nursery, stroller, car seat, etc."
        />
        <Field
          label="Income During Parental Leave"
          prefix="$"
          value={prop.leaveIncome}
          onChange={(v) => setProp("leaveIncome", v)}
          min={0}
          helpText="Annual equivalent during leave period"
        />
      </div>
    </div>
  );
}

// ── School fields ──────────────────────────────────────────────────────────
function SchoolFields({
  curr, prop, setProp,
}: {
  curr: Record<string, string | number>;
  prop: Record<string, string | number>;
  setProp: (k: string, v: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-sm text-purple-800">
        <p className="font-semibold mb-1">How this works</p>
        <p className="text-xs text-purple-600">During school your income drops and you pay tuition. After graduation your salary increases. We model both phases to show your true long-run financial impact.</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Annual Tuition"
          prefix="$"
          value={prop.annualTuition}
          onChange={(v) => setProp("annualTuition", v)}
          min={0}
          helpText="Total yearly cost including fees"
        />
        <Field
          label="Program Length"
          suffix="yrs"
          value={prop.durationYears}
          onChange={(v) => setProp("durationYears", v)}
          min={1}
          helpText="How many years in school"
        />
        <Field
          label="Income During School"
          prefix="$"
          value={prop.incomeWhileInSchool}
          onChange={(v) => setProp("incomeWhileInSchool", v)}
          min={0}
          helpText="Part-time / 0 if full-time student"
        />
        <Field
          label="Expected Salary After Graduation"
          prefix="$"
          value={prop.salaryAfter}
          onChange={(v) => setProp("salaryAfter", v)}
          min={0}
          helpText={`Your current: ${formatCurrency(Number(curr.income))}/yr`}
        />
      </div>
    </div>
  );
}

// ── Time-off fields ────────────────────────────────────────────────────────
function TimeOffFields({
  prop, setProp,
}: {
  prop: Record<string, string | number>;
  setProp: (k: string, v: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-sm text-orange-800">
        <p className="font-semibold mb-1">How this works</p>
        <p className="text-xs text-orange-600">During your time off, your expenses continue but income stops or drops significantly. We model the savings depletion and show how long it takes to recover financially after you return to work.</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Duration"
          suffix="months"
          value={prop.months}
          onChange={(v) => setProp("months", v)}
          min={1}
          helpText="How long will you be off work?"
        />
        <Field
          label="Income During Time Off"
          prefix="$"
          value={prop.partTimeIncome}
          onChange={(v) => setProp("partTimeIncome", v)}
          min={0}
          helpText="Annual equivalent — enter 0 if full break"
        />
        <Field
          label="Monthly Travel / Extra Costs"
          prefix="$"
          value={prop.extraMonthlyCost}
          onChange={(v) => setProp("extraMonthlyCost", v)}
          min={0}
          helpText="Above your normal expenses"
        />
        <Field
          label="Expected Salary When You Return"
          prefix="$"
          value={prop.salaryAfter}
          onChange={(v) => setProp("salaryAfter", v)}
          min={0}
          helpText="Could be same or different"
        />
      </div>
    </div>
  );
}

// ── Default form state by type ─────────────────────────────────────────────
function getDefaultState(type: ScenarioType, profile: { grossIncome: number; housing: number; state: string }) {
  const curr: Record<string, string | number> = {
    income: profile.grossIncome,
    city: "Austin, TX",
    housing: profile.housing,
    state: profile.state,
  };

  let prop: Record<string, string | number> = {};

  if (type === "job-change") {
    prop = { income: Math.round(profile.grossIncome * 1.3), city: "New York, NY", housing: Math.round(profile.housing * 1.5), state: "NY", movingCost: 8000 };
  } else if (type === "buy-home") {
    prop = { homePrice: 450000, downPayment: 90000, mortgageRate: 6.8, loanTerm: "30", propertyTax: 6000 };
  } else if (type === "school") {
    prop = {
      annualTuition: 25000,
      durationYears: 2,
      incomeWhileInSchool: Math.round(profile.grossIncome * 0.3),
      salaryAfter: Math.round(profile.grossIncome * 1.4),
    };
  } else if (type === "child") {
    prop = { monthlyChildcare: 1500, monthlyExtras: 500, oneTimeCost: 15000, leaveIncome: Math.round(profile.grossIncome * 0.6) };
  } else if (type === "time-off") {
    prop = { months: 6, partTimeIncome: 0, extraMonthlyCost: 500, salaryAfter: profile.grossIncome };
  } else {
    prop = { income: profile.grossIncome, housing: profile.housing };
  }

  return { curr, prop };
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function ScenarioBuilderPage() {
  const [, navigate] = useLocation();
  const { profile, addScenario } = useStore();
  const queryClient = useQueryClient();
  const [saveError, setSaveError] = useState<string | null>(null);

  const [scenarioType, setScenarioType] = useState<ScenarioType>("job-change");
  const [scenarioName, setScenarioName] = useState("My new scenario");

  const defaults = useMemo(
    () => getDefaultState(scenarioType, { grossIncome: profile.grossIncome, housing: profile.housing, state: profile.state }),
    [scenarioType, profile]
  );

  const [curr, setCurrState] = useState<Record<string, string | number>>(defaults.curr);
  const [prop, setPropState] = useState<Record<string, string | number>>(defaults.prop);

  const handleTypeChange = (t: ScenarioType) => {
    setScenarioType(t);
    const d = getDefaultState(t, { grossIncome: profile.grossIncome, housing: profile.housing, state: profile.state });
    setCurrState(d.curr);
    setPropState(d.prop);
  };

  const setCurr = useCallback((k: string, v: string) => setCurrState((s) => ({ ...s, [k]: v })), []);
  const setProp = useCallback((k: string, v: string) => setPropState((s) => ({ ...s, [k]: v })), []);

  // ── Compute comparison ────────────────────────────────────────────────────
  const analysis = useMemo(() => {
    const currIncome = Number(curr.income) || 0;
    const currState = (curr.state as string) || profile.state;
    const otherExpenses = profile.transport + profile.food + profile.utilities + profile.healthcare + profile.otherExpenses;

    const currTakeHome = calculateMonthlyTakeHome(currIncome, profile.filingStatus, currState);
    const currMonthlyHousing = Number(curr.housing) || profile.housing;
    const currSurplus = currTakeHome - currMonthlyHousing - otherExpenses;

    let propTakeHome = currTakeHome;
    let propMonthlyHousing = currMonthlyHousing; // default: housing unchanged
    let propScenarioCosts = 0; // extra monthly costs specific to this scenario
    let propSurplus = 0;
    let retirePropPhases: SurplusPhase[] | null = null; // set for child/school/time-off

    if (scenarioType === "job-change") {
      const propIncome = Number(prop.income) || currIncome;
      const propState = (prop.state as string) || currState;
      propTakeHome = calculateMonthlyTakeHome(propIncome, profile.filingStatus, propState);
      propMonthlyHousing = Number(prop.housing) || currMonthlyHousing;
      propSurplus = propTakeHome - propMonthlyHousing - otherExpenses;

    } else if (scenarioType === "buy-home") {
      const homePrice = Number(prop.homePrice) || 0;
      const down = Number(prop.downPayment) || 0;
      const rate = (Number(prop.mortgageRate) || 6.8) / 100;
      const term = Number(prop.loanTerm) || 30;
      const propertyTax = (Number(prop.propertyTax) || 0) / 12;
      const mortgage = calculateMortgagePayment(homePrice - down, rate, term);
      const maintenance = (homePrice * 0.01) / 12;
      propMonthlyHousing = mortgage + propertyTax + maintenance;
      // Income and state same as current when buying
      propSurplus = currTakeHome - propMonthlyHousing - otherExpenses;

    } else if (scenarioType === "child") {
      // Housing and income stay the same (unless on parental leave)
      const leaveIncome = Number(prop.leaveIncome) || 0; // 0 = fully unpaid leave
      const blendedAnnualIncome = leaveIncome * 0.25 + currIncome * 0.75;
      propTakeHome = calculateMonthlyTakeHome(blendedAnnualIncome, profile.filingStatus, currState);
      const monthlyChildcare = Number(prop.monthlyChildcare) || 0;
      const monthlyExtras = Number(prop.monthlyExtras) || 0;
      propScenarioCosts = monthlyChildcare + monthlyExtras;
      propSurplus = propTakeHome - currMonthlyHousing - otherExpenses - propScenarioCosts;
      // Phased: Year 1 = leave, Yrs 2-5 = full income + childcare, Yrs 6+ = normal
      const fullTH = calculateMonthlyTakeHome(currIncome, profile.filingStatus, currState);
      retirePropPhases = [
        { monthlySurplus: propSurplus,                                                              years: 1 },
        { monthlySurplus: fullTH - currMonthlyHousing - otherExpenses - monthlyChildcare - monthlyExtras, years: 4 },
        { monthlySurplus: fullTH - currMonthlyHousing - otherExpenses,                             years: 50 },
      ];

    } else if (scenarioType === "school") {
      // Two-phase: during school income drops, tuition added; after school income rises
      // We show a blended view: half the projection period in school, half after
      const incomeWhileInSchool = Number(prop.incomeWhileInSchool) || 0;
      const annualTuition = Number(prop.annualTuition) || 0;
      const salaryAfter = Number(prop.salaryAfter) || currIncome;
      const durationYears = Number(prop.durationYears) || 2;

      const takeHomeInSchool = calculateMonthlyTakeHome(incomeWhileInSchool, profile.filingStatus, currState);
      const takeHomeAfter = calculateMonthlyTakeHome(salaryAfter, profile.filingStatus, currState);
      const monthlyTuition = annualTuition / 12;

      const surplusInSchool = takeHomeInSchool - currMonthlyHousing - otherExpenses - monthlyTuition;
      const surplusAfter = takeHomeAfter - currMonthlyHousing - otherExpenses;

      // Blend for the 30-year view table display: weight by years
      const totalYears = 30;
      const schoolWeight = Math.min(durationYears, totalYears) / totalYears;
      const afterWeight = 1 - schoolWeight;
      propTakeHome = takeHomeInSchool * schoolWeight + takeHomeAfter * afterWeight;
      propScenarioCosts = monthlyTuition * schoolWeight; // only paid during school
      propSurplus = surplusInSchool * schoolWeight + surplusAfter * afterWeight;
      // Phased: in-school phase then post-graduation
      retirePropPhases = [
        { monthlySurplus: surplusInSchool, years: durationYears },
        { monthlySurplus: surplusAfter,    years: 50 },
      ];

    } else if (scenarioType === "time-off") {
      const months = Number(prop.months) || 6;
      const partTimeIncome = Number(prop.partTimeIncome) || 0;
      const extraMonthlyCost = Number(prop.extraMonthlyCost) || 0;
      const salaryAfter = Number(prop.salaryAfter) || currIncome;

      const takeHomeTimeOff = calculateMonthlyTakeHome(partTimeIncome, profile.filingStatus, currState);
      const takeHomeAfter = calculateMonthlyTakeHome(salaryAfter, profile.filingStatus, currState);

      const surplusTimeOff = takeHomeTimeOff - currMonthlyHousing - otherExpenses - extraMonthlyCost;
      const surplusAfter = takeHomeAfter - currMonthlyHousing - otherExpenses;

      // Blend for 30-year view table display
      const totalMonths = 30 * 12;
      const offWeight = months / totalMonths;
      const afterWeight = 1 - offWeight;
      propTakeHome = takeHomeTimeOff * offWeight + takeHomeAfter * afterWeight;
      propScenarioCosts = extraMonthlyCost * offWeight;
      propSurplus = surplusTimeOff * offWeight + surplusAfter * afterWeight;
      // Phased: time-off period then back to work
      retirePropPhases = [
        { monthlySurplus: surplusTimeOff, years: Math.max(1, Math.ceil(months / 12)) },
        { monthlySurplus: surplusAfter,   years: 50 },
      ];

    } else {
      // custom
      const propIncome = Number(prop.income) || currIncome;
      const propState = (prop.state as string) || currState;
      propTakeHome = calculateMonthlyTakeHome(propIncome, profile.filingStatus, propState);
      propMonthlyHousing = Number(prop.housing) || currMonthlyHousing;
      propSurplus = propTakeHome - propMonthlyHousing - otherExpenses;
    }

    const startNetWorth =
      profile.emergencyFund + profile.retirementBalance + profile.otherInvestments -
      (profile.creditCardDebt + profile.studentLoans + profile.carLoans + profile.otherDebt);

    // One-time upfront costs reduce the proposed path's starting position
    const oneTimeCostProp =
      scenarioType === "child"      ? (Number(prop.oneTimeCost) || 0) :
      scenarioType === "job-change" ? (Number(prop.movingCost)  || 0) :
      scenarioType === "buy-home"   ? (Number(prop.downPayment) || 0) : 0;
    const startNetWorthProp = startNetWorth - oneTimeCostProp;

    // Rule of 25: retirement target uses long-term stable expenses only — no temporary costs
    const currAnnualExpenses = (currMonthlyHousing + otherExpenses) * 12;
    const propAnnualExpenses = (propMonthlyHousing + otherExpenses) * 12;
    const retirementTargetCurr = calculateRetirementTarget(currAnnualExpenses / 12);
    const retirementTargetProp = calculateRetirementTarget(propAnnualExpenses / 12);

    const projCurr = projectNetWorth(startNetWorth, currSurplus, 30);
    const projProp = projectNetWorth(startNetWorthProp, propSurplus, 30);

    const retireCurr = estimateRetirementAge(profile.age, startNetWorth, Math.max(0, currSurplus), retirementTargetCurr);
    const retireProp = retirePropPhases
      ? estimateRetirementAgePhased(profile.age, startNetWorthProp, retirePropPhases, retirementTargetProp)
      : estimateRetirementAge(profile.age, startNetWorthProp, Math.max(0, propSurplus), retirementTargetProp);

    const diff20yr = (projProp[20]?.netWorth ?? 0) - (projCurr[20]?.netWorth ?? 0);
    const propWins = propSurplus >= currSurplus;

    const projData = projCurr.map((pt, i) => ({
      year: `Yr ${pt.year}`,
      "Current": pt.netWorth,
      "New Scenario": projProp[i]?.netWorth ?? 0,
    }));

    return {
      currTakeHome,
      propTakeHome,
      currMonthlyHousing,
      propMonthlyHousing,
      propScenarioCosts,
      currSurplus,
      propSurplus,
      retireCurr,
      retireProp,
      retirementTargetCurr,
      retirementTargetProp,
      diff20yr,
      propWins,
      projData,
      otherExpenses,
    };
  }, [curr, prop, profile, scenarioType]);

  // ── Save mutation ─────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async () => {
      const currentObj: Record<string, unknown> = {
        income: Number(curr.income),
        city: curr.city as string,
        monthlyHousing: analysis.currMonthlyHousing,
        state: curr.state as string,
      };

      const proposedObj: Record<string, unknown> = {
        income: Number(prop.income ?? curr.income),
        city: (prop.city ?? curr.city) as string,
        monthlyHousing: analysis.propMonthlyHousing,
        state: (prop.state ?? curr.state) as string,
        scenarioCosts: analysis.propScenarioCosts,
      };

      if (scenarioType === "buy-home") {
        proposedObj.homePurchasePrice = Number(prop.homePrice) || 0;
        proposedObj.downPayment = Number(prop.downPayment) || 0;
        proposedObj.mortgageRate = Number(prop.mortgageRate) || 6.8;
        proposedObj.loanTermYears = Number(prop.loanTerm) || 30;
        proposedObj.propertyTax = Number(prop.propertyTax) || 0;
      }
      if (scenarioType === "job-change") {
        proposedObj.movingCost = Number(prop.movingCost) || 0;
      }
      if (scenarioType === "child") {
        proposedObj.monthlyChildcare = Number(prop.monthlyChildcare) || 0;
        proposedObj.monthlyExtras = Number(prop.monthlyExtras) || 0;
        proposedObj.oneTimeCost = Number(prop.oneTimeCost) || 0;
        proposedObj.leaveIncome = Number(prop.leaveIncome) || 0;
      }
      if (scenarioType === "school") {
        proposedObj.annualTuition = Number(prop.annualTuition) || 0;
        proposedObj.durationYears = Number(prop.durationYears) || 2;
        proposedObj.incomeWhileInSchool = Number(prop.incomeWhileInSchool) || 0;
        proposedObj.salaryAfter = Number(prop.salaryAfter) || 0;
      }
      if (scenarioType === "time-off") {
        proposedObj.months = Number(prop.months) || 6;
        proposedObj.partTimeIncome = Number(prop.partTimeIncome) || 0;
        proposedObj.extraMonthlyCost = Number(prop.extraMonthlyCost) || 0;
        proposedObj.salaryAfter = Number(prop.salaryAfter) || 0;
      }

      return customFetch<Scenario>("/api/scenarios", {
        method: "POST",
        body: JSON.stringify({
          name: scenarioName,
          type: scenarioType,
          current: currentObj,
          proposed: proposedObj,
        }),
      });
    },
    onSuccess: (savedScenario) => {
      addScenario(savedScenario);
      queryClient.invalidateQueries({ queryKey: ["scenarios"] });
      navigate(`/app/scenarios/${savedScenario.id}`);
    },
    onError: () => {
      setSaveError("Failed to save scenario. Please try again.");
    },
  });

  const handleSave = () => {
    setSaveError(null);
    saveMutation.mutate();
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Scenario Builder</h1>
          <p className="text-sm text-gray-500 mt-0.5">Model any life decision and see the financial impact instantly.</p>
        </div>

        {/* Scenario name */}
        <div>
          <input
            type="text"
            value={scenarioName}
            onChange={(e) => setScenarioName(e.target.value)}
            className={cn(
              "text-xl font-semibold text-[#1A1A2E] bg-transparent border-b-2 focus:outline-none py-1 w-full max-w-md",
              scenarioName.trim() ? "border-gray-200 focus:border-[#FACC15]" : "border-red-300 focus:border-red-400"
            )}
            placeholder="Name this scenario..."
          />
          {!scenarioName.trim() && (
            <p className="text-xs text-red-500 mt-1">Scenario name is required</p>
          )}
        </div>

        {/* Type selector */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {SCENARIO_TYPES.map(({ id, label, icon: Icon, desc }) => (
            <button
              key={id}
              onClick={() => handleTypeChange(id)}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all",
                scenarioType === id
                  ? "bg-[#1A1A2E] text-white border-[#0D1B2A]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-[#FACC15]/40 hover:bg-[#FACC15]/5"
              )}
              title={desc}
            >
              <Icon className="w-5 h-5" />
              <span className="text-center leading-tight">{label}</span>
            </button>
          ))}
        </div>

        {/* Input form */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          {scenarioType === "job-change" && (
            <JobChangeFields curr={curr} setCurr={setCurr} prop={prop} setProp={setProp} />
          )}
          {scenarioType === "buy-home" && (
            <BuyHomeFields curr={curr} setCurr={setCurr} prop={prop} setProp={setProp} />
          )}
          {scenarioType === "child" && (
            <ChildFields prop={prop} setProp={setProp} />
          )}
          {scenarioType === "school" && (
            <SchoolFields curr={curr} prop={prop} setProp={setProp} />
          )}
          {scenarioType === "time-off" && (
            <TimeOffFields prop={prop} setProp={setProp} />
          )}
          {scenarioType === "custom" && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Current Annual Income" prefix="$" value={curr.income} onChange={(v) => setCurr("income", v)} />
              <Field label="New Annual Income" prefix="$" value={prop.income ?? curr.income} onChange={(v) => setProp("income", v)} />
              <Field label="Current Monthly Housing" prefix="$" value={curr.housing} onChange={(v) => setCurr("housing", v)} />
              <Field label="New Monthly Housing" prefix="$" value={prop.housing ?? curr.housing} onChange={(v) => setProp("housing", v)} />
            </div>
          )}
        </div>

        {/* Live analysis */}
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Comparison table */}
          <div className="lg:col-span-1 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="font-semibold text-[#1A1A2E] mb-4 text-sm">Monthly Breakdown</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 uppercase">
                  <th className="text-left pb-2 font-medium">Item</th>
                  <th className="text-right pb-2 font-medium">Current</th>
                  <th className="text-right pb-2 font-medium text-[#1A1A2E]">New</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[
                  { label: "Take-home/mo", curr: analysis.currTakeHome, prop: analysis.propTakeHome },
                  { label: "Housing/mo", curr: analysis.currMonthlyHousing, prop: analysis.propMonthlyHousing },
                  { label: "Other expenses", curr: analysis.otherExpenses, prop: null },
                  ...(analysis.propScenarioCosts > 0 ? [{ label: "Scenario costs", curr: 0, prop: analysis.propScenarioCosts }] : []),
                ].map((row) => {
                  const diff = row.prop !== null ? row.prop - row.curr : null;
                  return (
                    <tr key={row.label} className="text-gray-700">
                      <td className="py-2 text-gray-500 text-xs">{row.label}</td>
                      <td className="py-2 text-right font-medium">{formatCurrency(row.curr)}</td>
                      <td className="py-2 text-right font-medium">
                        {row.prop !== null ? (
                          <span className={diff !== null && diff > 0 ? "text-green-500" : diff !== null && diff < 0 ? "text-red-500" : ""}>
                            {formatCurrency(row.prop)}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200">
                  <td className="pt-3 text-xs font-semibold text-[#1A1A2E]">Net monthly</td>
                  <td className="pt-3 text-right font-bold text-[#1A1A2E]">{formatCurrency(analysis.currSurplus)}</td>
                  <td className="pt-3 text-right font-bold" style={{ color: analysis.propSurplus >= analysis.currSurplus ? "#22C55E" : "#ef4444" }}>
                    {formatCurrency(analysis.propSurplus)}
                  </td>
                </tr>
              </tfoot>
            </table>

            <div className="mt-4 space-y-2 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Retirement target (current)</span>
                <span className="font-semibold text-[#1A1A2E]">{formatCurrency(analysis.retirementTargetCurr, true)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Retirement target (new)</span>
                <span className="font-semibold text-gray-500">{formatCurrency(analysis.retirementTargetProp, true)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Retire age (current path)</span>
                <span className="font-semibold text-[#1A1A2E]">Age {analysis.retireCurr}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Retire age (new scenario)</span>
                <span className="font-semibold" style={{ color: analysis.retireProp <= analysis.retireCurr ? "#22C55E" : "#ef4444" }}>
                  Age {analysis.retireProp}
                </span>
              </div>
            </div>
          </div>

          {/* Projection chart */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="font-semibold text-[#1A1A2E] mb-1 text-sm">30-Year Net Worth Projection</h2>
            <p className="text-xs text-gray-400 mb-4">7% avg annual return · Retirement target = 25× annual expenses</p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={analysis.projData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="gcurr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D1B2A" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#0D1B2A" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gprop" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FACC15" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#FACC15" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} interval={4} />
                <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${(v / 1_000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                  formatter={(v: number) => formatCurrency(v)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="Current" stroke="#0D1B2A" strokeWidth={2} fill="url(#gcurr)" />
                <Area type="monotone" dataKey="New Scenario" stroke="#FACC15" strokeWidth={2} fill="url(#gprop)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Verdict card */}
        <div className={cn(
          "rounded-xl border p-5 flex items-start gap-4",
          analysis.propWins
            ? "bg-[#FFF9E6] border-yellow-200"
            : "bg-orange-50 border-orange-200"
        )}>
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
            analysis.propWins ? "bg-[#FACC15]" : "bg-orange-400"
          )}>
            {analysis.propWins ? <Award className="w-5 h-5 text-[#1A1A2E]" /> : <AlertCircle className="w-5 h-5 text-white" />}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-[#1A1A2E]">
                {analysis.propWins ? "New scenario wins financially" : "Current path is stronger"}
              </h3>
              {analysis.propWins ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-orange-500" />
              )}
            </div>
            <p className="text-sm text-gray-600">
              {analysis.propWins
                ? `The new scenario puts ${formatCurrency(analysis.propSurplus - analysis.currSurplus)}/month more in your pocket. Over 20 years, this compounds to approximately ${formatDiff(analysis.diff20yr)} in additional net worth. ${analysis.retireProp < analysis.retireCurr ? `You'd retire ${analysis.retireCurr - analysis.retireProp} years earlier at age ${analysis.retireProp}.` : ""}`
                : `The current path generates ${formatCurrency(analysis.currSurplus - analysis.propSurplus)}/month more surplus. The new scenario would cost you roughly ${formatDiff(analysis.diff20yr)} over 20 years. Consider if non-financial benefits justify the tradeoff.`
              }
            </p>
          </div>
        </div>

        {saveError && (
          <p className="text-sm text-red-500">{saveError}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending || !scenarioName.trim()}
            title={!scenarioName.trim() ? "Please enter a scenario name" : undefined}
            className="flex items-center gap-2 bg-[#FACC15] hover:bg-yellow-300 text-[#1A1A2E] px-6 py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saveMutation.isPending ? "Saving..." : "Save scenario"}
            {!saveMutation.isPending && <ArrowRight className="w-4 h-4" />}
          </button>
          <a href="/app/advisor">
            <button className="flex items-center gap-2 bg-[#1A1A2E] hover:bg-[#1a2e40] text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-colors">
              Ask AI advisor
            </button>
          </a>
        </div>
      </div>
    </AppLayout>
  );
}

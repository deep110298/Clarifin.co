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
  projectNetWorth,
  estimateRetirementAge,
  CITY_COL,
  formatCurrency,
  formatDiff,
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
  value: number | string;
  onChange: (v: string) => void;
  type?: "number" | "select" | "text";
  options?: string[];
  placeholder?: string;
  min?: number;
}

function Field({ label, prefix, value, onChange, type = "number", options, placeholder, min }: FieldProps) {
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
            prefix ? "pl-7 pr-3" : "px-3"
          )}
        />
      </div>
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
      {/* Current */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Current Situation</h3>
        <Field label="Annual Salary" prefix="$" value={curr.income} onChange={(v) => setCurr("income", v)} min={0} />
        <Field label="City" type="select" options={CITIES} value={curr.city as string} onChange={(v) => setCurr("city", v)} />
        <Field label="Monthly Rent" prefix="$" value={curr.housing} onChange={(v) => setCurr("housing", v)} min={0} />
        <Field label="State (for taxes)" type="select" options={US_STATES} value={curr.state as string} onChange={(v) => setCurr("state", v)} />
      </div>
      {/* Proposed */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-[#1A1A2E] uppercase tracking-wide">New Scenario</h3>
        <Field label="New Salary" prefix="$" value={prop.income} onChange={(v) => setProp("income", v)} min={0} />
        <Field label="New City" type="select" options={CITIES} value={prop.city as string} onChange={(v) => setProp("city", v)} />
        <Field label="New Monthly Rent" prefix="$" value={prop.housing} onChange={(v) => setProp("housing", v)} min={0} />
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
        <Field label="Mortgage Rate (%)" value={prop.mortgageRate} onChange={(v) => setProp("mortgageRate", v)} min={0} />
        <Field label="Loan Term" type="select" options={["30", "15"]} value={prop.loanTerm as string} onChange={(v) => setProp("loanTerm", v)} />
        <Field label="Annual Property Tax" prefix="$" value={prop.propertyTax} onChange={(v) => setProp("propertyTax", v)} min={0} />
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
    prop = { tuition: 25000, durationYears: 2, incomeLoss: Math.round(profile.grossIncome * 0.5) };
  } else if (type === "child") {
    prop = { firstYearCost: 20000, annualOngoing: 15000 };
  } else if (type === "time-off") {
    prop = { months: 6, monthlyCost: Math.round(profile.housing * 1.2) };
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
    const propIncome = Number(prop.income) || currIncome;
    const currState = (curr.state as string) || profile.state;
    const propState = (prop.state as string) || currState;

    const currTakeHome = calculateMonthlyTakeHome(currIncome, profile.filingStatus, currState);
    const propTakeHome = calculateMonthlyTakeHome(propIncome, profile.filingStatus, propState);

    let currMonthlyHousing = Number(curr.housing) || 0;
    let propMonthlyHousing = 0;

    if (scenarioType === "buy-home") {
      const homePrice = Number(prop.homePrice) || 0;
      const down = Number(prop.downPayment) || 0;
      const rate = (Number(prop.mortgageRate) || 6.8) / 100;
      const term = Number(prop.loanTerm) || 30;
      const propertyTax = (Number(prop.propertyTax) || 0) / 12;
      const mortgage = calculateMortgagePayment(homePrice - down, rate, term);
      propMonthlyHousing = mortgage + propertyTax + (homePrice * 0.01) / 12; // est. maintenance
    } else {
      propMonthlyHousing = Number(prop.housing) || 0;
    }

    const otherExpenses = profile.transport + profile.food + profile.utilities + profile.healthcare + profile.otherExpenses;
    const currSurplus = currTakeHome - currMonthlyHousing - otherExpenses;
    const propSurplus = propTakeHome - propMonthlyHousing - otherExpenses;

    const startNetWorth =
      profile.emergencyFund + profile.retirementBalance + profile.otherInvestments -
      (profile.creditCardDebt + profile.studentLoans + profile.carLoans + profile.otherDebt);

    const projCurr = projectNetWorth(startNetWorth, currSurplus, 30);
    const projProp = projectNetWorth(startNetWorth, propSurplus, 30);

    const retireCurr = estimateRetirementAge(profile.age, startNetWorth, Math.max(0, currSurplus));
    const retireProp = estimateRetirementAge(profile.age, startNetWorth, Math.max(0, propSurplus));

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
      currSurplus,
      propSurplus,
      retireCurr,
      retireProp,
      diff20yr,
      propWins,
      projData,
    };
  }, [curr, prop, profile, scenarioType]);

  // ── Save mutation (Bug 3 fix) ─────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async () => {
      // Build current and proposed objects with all relevant fields
      const currentObj: Record<string, unknown> = {
        income: Number(curr.income),
        city: curr.city as string,
        monthlyHousing: Number(curr.housing) || 0,
        state: curr.state as string,
      };

      const proposedObj: Record<string, unknown> = {
        income: Number(prop.income ?? curr.income),
        city: (prop.city ?? curr.city) as string,
        monthlyHousing: analysis.propMonthlyHousing,
        state: (prop.state ?? curr.state) as string,
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

      const body = {
        name: scenarioName,
        type: scenarioType,
        current: currentObj,
        proposed: proposedObj,
      };

      return customFetch<Scenario>("/api/scenarios", {
        method: "POST",
        body: JSON.stringify(body),
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
        <input
          type="text"
          value={scenarioName}
          onChange={(e) => setScenarioName(e.target.value)}
          className="text-xl font-semibold text-[#1A1A2E] bg-transparent border-b-2 border-gray-200 focus:border-[#FACC15] focus:outline-none py-1 w-full max-w-md"
          placeholder="Name this scenario..."
        />

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
          {(scenarioType === "school" || scenarioType === "child" || scenarioType === "time-off" || scenarioType === "custom") && (
            <div className="text-center py-8 text-gray-400">
              <Sliders className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Custom scenario inputs — fill in the details below</p>
              <div className="grid grid-cols-2 gap-4 mt-6 text-left max-w-md mx-auto">
                <Field label="Current Annual Income" prefix="$" value={curr.income} onChange={(v) => setCurr("income", v)} />
                <Field label="New Annual Income" prefix="$" value={prop.income ?? curr.income} onChange={(v) => setProp("income", v)} />
                <Field label="Current Monthly Housing" prefix="$" value={curr.housing} onChange={(v) => setCurr("housing", v)} />
                <Field label="New Monthly Housing" prefix="$" value={prop.housing ?? curr.housing} onChange={(v) => setProp("housing", v)} />
              </div>
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
                  { label: "Other expenses", curr: profile.transport + profile.food + profile.utilities + profile.healthcare + profile.otherExpenses, prop: null },
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

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Retirement age (current)</span>
                <span className="font-semibold text-[#1A1A2E]">Age {analysis.retireCurr}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Retirement age (new)</span>
                <span className="font-semibold" style={{ color: analysis.retireProp <= analysis.retireCurr ? "#22C55E" : "#ef4444" }}>
                  Age {analysis.retireProp}
                </span>
              </div>
            </div>
          </div>

          {/* Projection chart */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="font-semibold text-[#1A1A2E] mb-1 text-sm">30-Year Net Worth Projection</h2>
            <p className="text-xs text-gray-400 mb-4">7% avg annual return</p>
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

        {/* Error state */}
        {saveError && (
          <p className="text-sm text-red-500">{saveError}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending}
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

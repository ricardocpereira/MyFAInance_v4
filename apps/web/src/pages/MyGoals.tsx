import { useEffect, useMemo, useState } from "react";
import type { Translation } from "../content/translations";

type Portfolio = {
  id: number;
  name: string;
  currency: string;
};

type Goal = {
  id: number;
  name: string;
  is_default: boolean;
};

type GoalInputs = {
  start_date: string;
  duration_years: number;
  sp500_return: number;
  desired_monthly: number;
  planned_monthly: number;
  withdrawal_rate: number;
  initial_investment: number;
  inflation_rate: number;
  portfolio_inflation_rate: number;
  simulation_current_age: number;
  simulation_retirement_age: number;
  simulation_annual_spending: number;
  simulation_current_assets: number;
  simulation_monthly_contribution: number;
  simulation_return_rate: number;
  simulation_inflation_rate: number;
  simulation_swr: number;
  return_method: string;
};

type GoalMetrics = {
  years_elapsed: number;
  years_remaining: number;
  avg_monthly: number;
  invested_total: number;
  current_value: number;
  return_rate: number | null;
  return_method: string;
  assumption_return: number | null;
  future_value_1000: number;
  fire_target: number | null;
  coast_target: number | null;
  coast_years: number | null;
  coast_status: string;
  fire_years: number | null;
  fire_months: number | null;
  fire_status: string;
  inflation_rate: number;
};

type GoalProjection = {
  year: number;
  with_contrib: number;
  without_contrib: number | null;
  coast_target: number | null;
  age?: number;
};

type GoalFireSection = {
  metrics: GoalMetrics;
  projection: GoalProjection[];
};

type SimulationMetrics = {
  current_age: number;
  retirement_age: number;
  years_to_retire: number;
  annual_spending: number;
  current_assets: number;
  monthly_contribution: number;
  investment_return: number;
  inflation_rate: number;
  swr: number;
  adjusted_return: number;
  fire_target: number | null;
  coast_target: number | null;
  coast_years: number | null;
  coast_status: string;
};

type SimulationSection = {
  metrics: SimulationMetrics;
  projection: GoalProjection[];
};

type GoalContribution = {
  id: number;
  contribution_date: string;
  amount: number;
};

type GoalsProps = {
  t: Translation;
  token: string;
  portfolio?: Portfolio | null;
};

const API_BASE = "http://127.0.0.1:8000";

const formatNumber = (value: number | null, currency: string) => {
  if (value === null || Number.isNaN(value)) {
    return "N/A";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: "code"
  }).format(value);
};

const formatPercent = (value: number | null) => {
  if (value === null || Number.isNaN(value)) {
    return "N/A";
  }
  return `${value.toFixed(2)}%`;
};

const parseNumber = (value: string) => {
  if (!value) {
    return null;
  }
  let cleaned = value.trim();
  if (!cleaned) {
    return null;
  }
  cleaned = cleaned.replace(/[^0-9,.-]/g, "");
  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  if (lastComma !== -1 || lastDot !== -1) {
    const lastSep = Math.max(lastComma, lastDot);
    const integerPart = cleaned.slice(0, lastSep).replace(/[.,]/g, "");
    const decimalPart = cleaned.slice(lastSep + 1).replace(/[.,]/g, "");
    cleaned = decimalPart ? `${integerPart}.${decimalPart}` : integerPart;
  }
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

const buildPath = (
  points: GoalProjection[],
  key: "with_contrib" | "without_contrib" | "coast_target",
  max: number
) => {
  if (!points.length) {
    return "";
  }
  const lastIndex = points.length - 1;
  let path = "";
  let started = false;
  points.forEach((point, index) => {
    const value =
      key === "with_contrib"
        ? point.with_contrib
        : key === "without_contrib"
          ? point.without_contrib
          : point.coast_target;
    if (value === null || !Number.isFinite(value)) {
      started = false;
      return;
    }
    const x = lastIndex === 0 ? 0 : (index / lastIndex) * 100;
    const y = max === 0 ? 100 : 100 - (value / max) * 100;
    path += `${started ? "L" : "M"} ${x.toFixed(2)} ${y.toFixed(2)} `;
    started = true;
  });
  return path.trim();
};

const formatAxisValue = (value: number, currency: string) => {
  const absValue = Math.abs(value);
  let short = value.toFixed(0);
  if (absValue >= 1_000_000) {
    short = `${(value / 1_000_000).toFixed(1)}M`;
  } else if (absValue >= 1_000) {
    short = `${(value / 1_000).toFixed(0)}k`;
  }
  return `${currency} ${short}`;
};

function MyGoals({ t, token, portfolio }: GoalsProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [activeGoalId, setActiveGoalId] = useState<number | null>(null);
  const [goalInputs, setGoalInputs] = useState<GoalInputs | null>(null);
  const [portfolioFire, setPortfolioFire] = useState<GoalFireSection | null>(null);
  const [simulationFire, setSimulationFire] = useState<SimulationSection | null>(null);
  const [goalContributions, setGoalContributions] = useState<GoalContribution[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [goalViewMode, setGoalViewMode] = useState<"portfolio" | "simulation">(
    "portfolio"
  );

  const [newGoalName, setNewGoalName] = useState("");
  const [renameGoalName, setRenameGoalName] = useState("");

  const [formState, setFormState] = useState({
    start_date: "",
    duration_years: "",
    sp500_return: "",
    desired_monthly: "",
    planned_monthly: "",
    withdrawal_rate: "",
    initial_investment: "",
    inflation_rate: "",
    portfolio_inflation_rate: "",
    simulation_current_age: "",
    simulation_retirement_age: "",
    simulation_annual_spending: "",
    simulation_current_assets: "",
    simulation_monthly_contribution: "",
    simulation_return_rate: "",
    simulation_inflation_rate: "",
    simulation_swr: "",
    return_method: "cagr"
  });

  const [contributionDate, setContributionDate] = useState("");
  const [contributionAmount, setContributionAmount] = useState("");
  const [infoOpen, setInfoOpen] = useState(false);

  const currency = portfolio?.currency || "EUR";

  const formatCoast = (metrics: GoalMetrics | null) => {
    if (!metrics) {
      return "N/A";
    }
    if (metrics.coast_status === "missing") {
      return t.goals.status.missing;
    }
    if (metrics.coast_status === "imp") {
      return t.goals.status.impossible;
    }
    if (metrics.coast_status === "achieved") {
      return t.goals.status.achieved;
    }
    if (metrics.coast_years === null) {
      return "N/A";
    }
    return `${metrics.coast_years.toFixed(1)} ${t.goals.metrics.years}`;
  };

  const formatFire = (metrics: GoalMetrics | null) => {
    if (!metrics) {
      return "N/A";
    }
    if (metrics.fire_status === "missing") {
      return t.goals.status.missing;
    }
    if (metrics.fire_status === "imp") {
      return t.goals.status.impossible;
    }
    if (metrics.fire_years === null) {
      return "N/A";
    }
    const years = Math.max(0, Math.floor(metrics.fire_years));
    const months = metrics.fire_months ?? 0;
    return t.goals.fireMessage.replace("{years}", String(years)).replace("{months}", String(months));
  };

  const formatSimulationCoast = (metrics: SimulationMetrics | null) => {
    if (!metrics) {
      return "N/A";
    }
    if (metrics.coast_status === "missing") {
      return t.goals.status.missing;
    }
    if (metrics.coast_status === "imp") {
      return t.goals.status.impossible;
    }
    if (metrics.coast_status === "achieved") {
      return t.goals.status.achieved;
    }
    if (metrics.coast_years === null) {
      return "N/A";
    }
    return `${metrics.coast_years.toFixed(1)} ${t.goals.metrics.years}`;
  };

  const loadGoals = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/goals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || "Failed");
      }
      const items = (data.items || []) as Goal[];
      setGoals(items);
      if (items.length && !activeGoalId) {
        setActiveGoalId(items[0].id);
      }
    } catch (err) {
      setError(t.goals.loadError);
    } finally {
      setLoading(false);
    }
  };

  const loadGoal = async (goalId: number) => {
    setLoading(true);
    setError("");
    try {
      const query = portfolio?.id ? `?portfolio_id=${portfolio.id}` : "";
      const response = await fetch(`${API_BASE}/goals/${goalId}${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || "Failed");
      }
      const inputs = data.inputs as GoalInputs;
      setGoalInputs(inputs);
      setPortfolioFire(data.portfolio_fire || null);
      setSimulationFire(data.simulation_fire || null);
      setGoalContributions(data.contributions || []);
      setRenameGoalName(data.goal?.name || "");
      setFormState({
        start_date: inputs.start_date,
        duration_years: String(inputs.duration_years ?? ""),
        sp500_return: String((inputs.sp500_return || 0) * 100),
        desired_monthly: String(inputs.desired_monthly ?? ""),
        planned_monthly: String(
          inputs.planned_monthly ?? inputs.desired_monthly ?? ""
        ),
        withdrawal_rate: String((inputs.withdrawal_rate || 0) * 100),
        initial_investment: String(inputs.initial_investment ?? ""),
        inflation_rate: String((inputs.inflation_rate || 0) * 100),
        portfolio_inflation_rate: String(
          (inputs.portfolio_inflation_rate || inputs.inflation_rate || 0) * 100
        ),
        simulation_current_age: String(inputs.simulation_current_age ?? ""),
        simulation_retirement_age: String(inputs.simulation_retirement_age ?? ""),
        simulation_annual_spending: String(inputs.simulation_annual_spending ?? ""),
        simulation_current_assets: String(inputs.simulation_current_assets ?? ""),
        simulation_monthly_contribution: String(
          inputs.simulation_monthly_contribution ?? ""
        ),
        simulation_return_rate: String((inputs.simulation_return_rate || 0) * 100),
        simulation_inflation_rate: String(
          (inputs.simulation_inflation_rate || 0) * 100
        ),
        simulation_swr: String((inputs.simulation_swr || 0) * 100),
        return_method: inputs.return_method || "cagr"
      });
    } catch (err) {
      setError(t.goals.loadError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadGoals();
    }
  }, [token]);

  useEffect(() => {
    if (token && activeGoalId) {
      loadGoal(activeGoalId);
    }
  }, [token, activeGoalId, portfolio?.id]);

  const activeGoal = goals.find((goal) => goal.id === activeGoalId) || goals[0];

  const handleCreateGoal = async () => {
    if (!newGoalName.trim()) {
      setError(t.goals.nameRequired);
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`${API_BASE}/goals`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name: newGoalName.trim() })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || "Failed");
      }
      const createdGoal = data.goal as Goal;
      setGoals((prev) => [
        createdGoal,
        ...prev.filter((item) => item.id !== createdGoal.id)
      ]);
      setActiveGoalId(createdGoal.id);
      setNewGoalName("");
      setMessage(t.goals.created);
      await loadGoal(createdGoal.id);
    } catch (err) {
      setError(t.goals.saveError);
    } finally {
      setLoading(false);
    }
  };

  const handleRenameGoal = async () => {
    if (!activeGoal) {
      return;
    }
    if (!renameGoalName.trim()) {
      setError(t.goals.nameRequired);
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`${API_BASE}/goals/${activeGoal.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name: renameGoalName.trim() })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || "Failed");
      }
      setGoals((prev) =>
        prev.map((item) => (item.id === activeGoal.id ? data.goal : item))
      );
      setMessage(t.goals.updated);
    } catch (err) {
      setError(t.goals.saveError);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGoal = async () => {
    if (!activeGoal || activeGoal.is_default) {
      return;
    }
    const confirmed = window.confirm(t.goals.deleteConfirm);
    if (!confirmed) {
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`${API_BASE}/goals/${activeGoal.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || "Failed");
      }
      const remaining = goals.filter((item) => item.id !== activeGoal.id);
      setGoals(remaining);
      setActiveGoalId(remaining.length ? remaining[0].id : null);
      setMessage(t.goals.deleted);
    } catch (err) {
      setError(t.goals.deleteError);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInputs = async () => {
    if (!activeGoal) {
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    const duration = parseNumber(formState.duration_years);
    const sp500 = parseNumber(formState.sp500_return);
    const desired = parseNumber(formState.desired_monthly);
    const planned = parseNumber(formState.planned_monthly);
    const withdrawal = parseNumber(formState.withdrawal_rate);
    const initial = parseNumber(formState.initial_investment);
    const inflation = parseNumber(formState.inflation_rate);
    const portfolioInflation = parseNumber(formState.portfolio_inflation_rate);
    const simulationCurrentAge = parseNumber(formState.simulation_current_age);
    const simulationRetirementAge = parseNumber(formState.simulation_retirement_age);
    const simulationAnnualSpending = parseNumber(formState.simulation_annual_spending);
    const simulationCurrentAssets = parseNumber(formState.simulation_current_assets);
    const simulationMonthlyContribution = parseNumber(
      formState.simulation_monthly_contribution
    );
    const simulationReturnRate = parseNumber(formState.simulation_return_rate);
    const simulationInflationRate = parseNumber(formState.simulation_inflation_rate);
    const simulationSWR = parseNumber(formState.simulation_swr);
    if (
      !formState.start_date ||
      duration === null ||
      sp500 === null ||
      desired === null ||
      planned === null ||
      withdrawal === null ||
      initial === null ||
      inflation === null ||
      portfolioInflation === null ||
      simulationCurrentAge === null ||
      simulationRetirementAge === null ||
      simulationAnnualSpending === null ||
      simulationCurrentAssets === null ||
      simulationMonthlyContribution === null ||
      simulationReturnRate === null ||
      simulationInflationRate === null ||
      simulationSWR === null
    ) {
      setError(t.goals.inputError);
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/goals/${activeGoal.id}/inputs`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          start_date: formState.start_date,
          duration_years: duration,
          sp500_return: sp500,
          desired_monthly: desired,
          planned_monthly: planned,
          withdrawal_rate: withdrawal,
          initial_investment: initial,
          inflation_rate: inflation,
          portfolio_inflation_rate: portfolioInflation,
          simulation_current_age: simulationCurrentAge,
          simulation_retirement_age: simulationRetirementAge,
          simulation_annual_spending: simulationAnnualSpending,
          simulation_current_assets: simulationCurrentAssets,
          simulation_monthly_contribution: simulationMonthlyContribution,
          simulation_return_rate: simulationReturnRate,
          simulation_inflation_rate: simulationInflationRate,
          simulation_swr: simulationSWR,
          return_method: formState.return_method
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || "Failed");
      }
      setMessage(t.goals.updated);
      if (activeGoalId) {
        loadGoal(activeGoalId);
      }
    } catch (err) {
      setError(t.goals.saveError);
    } finally {
      setLoading(false);
    }
  };

  const handleAddContribution = async () => {
    if (!activeGoal) {
      return;
    }
    const amount = parseNumber(contributionAmount);
    if (!contributionDate || amount === null) {
      setError(t.goals.contributionError);
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(
        `${API_BASE}/goals/${activeGoal.id}/contributions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contribution_date: contributionDate,
            amount
          })
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || "Failed");
      }
      setContributionAmount("");
      setContributionDate("");
      if (activeGoalId) {
        loadGoal(activeGoalId);
      }
      setMessage(t.goals.contributionSaved);
    } catch (err) {
      setError(t.goals.saveError);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContribution = async (contributionId: number) => {
    if (!activeGoal) {
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(
        `${API_BASE}/goals/${activeGoal.id}/contributions/${contributionId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || "Failed");
      }
      if (activeGoalId) {
        loadGoal(activeGoalId);
      }
      setMessage(t.goals.deleted);
    } catch (err) {
      setError(t.goals.deleteError);
    } finally {
      setLoading(false);
    }
  };

  const buildChartData = (
    section: { metrics: { fire_target?: number | null }; projection?: GoalProjection[] } | null
  ) => {
    const projection = section?.projection || [];
    const fireTarget =
      section?.metrics?.fire_target === undefined ? null : section.metrics.fire_target ?? null;
    const values = [
      ...projection.map((item) => item.with_contrib),
      ...projection
        .map((item) => item.without_contrib)
        .filter((value): value is number => value !== null && Number.isFinite(value)),
      ...projection
        .map((item) => item.coast_target)
        .filter((value): value is number => value !== null && Number.isFinite(value))
    ];
    if (fireTarget !== null) {
      values.push(fireTarget);
    }
    const maxValue = values.length ? Math.max(...values, 1) : 1;
    const startValue = projection.length
      ? projection[0].age ?? projection[0].year
      : 0;
    const endValue = projection.length
      ? projection[projection.length - 1].age ?? projection[projection.length - 1].year
      : 0;
    return {
      maxValue,
      fireTarget,
      projection,
      years: projection.length ? projection[projection.length - 1].year : 0,
      startValue,
      endValue,
      usesAge: projection.length ? projection[0].age !== undefined : false
    };
  };

  const portfolioChart = useMemo(() => buildChartData(portfolioFire), [portfolioFire]);
  const simulationChart = useMemo(
    () => buildChartData(simulationFire),
    [simulationFire]
  );

  const portfolioWithPath = useMemo(
    () => buildPath(portfolioChart.projection, "with_contrib", portfolioChart.maxValue),
    [portfolioChart]
  );
  const portfolioWithoutPath = useMemo(
    () =>
      buildPath(portfolioChart.projection, "without_contrib", portfolioChart.maxValue),
    [portfolioChart]
  );
  const portfolioCoastPath = useMemo(
    () => buildPath(portfolioChart.projection, "coast_target", portfolioChart.maxValue),
    [portfolioChart]
  );

  const simulationWithPath = useMemo(
    () =>
      buildPath(
        simulationChart.projection,
        "with_contrib",
        simulationChart.maxValue
      ),
    [simulationChart]
  );
  const simulationWithoutPath = useMemo(
    () =>
      buildPath(
        simulationChart.projection,
        "without_contrib",
        simulationChart.maxValue
      ),
    [simulationChart]
  );
  const simulationCoastPath = useMemo(
    () =>
      buildPath(
        simulationChart.projection,
        "coast_target",
        simulationChart.maxValue
      ),
    [simulationChart]
  );

  const buildAxisLabels = (chart: {
    maxValue: number;
    projection: GoalProjection[];
    years: number;
    startValue: number;
    endValue: number;
    usesAge: boolean;
  }) => {
    const startLabel = chart.projection.length ? chart.startValue : 0;
    const endLabel = chart.projection.length ? chart.endValue : 0;
    return {
      startLabel,
      endLabel,
      maxLabel: formatAxisValue(chart.maxValue, currency),
      midLabel: formatAxisValue(chart.maxValue / 2, currency),
      axisValueLabel: t.goals.chart.axisValue.replace("{currency}", currency),
      axisYearsLabel: chart.usesAge ? t.goals.chart.axisAge : t.goals.chart.axisYears
    };
  };

  const buildCoastMarker = (projection: GoalProjection[]) => {
    if (!projection.length) {
      return null;
    }
    const lastIndex = projection.length - 1;
    let markerIndex = -1;
    for (let i = 0; i < projection.length; i += 1) {
      const point = projection[i];
      if (
        point.without_contrib !== null &&
        point.coast_target !== null &&
        point.without_contrib >= point.coast_target
      ) {
        markerIndex = i;
        break;
      }
    }
    if (markerIndex < 0) {
      return null;
    }
    const point = projection[markerIndex];
    const x = lastIndex === 0 ? 0 : (markerIndex / lastIndex) * 100;
    const labelValue = point.age ?? point.year;
    if (labelValue === undefined || labelValue === null) {
      return null;
    }
    return {
      x,
      label: labelValue.toFixed(0)
    };
  };

  const portfolioAxis = buildAxisLabels(portfolioChart);
  const simulationAxis = buildAxisLabels(simulationChart);
  const portfolioCoastMarker = useMemo(
    () => buildCoastMarker(portfolioChart.projection),
    [portfolioChart]
  );
  const simulationCoastMarker = useMemo(
    () => buildCoastMarker(simulationChart.projection),
    [simulationChart]
  );

  return (
    <section className="goals-page">
        <div className="goals-header">
          <div>
            <h2>{t.goals.title}</h2>
            <p>{t.goals.subtitle}</p>
          </div>
          <div className="goals-actions">
            <input
              className="goal-input"
              placeholder={t.goals.newGoalPlaceholder}
              value={newGoalName}
              onChange={(event) => setNewGoalName(event.target.value)}
            />
            <button className="primary-btn" type="button" onClick={handleCreateGoal}>
              {t.goals.add}
            </button>
            <button
              className={`ghost-btn${goalViewMode === "simulation" ? " active" : ""}`}
              type="button"
              onClick={() =>
                setGoalViewMode((prev) => (prev === "simulation" ? "portfolio" : "simulation"))
              }
            >
              {t.goals.simulation}
            </button>
            <button
              className="danger-btn"
              type="button"
              disabled={!activeGoal || activeGoal.is_default}
              onClick={handleDeleteGoal}
              title={
                !activeGoal || activeGoal.is_default ? t.goals.deleteConfirm : undefined
              }
            >
              {t.goals.delete}
            </button>
          </div>
        </div>

      <div className="goals-tabs">
        {goals.map((goal) => (
          <button
            key={goal.id}
            type="button"
            className={`goal-tab${goal.id === activeGoal?.id ? " active" : ""}`}
            onClick={() => setActiveGoalId(goal.id)}
          >
            {goal.name}
          </button>
        ))}
      </div>

      <div className="import-card">
        <div className="import-card-head">
          <div>
            <h3>{activeGoal?.name || t.goals.detailsTitle}</h3>
            <p>{t.goals.detailsSubtitle}</p>
          </div>
          <div className="goal-header-actions">
            {activeGoal && !activeGoal.is_default ? (
              <>
                <input
                  className="goal-input"
                  value={renameGoalName}
                  onChange={(event) => setRenameGoalName(event.target.value)}
                />
                <button className="secondary-btn" type="button" onClick={handleRenameGoal}>
                  {t.goals.rename}
                </button>
                <button className="danger-btn" type="button" onClick={handleDeleteGoal}>
                  {t.goals.delete}
                </button>
              </>
            ) : null}
          </div>
        </div>

        {loading ? <p className="muted">{t.goals.loading}</p> : null}
        {message ? <p className="success">{message}</p> : null}
        {error ? <p className="error">{error}</p> : null}

        <div className="goals-sections">
        {goalViewMode === "portfolio" ? (
        <div className="goals-section">
          <div className="goals-section-header">
            <div>
              <h4>{t.goals.sections.portfolio.title}</h4>
              <p>{t.goals.sections.portfolio.subtitle}</p>
            </div>
          </div>
          <div className="goals-grid">
            <div className="goals-card">
              <h5>{t.goals.sections.portfolio.inputs}</h5>
              <div className="form-grid">
                <div className="field">
                  <label>{t.goals.inputs.startDate}</label>
                  <input
                    type="date"
                    value={formState.start_date}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        start_date: event.target.value
                      }))
                    }
                  />
                </div>
                <div className="field">
                  <label>{t.goals.inputs.desiredMonthly}</label>
                  <input
                    value={formState.desired_monthly}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        desired_monthly: event.target.value
                      }))
                    }
                  />
                </div>
                <div className="field">
                  <label>{t.goals.inputs.plannedMonthly}</label>
                  <input
                    value={formState.planned_monthly}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        planned_monthly: event.target.value
                      }))
                    }
                  />
                </div>
                <div className="field">
                  <label>{t.goals.inputs.valueInvested}</label>
                  <input
                    value={formState.initial_investment}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        initial_investment: event.target.value
                      }))
                    }
                  />
                </div>
                <div className="field">
                  <label>{t.goals.inputs.durationYears}</label>
                  <input
                    value={formState.duration_years}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        duration_years: event.target.value
                      }))
                    }
                  />
                </div>
                <div className="field">
                  <label>{t.goals.inputs.sp500}</label>
                  <input
                    value={formState.sp500_return}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        sp500_return: event.target.value
                      }))
                    }
                  />
                </div>
                <div className="field">
                  <label>{t.goals.inputs.withdrawalRate}</label>
                  <input
                    value={formState.withdrawal_rate}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        withdrawal_rate: event.target.value
                      }))
                    }
                  />
                </div>
                <div className="field">
                  <label>{t.goals.inputs.initialInvestment}</label>
                  <input
                    value={formState.initial_investment}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        initial_investment: event.target.value
                      }))
                    }
                  />
                </div>
                <div className="field">
                  <label>{t.goals.inputs.returnMethod}</label>
                  <select
                    value={formState.return_method}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        return_method: event.target.value
                      }))
                    }
                  >
                    <option value="cagr">CAGR</option>
                    <option value="xirr">XIRR</option>
                  </select>
                </div>
                <div className="field">
                  <label>{t.goals.inputs.ecbInflation}</label>
                  <input
                    value={formState.portfolio_inflation_rate}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        portfolio_inflation_rate: event.target.value
                      }))
                    }
                  />
                </div>
              </div>
              <div className="form-actions">
                <button className="primary-btn" type="button" onClick={handleSaveInputs}>
                  {t.goals.saveInputs}
                </button>
              </div>
            </div>

            <div className="goals-card">
              <h5>{t.goals.sections.portfolio.results}</h5>
              <div className="goals-metrics">
                <div className="goals-metric">
                  <span>{t.goals.metrics.yearsElapsed}</span>
                  <strong>
                    {portfolioFire
                      ? portfolioFire.metrics.years_elapsed.toFixed(1)
                      : "N/A"}
                  </strong>
                </div>
                <div className="goals-metric">
                  <span>{t.goals.metrics.yearsRemaining}</span>
                  <strong>
                    {portfolioFire
                      ? portfolioFire.metrics.years_remaining.toFixed(1)
                      : "N/A"}
                  </strong>
                </div>
                <div className="goals-metric">
                  <span>{t.goals.metrics.avgMonthlyPortfolio}</span>
                  <strong>
                    {portfolioFire
                      ? formatNumber(portfolioFire.metrics.avg_monthly, currency)
                      : "N/A"}
                  </strong>
                </div>
                <div className="goals-metric">
                  <span>{t.goals.metrics.investedTotal}</span>
                  <strong>
                    {portfolioFire
                      ? formatNumber(portfolioFire.metrics.invested_total, currency)
                      : "N/A"}
                  </strong>
                </div>
                <div className="goals-metric">
                  <div className="holding-header">
                    <span>{t.goals.metrics.returnRate}</span>
                    <button
                      type="button"
                      className="info-btn"
                      onClick={() => setInfoOpen((open) => !open)}
                    >
                      ?
                    </button>
                    {infoOpen ? (
                      <div className="holdings-tooltip">
                        {t.goals.tooltips.returnRate}
                      </div>
                    ) : null}
                  </div>
                  <strong>
                    {portfolioFire
                      ? formatPercent(
                          portfolioFire.metrics.assumption_return ??
                            portfolioFire.metrics.return_rate
                        )
                      : "N/A"}
                  </strong>
                </div>
                <div className="goals-metric">
                  <span>{t.goals.metrics.returnCalc}</span>
                  <strong>
                    {portfolioFire ? formatPercent(portfolioFire.metrics.return_rate) : "N/A"}
                  </strong>
                </div>
                <div className="goals-metric">
                  <span>{t.goals.metrics.future1000}</span>
                  <strong>
                    {portfolioFire
                      ? formatNumber(portfolioFire.metrics.future_value_1000, currency)
                      : "N/A"}
                  </strong>
                </div>
                <div className="goals-metric">
                  <span>{t.goals.metrics.fireTarget}</span>
                  <strong>
                    {portfolioFire && portfolioFire.metrics.fire_target
                      ? formatNumber(portfolioFire.metrics.fire_target, currency)
                      : "N/A"}
                  </strong>
                </div>
                <div className="goals-metric">
                  <span>{t.goals.metrics.coastTarget}</span>
                  <strong>
                    {portfolioFire && portfolioFire.metrics.coast_target !== null
                      ? formatNumber(portfolioFire.metrics.coast_target, currency)
                      : "N/A"}
                  </strong>
                </div>
                <div className="goals-metric">
                  <span>{t.goals.metrics.coastTime}</span>
                  <strong>{formatCoast(portfolioFire?.metrics || null)}</strong>
                </div>
                <div className="goals-metric">
                  <span>{t.goals.metrics.fireTime}</span>
                  <strong>{formatFire(portfolioFire?.metrics || null)}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="goals-chart">
            <div className="import-card-head">
              <div>
                <h4>{t.goals.sections.portfolio.chartTitle}</h4>
                <p>{t.goals.sections.portfolio.chartSubtitle}</p>
              </div>
            </div>
            {portfolioChart.projection.length ? (
              <>
                <div className="goals-chart-body">
                  <div className="goals-chart-axis">
                    <span>{portfolioAxis.maxLabel}</span>
                    <span>{portfolioAxis.midLabel}</span>
                    <span>{formatAxisValue(0, currency)}</span>
                    <span className="axis-label">{portfolioAxis.axisValueLabel}</span>
                  </div>
                <div className="goals-chart-plot">
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                        <linearGradient
                          id="goalFillPortfolio"
                          x1="0"
                          x2="0"
                          y1="0"
                          y2="1"
                        >
                          <stop offset="0%" stopColor="rgba(46, 220, 153, 0.35)" />
                          <stop offset="100%" stopColor="rgba(46, 220, 153, 0)" />
                        </linearGradient>
                      </defs>
                      {portfolioChart.fireTarget ? (
                        <line
                          x1="0"
                          y1={100 - (portfolioChart.fireTarget / portfolioChart.maxValue) * 100}
                          x2="100"
                          y2={100 - (portfolioChart.fireTarget / portfolioChart.maxValue) * 100}
                          stroke="#ff6b6b"
                          strokeWidth="0.8"
                        />
                      ) : null}
                      {portfolioCoastMarker ? (
                        <>
                          <line
                            x1={portfolioCoastMarker.x}
                            y1="0"
                            x2={portfolioCoastMarker.x}
                            y2="100"
                            stroke="#4ea1ff"
                            strokeDasharray="2 2"
                            strokeWidth="0.8"
                          />
                          <text
                            x={portfolioCoastMarker.x}
                            y="98"
                            fill="#9aa9bf"
                            fontSize="4"
                            textAnchor="middle"
                          >
                            {portfolioCoastMarker.label}
                          </text>
                        </>
                      ) : null}
                      {portfolioCoastPath ? (
                        <path
                          d={portfolioCoastPath}
                          fill="none"
                          stroke="#4ea1ff"
                          strokeDasharray="3 3"
                          strokeWidth="1.1"
                        />
                      ) : null}
                      {portfolioWithoutPath ? (
                        <>
                          <path
                            d={`${portfolioWithoutPath} L 100 100 L 0 100 Z`}
                            fill="url(#goalFillPortfolio)"
                          />
                          <path
                            d={portfolioWithoutPath}
                            fill="none"
                            stroke="#2ad68d"
                            strokeWidth="1.4"
                          />
                        </>
                      ) : null}
                      {portfolioWithPath ? (
                        <path
                          d={portfolioWithPath}
                          fill="none"
                          stroke="#9aa9bf"
                          strokeWidth="1.1"
                        />
                      ) : null}
                    </svg>
                  </div>
                </div>
                <div className="goals-chart-x">
                  <span>{portfolioAxis.startLabel}</span>
                  <span>{portfolioAxis.endLabel}</span>
                </div>
                <p className="goals-chart-axis-label">{portfolioAxis.axisYearsLabel}</p>
                <div className="goals-chart-legend">
                  <span className="legend-item legend-continued">
                    {t.goals.chart.continuedContrib}
                  </span>
                  <span className="legend-item legend-coast">
                    {t.goals.chart.noContribAfterCoast}
                  </span>
                  <span className="legend-item legend-target">
                    {t.goals.chart.coastTarget}
                  </span>
                  <span className="legend-item legend-fire">{t.goals.chart.fireLine}</span>
                </div>
              </>
            ) : (
              <p className="muted">{t.goals.chart.empty}</p>
            )}
          </div>
        </div>
        ) : null}

        {goalViewMode === "simulation" ? (
        <div className="goals-section">
          <div className="goals-section-header">
            <div>
              <h4>{t.goals.sections.simulation.title}</h4>
              <p>{t.goals.sections.simulation.subtitle}</p>
            </div>
          </div>
          <div className="goals-grid">
            <div className="goals-card">
              <h5>{t.goals.sections.simulation.inputs}</h5>
              <div className="form-grid">
                <div className="field">
                  <label>{t.goals.inputs.currentAge}</label>
                  <input
                    value={formState.simulation_current_age}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        simulation_current_age: event.target.value
                      }))
                    }
                  />
                </div>
                <div className="field">
                  <label>{t.goals.inputs.retirementAge}</label>
                  <input
                    value={formState.simulation_retirement_age}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        simulation_retirement_age: event.target.value
                      }))
                    }
                  />
                </div>
                <div className="field">
                  <label>{t.goals.inputs.annualSpending}</label>
                  <input
                    value={formState.simulation_annual_spending}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        simulation_annual_spending: event.target.value
                      }))
                    }
                  />
                </div>
                <div className="field">
                  <label>{t.goals.inputs.currentAssets}</label>
                  <input
                    value={formState.simulation_current_assets}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        simulation_current_assets: event.target.value
                      }))
                    }
                  />
                </div>
                <div className="field">
                  <label>{t.goals.inputs.monthlyContribution}</label>
                  <input
                    value={formState.simulation_monthly_contribution}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        simulation_monthly_contribution: event.target.value
                      }))
                    }
                  />
                </div>
                <div className="field">
                  <label>{t.goals.inputs.investmentReturn}</label>
                  <input
                    value={formState.simulation_return_rate}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        simulation_return_rate: event.target.value
                      }))
                    }
                  />
                </div>
                <div className="field">
                  <label>{t.goals.inputs.inflation}</label>
                  <input
                    value={formState.simulation_inflation_rate}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        simulation_inflation_rate: event.target.value
                      }))
                    }
                  />
                </div>
                <div className="field">
                  <label>{t.goals.inputs.safeWithdrawalRate}</label>
                  <input
                    value={formState.simulation_swr}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        simulation_swr: event.target.value
                      }))
                    }
                  />
                </div>
              </div>
              <div className="form-actions">
                <button className="primary-btn" type="button" onClick={handleSaveInputs}>
                  {t.goals.saveInputs}
                </button>
              </div>
            </div>

            <div className="goals-card">
              <h5>{t.goals.sections.simulation.results}</h5>
              <div className="goals-metrics">
                <div className="goals-metric">
                  <span>{t.goals.metrics.yearsToRetire}</span>
                  <strong>
                    {simulationFire
                      ? simulationFire.metrics.years_to_retire.toFixed(1)
                      : "N/A"}
                  </strong>
                </div>
                <div className="goals-metric">
                  <span>{t.goals.metrics.annualSpending}</span>
                  <strong>
                    {simulationFire
                      ? formatNumber(simulationFire.metrics.annual_spending, currency)
                      : "N/A"}
                  </strong>
                </div>
                <div className="goals-metric">
                  <span>{t.goals.metrics.currentAssets}</span>
                  <strong>
                    {simulationFire
                      ? formatNumber(simulationFire.metrics.current_assets, currency)
                      : "N/A"}
                  </strong>
                </div>
                <div className="goals-metric">
                  <span>{t.goals.metrics.monthlyContribution}</span>
                  <strong>
                    {simulationFire
                      ? formatNumber(simulationFire.metrics.monthly_contribution, currency)
                      : "N/A"}
                  </strong>
                </div>
                <div className="goals-metric">
                  <span>{t.goals.metrics.investmentReturn}</span>
                  <strong>
                    {simulationFire
                      ? formatPercent(simulationFire.metrics.investment_return)
                      : "N/A"}
                  </strong>
                </div>
                <div className="goals-metric">
                  <span>{t.goals.metrics.adjustedReturn}</span>
                  <strong>
                    {simulationFire
                      ? formatPercent(simulationFire.metrics.adjusted_return)
                      : "N/A"}
                  </strong>
                </div>
                <div className="goals-metric">
                  <span>{t.goals.metrics.fireTarget}</span>
                  <strong>
                    {simulationFire
                      ? formatNumber(simulationFire.metrics.fire_target, currency)
                      : "N/A"}
                  </strong>
                </div>
                <div className="goals-metric">
                  <span>{t.goals.metrics.coastTarget}</span>
                  <strong>
                    {simulationFire
                      ? formatNumber(simulationFire.metrics.coast_target, currency)
                      : "N/A"}
                  </strong>
                </div>
                <div className="goals-metric">
                  <span>{t.goals.metrics.coastStatus}</span>
                  <strong>
                    {simulationFire
                      ? formatSimulationCoast(simulationFire.metrics)
                      : "N/A"}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          <div className="goals-chart">
            <div className="import-card-head">
              <div>
                <h4>{t.goals.sections.simulation.chartTitle}</h4>
                <p>{t.goals.sections.simulation.chartSubtitle}</p>
              </div>
            </div>
            {simulationChart.projection.length ? (
              <>
                <div className="goals-chart-body">
                  <div className="goals-chart-axis">
                    <span>{simulationAxis.maxLabel}</span>
                    <span>{simulationAxis.midLabel}</span>
                    <span>{formatAxisValue(0, currency)}</span>
                    <span className="axis-label">{simulationAxis.axisValueLabel}</span>
                  </div>
                <div className="goals-chart-plot">
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="goalFillSim" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="rgba(46, 220, 153, 0.35)" />
                          <stop offset="100%" stopColor="rgba(46, 220, 153, 0)" />
                        </linearGradient>
                      </defs>
                      {simulationChart.fireTarget ? (
                        <line
                          x1="0"
                          y1={100 - (simulationChart.fireTarget / simulationChart.maxValue) * 100}
                          x2="100"
                          y2={100 - (simulationChart.fireTarget / simulationChart.maxValue) * 100}
                          stroke="#ff6b6b"
                          strokeWidth="0.8"
                        />
                      ) : null}
                      {simulationCoastMarker ? (
                        <>
                          <line
                            x1={simulationCoastMarker.x}
                            y1="0"
                            x2={simulationCoastMarker.x}
                            y2="100"
                            stroke="#4ea1ff"
                            strokeDasharray="2 2"
                            strokeWidth="0.8"
                          />
                          <text
                            x={simulationCoastMarker.x}
                            y="98"
                            fill="#9aa9bf"
                            fontSize="4"
                            textAnchor="middle"
                          >
                            {simulationCoastMarker.label}
                          </text>
                        </>
                      ) : null}
                      {simulationCoastPath ? (
                        <path
                          d={simulationCoastPath}
                          fill="none"
                          stroke="#4ea1ff"
                          strokeDasharray="3 3"
                          strokeWidth="1.1"
                        />
                      ) : null}
                      {simulationWithoutPath ? (
                        <>
                          <path
                            d={`${simulationWithoutPath} L 100 100 L 0 100 Z`}
                            fill="url(#goalFillSim)"
                          />
                          <path
                            d={simulationWithoutPath}
                            fill="none"
                            stroke="#2ad68d"
                            strokeWidth="1.4"
                          />
                        </>
                      ) : null}
                      {simulationWithPath ? (
                        <path
                          d={simulationWithPath}
                          fill="none"
                          stroke="#9aa9bf"
                          strokeWidth="1.1"
                        />
                      ) : null}
                    </svg>
                  </div>
                </div>
                <div className="goals-chart-x">
                  <span>{simulationAxis.startLabel}</span>
                  <span>{simulationAxis.endLabel}</span>
                </div>
                <p className="goals-chart-axis-label">{simulationAxis.axisYearsLabel}</p>
                <div className="goals-chart-legend">
                  <span className="legend-item legend-continued">
                    {t.goals.chart.continuedContrib}
                  </span>
                  <span className="legend-item legend-coast">
                    {t.goals.chart.noContribAfterCoast}
                  </span>
                  <span className="legend-item legend-target">
                    {t.goals.chart.coastTarget}
                  </span>
                  <span className="legend-item legend-fire">{t.goals.chart.fireLine}</span>
                </div>
              </>
            ) : (
              <p className="muted">{t.goals.chart.empty}</p>
            )}
          </div>
        </div>
        ) : null}
        </div>

        {goalViewMode === "portfolio" ? (
        <div className="goals-grid">
          <div className="goals-card">
            <h4>{t.goals.contributions.title}</h4>
            <div className="form-grid">
              <div className="field">
                <label>{t.goals.contributions.date}</label>
                <input
                  type="date"
                  value={contributionDate}
                  onChange={(event) => setContributionDate(event.target.value)}
                />
              </div>
              <div className="field">
                <label>{t.goals.contributions.amount}</label>
                <input
                  value={contributionAmount}
                  onChange={(event) => setContributionAmount(event.target.value)}
                />
              </div>
            </div>
            <div className="form-actions">
              <button className="primary-btn" type="button" onClick={handleAddContribution}>
                {t.goals.contributions.add}
              </button>
            </div>
          </div>

          <div className="goals-card">
            <h4>{t.goals.contributions.listTitle}</h4>
            {goalContributions.length ? (
              <table className="goals-table">
                <thead>
                  <tr>
                    <th>{t.goals.contributions.date}</th>
                    <th>{t.goals.contributions.amount}</th>
                    <th>{t.goals.contributions.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {goalContributions.map((item) => (
                    <tr key={item.id}>
                      <td>{item.contribution_date}</td>
                      <td>{formatNumber(item.amount, currency)}</td>
                      <td>
                        <button
                          className="danger-btn"
                          type="button"
                          onClick={() => handleDeleteContribution(item.id)}
                        >
                          {t.goals.contributions.delete}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="muted">{t.goals.contributions.empty}</p>
            )}
          </div>
        </div>
        ) : null}
      </div>
    </section>
  );
}

export default MyGoals;

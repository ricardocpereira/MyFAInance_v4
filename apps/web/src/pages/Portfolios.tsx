import { useEffect, useMemo, useState } from "react";
import type { Translation } from "../content/translations";
import SantanderImport from "../components/SantanderImport";
import XtbImport from "../components/XtbImport";
import BancoInvestImport from "../components/BancoInvestImport";
import TradeRepublicImport from "../components/TradeRepublicImport";
import SaveNGrowImport from "../components/SaveNGrowImport";
import AforroNetImport from "../components/AforroNetImport";
import CategoryManager from "../components/CategoryManager";

type Portfolio = {
  id: number;
  name: string;
  currency: string;
  categories: string[];
  created_at: string;
  has_data: boolean;
};

type PortfoliosProps = {
  t: Translation;
  portfolio: Portfolio | undefined;
  loading: boolean;
  token: string;
  view: "overview" | "management" | "categories";
  onViewChange: (view: "overview" | "management" | "categories") => void;
  onRefresh: () => void;
};

type InstitutionRow = {
  institution: string;
  total: number;
  gains: number | null;
  vs_last_month?: number | null;
  profit_percent?: number | null;
  beni?: number | null;
  magui?: number | null;
};

function Portfolios({
  t,
  portfolio,
  loading,
  token,
  view,
  onViewChange,
  onRefresh
}: PortfoliosProps) {
  const [clearing, setClearing] = useState(false);
  const [clearMessage, setClearMessage] = useState("");
  const [clearError, setClearError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [infoOpen, setInfoOpen] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [allocation, setAllocation] = useState<
    { label: string; value: number }[]
  >([]);
  const [allocationView, setAllocationView] = useState<"pie" | "bar">("pie");
  const [allocationError, setAllocationError] = useState("");
  const [allocationLoading, setAllocationLoading] = useState(false);
  const [summaryTotals, setSummaryTotals] = useState({
    total: 0,
    totalInvested: 0,
    totalProfit: 0,
    profitPercent: 0,
    irr: null as number | null
  });
  const [institutions, setInstitutions] = useState<InstitutionRow[]>([]);
  const [institutionsLoading, setInstitutionsLoading] = useState(false);
  const [institutionsError, setInstitutionsError] = useState("");
  const [historyMonthly, setHistoryMonthly] = useState<
    { month: string; total: number }[]
  >([]);
  const [historyDaily, setHistoryDaily] = useState<
    {
      date: string;
      total: number;
      cash: number;
      emergency: number;
      invested: number;
    }[]
  >([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [snapshots, setSnapshots] = useState<
    {
      id: number;
      snapshot_date: string;
      total_value: number;
      total_invested: number;
      total_profit: number;
      profit_percent: number;
      created_at: string;
    }[]
  >([]);
  const [snapshotsLoading, setSnapshotsLoading] = useState(false);
  const [snapshotsError, setSnapshotsError] = useState("");
  const API_BASE = "http://127.0.0.1:8000";

  const institutionLogos: Record<string, string> = {
    santander: new URL(
      "../assets/institutions/Banco_Santander_Logotipo.svg.png",
      import.meta.url
    ).href,
    "trade republic": new URL(
      "../assets/institutions/Trade_Republic_logo_2021.svg.png",
      import.meta.url
    ).href,
    aforronet: new URL(
      "../assets/institutions/aforronet.gif",
      import.meta.url
    ).href,
    "save n grow": new URL(
      "../assets/institutions/images.png",
      import.meta.url
    ).href,
    xtb: new URL("../assets/institutions/logo-xtb.png", import.meta.url).href,
    bancoinvest: new URL(
      "../assets/institutions/BancoInvest Logo.png",
      import.meta.url
    ).href
  };

  const currencyLabel = portfolio?.currency || "EUR";

  const orderedAllocation = useMemo(() => {
    const order = ["cash", "emergency funds", "stocks", "retirement plans"];
    return [...allocation].sort((a, b) => {
      const aIndex = order.indexOf(a.label.toLowerCase());
      const bIndex = order.indexOf(b.label.toLowerCase());
      if (aIndex === -1 && bIndex === -1) {
        return b.value - a.value;
      }
      if (aIndex === -1) {
        return 1;
      }
      if (bIndex === -1) {
        return -1;
      }
      return aIndex - bIndex;
    });
  }, [allocation]);
  const allocationTotal = useMemo(
    () => orderedAllocation.reduce((sum, item) => sum + item.value, 0),
    [orderedAllocation]
  );
  const hasData =
    !!portfolio &&
    (portfolio.has_data || allocationTotal > 0 || summaryTotals.total > 0);
  const allocationColors = useMemo(
    () => ["#2ad68d", "#1b8af2", "#9b5cff", "#f2b441", "#ea5fd6", "#6fd6ff"],
    []
  );
  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currencyLabel,
        currencyDisplay: "code"
      }),
    [currencyLabel]
  );
  const formatCurrency = (value: number) => currencyFormatter.format(value);
  const formatSignedCurrency = (value: number) => {
    const sign = value < 0 ? "-" : "+";
    return `${sign}${currencyFormatter.format(Math.abs(value))}`;
  };
  const formatSignedPercent = (value: number) => {
    const sign = value < 0 ? "-" : "+";
    return `${sign}${Math.abs(value).toFixed(1)}%`;
  };
  const formatCategoryLabel = (label: string) => {
    const key = label.trim().toLowerCase();
    if (key === "cash") {
      return t.categories.cash;
    }
    if (key === "emergency funds") {
      return t.categories.emergency;
    }
    if (key === "stocks") {
      return t.categories.stocks;
    }
    if (key === "retirement plans") {
      return t.categories.retirement;
    }
    return label;
  };
  const formatMonthLabel = (value: string) => {
    if (!value) {
      return "";
    }
    // For aggregated portfolio snapshots, show full date (YYYY-MM-DD)
    if (portfolio?.id === -1 && value.includes('-') && value.split('-').length === 3) {
      const [year, month, day] = value.split("-");
      return `${day}/${month}/${year.slice(-2)}`;
    }
    // For regular portfolios, show month/year (YYYY-MM format)
    if (value.includes("-")) {
      const [year, month] = value.split("-");
      if (month && year) {
        return `${month}/${year.slice(-2)}`;
      }
    }
    return value;
  };
  const historySeries = useMemo(() => {
    // For aggregated portfolio, use snapshots data instead of monthly history
    if (portfolio?.id === -1 && snapshots.length > 0) {
      return snapshots.map(snapshot => ({
        month: snapshot.snapshot_date, // Use full date for snapshots
        total: snapshot.total_value
      })).sort((a, b) => a.month.localeCompare(b.month));
    }
    return [...historyMonthly].sort((a, b) => a.month.localeCompare(b.month));
  }, [historyMonthly, portfolio, snapshots]);
  const historyRange = useMemo(() => {
    if (!historySeries.length) {
      return { min: 0, max: 0 };
    }
    const totals = historySeries.map((item) => item.total);
    return { min: Math.min(...totals), max: Math.max(...totals) };
  }, [historySeries]);
  const historyLabels = useMemo(() => {
    if (!historySeries.length) {
      return [];
    }
    const first = historySeries[0].month;
    const last = historySeries[historySeries.length - 1].month;
    const middle = historySeries[Math.floor(historySeries.length / 2)].month;
    return [first, middle, last];
  }, [historySeries]);
  const historyPath = useMemo(() => {
    if (historySeries.length < 2) {
      return "";
    }
    const width = 300;
    const height = 90;
    const padding = 10;
    const range = historyRange.max - historyRange.min || 1;
    const step =
      historySeries.length > 1 ? width / (historySeries.length - 1) : 0;
    return historySeries
      .map((item, index) => {
        const x = padding + index * step;
        const y =
          padding +
          (height - ((item.total - historyRange.min) / range) * height);
        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  }, [historyRange.max, historyRange.min, historySeries]);
  const historyAreaPath = useMemo(() => {
    if (historySeries.length < 2) {
      return "";
    }
    const width = 300;
    const height = 90;
    const padding = 10;
    const range = historyRange.max - historyRange.min || 1;
    const step =
      historySeries.length > 1 ? width / (historySeries.length - 1) : 0;
    const points = historySeries.map((item, index) => {
      const x = padding + index * step;
      const y =
        padding +
        (height - ((item.total - historyRange.min) / range) * height);
      return { x, y };
    });
    const topPath = points
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
      .join(" ");
    const bottomY = padding + height;
    return `${topPath} L ${points[points.length - 1].x} ${bottomY} L ${points[0].x} ${bottomY} Z`;
  }, [historyRange.max, historyRange.min, historySeries]);
  const historyPoints = useMemo(() => {
    if (historySeries.length < 2) {
      return [];
    }
    const width = 300;
    const height = 90;
    const padding = 10;
    const range = historyRange.max - historyRange.min || 1;
    const step =
      historySeries.length > 1 ? width / (historySeries.length - 1) : 0;
    return historySeries.map((item, index) => ({
      x: padding + index * step,
      y:
        padding +
        (height - ((item.total - historyRange.min) / range) * height)
    }));
  }, [historyRange.max, historyRange.min, historySeries]);
  const historySummary = useMemo(() => {
    if (historySeries.length < 2) {
      return "";
    }
    const first = historySeries[0];
    const last = historySeries[historySeries.length - 1];
    const delta = last.total - first.total;
    const percent = first.total ? (delta / first.total) * 100 : 0;
    return `${formatMonthLabel(first.month)} → ${formatMonthLabel(
      last.month
    )} · ${formatSignedCurrency(delta)} (${formatSignedPercent(percent)})`;
  }, [formatSignedCurrency, formatSignedPercent, historySeries]);
  const pastRows = useMemo(() => {
    if (!historyDaily.length) {
      return [];
    }
    const sorted = [...historyDaily].sort((a, b) => a.date.localeCompare(b.date));
    const withChange = sorted.map((item, index) => {
      const prev = index > 0 ? sorted[index - 1] : null;
      return {
        ...item,
        change: prev ? item.total - prev.total : null,
        changePercent: prev && prev.total ? (item.total - prev.total) / prev.total : null
      };
    });
    return withChange.slice(-5).reverse();
  }, [historyDaily]);
  const portfolioTotal = summaryTotals.total || allocationTotal;
  const institutionTotalGains = useMemo(
    () => institutions.reduce((sum, item) => sum + (item.gains ?? 0), 0),
    [institutions]
  );
  const stats = [
    {
      title: t.summary.value,
      value: formatCurrency(portfolioTotal),
      meta: `${formatCurrency(summaryTotals.totalInvested)} ${t.summary.investedLabel}`,
      sub: null,
      info: null
    },
    {
      title: t.summary.totalProfit,
      value: formatSignedCurrency(summaryTotals.totalProfit),
      meta: formatSignedPercent(summaryTotals.profitPercent),
      sub: null,
      info: null,
      metaClass:
        summaryTotals.totalProfit > 0
          ? "pos"
          : summaryTotals.totalProfit < 0
          ? "neg"
          : ""
    },
    {
      title: t.summary.irr,
      value: summaryTotals.irr === null ? "N/A" : `${summaryTotals.irr.toFixed(2)}%`,
      meta: "",
      sub: null,
      info: t.summary.irrDescription
    },
    {
      title: t.summary.passiveIncome,
      value: "N/A",
      meta: "",
      sub: null,
      info: t.summary.passiveIncomeDescription
    }
  ];

  const renderImports = () => {
    if (!portfolio) {
      return null;
    }
    return (
      <section className="import-section">
        <div className="import-header">
          <div>
            <h3>{t.imports.title}</h3>
            <p>{t.imports.subtitle}</p>
          </div>
        </div>
        <SantanderImport
          portfolioId={portfolio.id}
          categories={portfolio.categories}
          token={token}
          currency={portfolio.currency}
          t={t}
          onRefresh={handleRefresh}
          embedded
        />
        <XtbImport
          portfolioId={portfolio.id}
          token={token}
          currency={portfolio.currency}
          categories={portfolio.categories}
          t={t}
          onRefresh={handleRefresh}
        />
        <BancoInvestImport
          portfolioId={portfolio.id}
          token={token}
          currency={portfolio.currency}
          categories={portfolio.categories}
          t={t}
          onRefresh={handleRefresh}
        />
        <TradeRepublicImport
          portfolioId={portfolio.id}
          token={token}
          currency={portfolio.currency}
          categories={portfolio.categories}
          t={t}
          onRefresh={handleRefresh}
        />
        <SaveNGrowImport
          portfolioId={portfolio.id}
          token={token}
          currency={portfolio.currency}
          categories={portfolio.categories}
          t={t}
          onRefresh={handleRefresh}
          refreshKey={refreshTick}
        />
        <AforroNetImport
          portfolioId={portfolio.id}
          token={token}
          currency={portfolio.currency}
          categories={portfolio.categories}
          t={t}
          onRefresh={handleRefresh}
        />
      </section>
    );
  };

  useEffect(() => {
    if (!portfolio) {
      setAllocation([]);
      setSummaryTotals({
        total: 0,
        totalInvested: 0,
        totalProfit: 0,
        profitPercent: 0,
        irr: null
      });
      return;
    }
    let active = true;
    setAllocationLoading(true);
    setAllocationError("");
    
    // Use aggregated endpoint if portfolio ID is -1 (Aggregated Portfolio)
    const endpoint = portfolio.id === -1 
      ? `${API_BASE}/portfolios/aggregated/summary`
      : `${API_BASE}/portfolios/${portfolio.id}/summary`;
    
    fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
      .then(({ ok, data }) => {
        if (!active) {
          return;
        }
        if (!ok) {
          throw new Error(data?.detail || "error");
        }
        const items = Object.entries(data.totals_by_category || {}).map(
          ([label, value]) => ({
            label,
            value: Number(value) || 0
          })
        );
        setAllocation(items.filter((item) => item.value > 0));
        setSummaryTotals({
          total: Number(data.total) || 0,
          totalInvested: Number(data.total_invested) || 0,
          totalProfit: Number(data.total_profit) || 0,
          profitPercent: Number(data.profit_percent) || 0,
          irr: data.irr === null || data.irr === undefined ? null : Number(data.irr)
        });
      })
      .catch(() => {
        if (active) {
          setAllocationError(t.portfolio.allocationError);
        }
      })
      .finally(() => {
        if (active) {
          setAllocationLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [API_BASE, portfolio, refreshTick, t, token]);

  useEffect(() => {
    if (!portfolio) {
      setInstitutions([]);
      return;
    }
    // Skip institutions for aggregated portfolio (ID -1)
    if (portfolio.id === -1) {
      setInstitutions([]);
      setInstitutionsLoading(false);
      return;
    }
    let active = true;
    setInstitutionsLoading(true);
    setInstitutionsError("");
    fetch(`${API_BASE}/portfolios/${portfolio.id}/institutions`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
      .then(({ ok, data }) => {
        if (!active) {
          return;
        }
        if (!ok) {
          throw new Error(data?.detail || "error");
        }
        const items = (data.items || []).map((item: InstitutionRow) => ({
          institution: item.institution,
          total: Number(item.total) || 0,
          gains:
            item.gains === null || item.gains === undefined
              ? null
              : Number(item.gains) || 0,
          vs_last_month:
            item.vs_last_month === null || item.vs_last_month === undefined
              ? null
              : Number(item.vs_last_month) || 0,
          profit_percent:
            item.profit_percent === null || item.profit_percent === undefined
              ? null
              : Number(item.profit_percent) || 0,
          beni:
            item.beni === null || item.beni === undefined
              ? null
              : Number(item.beni) || 0,
          magui:
            item.magui === null || item.magui === undefined
              ? null
              : Number(item.magui) || 0
        }));
        setInstitutions(items);
      })
      .catch(() => {
        if (active) {
          setInstitutionsError(t.breakdown.noData);
        }
      })
      .finally(() => {
        if (active) {
          setInstitutionsLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [API_BASE, portfolio, refreshTick, t, token]);

  useEffect(() => {
    if (!portfolio) {
      setHistoryMonthly([]);
      setHistoryDaily([]);
      return;
    }
    // Skip history for aggregated portfolio (ID -1) - will use snapshots instead
    if (portfolio.id === -1) {
      setHistoryMonthly([]);
      setHistoryDaily([]);
      setHistoryLoading(false);
      
      // Load snapshots for aggregated portfolio
      let snapshotActive = true;
      setSnapshotsLoading(true);
      setSnapshotsError("");
      fetch(`${API_BASE}/portfolios/aggregated/snapshots`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
        .then(({ ok, data }) => {
          if (!snapshotActive) return;
          if (!ok) {
            throw new Error(data?.detail || "error");
          }
          const items = (data.items || []).map((item: any) => ({
            id: Number(item.id) || 0,
            snapshot_date: item.snapshot_date,
            total_value: Number(item.total_value) || 0,
            total_invested: Number(item.total_invested) || 0,
            total_profit: Number(item.total_profit) || 0,
            profit_percent: Number(item.profit_percent) || 0,
            created_at: item.created_at
          }));
          setSnapshots(items);
        })
        .catch(() => {
          if (snapshotActive) {
            setSnapshotsError(t.past?.noData || "No snapshots yet");
          }
        })
        .finally(() => {
          if (snapshotActive) {
            setSnapshotsLoading(false);
          }
        });
      return () => {
        snapshotActive = false;
      };
    }
    let active = true;
    setHistoryLoading(true);
    setHistoryError("");
    const fetchWithAuth = (path: string) =>
      fetch(`${API_BASE}${path}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }).then((response) => response.json().then((data) => ({ ok: response.ok, data })));
    Promise.all([
      fetchWithAuth(`/portfolios/${portfolio.id}/history/monthly`),
      fetchWithAuth(`/portfolios/${portfolio.id}/history`)
    ])
      .then(([monthly, daily]) => {
        if (!active) {
          return;
        }
        if (!monthly.ok) {
          throw new Error(monthly.data?.detail || "error");
        }
        if (!daily.ok) {
          throw new Error(daily.data?.detail || "error");
        }
        const monthlyItems = (monthly.data?.items || []).map((item: any) => ({
          month: item.month,
          total: Number(item.total) || 0
        }));
        const dailyItems = (daily.data?.items || []).map((item: any) => ({
          date: item.date,
          total: Number(item.total) || 0,
          cash: Number(item.cash) || 0,
          emergency: Number(item.emergency) || 0,
          invested: Number(item.invested) || 0
        }));
        setHistoryMonthly(monthlyItems);
        setHistoryDaily(dailyItems);
      })
      .catch(() => {
        if (active) {
          setHistoryError(t.past.noData || t.breakdown.noData);
        }
      })
      .finally(() => {
        if (active) {
          setHistoryLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [API_BASE, portfolio, refreshTick, t, token]);

  const handleDeleteSnapshot = async (snapshotId: number) => {
    if (!confirm("Delete this snapshot?")) return;
    
    try {
      const response = await fetch(
        `${API_BASE}/portfolios/aggregated/snapshots/${snapshotId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.detail || "Failed to delete snapshot");
      }
      setRefreshTick((value) => value + 1);
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleClearAllSnapshots = async () => {
    if (!confirm("Delete ALL snapshots? This cannot be undone!")) return;
    
    try {
      const response = await fetch(
        `${API_BASE}/portfolios/aggregated/snapshots`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.detail || "Failed to clear snapshots");
      }
      setRefreshTick((value) => value + 1);
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleClearData = async () => {
    if (!portfolio) {
      return;
    }
    const confirmed = window.confirm(t.portfolio.clearConfirm);
    if (!confirmed) {
      return;
    }
    setClearing(true);
    setClearError("");
    setClearMessage("");
    try {
      const response = await fetch(
        `${API_BASE}/portfolios/${portfolio.id}/clear-data`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setClearError(data?.detail || t.portfolio.clearError);
        return;
      }
      setClearMessage(t.portfolio.clearSuccess);
      onRefresh();
      setRefreshTick((value) => value + 1);
    } catch (err) {
      setClearError(t.portfolio.clearError);
    } finally {
      setClearing(false);
    }
  };

  const handleDeletePortfolio = async () => {
    if (!portfolio) {
      return;
    }
    const confirmed = window.confirm(t.portfolio.deleteConfirm);
    if (!confirmed) {
      return;
    }
    setDeleting(true);
    setDeleteError("");
    setDeleteMessage("");
    try {
      const response = await fetch(`${API_BASE}/portfolios/${portfolio.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!response.ok) {
        setDeleteError(data?.detail || t.portfolio.deleteError);
        return;
      }
      setDeleteMessage(t.portfolio.deleteSuccess);
      onRefresh();
      setRefreshTick((value) => value + 1);
    } catch (err) {
      setDeleteError(t.portfolio.deleteError);
    } finally {
      setDeleting(false);
    }
  };

  const handleRefresh = () => {
    onRefresh();
    setRefreshTick((value) => value + 1);
  };

  if (!portfolio && !loading) {
    return (
      <div className="empty-state">
        <h3>{t.portfolio.emptyTitle}</h3>
        <p>{t.portfolio.emptyPrompt}</p>
      </div>
    );
  }

  const dashboardHeader = (
    <section className="dashboard-title">
      <div className="dashboard-info">
        <h2>{portfolio?.name || t.portfolio.loading}</h2>
        <div className="dashboard-subrow">
          <p>{t.portfolio.summaryLabel}</p>
          <div className="dashboard-currency">
            <span>{t.portfolio.currencyLabel}</span>
            <strong>{currencyLabel}</strong>
          </div>
        </div>
      </div>
      <div className="dashboard-actions">
        <div className="dashboard-tabs">
          <button
            type="button"
            className={`dashboard-tab portfolio-analytics-tab${view === "overview" ? " active" : ""}`}
            onClick={() => onViewChange("overview")}
          >
            <img 
              src="/Portfolio analytics.png" 
              alt="Portfolio Analytics" 
              className="tab-icon"
            />
            Portfolio Analytics
          </button>
          <button
            type="button"
            className={`dashboard-tab${view === "management" ? " active" : ""}`}
            onClick={() => onViewChange("management")}
          >
            {t.portfolio.managementTab}
          </button>
          <button
            type="button"
            className={`dashboard-tab${view === "categories" ? " active" : ""}`}
            onClick={() => onViewChange("categories")}
          >
            {t.portfolio.categoriesTab}
          </button>
        </div>
        <button
          className="ghost-btn clear-btn"
          type="button"
          onClick={handleClearData}
          disabled={clearing || !portfolio}
        >
          {clearing ? t.portfolio.clearing : t.portfolio.clear}
        </button>
        <button
          className="ghost-btn clear-btn delete-btn"
          type="button"
          onClick={handleDeletePortfolio}
          disabled={deleting || !portfolio}
        >
          {deleting ? t.portfolio.deleting : t.portfolio.delete}
        </button>
      </div>
    </section>
  );

  if (portfolio && view === "management") {
    return (
      <>
        {loading ? <div className="loading-banner">{t.portfolio.loading}</div> : null}
        {dashboardHeader}
        {clearMessage ? <div className="login-banner">{clearMessage}</div> : null}
        {clearError ? <p className="login-error">{clearError}</p> : null}
        {deleteMessage ? <div className="login-banner">{deleteMessage}</div> : null}
        {deleteError ? <p className="login-error">{deleteError}</p> : null}
        {renderImports()}
      </>
    );
  }

  if (portfolio && view === "categories") {
    return (
      <>
        {loading ? <div className="loading-banner">{t.portfolio.loading}</div> : null}
        {dashboardHeader}
        {clearMessage ? <div className="login-banner">{clearMessage}</div> : null}
        {clearError ? <p className="login-error">{clearError}</p> : null}
        {deleteMessage ? <div className="login-banner">{deleteMessage}</div> : null}
        {deleteError ? <p className="login-error">{deleteError}</p> : null}
        <CategoryManager
          portfolioId={portfolio.id}
          categories={portfolio.categories || []}
          token={token}
          t={t}
          onRefresh={handleRefresh}
        />
      </>
    );
  }

  if (portfolio && !hasData) {
    return (
      <>
        {loading ? <div className="loading-banner">{t.portfolio.loading}</div> : null}
        {dashboardHeader}
        {clearMessage ? <div className="login-banner">{clearMessage}</div> : null}
        {clearError ? <p className="login-error">{clearError}</p> : null}
        {deleteMessage ? <div className="login-banner">{deleteMessage}</div> : null}
        {deleteError ? <p className="login-error">{deleteError}</p> : null}
        <div className="empty-state">
          <h3>{t.portfolio.noDataTitle}</h3>
          <p>{t.portfolio.noDataPrompt}</p>
        </div>
      </>
    );
  }

  return (
    <>
      {loading ? <div className="loading-banner">{t.portfolio.loading}</div> : null}
      {dashboardHeader}
        {clearMessage ? <div className="login-banner">{clearMessage}</div> : null}
        {clearError ? <p className="login-error">{clearError}</p> : null}
        {deleteMessage ? <div className="login-banner">{deleteMessage}</div> : null}
        {deleteError ? <p className="login-error">{deleteError}</p> : null}
      <section className="summary-grid">
        {stats.map((item) => (
          <article className="stat-card" key={item.title}>
            <div className="stat-header">
              <span className="stat-title">
                {item.title}
                {item.info ? (
                  <button
                    type="button"
                    className="info-btn"
                    onClick={() =>
                      setInfoOpen(infoOpen === item.title ? null : item.title)
                    }
                  >
                    ?
                  </button>
                ) : null}
              </span>
              <span className={`stat-meta ${item.metaClass || ""}`.trim()}>
                {item.meta}
              </span>
            </div>
            <h2>{item.value.replace("EUR", currencyLabel)}</h2>
            {item.sub ? <p className="stat-sub">{item.sub}</p> : null}
            {item.info && infoOpen === item.title ? (
              <div className="stat-tooltip">{item.info}</div>
            ) : null}
          </article>
        ))}
      </section>

      <section className="charts-grid">
        <article className="chart-card">
          <header>
            <h3>{t.charts.portfolioEvolution}</h3>
            <span className="chart-sub">{t.charts.snapshotTrend}</span>
          </header>
          <div className="chart-placeholder">
            {historyLoading ? (
              <div className="loading-banner">{t.portfolio.loading}</div>
            ) : null}
            {historyError ? <p className="login-error">{historyError}</p> : null}
            {historySeries.length > 1 ? (
              <svg className="chart-svg" viewBox="0 0 320 110" preserveAspectRatio="none">
                <path className="chart-area" d={historyAreaPath} />
                <path
                  className="chart-line-path"
                  d={historyPath}
                  stroke="#2ad68d"
                  strokeWidth="3"
                  fill="none"
                />
                {historyPoints.map((point, index) => (
                  <circle
                    key={`point-${index}`}
                    cx={point.x}
                    cy={point.y}
                    r="3.5"
                    className="chart-point"
                  />
                ))}
              </svg>
            ) : (
              <p className="chart-sub">{t.charts.noHistory}</p>
            )}
            {historyLabels.length ? (
              <div className="chart-axis">
                {historyLabels.map((label) => (
                  <span key={label}>{formatMonthLabel(label)}</span>
                ))}
              </div>
            ) : null}
            {historySummary ? (
              <div className="chart-meta">{historySummary}</div>
            ) : null}
          </div>
        </article>
        <article className="chart-card">
          <header>
            <h3>{t.charts.assetAllocation}</h3>
            <div className="chart-toggle">
              <button
                type="button"
                className={allocationView === "pie" ? "active" : ""}
                onClick={() => setAllocationView("pie")}
              >
                {t.charts.viewPie}
              </button>
              <button
                type="button"
                className={allocationView === "bar" ? "active" : ""}
                onClick={() => setAllocationView("bar")}
              >
                {t.charts.viewBar}
              </button>
            </div>
          </header>
          <div className="donut-wrap">
            {allocationLoading ? (
              <div className="loading-banner">{t.portfolio.loading}</div>
            ) : null}
            {allocationError ? <p className="login-error">{allocationError}</p> : null}
            {!allocationLoading && allocationTotal <= 0 ? (
              <p className="chart-sub">{t.portfolio.noAllocation}</p>
            ) : (
              <>
                {allocationView === "pie" ? (
                  <>
                    <div
                      className="donut"
                      style={{
                        background: `conic-gradient(${orderedAllocation
                          .map((item, index) => {
                            const start =
                              orderedAllocation
                                .slice(0, index)
                                .reduce((sum, entry) => sum + entry.value, 0) /
                              allocationTotal;
                            const end = start + item.value / allocationTotal;
                            const color = allocationColors[index % allocationColors.length];
                            return `${color} ${start * 360}deg ${end * 360}deg`;
                          })
                          .join(", ")})`
                      }}
                    />
                    <div className="legend">
                      {orderedAllocation.map((item, index) => {
                        const percent = allocationTotal
                          ? (item.value / allocationTotal) * 100
                          : 0;
                        return (
                          <span key={item.label}>
                            <i
                              className="dot"
                              style={{
                                background: allocationColors[index % allocationColors.length]
                              }}
                            />
                            {item.label} {percent.toFixed(1)}%
                          </span>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="bar-chart">
                    {orderedAllocation.map((item, index) => {
                      const percent = allocationTotal
                        ? (item.value / allocationTotal) * 100
                        : 0;
                      return (
                        <div className="bar-row" key={item.label}>
                          <span className="bar-label">{item.label}</span>
                          <div className="bar-track">
                            <div
                              className="bar-fill"
                              style={{
                                width: `${percent}%`,
                                background: allocationColors[index % allocationColors.length]
                              }}
                            />
                          </div>
                          <span className="bar-value">{percent.toFixed(1)}%</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </article>
      </section>

      <section className="asset-categories">
        <h3>{t.categories.title}</h3>
        {allocationTotal <= 0 ? (
          <p className="empty-state">{t.portfolio.noAllocation}</p>
        ) : (
          <div className="category-grid">
            {orderedAllocation.map((item, index) => {
              const percent = allocationTotal
                ? (item.value / allocationTotal) * 100
                : 0;
              return (
                <article className="category-card" key={item.label}>
                  <div className="category-head">
                    <span>{formatCategoryLabel(item.label)}</span>
                    <span className="tag">{percent.toFixed(1)}%</span>
                  </div>
                  <h4>{currencyFormatter.format(item.value)}</h4>
                  <div className="bar">
                    <span
                      style={{
                        width: `${percent}%`,
                        background: allocationColors[index % allocationColors.length]
                      }}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="institution-breakdown">
        <div className="section-head">
          <h3>{t.breakdown.title}</h3>
          <span
            className={`total-gains ${
              institutionTotalGains >= 0 ? "pos" : "neg"
            }`.trim()}
          >
            {t.breakdown.totalGains}: {formatCurrency(institutionTotalGains)}
          </span>
        </div>
        <div className="table institution-table">
          <div className="row head">
            <span>{t.breakdown.columns.institution}</span>
            <span>{t.breakdown.columns.total}</span>
            <span>{t.breakdown.columns.vsLastMonth}</span>
            <span>{t.breakdown.columns.gains}</span>
            <span>{t.breakdown.columns.profitPercent}</span>
            <span>{t.breakdown.columns.beni}</span>
            <span>{t.breakdown.columns.magui}</span>
          </div>
          {institutionsLoading ? (
            <div className="loading-banner">{t.portfolio.loading}</div>
          ) : null}
          {institutionsError ? (
            <p className="chart-sub">{institutionsError}</p>
          ) : null}
          {institutions.map((row) => {
            const logo = institutionLogos[row.institution.toLowerCase()];
            return (
              <div className="row" key={row.institution}>
                <span className="institution-cell">
                  {logo ? (
                    <img
                      className="institution-logo"
                      src={logo}
                      alt={row.institution}
                    />
                  ) : null}
                  <span>{row.institution}</span>
                </span>
                <span>{formatCurrency(row.total)}</span>
                <span
                  className={
                    row.vs_last_month === null || row.vs_last_month === undefined
                      ? ""
                      : row.vs_last_month >= 0
                      ? "pos"
                      : "neg"
                  }
                >
                  {row.vs_last_month === null || row.vs_last_month === undefined
                    ? "--"
                    : formatSignedCurrency(row.vs_last_month)}
                </span>
                <span
                  className={
                    row.gains === null || row.gains === undefined
                      ? ""
                      : row.gains >= 0
                      ? "pos"
                      : "neg"
                  }
                >
                  {row.gains === null || row.gains === undefined
                    ? "--"
                    : formatSignedCurrency(row.gains)}
                </span>
                <span
                  className={
                    row.profit_percent === null || row.profit_percent === undefined
                      ? ""
                      : row.profit_percent >= 0
                      ? "pos"
                      : "neg"
                  }
                >
                  {row.profit_percent === null || row.profit_percent === undefined
                    ? "--"
                    : formatSignedPercent(row.profit_percent)}
                </span>
                <span>
                  {row.beni === null || row.beni === undefined
                    ? "--"
                    : formatCurrency(row.beni)}
                </span>
                <span>
                  {row.magui === null || row.magui === undefined
                    ? "--"
                    : formatCurrency(row.magui)}
                </span>
              </div>
            );
          })}
          {!institutionsLoading && !institutionsError && institutions.length === 0 ? (
            <p className="chart-sub">{t.breakdown.noData}</p>
          ) : null}
        </div>
      </section>

      <section className="past-days" id="snapshots-section">
        <div className="section-head">
          <h3>{portfolio?.id === -1 ? "Snapshots History" : t.past.title}</h3>
          <span className="chart-sub">{portfolio?.id === -1 ? "Historical snapshots of aggregated portfolio" : t.past.subtitle}</span>
        </div>
        
        {portfolio?.id === -1 ? (
          // Render snapshots for aggregated portfolio
          <>
            <div className="table compact">
              <div className="row head">
                <span>Date</span>
                <span>Total Value</span>
                <span>Invested</span>
                <span>Profit</span>
                <span>Profit %</span>
                <span>Actions</span>
              </div>
              {snapshotsLoading ? <p className="chart-sub">{t.portfolio.loading}</p> : null}
              {snapshotsError ? <p className="login-error">{snapshotsError}</p> : null}
              {!snapshotsLoading && !snapshotsError && snapshots.length === 0 ? (
                <p className="chart-sub">No snapshots yet. Click "Create Snapshot" to start tracking.</p>
              ) : null}
              {snapshots.map((snapshot) => (
                <div className="row" key={snapshot.id}>
                  <span>{snapshot.snapshot_date}</span>
                  <span>{formatCurrency(snapshot.total_value)}</span>
                  <span>{formatCurrency(snapshot.total_invested)}</span>
                  <span className={snapshot.total_profit >= 0 ? "pos" : "neg"}>
                    {formatSignedCurrency(snapshot.total_profit)}
                  </span>
                  <span className={snapshot.profit_percent >= 0 ? "pos" : "neg"}>
                    {formatSignedPercent(snapshot.profit_percent)}
                  </span>
                  <span>
                    <button 
                      className="ghost-btn" 
                      type="button"
                      onClick={() => handleDeleteSnapshot(snapshot.id)}
                      style={{ padding: "4px 8px", fontSize: "12px" }}
                    >
                      Delete
                    </button>
                  </span>
                </div>
              ))}
            </div>
            {snapshots.length > 0 && (
              <button
                className="ghost-btn"
                type="button"
                onClick={handleClearAllSnapshots}
                style={{ marginTop: "12px" }}
              >
                Clear All Snapshots
              </button>
            )}
          </>
        ) : (
          // Render daily history for regular portfolios
          <div className="table compact">
            <div className="row head">
              <span>{t.past.columns.date}</span>
              <span>{t.past.columns.total}</span>
              <span>{t.past.columns.change}</span>
              <span>{t.past.columns.cash}</span>
              <span>{t.past.columns.emergency}</span>
              <span>{t.past.columns.invested}</span>
            </div>
            {historyLoading ? <p className="chart-sub">{t.portfolio.loading}</p> : null}
            {historyError ? <p className="login-error">{historyError}</p> : null}
            {!historyLoading && !historyError && pastRows.length === 0 ? (
              <p className="chart-sub">{t.past.noData}</p>
            ) : null}
            {pastRows.map((row) => (
              <div className="row" key={row.date}>
                <span>{row.date}</span>
                <span>{formatCurrency(row.total)}</span>
                <span
                  className={
                    row.change === null || row.change === undefined
                      ? ""
                      : row.change >= 0
                      ? "pos"
                      : "neg"
                  }
                >
                  {row.change === null ? "--" : formatSignedCurrency(row.change)}
                  {row.changePercent === null || row.change === null
                    ? ""
                    : ` (${formatSignedPercent(row.changePercent * 100)})`}
                </span>
                <span>{formatCurrency(row.cash)}</span>
                <span>{formatCurrency(row.emergency)}</span>
                <span>{formatCurrency(row.invested)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

    </>
  );
}

export default Portfolios;

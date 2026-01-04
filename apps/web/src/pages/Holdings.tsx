import { useEffect, useMemo, useState } from "react";
import type { Translation } from "../content/translations";

type Portfolio = {
  id: number;
  name: string;
  currency: string;
  categories: string[];
};

type HoldingItem = {
  ticker: string;
  name?: string | null;
  institution?: string | null;
  category?: string | null;
  shares: number;
  avg_price: number;
  cost_basis: number;
  current_price: number;
  current_value: number;
  profit_value: number;
  profit_percent: number | null;
  share_percent: number;
  sector?: string | null;
  industry?: string | null;
  country?: string | null;
  region?: string | null;
  currency?: string | null;
  exchange?: string | null;
  asset_type?: string | null;
  tags?: string[];
  portfolio_id?: number;
  portfolio_name?: string;
};

type HoldingMetaDraft = {
  ticker: string;
  portfolio_id?: number | null;
  sector: string;
  industry: string;
  country: string;
  asset_type: string;
  tags: string[];
};

type HoldingOperation = {
  id: number;
  source_file?: string | null;
  operation_type: string;
  operation_kind?: string | null;
  ticker?: string | null;
  description?: string | null;
  amount?: number | null;
  currency?: string | null;
  trade_date?: string | null;
  created_at?: string | null;
  tags?: string[];
};

type SortKey =
  | "holding"
  | "portfolio"
  | "shares"
  | "cost_basis"
  | "current_value"
  | "profit_value"
  | "share_percent"
  | "tags";

type HoldingsProps = {
  t: Translation;
  token: string;
  portfolio?: Portfolio;
  portfolios: Portfolio[];
};

const API_BASE = "http://127.0.0.1:8000";
const normalizeTicker = (value?: string | null) =>
  (value || "").trim().toUpperCase();
const toNumber = (value: unknown) => {
  if (value === null || value === undefined) {
    return 0;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  const raw = String(value).trim();
  if (!raw) {
    return 0;
  }
  let text = raw
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, "")
    .replace(/EUR|USD|GBP/gi, "")
    .replace(/[€$]/g, "");
  if (text.includes(",") && text.includes(".")) {
    if (text.lastIndexOf(",") > text.lastIndexOf(".")) {
      text = text.replace(/\./g, "").replace(",", ".");
    } else {
      text = text.replace(/,/g, "");
    }
  } else if (text.includes(",")) {
    text = text.replace(",", ".");
  }
  text = text.replace(/[^0-9.-]/g, "");
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : 0;
};

function Holdings({ t, token, portfolio, portfolios }: HoldingsProps) {
  const [viewMode, setViewMode] = useState<"overall" | "portfolio">("portfolio");
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<number | null>(
    portfolio?.id ?? null
  );
  const [dashboardView, setDashboardView] = useState<
    "holdings" | "diversification" | "dividends" | "growth"
  >("holdings");
  const [diversificationView, setDiversificationView] = useState<
    "sectors" | "classes" | "currencies" | "regions" | "countries"
  >("sectors");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [institutionFilter, setInstitutionFilter] = useState("");
  const [tickerFilter, setTickerFilter] = useState("");
  const [tableView, setTableView] = useState<"holdings" | "operations">("holdings");
  const [chartGroup, setChartGroup] = useState<
    "ticker" | "sector" | "industry" | "country" | "asset"
  >("ticker");
  const [chartMetric, setChartMetric] = useState<"gain" | "gain_pct" | "price_pct">(
    "gain"
  );
  const [chartRange, setChartRange] = useState<
    "1d" | "1w" | "1m" | "3m" | "6m" | "ytd" | "1y" | "all"
  >("1d");
  const [holdings, setHoldings] = useState<HoldingItem[]>([]);
  const [operations, setOperations] = useState<HoldingOperation[]>([]);
  const [operationsLoading, setOperationsLoading] = useState(false);
  const [operationsError, setOperationsError] = useState("");
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("current_value");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [refreshing, setRefreshing] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState(0);
  const [infoOpen, setInfoOpen] = useState<string | null>(null);
  const [metaDraft, setMetaDraft] = useState<HoldingMetaDraft | null>(null);
  const [metaSaving, setMetaSaving] = useState(false);
  const [metaError, setMetaError] = useState("");
  const [metaMessage, setMetaMessage] = useState("");
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tagError, setTagError] = useState("");
  const [tagMessage, setTagMessage] = useState("");

  const [txTicker, setTxTicker] = useState("");
  const [txCompany, setTxCompany] = useState("");
  const [txOperation, setTxOperation] = useState<"buy" | "sell">("buy");
  const [txDate, setTxDate] = useState("");
  const [txShares, setTxShares] = useState("");
  const [txPrice, setTxPrice] = useState("");
  const [txFee, setTxFee] = useState("");
  const [txNote, setTxNote] = useState("");
  const [txCategory, setTxCategory] = useState("Stocks");
  const [txInstitution, setTxInstitution] = useState("");
  const [txSaving, setTxSaving] = useState(false);
  const [txError, setTxError] = useState("");
  const [txMessage, setTxMessage] = useState("");

  const activePortfolio = useMemo(
    () =>
      portfolios.find((item) => item.id === selectedPortfolioId) ||
      portfolio ||
      null,
    [portfolios, portfolio, selectedPortfolioId]
  );

  useEffect(() => {
    if (portfolio?.id && !selectedPortfolioId) {
      setSelectedPortfolioId(portfolio.id);
    }
  }, [portfolio?.id, selectedPortfolioId]);

  useEffect(() => {
    if (activePortfolio?.categories?.length) {
      setTxCategory(activePortfolio.categories[0] || "Stocks");
    } else {
      setTxCategory("Stocks");
    }
  }, [activePortfolio?.id]);

  const currencyLabel = activePortfolio?.currency || portfolio?.currency || "EUR";
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
    return `${sign}${Math.abs(value).toFixed(2)}%`;
  };

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    portfolios.forEach((item) => item.categories?.forEach((cat) => set.add(cat)));
    if (set.size === 0 && portfolio?.categories) {
      portfolio.categories.forEach((cat) => set.add(cat));
    }
    if (set.size === 0) {
      set.add("Stocks");
    }
    return Array.from(set);
  }, [portfolios, portfolio?.categories]);

  const institutionOptions = useMemo(() => {
    const set = new Set<string>();
    holdings.forEach((item) => {
      if (item.institution) {
        set.add(item.institution);
      }
    });
    return Array.from(set);
  }, [holdings]);

  const sortedHoldings = useMemo(() => {
    const items = [...holdings];
    const getSortValue = (item: HoldingItem) => {
      switch (sortKey) {
        case "holding":
          return (item.ticker || "").toLowerCase();
        case "portfolio":
          return (item.portfolio_name || "").toLowerCase();
        case "shares":
          return toNumber(item.shares);
        case "cost_basis":
          return toNumber(item.cost_basis);
        case "current_value":
          return toNumber(item.current_value);
        case "profit_value":
          return toNumber(item.profit_value);
        case "share_percent":
          return toNumber(item.share_percent);
        case "tags":
          return (item.tags || []).join(", ").toLowerCase();
        default:
          return 0;
      }
    };
    items.sort((a, b) => {
      const av = getSortValue(a);
      const bv = getSortValue(b);
      let comparison = 0;
      if (typeof av === "string" || typeof bv === "string") {
        comparison = String(av).localeCompare(String(bv), undefined, {
          numeric: true,
          sensitivity: "base"
        });
      } else {
        comparison = Number(av) - Number(bv);
      }
      if (comparison === 0) {
        comparison = normalizeTicker(a.ticker).localeCompare(
          normalizeTicker(b.ticker),
          undefined,
          { numeric: true, sensitivity: "base" }
        );
      }
      return sortDir === "asc" ? comparison : -comparison;
    });
    return items;
  }, [holdings, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
      return;
    }
    setSortKey(key);
    setSortDir("asc");
  };

  const renderSortLabel = (key: SortKey, label: string) => (
    <span
      className="sort-cell"
      role="button"
      tabIndex={0}
      onClick={() => handleSort(key)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleSort(key);
        }
      }}
    >
      <span>{label}</span>
      {sortKey === key ? (
        <span className="sort-arrow">{sortDir === "asc" ? "^" : "v"}</span>
      ) : null}
    </span>
  );

  const filteredHoldings = useMemo(() => {
    const query = tickerFilter.trim().toLowerCase();
    if (!query) {
      return sortedHoldings;
    }
    return sortedHoldings.filter((item) => {
      const ticker = item.ticker.toLowerCase();
      const name = (item.name || "").toLowerCase();
      return ticker.includes(query) || name.includes(query);
    });
  }, [sortedHoldings, tickerFilter]);

  const tickerOptions = useMemo(() => {
    const set = new Set<string>();
    sortedHoldings.forEach((item) => set.add(item.ticker));
    return Array.from(set);
  }, [sortedHoldings]);

  const getAssetType = (category?: string | null) => {
    const value = (category || "").toLowerCase();
    if (value.includes("retirement") || value.includes("ppr")) {
      return "Retirement Plans";
    }
    if (value.includes("etf")) {
      return "ETFs";
    }
    if (value.includes("fund")) {
      return "Funds";
    }
    if (value.includes("stock")) {
      return "Stocks";
    }
    return "Others";
  };

  const assetTypeOptions = ["Stocks", "ETFs", "Funds", "Retirement Plans", "Others"];

  const chartItems = useMemo(() => {
    const grouped = new Map<
      string,
      {
        label: string;
        costBasis: number;
        currentValue: number;
        profitValue: number;
        shares: number;
        priceTotal: number;
        avgPriceTotal: number;
      }
    >();
    filteredHoldings.forEach((item) => {
      const assetType = item.asset_type || getAssetType(item.category);
      const label =
        chartGroup === "ticker"
          ? item.ticker
          : chartGroup === "sector"
          ? item.sector || "Other"
          : chartGroup === "industry"
          ? item.industry || "Other"
          : chartGroup === "country"
          ? item.country || "Other"
          : chartGroup === "asset"
          ? assetType
          : "Other";
      const entry = grouped.get(label) || {
        label,
        costBasis: 0,
        currentValue: 0,
        profitValue: 0,
        shares: 0,
        priceTotal: 0,
        avgPriceTotal: 0
      };
      entry.costBasis += Number(item.cost_basis || 0);
      entry.currentValue += Number(item.current_value || 0);
      entry.profitValue += Number(item.profit_value || 0);
      entry.shares += Number(item.shares || 0);
      entry.priceTotal += Number(item.current_price || 0) * Number(item.shares || 0);
      entry.avgPriceTotal += Number(item.avg_price || 0) * Number(item.shares || 0);
      grouped.set(label, entry);
    });
    const items = Array.from(grouped.values()).map((entry) => {
      const profitPercent = entry.costBasis
        ? (entry.profitValue / entry.costBasis) * 100
        : 0;
      const pricePercent = entry.avgPriceTotal
        ? ((entry.priceTotal - entry.avgPriceTotal) / entry.avgPriceTotal) * 100
        : 0;
      const value =
        chartMetric === "gain"
          ? entry.profitValue
          : chartMetric === "gain_pct"
          ? profitPercent
          : pricePercent;
      return {
        label: entry.label,
        value,
        profitValue: entry.profitValue,
        profitPercent,
        pricePercent
      };
    });
    items.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
    return items;
  }, [filteredHoldings, chartGroup, chartMetric]);

  const maxChartValue = useMemo(() => {
    if (!chartItems.length) {
      return 1;
    }
    return Math.max(...chartItems.map((item) => Math.abs(item.value)), 1);
  }, [chartItems]);

  const diversificationData = useMemo(() => {
    // Asset allocation (classes)
    const assetGroups = new Map<string, { value: number; count: number }>();
    filteredHoldings.forEach((item) => {
      const assetType = item.asset_type || getAssetType(item.category);
      const entry = assetGroups.get(assetType) || { value: 0, count: 0 };
      entry.value += Number(item.current_value || 0);
      entry.count += 1;
      assetGroups.set(assetType, entry);
    });

    const assetAllocation = Array.from(assetGroups.entries())
      .map(([label, data]) => ({
        label,
        value: data.value,
        count: data.count,
        percentage: totalValue > 0 ? (data.value / totalValue) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value);

    // Sector allocation
    const sectorGroups = new Map<string, { value: number; count: number }>();
    filteredHoldings.forEach((item) => {
      const sector = item.sector || "Other";
      const entry = sectorGroups.get(sector) || { value: 0, count: 0 };
      entry.value += Number(item.current_value || 0);
      entry.count += 1;
      sectorGroups.set(sector, entry);
    });

    const sectorAllocation = Array.from(sectorGroups.entries())
      .map(([label, data]) => ({
        label,
        value: data.value,
        count: data.count,
        percentage: totalValue > 0 ? (data.value / totalValue) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value);

    // Region allocation
    const regionGroups = new Map<string, { value: number; count: number }>();
    filteredHoldings.forEach((item) => {
      const region = item.region || item.country || "Other";
      const entry = regionGroups.get(region) || { value: 0, count: 0 };
      entry.value += Number(item.current_value || 0);
      entry.count += 1;
      regionGroups.set(region, entry);
    });

    const regionAllocation = Array.from(regionGroups.entries())
      .map(([label, data]) => ({
        label,
        value: data.value,
        count: data.count,
        percentage: totalValue > 0 ? (data.value / totalValue) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value);

    // Country allocation
    const countryGroups = new Map<string, { value: number; count: number }>();
    filteredHoldings.forEach((item) => {
      const country = item.country || "Other";
      const entry = countryGroups.get(country) || { value: 0, count: 0 };
      entry.value += Number(item.current_value || 0);
      entry.count += 1;
      countryGroups.set(country, entry);
    });

    const countryAllocation = Array.from(countryGroups.entries())
      .map(([label, data]) => ({
        label,
        value: data.value,
        count: data.count,
        percentage: totalValue > 0 ? (data.value / totalValue) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value);

    // Currency allocation
    const currencyGroups = new Map<string, { value: number; count: number }>();
    filteredHoldings.forEach((item) => {
      const currency = item.currency || "USD";
      const entry = currencyGroups.get(currency) || { value: 0, count: 0 };
      entry.value += Number(item.current_value || 0);
      entry.count += 1;
      currencyGroups.set(currency, entry);
    });

    const currencyAllocation = Array.from(currencyGroups.entries())
      .map(([label, data]) => ({
        label,
        value: data.value,
        count: data.count,
        percentage: totalValue > 0 ? (data.value / totalValue) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value);

    return { 
      assetAllocation, 
      sectorAllocation, 
      regionAllocation, 
      countryAllocation, 
      currencyAllocation 
    };
  }, [filteredHoldings, totalValue]);

  const loadHoldings = async () => {
    if (!token) {
      return;
    }
    if (viewMode === "portfolio" && !activePortfolio) {
      setHoldings([]);
      setTotalValue(0);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (categoryFilter) {
        params.set("category", categoryFilter);
      }
      if (institutionFilter) {
        params.set("institution", institutionFilter);
      }
      const basePath =
        viewMode === "overall"
          ? "/holdings"
          : `/portfolios/${activePortfolio?.id}/holdings`;
      const url = params.toString()
        ? `${API_BASE}${basePath}?${params}`
        : `${API_BASE}${basePath}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || t.holdings.loadError);
      }
      setHoldings((current) => {
        const tagMap = new Map(
          current.map((item) => [normalizeTicker(item.ticker), item.tags || []])
        );
        return (data.items || []).map((item: HoldingItem) => {
          if (item.tags && item.tags.length) {
            return item;
          }
          const fallback = tagMap.get(normalizeTicker(item.ticker));
          return fallback && fallback.length ? { ...item, tags: fallback } : item;
        });
      });
      setTotalValue(Number(data.total_value) || 0);
    } catch (err) {
      setError(t.holdings.loadError);
    } finally {
      setLoading(false);
    }
  };

  const loadTags = async () => {
    if (!token) {
      return;
    }
    setTagError("");
    try {
      const response = await fetch(`${API_BASE}/holdings/tags`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || "Failed");
      }
      const items = (data.items || []) as string[];
      const custom = (data.custom || []) as string[];
      setAvailableTags(items);
      setCustomTags(custom);
    } catch (err) {
      setTagError(t.holdings.tags.loadError);
    }
  };

  const loadOperations = async () => {
    if (!token) {
      return;
    }
    if (!activePortfolio) {
      setOperations([]);
      return;
    }
    setOperationsLoading(true);
    setOperationsError("");
    try {
      const response = await fetch(
        `${API_BASE}/portfolios/${activePortfolio.id}/holdings/operations`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || t.holdings.operations.loadError);
      }
      setOperations(data.items || []);
    } catch (err) {
      setOperationsError(t.holdings.operations.loadError);
    } finally {
      setOperationsLoading(false);
    }
  };

  const openMetaEditor = (item: HoldingItem) => {
    setMetaError("");
    setMetaMessage("");
    setTagError("");
    setTagMessage("");
    setMetaDraft({
      ticker: item.ticker,
      portfolio_id: item.portfolio_id ?? activePortfolio?.id ?? null,
      sector: item.sector || "",
      industry: item.industry || "",
      country: item.country || "",
      asset_type: item.asset_type || getAssetType(item.category),
      tags: item.tags ? [...item.tags] : []
    });
  };

  const openMetaEditorForTicker = (ticker: string, tags: string[] = []) => {
    const normalized = normalizeTicker(ticker);
    const match = holdings.find(
      (item) => normalizeTicker(item.ticker) === normalized
    );
    setMetaError("");
    setMetaMessage("");
    setTagError("");
    setTagMessage("");
    setMetaDraft({
      ticker: normalized || ticker,
      portfolio_id: activePortfolio?.id ?? null,
      sector: match?.sector || "",
      industry: match?.industry || "",
      country: match?.country || "",
      asset_type: match?.asset_type || getAssetType(match?.category),
      tags: match?.tags ? [...match.tags] : [...tags]
    });
  };

  const closeMetaEditor = () => {
    setMetaDraft(null);
  };

  const updateMetaDraft = (field: keyof HoldingMetaDraft, value: string) => {
    setMetaDraft((current) => (current ? { ...current, [field]: value } : current));
  };

  const toggleMetaTag = (tag: string) => {
    setMetaDraft((current) => {
      if (!current) {
        return current;
      }
      const normalized = current.tags || [];
      const exists = normalized.some((entry) => entry === tag);
      const nextTags = exists
        ? normalized.filter((entry) => entry !== tag)
        : [...normalized, tag];
      return { ...current, tags: nextTags };
    });
  };

  const handleAddTag = async () => {
    if (!tagInput.trim()) {
      setTagError(t.holdings.tags.required);
      return;
    }
    setTagError("");
    setTagMessage("");
    try {
      const response = await fetch(`${API_BASE}/holdings/tags`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name: tagInput.trim() })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || "Failed");
      }
      setTagInput("");
      setTagMessage(t.holdings.tags.created);
      await loadTags();
      setMetaDraft((current) => {
        if (!current) {
          return current;
        }
        if (current.tags.includes(data?.name || "")) {
          return current;
        }
        const next = data?.name ? [...current.tags, data.name] : current.tags;
        return { ...current, tags: next };
      });
    } catch (err) {
      setTagError(t.holdings.tags.saveError);
    }
  };

  const handleDeleteTag = async (tag: string) => {
    setTagError("");
    setTagMessage("");
    try {
      const response = await fetch(
        `${API_BASE}/holdings/tags/${encodeURIComponent(tag)}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || "Failed");
      }
      await loadTags();
      setTagMessage(t.holdings.tags.deleted);
      setMetaDraft((current) => {
        if (!current) {
          return current;
        }
        return { ...current, tags: current.tags.filter((entry) => entry !== tag) };
      });
      setHoldings((current) =>
        current.map((item) =>
          item.tags && item.tags.includes(tag)
            ? { ...item, tags: item.tags.filter((entry) => entry !== tag) }
            : item
        )
      );
      setOperations((current) =>
        current.map((item) =>
          item.tags && item.tags.includes(tag)
            ? { ...item, tags: item.tags.filter((entry) => entry !== tag) }
            : item
        )
      );
    } catch (err) {
      setTagError(t.holdings.tags.deleteError);
    }
  };

  const handleMetaSave = async () => {
    if (!metaDraft) {
      return;
    }
    const portfolioId = metaDraft.portfolio_id ?? activePortfolio?.id ?? null;
    if (!portfolioId) {
      setMetaError(t.holdings.meta.noPortfolio);
      return;
    }
    setMetaSaving(true);
    setMetaError("");
    setMetaMessage("");
    try {
      const response = await fetch(
        `${API_BASE}/portfolios/${portfolioId}/holdings/metadata`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            ticker: metaDraft.ticker,
            sector: metaDraft.sector,
            industry: metaDraft.industry,
            country: metaDraft.country,
            asset_type: metaDraft.asset_type,
            tags: metaDraft.tags
          })
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || t.holdings.meta.saveError);
      }
      const savedTags = Array.isArray(data?.item?.tags)
        ? (data.item.tags as string[])
        : metaDraft.tags;
      const targetTicker = normalizeTicker(metaDraft.ticker);
      setHoldings((current) =>
        current.map((item) =>
          normalizeTicker(item.ticker) === targetTicker
            ? {
                ...item,
                sector: metaDraft.sector,
                industry: metaDraft.industry,
                country: metaDraft.country,
                asset_type: metaDraft.asset_type,
                tags: savedTags
              }
            : item
        )
      );
      setOperations((current) =>
        current.map((item) =>
          normalizeTicker(item.ticker) === targetTicker
            ? { ...item, tags: savedTags }
            : item
        )
      );
      setMetaMessage(t.holdings.meta.saveSuccess);
      closeMetaEditor();
      loadHoldings();
      if (tableView === "operations") {
        loadOperations();
      }
    } catch (err) {
      setMetaError(t.holdings.meta.saveError);
    } finally {
      setMetaSaving(false);
    }
  };

  useEffect(() => {
    loadHoldings();
  }, [
    token,
    viewMode,
    activePortfolio?.id,
    categoryFilter,
    institutionFilter
  ]);

  useEffect(() => {
    if (viewMode === "overall" && tableView === "operations") {
      setTableView("holdings");
      return;
    }
    if (tableView === "operations") {
      loadOperations();
    }
  }, [token, activePortfolio?.id, tableView, viewMode]);

  useEffect(() => {
    loadTags();
  }, [token]);

  const handleRefreshPrices = async () => {
    if (!token) {
      return;
    }
    setRefreshing(true);
    setRefreshProgress(0);
    setMessage("");
    setError("");
    try {
      const path =
        viewMode === "overall"
          ? "/holdings/refresh-prices"
          : `/portfolios/${activePortfolio?.id}/holdings/refresh-prices`;
      const response = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ force: true })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || t.holdings.refreshError);
      }
      
      // Calculate average progress from results
      const items = data.items || [];
      if (items.length > 0) {
        const lastProgress = items[items.length - 1]?.progress || 100;
        setRefreshProgress(lastProgress);
      }
      
      const errorItem = items.find((item: any) => item.status === "error");
      if (errorItem) {
        const errorText = String(errorItem.error || "");
        if (errorText.toLowerCase().includes("price unavailable")) {
          setError(`${t.holdings.tickerUnsupported} ${errorItem.ticker}`);
        } else {
          setError(t.holdings.refreshError);
        }
      } else {
        setMessage(t.holdings.refreshSuccess);
      }
      await loadHoldings();
    } catch (err) {
      setError(t.holdings.refreshError);
    } finally {
      setRefreshing(false);
      setRefreshProgress(0);
    }
  };

  const handleSaveTransaction = async (keepValues: boolean) => {
    if (!activePortfolio?.id) {
      setTxError(t.holdings.transaction.noPortfolio);
      return;
    }
    if (!txTicker.trim()) {
      setTxError(t.holdings.validation.ticker);
      return;
    }
    if (!txDate) {
      setTxError(t.holdings.validation.date);
      return;
    }
    if (Number(txShares) <= 0) {
      setTxError(t.holdings.validation.shares);
      return;
    }
    if (Number(txPrice) <= 0) {
      setTxError(t.holdings.validation.price);
      return;
    }
    setTxSaving(true);
    setTxError("");
    setTxMessage("");
    try {
      const response = await fetch(
        `${API_BASE}/portfolios/${activePortfolio.id}/holdings/transactions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            ticker: txTicker.trim().toUpperCase(),
            name: txCompany.trim() || null,
            operation: txOperation,
            trade_date: txDate,
            shares: Number(txShares),
            price: Number(txPrice),
            fee: txFee ? Number(txFee) : null,
            note: txNote.trim() || null,
            category: txCategory || "Stocks",
            institution: txInstitution.trim() || null
          })
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || t.holdings.transaction.saveError);
      }
      setTxMessage(t.holdings.transaction.saveSuccess);
      if (keepValues) {
        setTxShares("");
        setTxPrice("");
        setTxFee("");
        setTxNote("");
      } else {
        setTxTicker("");
        setTxCompany("");
        setTxOperation("buy");
        setTxDate("");
        setTxShares("");
        setTxPrice("");
        setTxFee("");
        setTxNote("");
        setTxCategory("Stocks");
        setTxInstitution("");
      }
      await loadHoldings();
    } catch (err) {
      setTxError(t.holdings.transaction.saveError);
    } finally {
      setTxSaving(false);
    }
  };

  const tooltipText = t.holdings.tooltips;
  const showPortfolioColumn = viewMode === "overall";

  return (
    <div className="holdings-page">
      <section className="holdings-header">
        <div className="holdings-header-main">
          <div className="holdings-title-group">
            <h2>{t.holdings.title}</h2>
            <p className="holdings-subtitle-inline">{t.holdings.subtitle}</p>
          </div>
          <div className="holdings-dashboard-tabs-inline">
            <button
              type="button"
              className={dashboardView === "holdings" ? "active" : ""}
              onClick={() => setDashboardView("holdings")}
            >
              {t.holdings.dashboard.tabs.holdings}
            </button>
            <button
              type="button"
              className={dashboardView === "diversification" ? "active" : ""}
              onClick={() => setDashboardView("diversification")}
            >
              {t.holdings.dashboard.tabs.diversification}
            </button>
            <button
              type="button"
              className={dashboardView === "dividends" ? "active" : ""}
              onClick={() => setDashboardView("dividends")}
              disabled
            >
              {t.holdings.dashboard.tabs.dividends}
            </button>
            <button
              type="button"
              className={dashboardView === "growth" ? "active" : ""}
              onClick={() => setDashboardView("growth")}
              disabled
            >
              {t.holdings.dashboard.tabs.growth}
            </button>
            <button
              type="button"
              className={dashboardView === "realestate" ? "active" : ""}
              onClick={() => window.location.href = "/real-estate"}
            >
              🏘️ Real Estate
            </button>
          </div>
        </div>
        <div className="holdings-meta">
          <div className="holdings-total">
            <span>{t.holdings.totalLabel}</span>
            <strong>{formatCurrency(totalValue)}</strong>
          </div>
          <button
            className="ghost-btn"
            type="button"
            onClick={handleRefreshPrices}
            disabled={refreshing}
          >
            {refreshing && refreshProgress > 0 
              ? `${t.holdings.updating} (${refreshProgress}%)` 
              : refreshing 
              ? t.holdings.updating 
              : t.holdings.updateAll}
          </button>
        </div>
      </section>

      <section className="holdings-filters">
        <div className="filter-group">
          <span>{t.holdings.filters.view}</span>
          <div className="filter-tabs">
            <button
              type="button"
              className={viewMode === "portfolio" ? "active" : ""}
              onClick={() => setViewMode("portfolio")}
            >
              {t.holdings.viewPortfolio}
            </button>
            <button
              type="button"
              className={viewMode === "overall" ? "active" : ""}
              onClick={() => setViewMode("overall")}
            >
              {t.holdings.viewOverall}
            </button>
          </div>
        </div>
        <div className="filter-field">
          <label>{t.holdings.filters.portfolio}</label>
          <select
            value={activePortfolio?.id || ""}
            onChange={(event) => setSelectedPortfolioId(Number(event.target.value))}
            disabled={viewMode === "overall"}
          >
            {(portfolios.length ? portfolios : portfolio ? [portfolio] : []).map(
              (item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              )
            )}
          </select>
        </div>
        <div className="filter-field">
          <label>{t.holdings.filters.category}</label>
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
          >
            <option value="">{t.holdings.filters.all}</option>
            {categoryOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-field">
          <label>{t.holdings.filters.institution}</label>
          <select
            value={institutionFilter}
            onChange={(event) => setInstitutionFilter(event.target.value)}
          >
            <option value="">{t.holdings.filters.all}</option>
            {institutionOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-field">
          <label>{t.holdings.filters.ticker}</label>
          <input
            type="text"
            value={tickerFilter}
            onChange={(event) => setTickerFilter(event.target.value)}
            placeholder={t.holdings.filters.tickerPlaceholder}
            list="ticker-options"
          />
          <datalist id="ticker-options">
            {tickerOptions.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </div>
      </section>

      {message ? <div className="login-banner">{message}</div> : null}
      {error ? <p className="login-error">{error}</p> : null}
      {metaMessage ? <div className="login-banner">{metaMessage}</div> : null}
      {metaError ? <p className="login-error">{metaError}</p> : null}

      {dashboardView === "diversification" && (
        <section className="holdings-dashboard">
          <div className="diversification-tabs">
            <button
              type="button"
              className={diversificationView === "sectors" ? "active" : ""}
              onClick={() => setDiversificationView("sectors")}
            >
              Sectors
            </button>
            <button
              type="button"
              className={diversificationView === "classes" ? "active" : ""}
              onClick={() => setDiversificationView("classes")}
            >
              Classes
            </button>
            <button
              type="button"
              className={diversificationView === "currencies" ? "active" : ""}
              onClick={() => setDiversificationView("currencies")}
            >
              Currencies
            </button>
            <button
              type="button"
              className={diversificationView === "regions" ? "active" : ""}
              onClick={() => setDiversificationView("regions")}
            >
              Regions
            </button>
            <button
              type="button"
              className={diversificationView === "countries" ? "active" : ""}
              onClick={() => setDiversificationView("countries")}
            >
              Countries
            </button>
          </div>
          <div className="diversification-container">
            {filteredHoldings.length === 0 ? (
              <p className="chart-sub">{t.holdings.dashboard.diversification.empty}</p>
            ) : (
              <>
                {diversificationView === "classes" && (
                  <div className="diversification-block">
                    <div className="diversification-block-header">
                      <h4>{t.holdings.dashboard.diversification.assetAllocation.title}</h4>
                      <p className="chart-sub">
                        {t.holdings.dashboard.diversification.assetAllocation.subtitle}
                      </p>
                    </div>
                    <div className="diversification-content">
                    <div className="donut-chart-container">
                      <svg className="donut-chart" viewBox="0 0 100 100">
                        {(() => {
                          let startAngle = 0;
                          const colors = [
                            "#2ad68d",
                            "#4dabf7",
                            "#ff6b6b",
                            "#ffd43b",
                            "#a78bfa",
                            "#fb923c"
                          ];
                          return diversificationData.assetAllocation.map((item, index) => {
                            const percentage = item.percentage;
                            const angle = (percentage / 100) * 360;
                            const radius = 40;
                            const cx = 50;
                            const cy = 50;
                            const strokeWidth = 15;
                            const circumference = 2 * Math.PI * radius;
                            const strokeDasharray = `${
                              (angle / 360) * circumference
                            } ${circumference}`;
                            const rotation = startAngle;
                            startAngle += angle;
                            return (
                              <circle
                                key={item.label}
                                cx={cx}
                                cy={cy}
                                r={radius}
                                fill="none"
                                stroke={colors[index % colors.length]}
                                strokeWidth={strokeWidth}
                                strokeDasharray={strokeDasharray}
                                transform={`rotate(${rotation} ${cx} ${cy})`}
                                opacity="0.9"
                              />
                            );
                          });
                        })()}
                      </svg>
                      <div className="donut-center-text">
                        <span className="donut-label">{t.holdings.totalLabel}</span>
                        <span className="donut-value">{formatCurrency(totalValue)}</span>
                      </div>
                    </div>
                    <div className="diversification-list">
                      {diversificationData.assetAllocation.map((item, index) => {
                        const colors = [
                          "#2ad68d",
                          "#4dabf7",
                          "#ff6b6b",
                          "#ffd43b",
                          "#a78bfa",
                          "#fb923c"
                        ];
                        return (
                          <div key={item.label} className="diversification-item">
                            <div className="diversification-item-label">
                              <span
                                className="diversification-color-dot"
                                style={{ backgroundColor: colors[index % colors.length] }}
                              />
                              <div className="diversification-item-info">
                                <strong>{item.label}</strong>
                                <small>
                                  {item.count} {item.count === 1 ? "holding" : "holdings"}
                                </small>
                              </div>
                            </div>
                            <div className="diversification-item-value">
                              <span className="percentage">
                                {item.percentage.toFixed(1)}%
                              </span>
                              <span className="amount">{formatCurrency(item.value)}</span>
                            </div>
                            <div className="diversification-bar">
                              <div
                                className="diversification-bar-fill"
                                style={{
                                  width: `${item.percentage}%`,
                                  backgroundColor: colors[index % colors.length]
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                )}

                {diversificationView === "sectors" && (
                <div className="diversification-block">
                  <div className="diversification-block-header">
                    <h4>{t.holdings.dashboard.diversification.sectorAllocation.title}</h4>
                    <p className="chart-sub">
                      {t.holdings.dashboard.diversification.sectorAllocation.subtitle}
                    </p>
                  </div>
                  <div className="diversification-content">
                    <div className="donut-chart-container">
                      <svg className="donut-chart" viewBox="0 0 100 100">
                        {(() => {
                          let startAngle = 0;
                          const colors = [
                            "#2ad68d",
                            "#4dabf7",
                            "#ff6b6b",
                            "#ffd43b",
                            "#a78bfa",
                            "#fb923c",
                            "#38bdf8",
                            "#f472b6",
                            "#10b981"
                          ];
                          return diversificationData.sectorAllocation.map((item, index) => {
                            const percentage = item.percentage;
                            const angle = (percentage / 100) * 360;
                            const radius = 40;
                            const cx = 50;
                            const cy = 50;
                            const strokeWidth = 15;
                            const circumference = 2 * Math.PI * radius;
                            const strokeDasharray = `${
                              (angle / 360) * circumference
                            } ${circumference}`;
                            const rotation = startAngle;
                            startAngle += angle;
                            return (
                              <circle
                                key={item.label}
                                cx={cx}
                                cy={cy}
                                r={radius}
                                fill="none"
                                stroke={colors[index % colors.length]}
                                strokeWidth={strokeWidth}
                                strokeDasharray={strokeDasharray}
                                transform={`rotate(${rotation} ${cx} ${cy})`}
                                opacity="0.9"
                              />
                            );
                          });
                        })()}
                      </svg>
                      <div className="donut-center-text">
                        <span className="donut-label">Sectors</span>
                        <span className="donut-value">
                          {diversificationData.sectorAllocation.length}
                        </span>
                      </div>
                    </div>
                    <div className="diversification-list">
                      {diversificationData.sectorAllocation.map((item, index) => {
                        const colors = [
                          "#2ad68d",
                          "#4dabf7",
                          "#ff6b6b",
                          "#ffd43b",
                          "#a78bfa",
                          "#fb923c",
                          "#38bdf8",
                          "#f472b6",
                          "#10b981"
                        ];
                        return (
                          <div key={item.label} className="diversification-item">
                            <div className="diversification-item-label">
                              <span
                                className="diversification-color-dot"
                                style={{ backgroundColor: colors[index % colors.length] }}
                              />
                              <div className="diversification-item-info">
                                <strong>{item.label}</strong>
                                <small>
                                  {item.count} {item.count === 1 ? "holding" : "holdings"}
                                </small>
                              </div>
                            </div>
                            <div className="diversification-item-value">
                              <span className="percentage">
                                {item.percentage.toFixed(1)}%
                              </span>
                              <span className="amount">{formatCurrency(item.value)}</span>
                            </div>
                            <div className="diversification-bar">
                              <div
                                className="diversification-bar-fill"
                                style={{
                                  width: `${item.percentage}%`,
                                  backgroundColor: colors[index % colors.length]
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                )}

                {diversificationView === "countries" && (
                <div className="diversification-block">
                  <div className="diversification-block-header">
                    <h4>Country Allocation</h4>
                    <p className="chart-sub">Distribution by country</p>
                  </div>
                  <div className="diversification-content">
                    <div className="donut-chart-container">
                      <svg className="donut-chart" viewBox="0 0 100 100">
                        {(() => {
                          let startAngle = 0;
                          const colors = ["#2ad68d","#4dabf7","#ff6b6b","#ffd43b","#a78bfa","#fb923c","#38bdf8","#f472b6","#10b981"];
                          return diversificationData.countryAllocation.map((item, index) => {
                            const angle = (item.percentage / 100) * 360;
                            const radius = 40;
                            const circumference = 2 * Math.PI * radius;
                            const strokeDasharray = `${(angle / 360) * circumference} ${circumference}`;
                            const rotation = startAngle;
                            startAngle += angle;
                            return (
                              <circle key={item.label} cx={50} cy={50} r={radius} fill="none"
                                stroke={colors[index % colors.length]} strokeWidth={15}
                                strokeDasharray={strokeDasharray} transform={`rotate(${rotation} 50 50)`} opacity="0.9" />
                            );
                          });
                        })()}
                      </svg>
                      <div className="donut-center-text">
                        <span className="donut-label">Countries</span>
                        <span className="donut-value">{diversificationData.countryAllocation.length}</span>
                      </div>
                    </div>
                    <div className="diversification-list">
                      {diversificationData.countryAllocation.map((item, index) => {
                        const colors = ["#2ad68d","#4dabf7","#ff6b6b","#ffd43b","#a78bfa","#fb923c","#38bdf8","#f472b6","#10b981"];
                        return (
                          <div key={item.label} className="diversification-item">
                            <div className="diversification-item-label">
                              <span className="diversification-color-dot" style={{ backgroundColor: colors[index % colors.length] }} />
                              <div className="diversification-item-info">
                                <strong>{item.label}</strong>
                                <small>{item.count} {item.count === 1 ? "holding" : "holdings"}</small>
                              </div>
                            </div>
                            <div className="diversification-item-value">
                              <span className="percentage">{item.percentage.toFixed(1)}%</span>
                              <span className="amount">{formatCurrency(item.value)}</span>
                            </div>
                            <div className="diversification-bar">
                              <div className="diversification-bar-fill" 
                                style={{ width: `${item.percentage}%`, backgroundColor: colors[index % colors.length] }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                )}

                {diversificationView === "regions" && (
                <div className="diversification-block">
                  <div className="diversification-block-header">
                    <h4>Region Allocation</h4>
                    <p className="chart-sub">Distribution by region</p>
                  </div>
                  <div className="diversification-content">
                    <div className="donut-chart-container">
                      <svg className="donut-chart" viewBox="0 0 100 100">
                        {(() => {
                          let startAngle = 0;
                          const colors = ["#2ad68d","#4dabf7","#ff6b6b","#ffd43b","#a78bfa","#fb923c","#38bdf8","#f472b6","#10b981"];
                          return diversificationData.regionAllocation.map((item, index) => {
                            const angle = (item.percentage / 100) * 360;
                            const radius = 40;
                            const circumference = 2 * Math.PI * radius;
                            const strokeDasharray = `${(angle / 360) * circumference} ${circumference}`;
                            const rotation = startAngle;
                            startAngle += angle;
                            return (
                              <circle key={item.label} cx={50} cy={50} r={radius} fill="none"
                                stroke={colors[index % colors.length]} strokeWidth={15}
                                strokeDasharray={strokeDasharray} transform={`rotate(${rotation} 50 50)`} opacity="0.9" />
                            );
                          });
                        })()}
                      </svg>
                      <div className="donut-center-text">
                        <span className="donut-label">Regions</span>
                        <span className="donut-value">{diversificationData.regionAllocation.length}</span>
                      </div>
                    </div>
                    <div className="diversification-list">
                      {diversificationData.regionAllocation.map((item, index) => {
                        const colors = ["#2ad68d","#4dabf7","#ff6b6b","#ffd43b","#a78bfa","#fb923c","#38bdf8","#f472b6","#10b981"];
                        return (
                          <div key={item.label} className="diversification-item">
                            <div className="diversification-item-label">
                              <span className="diversification-color-dot" style={{ backgroundColor: colors[index % colors.length] }} />
                              <div className="diversification-item-info">
                                <strong>{item.label}</strong>
                                <small>{item.count} {item.count === 1 ? "holding" : "holdings"}</small>
                              </div>
                            </div>
                            <div className="diversification-item-value">
                              <span className="percentage">{item.percentage.toFixed(1)}%</span>
                              <span className="amount">{formatCurrency(item.value)}</span>
                            </div>
                            <div className="diversification-bar">
                              <div className="diversification-bar-fill" 
                                style={{ width: `${item.percentage}%`, backgroundColor: colors[index % colors.length] }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                )}

                {diversificationView === "currencies" && (
                <div className="diversification-block">
                  <div className="diversification-block-header">
                    <h4>Currency Allocation</h4>
                    <p className="chart-sub">Distribution by currency</p>
                  </div>
                  <div className="diversification-content">
                    <div className="donut-chart-container">
                      <svg className="donut-chart" viewBox="0 0 100 100">
                        {(() => {
                          let startAngle = 0;
                          const colors = ["#2ad68d","#4dabf7","#ff6b6b","#ffd43b","#a78bfa","#fb923c","#38bdf8","#f472b6","#10b981"];
                          return diversificationData.currencyAllocation.map((item, index) => {
                            const angle = (item.percentage / 100) * 360;
                            const radius = 40;
                            const circumference = 2 * Math.PI * radius;
                            const strokeDasharray = `${(angle / 360) * circumference} ${circumference}`;
                            const rotation = startAngle;
                            startAngle += angle;
                            return (
                              <circle key={item.label} cx={50} cy={50} r={radius} fill="none"
                                stroke={colors[index % colors.length]} strokeWidth={15}
                                strokeDasharray={strokeDasharray} transform={`rotate(${rotation} 50 50)`} opacity="0.9" />
                            );
                          });
                        })()}
                      </svg>
                      <div className="donut-center-text">
                        <span className="donut-label">Currencies</span>
                        <span className="donut-value">{diversificationData.currencyAllocation.length}</span>
                      </div>
                    </div>
                    <div className="diversification-list">
                      {diversificationData.currencyAllocation.map((item, index) => {
                        const colors = ["#2ad68d","#4dabf7","#ff6b6b","#ffd43b","#a78bfa","#fb923c","#38bdf8","#f472b6","#10b981"];
                        return (
                          <div key={item.label} className="diversification-item">
                            <div className="diversification-item-label">
                              <span className="diversification-color-dot" style={{ backgroundColor: colors[index % colors.length] }} />
                              <div className="diversification-item-info">
                                <strong>{item.label}</strong>
                                <small>{item.count} {item.count === 1 ? "holding" : "holdings"}</small>
                              </div>
                            </div>
                            <div className="diversification-item-value">
                              <span className="percentage">{item.percentage.toFixed(1)}%</span>
                              <span className="amount">{formatCurrency(item.value)}</span>
                            </div>
                            <div className="diversification-bar">
                              <div className="diversification-bar-fill" 
                                style={{ width: `${item.percentage}%`, backgroundColor: colors[index % colors.length] }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                )}
              </>
            )}
          </div>
        </section>
      )}

      {dashboardView === "growth" && (
        <section className="holdings-chart">
        <div className="holdings-chart-header">
          <h3>{t.holdings.chart.title}</h3>
          <div className="holdings-chart-toggle">
            <span>{t.holdings.chart.groupLabel}</span>
            <div className="holdings-chip-row">
              {(
                [
                  ["ticker", t.holdings.chart.groups.ticker],
                  ["sector", t.holdings.chart.groups.sector],
                  ["industry", t.holdings.chart.groups.industry],
                  ["country", t.holdings.chart.groups.country],
                  ["asset", t.holdings.chart.groups.asset]
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={`holdings-chip${chartGroup === value ? " active" : ""}`}
                  onClick={() => setChartGroup(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="holdings-chart-controls">
          <div className="holdings-chart-toggle">
            <span>{t.holdings.chart.metricLabel}</span>
            <div className="holdings-chip-row">
              {(
                [
                  ["gain", t.holdings.chart.metrics.gainValue],
                  ["gain_pct", t.holdings.chart.metrics.gainPercent],
                  ["price_pct", t.holdings.chart.metrics.pricePercent]
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={`holdings-chip${chartMetric === value ? " active" : ""}`}
                  onClick={() => setChartMetric(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="holdings-chart-toggle">
            <span>{t.holdings.chart.rangeLabel}</span>
            <div className="holdings-chip-row">
              {(
                [
                  ["1d", "1d"],
                  ["1w", "1w"],
                  ["1m", "1m"],
                  ["3m", "3m"],
                  ["6m", "6m"],
                  ["ytd", "ytd"],
                  ["1y", "1y"],
                  ["all", "All"]
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={`holdings-chip${chartRange === value ? " active" : ""}`}
                  onClick={() => setChartRange(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="holdings-chart-body">
          {chartItems.length === 0 ? (
            <p className="chart-sub">{t.holdings.chart.empty}</p>
          ) : (
            <div className="holdings-chart-bars">
              {chartItems.map((item) => {
                const height = (Math.abs(item.value) / maxChartValue) * 100;
                const isPositive = item.value >= 0;
                return (
                  <div className="holdings-chart-bar" key={item.label}>
                    <div className="holdings-chart-bar-stack">
                      <div className="holdings-chart-bar-pos">
                        {isPositive ? (
                          <span
                            className="holdings-chart-bar-fill pos"
                            style={{ height: `${height}%` }}
                          />
                        ) : null}
                      </div>
                      <div className="holdings-chart-bar-neg">
                        {!isPositive ? (
                          <span
                            className="holdings-chart-bar-fill neg"
                            style={{ height: `${height}%` }}
                          />
                        ) : null}
                      </div>
                    </div>
                    <span className="holdings-chart-label" title={item.label}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
      )}

      {dashboardView === "holdings" && (
        <section className="holdings-table-wrap">
        <div className="holdings-table-header">
          <h3>{t.holdings.tableTitle}</h3>
          <div className="holdings-chip-row">
            <button
              type="button"
              className={`holdings-chip${tableView === "holdings" ? " active" : ""}`}
              onClick={() => setTableView("holdings")}
            >
              {t.holdings.tableViews.holdings}
            </button>
            <button
              type="button"
              className={`holdings-chip${tableView === "operations" ? " active" : ""}`}
              onClick={() => setTableView("operations")}
              disabled={viewMode === "overall"}
            >
              {t.holdings.tableViews.operations}
            </button>
          </div>
        </div>
        {tableView === "holdings" ? (
          <>
            {loading ? <div className="loading-banner">{t.portfolio.loading}</div> : null}
            {!loading && filteredHoldings.length === 0 ? (
              <p className="chart-sub">{t.holdings.empty}</p>
            ) : null}
            {filteredHoldings.length ? (
              <div
                className={`table holdings-table${showPortfolioColumn ? " overall" : ""}`}
              >
                <div className="row head">
                  <span>{renderSortLabel("holding", t.holdings.columns.holding)}</span>
                  {showPortfolioColumn ? (
                    <span>{renderSortLabel("portfolio", t.holdings.columns.portfolio)}</span>
                  ) : null}
                  <span>{renderSortLabel("shares", t.holdings.columns.shares)}</span>
                  <span className="holding-header">
                    {renderSortLabel("cost_basis", t.holdings.columns.costBasis)}
                    <button
                      type="button"
                      className="info-btn"
                      onClick={() =>
                        setInfoOpen(infoOpen === "costBasis" ? null : "costBasis")
                      }
                    >
                      ?
                    </button>
                    {infoOpen === "costBasis" ? (
                      <div className="holdings-tooltip">{tooltipText.costBasis}</div>
                    ) : null}
                  </span>
                  <span className="holding-header">
                    {renderSortLabel("current_value", t.holdings.columns.currentValue)}
                    <button
                      type="button"
                      className="info-btn"
                      onClick={() =>
                        setInfoOpen(infoOpen === "currentValue" ? null : "currentValue")
                      }
                    >
                      ?
                    </button>
                    {infoOpen === "currentValue" ? (
                      <div className="holdings-tooltip">{tooltipText.currentValue}</div>
                    ) : null}
                  </span>
                  <span className="holding-header">
                    {renderSortLabel("profit_value", t.holdings.columns.totalProfit)}
                    <button
                      type="button"
                      className="info-btn"
                      onClick={() =>
                        setInfoOpen(infoOpen === "totalProfit" ? null : "totalProfit")
                      }
                    >
                      ?
                    </button>
                    {infoOpen === "totalProfit" ? (
                      <div className="holdings-tooltip">{tooltipText.totalProfit}</div>
                    ) : null}
                  </span>
                  <span className="holding-header">
                    {renderSortLabel("share_percent", t.holdings.columns.share)}
                    <button
                      type="button"
                      className="info-btn"
                      onClick={() => setInfoOpen(infoOpen === "share" ? null : "share")}
                    >
                      ?
                    </button>
                    {infoOpen === "share" ? (
                      <div className="holdings-tooltip">{tooltipText.share}</div>
                    ) : null}
                  </span>
                  <span>{renderSortLabel("tags", t.holdings.columns.tags)}</span>
                </div>
                {filteredHoldings.map((item) => (
                  <div className="row" key={`${item.ticker}-${item.portfolio_id || ""}`}>
                    <span className="holding-name">
                      <strong>{item.ticker}</strong>
                      <small>{item.name || item.institution || "-"}</small>
                      <button
                        type="button"
                        className="holding-meta-btn"
                        onClick={() => openMetaEditor(item)}
                      >
                        {t.holdings.meta.edit}
                      </button>
                    </span>
                    {showPortfolioColumn ? (
                      <span>{item.portfolio_name || "--"}</span>
                    ) : null}
                    <span>{Number(item.shares || 0).toFixed(4)}</span>
                    <span>{formatCurrency(item.cost_basis || 0)}</span>
                    <span>{formatCurrency(item.current_value || 0)}</span>
                    <span className={item.profit_value >= 0 ? "pos" : "neg"}>
                      {formatSignedCurrency(item.profit_value || 0)}
                      {item.profit_percent !== null && item.profit_percent !== undefined
                        ? ` (${formatSignedPercent(item.profit_percent)})`
                        : ""}
                    </span>
                    <span>{Number(item.share_percent || 0).toFixed(2)}%</span>
                    <span className="holding-tags">
                      {item.tags && item.tags.length ? (
                        item.tags.map((tag) => (
                          <span className="tag-chip" key={`${item.ticker}-${tag}`}>
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="muted">--</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </>
        ) : operationsLoading ? (
          <div className="loading-banner">{t.holdings.operations.loading}</div>
        ) : operationsError ? (
          <p className="chart-sub error-text">{operationsError}</p>
        ) : operations.length === 0 ? (
          <p className="chart-sub">{t.holdings.operations.empty}</p>
        ) : (
          <div className="table holdings-operations-table">
            <div className="row head">
              <span>{t.holdings.operations.columns.date}</span>
              <span>{t.holdings.operations.columns.type}</span>
              <span>{t.holdings.operations.columns.ticker}</span>
              <span>{t.holdings.operations.columns.description}</span>
              <span>{t.holdings.operations.columns.amount}</span>
              <span>{t.holdings.operations.columns.source}</span>
              <span>{t.holdings.operations.columns.tags}</span>
              <span>{t.holdings.operations.columns.actions}</span>
            </div>
            {operations.map((item) => (
              <div className="row" key={`op-${item.id}`}>
                <span>{item.trade_date || "--"}</span>
                <span>{item.operation_kind || item.operation_type}</span>
                <span>{item.ticker || "--"}</span>
                <span>{item.description || "--"}</span>
                <span>{formatSignedCurrency(item.amount || 0)}</span>
                <span>{item.source_file || "--"}</span>
                <span className="holding-tags">
                  {item.tags && item.tags.length ? (
                    item.tags.map((tag) => (
                      <span className="tag-chip" key={`${item.id}-${tag}`}>
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="muted">--</span>
                  )}
                </span>
                <span>
                  {item.ticker ? (
                    <button
                      type="button"
                      className="holding-meta-btn"
                      onClick={() =>
                        openMetaEditorForTicker(item.ticker || "", item.tags || [])
                      }
                    >
                      {t.holdings.meta.edit}
                    </button>
                  ) : (
                    <span className="muted">--</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
        </section>
      )}

      {metaDraft ? (
        <div className="holding-meta-modal" onClick={closeMetaEditor}>
          <div className="holding-meta-card" onClick={(event) => event.stopPropagation()}>
            <div className="holding-meta-header">
              <div>
                <h4>{t.holdings.meta.title}</h4>
                <p className="chart-sub">
                  {metaDraft.ticker} · {t.holdings.meta.subtitle}
                </p>
              </div>
              <button
                type="button"
                className="ghost-btn"
                onClick={closeMetaEditor}
              >
                {t.holdings.meta.cancel}
              </button>
            </div>
            <div className="holding-meta-grid">
              <label>
                <span>{t.holdings.meta.sector}</span>
                <input
                  type="text"
                  value={metaDraft.sector}
                  onChange={(event) => updateMetaDraft("sector", event.target.value)}
                />
              </label>
              <label>
                <span>{t.holdings.meta.industry}</span>
                <input
                  type="text"
                  value={metaDraft.industry}
                  onChange={(event) => updateMetaDraft("industry", event.target.value)}
                />
              </label>
              <label>
                <span>{t.holdings.meta.country}</span>
                <input
                  type="text"
                  value={metaDraft.country}
                  onChange={(event) => updateMetaDraft("country", event.target.value)}
                />
              </label>
              <label>
                <span>{t.holdings.meta.assetType}</span>
                <select
                  value={metaDraft.asset_type}
                  onChange={(event) => updateMetaDraft("asset_type", event.target.value)}
                >
                  {assetTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="holding-tag-panel">
              <div className="tag-panel-header">
                <span>{t.holdings.tags.label}</span>
                {tagMessage ? <span className="tag-message">{tagMessage}</span> : null}
              </div>
              <div className="tag-chip-row">
                {availableTags.map((tag) => {
                  const active = metaDraft.tags.includes(tag);
                  const isCustom = customTags.some(
                    (item) => item.toLowerCase() === tag.toLowerCase()
                  );
                  return (
                    <div className={`tag-chip${active ? " active" : ""}`} key={tag}>
                      <button
                        type="button"
                        className="tag-chip-btn"
                        onClick={() => toggleMetaTag(tag)}
                      >
                        {tag}
                      </button>
                      {isCustom ? (
                        <button
                          type="button"
                          className="tag-remove-btn"
                          onClick={() => handleDeleteTag(tag)}
                        >
                          ×
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              <div className="tag-input-row">
                <input
                  type="text"
                  placeholder={t.holdings.tags.placeholder}
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                />
                <button type="button" className="ghost-btn" onClick={handleAddTag}>
                  {t.holdings.tags.add}
                </button>
              </div>
              {tagError ? <p className="login-error">{tagError}</p> : null}
            </div>
            <div className="holding-meta-actions">
              <button
                type="button"
                className="primary-btn"
                onClick={handleMetaSave}
                disabled={metaSaving}
              >
                {metaSaving ? t.holdings.meta.saving : t.holdings.meta.save}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section className="holdings-form">
        <div className="section-head">
          <h3>{t.holdings.transaction.title}</h3>
          <span className="chart-sub">{t.holdings.transaction.subtitle}</span>
        </div>
        {txMessage ? <div className="login-banner">{txMessage}</div> : null}
        {txError ? <p className="login-error">{txError}</p> : null}
        <div className="form-grid">
          <div className="field">
            <label>{t.holdings.transaction.ticker}</label>
            <input
              type="text"
              value={txTicker}
              onChange={(event) => setTxTicker(event.target.value)}
            />
          </div>
          <div className="field">
            <label>{t.holdings.transaction.company}</label>
            <input
              type="text"
              value={txCompany}
              onChange={(event) => setTxCompany(event.target.value)}
            />
          </div>
          <div className="field">
            <label>{t.holdings.transaction.operation}</label>
            <select
              value={txOperation}
              onChange={(event) =>
                setTxOperation(event.target.value === "sell" ? "sell" : "buy")
              }
            >
              <option value="buy">{t.holdings.transaction.buy}</option>
              <option value="sell">{t.holdings.transaction.sell}</option>
            </select>
          </div>
          <div className="field">
            <label>{t.holdings.transaction.date}</label>
            <input
              type="date"
              value={txDate}
              onChange={(event) => setTxDate(event.target.value)}
            />
          </div>
          <div className="field">
            <label>{t.holdings.transaction.shares}</label>
            <input
              type="number"
              value={txShares}
              onChange={(event) => setTxShares(event.target.value)}
            />
          </div>
          <div className="field">
            <label>{t.holdings.transaction.price}</label>
            <input
              type="number"
              value={txPrice}
              onChange={(event) => setTxPrice(event.target.value)}
            />
          </div>
          <div className="field">
            <label>{t.holdings.transaction.fee}</label>
            <input
              type="number"
              value={txFee}
              onChange={(event) => setTxFee(event.target.value)}
            />
          </div>
          <div className="field">
            <label>{t.holdings.transaction.note}</label>
            <input
              type="text"
              value={txNote}
              onChange={(event) => setTxNote(event.target.value)}
            />
          </div>
          <div className="field">
            <label>{t.holdings.transaction.category}</label>
            <select
              value={txCategory}
              onChange={(event) => setTxCategory(event.target.value)}
            >
              {categoryOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>{t.holdings.transaction.institution}</label>
            <input
              type="text"
              value={txInstitution}
              onChange={(event) => setTxInstitution(event.target.value)}
            />
          </div>
        </div>
        <div className="form-actions">
          <button
            className="ghost-btn"
            type="button"
            onClick={() => handleSaveTransaction(true)}
            disabled={txSaving}
          >
            {txSaving ? t.holdings.transaction.saving : t.holdings.transaction.saveMore}
          </button>
          <button
            className="primary-btn"
            type="button"
            onClick={() => handleSaveTransaction(false)}
            disabled={txSaving}
          >
            {txSaving ? t.holdings.transaction.saving : t.holdings.transaction.save}
          </button>
        </div>
      </section>
    </div>
  );
}

export default Holdings;

import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  Switch,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import Svg, { G, Path, Circle } from "react-native-svg";

const BANKING_DEFAULT_CATEGORY = "Sem categoria";
const BANKING_DEFAULT_SUBCATEGORY = "Sem subcategoria";

export default function App() {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("");
  const [portfolios, setPortfolios] = useState([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [dashboardError, setDashboardError] = useState("");
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [dailyHistory, setDailyHistory] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [institutionsLoading, setInstitutionsLoading] = useState(false);
  const [institutionsError, setInstitutionsError] = useState("");
  const [institutionDetail, setInstitutionDetail] = useState(null);
  const [institutionDetailOpen, setInstitutionDetailOpen] = useState(false);
  const [institutionDetailLoading, setInstitutionDetailLoading] = useState(false);
  const [institutionDetailError, setInstitutionDetailError] = useState("");
  const [homeTab, setHomeTab] = useState("portfolios");
  const [portfolioView, setPortfolioView] = useState("overview");
  const [localCategories, setLocalCategories] = useState([]);
  const [categoryInput, setCategoryInput] = useState("");
  const [categoryMessage, setCategoryMessage] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [categorySettings, setCategorySettings] = useState({});
  const [settingsError, setSettingsError] = useState("");
  const [clearMessage, setClearMessage] = useState("");
  const [clearError, setClearError] = useState("");
  const [clearing, setClearing] = useState(false);
  const [deletePortfolioMessage, setDeletePortfolioMessage] = useState("");
  const [deletePortfolioError, setDeletePortfolioError] = useState("");
  const [deletingPortfolio, setDeletingPortfolio] = useState(false);

  const [santanderFile, setSantanderFile] = useState(null);
  const [santanderItems, setSantanderItems] = useState([]);
  const [santanderWarnings, setSantanderWarnings] = useState([]);
  const [santanderPreviewing, setSantanderPreviewing] = useState(false);
  const [santanderSaving, setSantanderSaving] = useState(false);
  const [santanderError, setSantanderError] = useState("");
  const [santanderMessage, setSantanderMessage] = useState("");

  const [xtbFiles, setXtbFiles] = useState([]);
  const [xtbItems, setXtbItems] = useState([]);
  const [xtbHoldings, setXtbHoldings] = useState([]);
  const [xtbWarnings, setXtbWarnings] = useState([]);
  const [xtbImports, setXtbImports] = useState([]);
  const [xtbPreviewing, setXtbPreviewing] = useState(false);
  const [xtbSaving, setXtbSaving] = useState(false);
  const [xtbLoadingImports, setXtbLoadingImports] = useState(false);
  const [xtbError, setXtbError] = useState("");
  const [xtbMessage, setXtbMessage] = useState("");

  const [bancoFile, setBancoFile] = useState(null);
  const [bancoPreview, setBancoPreview] = useState(null);
  const [bancoImports, setBancoImports] = useState([]);
  const [bancoPreviewing, setBancoPreviewing] = useState(false);
  const [bancoSaving, setBancoSaving] = useState(false);
  const [bancoLoadingImports, setBancoLoadingImports] = useState(false);
  const [bancoError, setBancoError] = useState("");
  const [bancoMessage, setBancoMessage] = useState("");

  const [saveFile, setSaveFile] = useState(null);
  const [savePreview, setSavePreview] = useState(null);
  const [saveEntries, setSaveEntries] = useState([]);
  const [savePreviewing, setSavePreviewing] = useState(false);
  const [saveSaving, setSaveSaving] = useState(false);
  const [saveLoadingEntries, setSaveLoadingEntries] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  const [aforronetFiles, setAforroNetFiles] = useState([]);
  const [aforronetPreview, setAforroNetPreview] = useState([]);
  const [aforronetImports, setAforroNetImports] = useState([]);
  const [aforronetPreviewing, setAforroNetPreviewing] = useState(false);
  const [aforronetSaving, setAforroNetSaving] = useState(false);
  const [aforronetLoadingImports, setAforroNetLoadingImports] = useState(false);
  const [aforronetError, setAforroNetError] = useState("");
  const [aforronetMessage, setAforroNetMessage] = useState("");

  const [tradeFiles, setTradeFiles] = useState([]);
  const [tradePreview, setTradePreview] = useState([]);
  const [tradeEntries, setTradeEntries] = useState([]);
  const [tradePreviewing, setTradePreviewing] = useState(false);
  const [tradeLoadingEntries, setTradeLoadingEntries] = useState(false);
  const [tradeSaving, setTradeSaving] = useState(false);
  const [tradeDeletingId, setTradeDeletingId] = useState(null);
  const [tradeError, setTradeError] = useState("");
  const [tradeMessage, setTradeMessage] = useState("");
  const [tradeManualCash, setTradeManualCash] = useState("");
  const [tradeManualInterests, setTradeManualInterests] = useState("");
  const [tradeManualCategory, setTradeManualCategory] = useState("Cash");
  const [tradeManualSaving, setTradeManualSaving] = useState(false);
  const [tradeManualError, setTradeManualError] = useState("");
  const [tradeManualMessage, setTradeManualMessage] = useState("");

  const [holdingsView, setHoldingsView] = useState("portfolio");
  const [holdingsItems, setHoldingsItems] = useState([]);
  const [holdingsTotal, setHoldingsTotal] = useState(0);
  const [holdingsLoading, setHoldingsLoading] = useState(false);
  const [holdingsError, setHoldingsError] = useState("");
  const [holdingsMessage, setHoldingsMessage] = useState("");
  const [holdingsCategory, setHoldingsCategory] = useState("");
  const [holdingsInstitution, setHoldingsInstitution] = useState("");
  const [holdingsTicker, setHoldingsTicker] = useState("");
  const [expandedHoldingKey, setExpandedHoldingKey] = useState(null);
  const [holdingsChartGroup, setHoldingsChartGroup] = useState("ticker");
  const [holdingsChartMetric, setHoldingsChartMetric] = useState("gain");
  const [holdingsChartRange, setHoldingsChartRange] = useState("1d");
  const [holdingMetaDrafts, setHoldingMetaDrafts] = useState({});
  const [holdingMetaSavingKey, setHoldingMetaSavingKey] = useState(null);
  const [holdingMetaMessage, setHoldingMetaMessage] = useState("");
  const [holdingMetaError, setHoldingMetaError] = useState("");
  const [holdingTicker, setHoldingTicker] = useState("");
  const [holdingCompany, setHoldingCompany] = useState("");
  const [holdingOperation, setHoldingOperation] = useState("buy");
  const [holdingDate, setHoldingDate] = useState("");
  const [holdingShares, setHoldingShares] = useState("");
  const [holdingPrice, setHoldingPrice] = useState("");
  const [holdingFee, setHoldingFee] = useState("");
  const [holdingNote, setHoldingNote] = useState("");
  const [holdingCategory, setHoldingCategory] = useState("Stocks");
  const [holdingInstitution, setHoldingInstitution] = useState("");
  const [holdingSaving, setHoldingSaving] = useState(false);
  const [holdingError, setHoldingError] = useState("");
  const [holdingMessage, setHoldingMessage] = useState("");
  const [bankingInstitutions, setBankingInstitutions] = useState([]);
  const [bankingCategories, setBankingCategories] = useState([]);
  const [bankingTransactions, setBankingTransactions] = useState([]);
  const [bankingLoading, setBankingLoading] = useState(false);
  const [bankingError, setBankingError] = useState("");
  const [bankingMessage, setBankingMessage] = useState("");
  const [bankingFile, setBankingFile] = useState(null);
  const [bankingPaste, setBankingPaste] = useState("");
  const [bankingPreview, setBankingPreview] = useState(null);
  const [bankingMapping, setBankingMapping] = useState([]);
  const [bankingInstitutionInput, setBankingInstitutionInput] = useState("");
  const [bankingInstitutionSelect, setBankingInstitutionSelect] = useState("");
  const [bankingPreviewing, setBankingPreviewing] = useState(false);
  const [bankingImporting, setBankingImporting] = useState(false);
  const [bankingShowMapping, setBankingShowMapping] = useState(false);
  const [bankingShowWarnings, setBankingShowWarnings] = useState(false);
  const [bankingMonth, setBankingMonth] = useState("");
  const [bankingCategory, setBankingCategory] = useState("");
  const [bankingSubcategory, setBankingSubcategory] = useState("");
  const [bankingInstitutionFilter, setBankingInstitutionFilter] = useState("");
  const [bankingUpdatingId, setBankingUpdatingId] = useState(null);
  const [bankingBudgets, setBankingBudgets] = useState([]);
  const [bankingBudgetsLoading, setBankingBudgetsLoading] = useState(false);
  const [bankingBudgetsError, setBankingBudgetsError] = useState("");
  const [bankingBudgetMonth, setBankingBudgetMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [bankingBudgetCategory, setBankingBudgetCategory] = useState("");
  const [bankingBudgetAmount, setBankingBudgetAmount] = useState("");
  const API_BASE = process.env.EXPO_PUBLIC_API_BASE || "http://10.0.2.2:8000";
  const institutionLogos = useMemo(
    () => ({
      santander: require("./assets/institutions/Banco_Santander_Logotipo.svg.png"),
      "trade republic": require("./assets/institutions/Trade_Republic_logo_2021.svg.png"),
      aforronet: require("./assets/institutions/aforronet.gif"),
      "save n grow": require("./assets/institutions/images.png"),
      xtb: require("./assets/institutions/logo-xtb.png"),
      bancoinvest: require("./assets/institutions/BancoInvest Logo.png")
    }),
    []
  );

  const resetFeedback = () => {
    setMessage("");
    setError("");
  };

  const activePortfolio = useMemo(
    () =>
      portfolios.find((item) => item.id === selectedPortfolioId) ||
      portfolios[0] ||
      null,
    [portfolios, selectedPortfolioId]
  );

  const bankingSummary = useMemo(() => {
    let income = 0;
    let expenses = 0;
    const byCategory = {};
    bankingTransactions.forEach((tx) => {
      if (tx.amount >= 0) {
        income += tx.amount;
      } else {
        const spend = Math.abs(tx.amount);
        expenses += spend;
        const key = tx.category || BANKING_DEFAULT_CATEGORY;
        byCategory[key] = (byCategory[key] || 0) + spend;
      }
    });
    const net = income - expenses;
    const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
    return {
      income,
      expenses,
      net,
      topCategory: topCategory ? topCategory[0] : "--"
    };
  }, [bankingTransactions]);

  const bankingExpenseByCategory = useMemo(() => {
    const totals = {};
    bankingTransactions.forEach((tx) => {
      if (tx.amount < 0) {
        const key = tx.category || BANKING_DEFAULT_CATEGORY;
        totals[key] = (totals[key] || 0) + Math.abs(tx.amount);
      }
    });
    return Object.entries(totals)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [bankingTransactions]);

  const bankingMonthlyNet = useMemo(() => {
    const totals = {};
    bankingTransactions.forEach((tx) => {
      const month = tx.tx_date ? String(tx.tx_date).slice(0, 7) : "Unknown";
      if (!totals[month]) {
        totals[month] = { income: 0, expenses: 0 };
      }
      if (tx.amount >= 0) {
        totals[month].income += tx.amount;
      } else {
        totals[month].expenses += Math.abs(tx.amount);
      }
    });
    return Object.entries(totals)
      .map(([month, entry]) => ({
        month,
        net: entry.income - entry.expenses
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6);
  }, [bankingTransactions]);

  useEffect(() => {
    setLocalCategories(activePortfolio?.categories || []);
    if (activePortfolio?.categories?.length) {
      setHoldingCategory(activePortfolio.categories[0] || "Stocks");
      if (!activePortfolio.categories.includes(tradeManualCategory)) {
        setTradeManualCategory(activePortfolio.categories[0] || "Cash");
      }
    } else {
      setHoldingCategory("Stocks");
      setTradeManualCategory("Cash");
    }
  }, [activePortfolio?.id, (activePortfolio?.categories || []).join("|")]);

  useEffect(() => {
    if (activePortfolio?.id && token) {
      loadCategorySettings(activePortfolio.id);
    }
  }, [activePortfolio?.id, token]);

  const formatCurrency = (value) => {
    const currency = activePortfolio?.currency || "EUR";
    return `${currency} ${Number(value || 0).toFixed(2)}`;
  };

  const parseInputNumber = (value) => {
    if (!value) {
      return null;
    }
    let cleaned = String(value).trim();
    if (!cleaned) {
      return null;
    }
    cleaned = cleaned.replace(/[^0-9,.-]/g, "");
    if (cleaned.includes(",") && cleaned.includes(".")) {
      if (cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")) {
        cleaned = cleaned.replace(/\./g, "");
        cleaned = cleaned.replace(",", ".");
      } else {
        cleaned = cleaned.replace(/,/g, "");
      }
    } else if (cleaned.includes(",")) {
      cleaned = cleaned.replace(",", ".");
    }
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const toFormFile = (asset, fallbackName) => ({
    uri: asset.uri,
    name: asset.name || fallbackName || "upload.xlsx",
    type: asset.mimeType || "application/octet-stream"
  });

  const pickFiles = async ({ multiple } = {}) => {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ],
      multiple: Boolean(multiple),
      copyToCacheDirectory: true
    });
    if (result.canceled) {
      return [];
    }
    const assets = result.assets || (result.uri ? [result] : []);
    return assets.map((asset) => toFormFile(asset, "upload.xlsx"));
  };

  const pickBankingFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        "text/csv",
        "text/plain",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ],
      copyToCacheDirectory: true
    });
    if (result.canceled) {
      return null;
    }
    const asset = result.assets ? result.assets[0] : result;
    return toFormFile(asset, "transactions.csv");
  };

  const pickPdf = async ({ multiple } = {}) => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      multiple: Boolean(multiple),
      copyToCacheDirectory: true
    });
    if (result.canceled) {
      return [];
    }
    const assets = result.assets || (result.uri ? [result] : []);
    return assets.map((asset) => toFormFile(asset, "upload.pdf"));
  };

  const handleRequest = async (path, body) => {
    setLoading(true);
    resetFeedback();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        signal: controller.signal,
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || "Request failed.");
      }
      return data;
    } catch (err) {
      if (err.name === "AbortError") {
        setError("Request timed out. Check the API base URL and backend.");
      } else {
        setError(err.message || "Request failed.");
      }
      return null;
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const authFetch = async (path) => {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.detail || "Request failed.");
    }
    return data;
  };

  const authJson = async (path, options = {}) => {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`
      }
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.detail || "Request failed.");
    }
    return data;
  };

  const loadPortfolios = async () => {
    if (!token) {
      return;
    }
    setLoadingDashboard(true);
    setDashboardError("");
    try {
      const data = await authFetch("/portfolios");
      const items = data.items || [];
      setPortfolios(items);
      const hasSelected = selectedPortfolioId
        ? items.some((item) => item.id === selectedPortfolioId)
        : false;
      if (items.length && !hasSelected) {
        setSelectedPortfolioId(items[0].id);
      }
      if (!items.length) {
        setSelectedPortfolioId(null);
      }
      if (!items.length) {
        setSummary(null);
      }
    } catch (err) {
      setDashboardError(err.message || "Unable to load portfolios.");
    } finally {
      setLoadingDashboard(false);
    }
  };

  const loadSummary = async (portfolioId) => {
    if (!token || !portfolioId) {
      return;
    }
    setLoadingDashboard(true);
    setDashboardError("");
    try {
      const data = await authFetch(`/portfolios/${portfolioId}/summary`);
      setSummary(data);
    } catch (err) {
      setDashboardError(err.message || "Unable to load summary.");
    } finally {
      setLoadingDashboard(false);
    }
  };

  const loadHistory = async (portfolioId) => {
    if (!token || !portfolioId) {
      return;
    }
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const [monthly, daily] = await Promise.all([
        authJson(`/portfolios/${portfolioId}/history/monthly`),
        authJson(`/portfolios/${portfolioId}/history`)
      ]);
      setHistory(monthly.items || []);
      setDailyHistory(daily.items || []);
    } catch (err) {
      setHistoryError("Unable to load history.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadInstitutions = async (portfolioId) => {
    if (!token || !portfolioId) {
      return;
    }
    setInstitutionsLoading(true);
    setInstitutionsError("");
    try {
      const data = await authJson(`/portfolios/${portfolioId}/institutions`);
      setInstitutions(data.items || []);
    } catch (err) {
      setInstitutionsError("Unable to load institutions.");
    } finally {
      setInstitutionsLoading(false);
    }
  };

  const loadBankingCategories = async (portfolioId) => {
    if (!token || !portfolioId) {
      return;
    }
    try {
      const data = await authJson(`/portfolios/${portfolioId}/banking/categories`);
      setBankingCategories(data.items || []);
    } catch (err) {
      // ignore
    }
  };

  const loadBankingInstitutions = async (portfolioId) => {
    if (!token || !portfolioId) {
      return;
    }
    try {
      const data = await authJson(`/portfolios/${portfolioId}/institutions`);
      const names = (data.items || [])
        .map((item) => item?.institution || item?.name)
        .filter(Boolean);
      setBankingInstitutions(Array.from(new Set(names)));
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    if (!bankingInstitutionInput) {
      return;
    }
    if (bankingInstitutions.includes(bankingInstitutionInput)) {
      setBankingInstitutionSelect(bankingInstitutionInput);
    }
  }, [bankingInstitutions, bankingInstitutionInput]);

  const loadBankingTransactions = async (portfolioId) => {
    if (!token || !portfolioId) {
      return;
    }
    setBankingLoading(true);
    setBankingError("");
    try {
      const params = [];
      if (bankingMonth) {
        params.push(`month=${encodeURIComponent(bankingMonth)}`);
      }
      if (bankingCategory) {
        params.push(`category=${encodeURIComponent(bankingCategory)}`);
      }
      if (bankingSubcategory) {
        params.push(`subcategory=${encodeURIComponent(bankingSubcategory)}`);
      }
      if (bankingInstitutionFilter) {
        params.push(`institution=${encodeURIComponent(bankingInstitutionFilter)}`);
      }
      const query = params.length ? `?${params.join("&")}` : "";
      const data = await authJson(
        `/portfolios/${portfolioId}/banking/transactions${query}`
      );
      setBankingTransactions(data.items || []);
    } catch (err) {
      setBankingError("Unable to load transactions.");
    } finally {
      setBankingLoading(false);
    }
  };

  const loadBankingBudgets = async (portfolioId) => {
    if (!token || !portfolioId) {
      return;
    }
    setBankingBudgetsLoading(true);
    setBankingBudgetsError("");
    try {
      const month = bankingBudgetMonth || new Date().toISOString().slice(0, 7);
      const data = await authJson(
        `/portfolios/${portfolioId}/banking/budgets?month=${encodeURIComponent(
          month
        )}`
      );
      setBankingBudgets(data.items || []);
    } catch (err) {
      setBankingBudgetsError("Unable to load budgets.");
    } finally {
      setBankingBudgetsLoading(false);
    }
  };

  const openInstitutionDetail = async (institution) => {
    if (!activePortfolio) {
      return;
    }
    setInstitutionDetailOpen(true);
    setInstitutionDetail(null);
    setInstitutionDetailError("");
    setInstitutionDetailLoading(true);
    try {
      const data = await authJson(
        `/portfolios/${activePortfolio.id}/institutions/${encodeURIComponent(
          institution
        )}/detail`
      );
      setInstitutionDetail(data);
    } catch (err) {
      setInstitutionDetailError("Unable to load institution detail.");
    } finally {
      setInstitutionDetailLoading(false);
    }
  };

  const refreshPortfolioData = async (portfolioId) => {
    await loadPortfolios();
    if (portfolioId) {
      await loadSummary(portfolioId);
      await loadHistory(portfolioId);
      await loadInstitutions(portfolioId);
      await loadCategorySettings(portfolioId);
    }
  };

  const loadTradeEntries = async (portfolioId) => {
    if (!portfolioId) {
      return;
    }
    setTradeLoadingEntries(true);
    setTradeError("");
    try {
      const data = await authJson(`/portfolios/${portfolioId}/imports/trade-republic`);
      setTradeEntries(data.items || []);
    } catch (err) {
      setTradeError("Unable to load Trade Republic imports.");
    } finally {
      setTradeLoadingEntries(false);
    }
  };

  const loadXtbImports = async (portfolioId) => {
    if (!portfolioId) {
      return;
    }
    setXtbLoadingImports(true);
    setXtbError("");
    try {
      const data = await authJson(`/portfolios/${portfolioId}/imports/xtb`);
      setXtbImports(data.items || []);
    } catch (err) {
      setXtbError("Unable to load XTB imports.");
    } finally {
      setXtbLoadingImports(false);
    }
  };

  const loadBancoImports = async (portfolioId) => {
    if (!portfolioId) {
      return;
    }
    setBancoLoadingImports(true);
    setBancoError("");
    try {
      const data = await authJson(`/portfolios/${portfolioId}/imports/bancoinvest`);
      setBancoImports(data.items || []);
    } catch (err) {
      setBancoError("Unable to load BancoInvest imports.");
    } finally {
      setBancoLoadingImports(false);
    }
  };

  const loadSaveEntries = async (portfolioId) => {
    if (!portfolioId) {
      return;
    }
    setSaveLoadingEntries(true);
    setSaveError("");
    try {
      const data = await authJson(`/portfolios/${portfolioId}/imports/save-n-grow`);
      setSaveEntries(data.items || []);
    } catch (err) {
      setSaveError("Unable to load Save N Grow imports.");
    } finally {
      setSaveLoadingEntries(false);
    }
  };

  const loadAforroNetImports = async (portfolioId) => {
    if (!portfolioId) {
      return;
    }
    setAforroNetLoadingImports(true);
    setAforroNetError("");
    try {
      const data = await authJson(`/portfolios/${portfolioId}/imports/aforronet`);
      setAforroNetImports(data.items || []);
    } catch (err) {
      setAforroNetError("Unable to load AforroNet imports.");
    } finally {
      setAforroNetLoadingImports(false);
    }
  };

  const loadHoldings = async (portfolioId) => {
    if (!token) {
      return;
    }
    if (holdingsView === "portfolio" && !portfolioId) {
      setHoldingsItems([]);
      setHoldingsTotal(0);
      return;
    }
    setHoldingsLoading(true);
    setHoldingsError("");
    try {
      const params = new URLSearchParams();
      if (holdingsCategory) {
        params.set("category", holdingsCategory);
      }
      if (holdingsInstitution) {
        params.set("institution", holdingsInstitution);
      }
      const path =
        holdingsView === "overall"
          ? "/holdings"
          : `/portfolios/${portfolioId}/holdings`;
      const query = params.toString();
      const data = await authJson(`${path}${query ? `?${query}` : ""}`);
      setHoldingsItems(data.items || []);
      setHoldingsTotal(Number(data.total_value) || 0);
    } catch (err) {
      setHoldingsError("Unable to load holdings.");
    } finally {
      setHoldingsLoading(false);
    }
  };

  const loadCategorySettings = async (portfolioId) => {
    if (!portfolioId) {
      return;
    }
    setSettingsError("");
    try {
      const data = await authJson(
        `/portfolios/${portfolioId}/categories/settings`
      );
      const nextSettings = {};
      (data.items || []).forEach((item) => {
        nextSettings[item.category] = Boolean(item.is_investment);
      });
      setCategorySettings(nextSettings);
    } catch (err) {
      setSettingsError("Unable to load category settings.");
    }
  };

  const updateCategorySetting = async (category, isInvestment) => {
    if (!activePortfolio) {
      return;
    }
    setSettingsError("");
    try {
      await authJson(
        `/portfolios/${activePortfolio.id}/categories/settings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ category, is_investment: isInvestment })
        }
      );
      setCategorySettings((prev) => ({
        ...prev,
        [category]: isInvestment
      }));
    } catch (err) {
      setSettingsError("Unable to save category settings.");
    }
  };

  const handleLogin = async () => {
    const data = await handleRequest("/auth/login", { email, password });
    if (!data) {
      return;
    }
    if (data.status === "ok") {
      setToken(data.token);
      setMode("home");
      setMessage("Logged in.");
      return;
    }
    if (data.status === "verification_required") {
      setMode("verify");
      setMessage(data.message || "Verification required.");
    }
  };

  const handleRegister = async () => {
    const data = await handleRequest("/auth/register", { email, password });
    if (!data) {
      return;
    }
    setMode("verify");
    setMessage(data.message || "Verification code sent.");
  };

  const handleVerify = async () => {
    const data = await handleRequest("/auth/verify", { email, code });
    if (!data) {
      return;
    }
    setMode("signin");
    setMessage("Email verified. You can sign in now.");
  };

  const handleResetRequest = async () => {
    const data = await handleRequest("/auth/password/reset-request", { email });
    if (!data) {
      return;
    }
    setMode("reset");
    setMessage("Recovery email sent.");
  };

  const handleReset = async () => {
    const data = await handleRequest("/auth/password/reset", {
      email,
      code,
      new_password: newPassword
    });
    if (!data) {
      return;
    }
    setMode("signin");
    setMessage("Password updated. You can sign in now.");
  };

  const handleClearData = async () => {
    if (!activePortfolio) {
      return;
    }
    Alert.alert(
      "Clear data",
      "This will remove all imports from this portfolio. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            setClearing(true);
            setClearError("");
            setClearMessage("");
            try {
              await authJson(`/portfolios/${activePortfolio.id}/clear-data`, {
                method: "POST"
              });
              setClearMessage("Portfolio data cleared.");
              await refreshPortfolioData(activePortfolio.id);
              await loadTradeEntries(activePortfolio.id);
              await loadXtbImports(activePortfolio.id);
              await loadBancoImports(activePortfolio.id);
              await loadSaveEntries(activePortfolio.id);
              await loadAforroNetImports(activePortfolio.id);
              await loadHoldings(activePortfolio.id);
            } catch (err) {
              setClearError("Unable to clear data.");
            } finally {
              setClearing(false);
            }
          }
        }
      ]
    );
  };

  const handleDeletePortfolio = async () => {
    if (!activePortfolio) {
      return;
    }
    Alert.alert(
      "Delete portfolio",
      "This will remove the portfolio and all its data. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeletingPortfolio(true);
            setDeletePortfolioError("");
            setDeletePortfolioMessage("");
            try {
              await authJson(`/portfolios/${activePortfolio.id}`, {
                method: "DELETE"
              });
              setDeletePortfolioMessage("Portfolio deleted.");
              await loadPortfolios();
              setSummary(null);
              setHistory([]);
              setDailyHistory([]);
              setInstitutions([]);
              setHoldingsItems([]);
              setHoldingsTotal(0);
            } catch (err) {
              setDeletePortfolioError("Unable to delete portfolio.");
            } finally {
              setDeletingPortfolio(false);
            }
          }
        }
      ]
    );
  };

  const handleHoldingsRefresh = async () => {
    if (!token) {
      return;
    }
    if (holdingsView === "portfolio" && !activePortfolio) {
      setHoldingsError("Select a portfolio first.");
      return;
    }
    setHoldingsMessage("");
    setHoldingsError("");
    try {
      const path =
        holdingsView === "overall"
          ? "/holdings/refresh-prices"
          : `/portfolios/${activePortfolio.id}/holdings/refresh-prices`;
      const data = await authJson(path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ force: true })
      });
      const errorItem = (data.items || []).find((item) => item.status === "error");
      if (errorItem) {
        const errorText = String(errorItem.error || "");
        if (errorText.toLowerCase().includes("price unavailable")) {
          setHoldingsError(`Ticker nao suportado: ${errorItem.ticker}`);
        } else {
          setHoldingsError("Unable to refresh prices.");
        }
      } else {
        setHoldingsMessage("Prices updated.");
      }
      await loadHoldings(activePortfolio?.id);
    } catch (err) {
      setHoldingsError("Unable to refresh prices.");
    }
  };

  const handleSaveHoldingTransaction = async (keepValues) => {
    if (!activePortfolio) {
      setHoldingError("Select a portfolio first.");
      return;
    }
    if (!holdingTicker.trim()) {
      setHoldingError("Ticker is required.");
      return;
    }
    if (!holdingDate) {
      setHoldingError("Date is required.");
      return;
    }
    if (Number(holdingShares) <= 0) {
      setHoldingError("Shares must be greater than 0.");
      return;
    }
    if (Number(holdingPrice) <= 0) {
      setHoldingError("Price must be greater than 0.");
      return;
    }
    setHoldingSaving(true);
    setHoldingError("");
    setHoldingMessage("");
    try {
      await authJson(`/portfolios/${activePortfolio.id}/holdings/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ticker: holdingTicker.trim().toUpperCase(),
          name: holdingCompany.trim() || null,
          operation: holdingOperation,
          trade_date: holdingDate,
          shares: Number(holdingShares),
          price: Number(holdingPrice),
          fee: holdingFee ? Number(holdingFee) : null,
          note: holdingNote.trim() || null,
          category: holdingCategory || "Stocks",
          institution: holdingInstitution.trim() || null
        })
      });
      setHoldingMessage("Transaction saved.");
      if (keepValues) {
        setHoldingShares("");
        setHoldingPrice("");
        setHoldingFee("");
        setHoldingNote("");
      } else {
        setHoldingTicker("");
        setHoldingCompany("");
        setHoldingOperation("buy");
        setHoldingDate("");
        setHoldingShares("");
        setHoldingPrice("");
        setHoldingFee("");
        setHoldingNote("");
        setHoldingCategory("Stocks");
        setHoldingInstitution("");
      }
      await loadHoldings(activePortfolio.id);
    } catch (err) {
      setHoldingError("Unable to save transaction.");
    } finally {
      setHoldingSaving(false);
    }
  };

  const handleAddCategory = async () => {
    if (!activePortfolio) {
      return;
    }
    const trimmed = categoryInput.trim();
    if (!trimmed) {
      return;
    }
    setCategoryError("");
    setCategoryMessage("");
    try {
      const data = await authJson(
        `/portfolios/${activePortfolio.id}/categories/add`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ category: trimmed })
        }
      );
      setLocalCategories(data.categories || []);
      setCategoryMessage("Category added.");
      setCategoryInput("");
      await refreshPortfolioData(activePortfolio.id);
    } catch (err) {
      setCategoryError("Unable to add category.");
    }
  };

  const removeCategory = async (category, clearData = false) => {
    const data = await authJson(
      `/portfolios/${activePortfolio.id}/categories/remove`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ category, clear_data: clearData })
      }
    );
    return data;
  };

  const handleRemoveCategory = async (category) => {
    if (!activePortfolio) {
      return;
    }
    setCategoryError("");
    setCategoryMessage("");
    try {
      await removeCategory(category, false);
      setCategoryMessage("Category removed.");
      await refreshPortfolioData(activePortfolio.id);
    } catch (err) {
      if (err?.message?.includes("clear") || err?.message?.includes("409")) {
        Alert.alert(
          "Remove category",
          "This category is used by existing imports. Clear data for this category?",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Remove",
              style: "destructive",
              onPress: async () => {
                try {
                  const data = await removeCategory(category, true);
                  setCategoryMessage("Category removed.");
                  setLocalCategories(data.remaining || []);
                  await refreshPortfolioData(activePortfolio.id);
                } catch (innerErr) {
                  setCategoryError("Unable to remove category.");
                }
              }
            }
          ]
        );
        return;
      }
      setCategoryError("Unable to remove category.");
    }
  };

  const handleSantanderPreview = async (fileOverride) => {
    const file = fileOverride || santanderFile;
    if (!file || !activePortfolio) {
      setSantanderError("Select a file first.");
      return;
    }
    setSantanderPreviewing(true);
    setSantanderError("");
    setSantanderMessage("");
    setSantanderWarnings([]);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(
        `${API_BASE}/portfolios/${activePortfolio.id}/imports/santander/preview`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        }
      );
      const data = await response.json();
      if (!response.ok) {
        const detail = Array.isArray(data?.detail)
          ? "This file does not look like a Santander statement."
          : typeof data?.detail === "string"
          ? data.detail
          : "Preview failed.";
        throw new Error(detail);
      }
      const nextItems = (data.items || []).map((item) => ({
        ...item,
        ignore: Boolean(item.ignore)
      }));
      setSantanderItems(nextItems);
      setSantanderWarnings(data.warnings || []);
      const detected = nextItems
        .map((item) => item.category)
        .filter((item) => item && item !== "Unknown");
      if (detected.length) {
        setLocalCategories((prev) => {
          const merged = [...prev];
          detected.forEach((entry) => {
            if (!merged.some((item) => item.toLowerCase() === entry.toLowerCase())) {
              merged.push(entry);
            }
          });
          return merged;
        });
      }
    } catch (err) {
      setSantanderError(err.message || "Preview failed.");
    } finally {
      setSantanderPreviewing(false);
    }
  };

  const handleSantanderCommit = async () => {
    if (!activePortfolio || !santanderItems.length || !santanderFile) {
      setSantanderError("Preview the file first.");
      return;
    }
    setSantanderSaving(true);
    setSantanderError("");
    setSantanderMessage("");
    try {
      const data = await authJson(
        `/portfolios/${activePortfolio.id}/imports/santander/commit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            filename: santanderFile.name,
            items: santanderItems
          })
        }
      );
      setSantanderMessage(`Import saved (#${data.import_id}).`);
      if (Array.isArray(data.categories)) {
        setLocalCategories(data.categories);
      }
      await refreshPortfolioData(activePortfolio.id);
    } catch (err) {
      setSantanderError(err.message || "Import failed.");
    } finally {
      setSantanderSaving(false);
    }
  };

  const handleXtbPreview = async (filesOverride) => {
    const targetFiles = filesOverride || xtbFiles;
    if (!activePortfolio || !targetFiles.length) {
      setXtbError("Select files first.");
      return;
    }
    setXtbPreviewing(true);
    setXtbError("");
    setXtbMessage("");
    setXtbWarnings([]);
    try {
      const formData = new FormData();
      targetFiles.forEach((file) => {
        formData.append("files", file);
      });
      const response = await fetch(
        `${API_BASE}/portfolios/${activePortfolio.id}/imports/xtb/preview`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || "Preview failed.");
      }
      setXtbItems(data.items || []);
      const holdings = (data.holdings || []).map((item) => ({
        ...item,
        shares: Number(item.shares) || 0,
        open_price: Number(item.open_price) || 0,
        purchase_value:
          item.purchase_value === null || item.purchase_value === undefined
            ? null
            : Number(item.purchase_value) || 0,
        current_price:
          item.current_price === null || item.current_price === undefined
            ? null
            : Number(item.current_price) || 0
      }));
      setXtbHoldings(holdings);
      setXtbWarnings(data.warnings || []);
    } catch (err) {
      setXtbError(err.message || "Preview failed.");
    } finally {
      setXtbPreviewing(false);
    }
  };

  const handleXtbCommit = async () => {
    if (!activePortfolio || !xtbItems.length) {
      setXtbError("Preview files first.");
      return;
    }
    setXtbSaving(true);
    setXtbError("");
    setXtbMessage("");
    try {
      await authJson(`/portfolios/${activePortfolio.id}/imports/xtb/commit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ items: xtbItems, holdings: xtbHoldings })
      });
      setXtbMessage("XTB import saved.");
      setXtbItems([]);
      setXtbHoldings([]);
      setXtbFiles([]);
      await loadXtbImports(activePortfolio.id);
      await refreshPortfolioData(activePortfolio.id);
    } catch (err) {
      setXtbError(err.message || "Import failed.");
    } finally {
      setXtbSaving(false);
    }
  };

  const handleXtbDelete = async (importId) => {
    if (!activePortfolio) {
      return;
    }
    Alert.alert(
      "Delete import",
      "This will remove only this import.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await authJson(
                `/portfolios/${activePortfolio.id}/imports/xtb/${importId}`,
                { method: "DELETE" }
              );
              await loadXtbImports(activePortfolio.id);
              await refreshPortfolioData(activePortfolio.id);
            } catch (err) {
              setXtbError("Unable to delete import.");
            }
          }
        }
      ]
    );
  };

  const handleBancoPreview = async (fileOverride) => {
    const file = fileOverride || bancoFile;
    if (!file || !activePortfolio) {
      setBancoError("Select a file first.");
      return;
    }
    setBancoPreviewing(true);
    setBancoError("");
    setBancoMessage("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(
        `${API_BASE}/portfolios/${activePortfolio.id}/imports/bancoinvest/preview`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || "Preview failed.");
      }
      setBancoPreview({
        filename: data.filename,
        file_hash: data.file_hash,
        snapshot_date: data.snapshot_date || null,
        items: (data.items || []).map((item) => ({
          ...item,
          category: item.category || "Retirement Plans"
        }))
      });
    } catch (err) {
      setBancoError(err.message || "Preview failed.");
    } finally {
      setBancoPreviewing(false);
    }
  };

  const handleBancoCommit = async () => {
    if (!activePortfolio || !bancoPreview) {
      setBancoError("Preview the file first.");
      return;
    }
    setBancoSaving(true);
    setBancoError("");
    setBancoMessage("");
    try {
      await authJson(
        `/portfolios/${activePortfolio.id}/imports/bancoinvest/commit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(bancoPreview)
        }
      );
      setBancoMessage("BancoInvest import saved.");
      setBancoPreview(null);
      setBancoFile(null);
      await loadBancoImports(activePortfolio.id);
      await refreshPortfolioData(activePortfolio.id);
    } catch (err) {
      setBancoError(err.message || "Import failed.");
    } finally {
      setBancoSaving(false);
    }
  };

  const handleBancoDelete = async (importId) => {
    if (!activePortfolio) {
      return;
    }
    Alert.alert("Delete import", "This will remove only this import.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await authJson(
              `/portfolios/${activePortfolio.id}/imports/bancoinvest/${importId}`,
              { method: "DELETE" }
            );
            await loadBancoImports(activePortfolio.id);
            await refreshPortfolioData(activePortfolio.id);
          } catch (err) {
            setBancoError("Unable to delete import.");
          }
        }
      }
    ]);
  };

  const handleSavePreview = async (fileOverride) => {
    const file = fileOverride || saveFile;
    if (!file || !activePortfolio) {
      setSaveError("Select a file first.");
      return;
    }
    setSavePreviewing(true);
    setSaveError("");
    setSaveMessage("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(
        `${API_BASE}/portfolios/${activePortfolio.id}/imports/save-n-grow/preview`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || "Preview failed.");
      }
      setSavePreview({
        filename: data.filename,
        file_hash: data.file_hash,
        snapshot_date: data.snapshot_date || null,
        items: (data.items || []).map((item) => ({
          ...item,
          category: item.category || "Retirement Plans"
        }))
      });
    } catch (err) {
      setSaveError(err.message || "Preview failed.");
    } finally {
      setSavePreviewing(false);
    }
  };

  const handleSaveCommit = async () => {
    if (!activePortfolio || !savePreview) {
      setSaveError("Preview the file first.");
      return;
    }
    setSaveSaving(true);
    setSaveError("");
    setSaveMessage("");
    try {
      await authJson(
        `/portfolios/${activePortfolio.id}/imports/save-n-grow/commit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(savePreview)
        }
      );
      setSaveMessage("Save N Grow import saved.");
      setSavePreview(null);
      setSaveFile(null);
      await loadSaveEntries(activePortfolio.id);
      await refreshPortfolioData(activePortfolio.id);
    } catch (err) {
      setSaveError(err.message || "Import failed.");
    } finally {
      setSaveSaving(false);
    }
  };

  const handleAforroNetPreview = async (filesOverride) => {
    const files = filesOverride || aforronetFiles;
    if (!files.length || !activePortfolio) {
      setAforroNetError("Select files first.");
      return;
    }
    setAforroNetPreviewing(true);
    setAforroNetError("");
    setAforroNetMessage("");
    try {
      const formData = new FormData();
      files.forEach((entry) => formData.append("files", entry));
      const response = await fetch(
        `${API_BASE}/portfolios/${activePortfolio.id}/imports/aforronet/preview`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || "Preview failed.");
      }
      const items = (data.items || []).map((entry) => ({
        filename: entry.filename,
        file_hash: entry.file_hash,
        snapshot_date: entry.snapshot_date || null,
        items: (entry.items || []).map((item) => ({
          ...item,
          category: item.category || "Emergency Funds"
        }))
      }));
      setAforroNetPreview(items);
    } catch (err) {
      setAforroNetError(err.message || "Preview failed.");
    } finally {
      setAforroNetPreviewing(false);
    }
  };

  const handleAforroNetCommit = async () => {
    if (!activePortfolio || !aforronetPreview.length) {
      setAforroNetError("Preview the files first.");
      return;
    }
    setAforroNetSaving(true);
    setAforroNetError("");
    setAforroNetMessage("");
    try {
      await authJson(
        `/portfolios/${activePortfolio.id}/imports/aforronet/commit-batch`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ imports: aforronetPreview })
        }
      );
      setAforroNetMessage("AforroNet import saved.");
      setAforroNetPreview([]);
      setAforroNetFiles([]);
      await loadAforroNetImports(activePortfolio.id);
      await refreshPortfolioData(activePortfolio.id);
    } catch (err) {
      setAforroNetError(err.message || "Import failed.");
    } finally {
      setAforroNetSaving(false);
    }
  };

  const handleAforroNetDelete = async (importId) => {
    if (!activePortfolio) {
      return;
    }
    Alert.alert("Delete import", "This will remove only this import.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await authJson(
              `/portfolios/${activePortfolio.id}/imports/aforronet/${importId}`,
              { method: "DELETE" }
            );
            await loadAforroNetImports(activePortfolio.id);
            await refreshPortfolioData(activePortfolio.id);
          } catch (err) {
            setAforroNetError("Unable to delete import.");
          }
        }
      }
    ]);
  };

  const handleTradePreview = async (filesOverride) => {
    if (!activePortfolio) {
      return;
    }
    const files = filesOverride || tradeFiles;
    if (!files.length) {
      setTradeError("Select files first.");
      return;
    }
    setTradePreviewing(true);
    setTradeError("");
    setTradeMessage("");
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      const response = await fetch(
        `${API_BASE}/portfolios/${activePortfolio.id}/imports/trade-republic/preview`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || "Preview failed.");
      }
      setTradePreview(data.items || []);
    } catch (err) {
      setTradeError(err.message || "Preview failed.");
    } finally {
      setTradePreviewing(false);
    }
  };

  const handleTradeCommit = async () => {
    if (!activePortfolio || !tradePreview.length) {
      setTradeError("Preview the files first.");
      return;
    }
    setTradeSaving(true);
    setTradeError("");
    setTradeMessage("");
    try {
      await authJson(
        `/portfolios/${activePortfolio.id}/imports/trade-republic/commit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ items: tradePreview })
        }
      );
      setTradeMessage("Trade Republic import saved.");
      setTradeFiles([]);
      setTradePreview([]);
      await loadTradeEntries(activePortfolio.id);
      await refreshPortfolioData(activePortfolio.id);
    } catch (err) {
      setTradeError(err.message || "Save failed.");
    } finally {
      setTradeSaving(false);
    }
  };

  const handleTradeManualSave = async () => {
    if (!activePortfolio) {
      return;
    }
    const available = parseInputNumber(tradeManualCash);
    const interests = parseInputNumber(tradeManualInterests);
    if (available === null || interests === null) {
      setTradeManualError("Provide Available Cash and Interests received.");
      return;
    }
    setTradeManualSaving(true);
    setTradeManualError("");
    setTradeManualMessage("");
    try {
      await authJson(`/portfolios/${activePortfolio.id}/imports/trade-republic/manual`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          available_cash: tradeManualCash,
          interests_received: tradeManualInterests,
          currency: activePortfolio.currency,
          category: tradeManualCategory
        })
      });
      setTradeManualMessage("Trade Republic entry saved.");
      setTradeManualCash("");
      setTradeManualInterests("");
      await loadTradeEntries(activePortfolio.id);
      await refreshPortfolioData(activePortfolio.id);
    } catch (err) {
      setTradeManualError(err.message || "Unable to save manual entry.");
    } finally {
      setTradeManualSaving(false);
    }
  };

  const bankingMappingOptions = [
    { value: "ignore", label: "Ignore" },
    { value: "date", label: "Date" },
    { value: "description", label: "Description" },
    { value: "amount", label: "Amount" },
    { value: "debit", label: "Debit" },
    { value: "credit", label: "Credit" },
    { value: "balance", label: "Balance" },
    { value: "currency", label: "Currency" }
  ];

  const deriveBankingMapping = (mapping, columns) => {
    const result = new Array(columns.length).fill("ignore");
    Object.entries(mapping || {}).forEach(([key, value]) => {
      if (typeof value === "number" && value >= 0 && value < columns.length) {
        result[value] = key;
      }
    });
    return result;
  };

  const resolveBankingInstitution = () => {
    if (
      bankingInstitutionSelect &&
      bankingInstitutionSelect !== "Custom" &&
      bankingInstitutionSelect !== "Select"
    ) {
      return bankingInstitutionSelect;
    }
    return bankingInstitutionInput;
  };

  const handleBankingPreview = async () => {
    if (!activePortfolio) {
      return;
    }
    if (!bankingFile && !bankingPaste.trim()) {
      setBankingError("Select a file or paste data first.");
      return;
    }
    setBankingPreviewing(true);
    setBankingError("");
    setBankingMessage("");
    try {
      const formData = new FormData();
      if (bankingFile) {
        formData.append("file", bankingFile);
      }
      if (bankingPaste.trim()) {
        formData.append("text", bankingPaste.trim());
      }
      const institutionName = resolveBankingInstitution();
      if (institutionName.trim()) {
        formData.append("institution", institutionName.trim());
      }
      const response = await fetch(
        `${API_BASE}/portfolios/${activePortfolio.id}/banking/preview`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || "Preview failed.");
      }
      setBankingPreview(data);
      setBankingMapping(deriveBankingMapping(data.mapping, data.columns || []));
    } catch (err) {
      setBankingError(err.message || "Preview failed.");
    } finally {
      setBankingPreviewing(false);
    }
  };

  const handleBankingMappingChange = (index, value) => {
    setBankingMapping((current) => {
      const next = [...current];
      if (value !== "ignore") {
        next.forEach((item, idx) => {
          if (idx !== index && item === value) {
            next[idx] = "ignore";
          }
        });
      }
      next[index] = value;
      return next;
    });
  };

  const handleBankingRowToggle = (index) => {
    if (!bankingPreview) {
      return;
    }
    const nextRows = bankingPreview.rows.map((row, idx) =>
      idx === index ? { ...row, include: !row.include } : row
    );
    setBankingPreview({ ...bankingPreview, rows: nextRows });
  };

  const buildBankingMappingPayload = () => {
    const mapping = {
      date: null,
      description: null,
      amount: null,
      balance: null,
      currency: null,
      debit: null,
      credit: null
    };
    bankingMapping.forEach((value, index) => {
      if (value && value !== "ignore") {
        mapping[value] = index;
      }
    });
    return mapping;
  };

  const handleBankingCommit = async () => {
    if (!activePortfolio || !bankingPreview) {
      setBankingError("Preview the file first.");
      return;
    }
    const institutionName = resolveBankingInstitution();
    if (!institutionName.trim()) {
      setBankingError("Institution is required.");
      return;
    }
    if (
      bankingPreview.warnings?.length &&
      bankingPreview.rows?.length &&
      bankingPreview.warnings.length >= bankingPreview.rows.length
    ) {
      setBankingError("No valid rows found. Check the column detection.");
      return;
    }
    setBankingImporting(true);
    setBankingError("");
    setBankingMessage("");
    try {
      await authJson(`/portfolios/${activePortfolio.id}/banking/commit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          source_file: bankingPreview.source_file,
          file_hash: bankingPreview.file_hash,
          institution: institutionName.trim(),
          columns: bankingPreview.columns || [],
          mapping: buildBankingMappingPayload(),
          rows: bankingPreview.rows || []
        })
      });
      setBankingMessage("Transactions imported.");
      setBankingPreview(null);
      setBankingFile(null);
      setBankingPaste("");
      setBankingShowMapping(false);
      setBankingShowWarnings(false);
      await loadBankingInstitutions(activePortfolio.id);
      await loadBankingTransactions(activePortfolio.id);
      await loadBankingBudgets(activePortfolio.id);
    } catch (err) {
      const detail = err.message || "Import failed.";
      if (String(detail).toLowerCase().includes("no valid rows")) {
        setBankingError("No valid rows found. Check the column detection.");
      } else {
        setBankingError(detail);
      }
    } finally {
      setBankingImporting(false);
    }
  };

  const handleBankingClear = async () => {
    if (!activePortfolio) {
      return;
    }
    Alert.alert(
      "Clear transactions",
      "This will remove all imported banking transactions.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            setBankingImporting(true);
            setBankingError("");
            setBankingMessage("");
            try {
              await authJson(`/portfolios/${activePortfolio.id}/banking/clear`, {
                method: "POST"
              });
              setBankingMessage("Banking transactions cleared.");
              setBankingPreview(null);
              setBankingFile(null);
              setBankingPaste("");
              setBankingShowMapping(false);
              setBankingShowWarnings(false);
              await loadBankingInstitutions(activePortfolio.id);
              await loadBankingTransactions(activePortfolio.id);
              await loadBankingBudgets(activePortfolio.id);
            } catch (err) {
              setBankingError("Unable to clear banking transactions.");
            } finally {
              setBankingImporting(false);
            }
          }
        }
      ]
    );
  };

  const handleBankingCategoryUpdate = async (txId, category, subcategory) => {
    if (!activePortfolio) {
      return;
    }
    setBankingUpdatingId(txId);
    setBankingError("");
    try {
      const data = await authJson(
        `/portfolios/${activePortfolio.id}/banking/transactions/${txId}/category`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            category,
            subcategory: subcategory || null
          })
        }
      );
      const updated = data.transaction;
      setBankingTransactions((current) =>
        current.map((item) =>
          item.id === txId
            ? {
                ...item,
                category: updated.category,
                subcategory: updated.subcategory
              }
            : item
        )
      );
      await loadBankingCategories(activePortfolio.id);
      await loadBankingBudgets(activePortfolio.id);
    } catch (err) {
      setBankingError("Unable to update category.");
    } finally {
      setBankingUpdatingId(null);
    }
  };

  const handleBankingBudgetSave = async () => {
    if (!activePortfolio) {
      return;
    }
    const category = bankingBudgetCategory.trim();
    if (!category || category === "Select") {
      setBankingBudgetsError("Category is required.");
      return;
    }
    const amountValue = parseInputNumber(bankingBudgetAmount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setBankingBudgetsError("Amount must be greater than 0.");
      return;
    }
    const month = bankingBudgetMonth || new Date().toISOString().slice(0, 7);
    setBankingBudgetsLoading(true);
    setBankingBudgetsError("");
    try {
      await authJson(`/portfolios/${activePortfolio.id}/banking/budgets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          category,
          amount: amountValue,
          month
        })
      });
      setBankingBudgetAmount("");
      await loadBankingBudgets(activePortfolio.id);
      await loadBankingCategories(activePortfolio.id);
    } catch (err) {
      setBankingBudgetsError("Unable to save budget.");
    } finally {
      setBankingBudgetsLoading(false);
    }
  };

  const handleBankingBudgetDelete = async (budgetId) => {
    if (!activePortfolio) {
      return;
    }
    Alert.alert("Delete budget", "Remove this budget?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setBankingBudgetsLoading(true);
          setBankingBudgetsError("");
          try {
            await authJson(
              `/portfolios/${activePortfolio.id}/banking/budgets/${budgetId}`,
              { method: "DELETE" }
            );
            await loadBankingBudgets(activePortfolio.id);
          } catch (err) {
            setBankingBudgetsError("Unable to delete budget.");
          } finally {
            setBankingBudgetsLoading(false);
          }
        }
      }
    ]);
  };

  const handleTradeDelete = async (entryId) => {
    if (!activePortfolio) {
      return;
    }
    Alert.alert("Delete import", "This will remove only this import.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setTradeDeletingId(entryId);
            await authJson(
              `/portfolios/${activePortfolio.id}/imports/trade-republic/${entryId}`,
              { method: "DELETE" }
            );
            await loadTradeEntries(activePortfolio.id);
            await refreshPortfolioData(activePortfolio.id);
          } catch (err) {
            setTradeError("Unable to delete import.");
          } finally {
            setTradeDeletingId(null);
          }
        }
      }
    ]);
  };

  const updateSantanderItem = (index, updates) => {
    setSantanderItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, ...updates } : item))
    );
  };

  const updateXtbItem = (index, updates) => {
    setXtbItems((prev) => {
      const target = prev[index];
      const next = prev.map((item, idx) =>
        idx === index ? { ...item, ...updates } : item
      );
      if (updates.category && target?.filename) {
        setXtbHoldings((current) =>
          current.map((holding) =>
            holding.source_file === target.filename
              ? { ...holding, category: updates.category }
              : holding
          )
        );
      }
      return next;
    });
  };

  const updateBancoItem = (index, updates) => {
    setBancoPreview((prev) => {
      if (!prev) {
        return prev;
      }
      const items = prev.items.map((item, idx) =>
        idx === index ? { ...item, ...updates } : item
      );
      return { ...prev, items };
    });
  };

  const updateSaveItem = (index, updates) => {
    setSavePreview((prev) => {
      if (!prev) {
        return prev;
      }
      const items = prev.items.map((item, idx) =>
        idx === index ? { ...item, ...updates } : item
      );
      return { ...prev, items };
    });
  };

  const updateTradeItem = (index, updates) => {
    setTradePreview((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, ...updates } : item))
    );
  };

  const updateAforroNetItem = (groupIndex, itemIndex, updates) => {
    setAforroNetPreview((prev) =>
      prev.map((group, idx) => {
        if (idx !== groupIndex) {
          return group;
        }
        const items = group.items.map((item, innerIdx) =>
          innerIdx === itemIndex ? { ...item, ...updates } : item
        );
        return { ...group, items };
      })
    );
  };

  useEffect(() => {
    if (mode === "home") {
      loadPortfolios();
    }
  }, [mode, token]);

  useEffect(() => {
    if (mode === "home" && selectedPortfolioId) {
      loadSummary(selectedPortfolioId);
      loadHistory(selectedPortfolioId);
      loadInstitutions(selectedPortfolioId);
    }
  }, [mode, selectedPortfolioId, token]);

  useEffect(() => {
    if (
      mode !== "home" ||
      homeTab !== "portfolios" ||
      portfolioView !== "imports" ||
      !activePortfolio
    ) {
      return;
    }
    loadTradeEntries(activePortfolio.id);
    loadXtbImports(activePortfolio.id);
    loadBancoImports(activePortfolio.id);
    loadSaveEntries(activePortfolio.id);
    loadAforroNetImports(activePortfolio.id);
  }, [mode, homeTab, portfolioView, activePortfolio?.id, token]);

  useEffect(() => {
    if (mode !== "home" || homeTab !== "investments") {
      return;
    }
    if (holdingsView === "portfolio" && !activePortfolio) {
      return;
    }
    loadHoldings(activePortfolio?.id);
  }, [
    mode,
    homeTab,
    holdingsView,
    activePortfolio?.id,
    holdingsCategory,
    holdingsInstitution,
    token
  ]);

  useEffect(() => {
    if (mode !== "home" || homeTab !== "banking" || !activePortfolio) {
      return;
    }
    loadBankingCategories(activePortfolio.id);
    loadBankingInstitutions(activePortfolio.id);
  }, [mode, homeTab, activePortfolio?.id, token]);

  useEffect(() => {
    if (mode !== "home" || homeTab !== "banking" || !activePortfolio) {
      return;
    }
    loadBankingTransactions(activePortfolio.id);
  }, [
    mode,
    homeTab,
    activePortfolio?.id,
    bankingMonth,
    bankingCategory,
    bankingSubcategory,
    bankingInstitutionFilter,
    token
  ]);

  useEffect(() => {
    if (mode !== "home" || homeTab !== "banking" || !activePortfolio) {
      return;
    }
    loadBankingBudgets(activePortfolio.id);
  }, [mode, homeTab, activePortfolio?.id, bankingBudgetMonth, token]);

  const categoryOptions = useMemo(
    () => [...localCategories, "Unknown"],
    [localCategories]
  );
  const allocationItems = useMemo(() => {
    if (!summary?.totals_by_category) {
      return [];
    }
    return Object.entries(summary.totals_by_category)
      .map(([label, value]) => ({
        label,
        value: Number(value) || 0
      }))
      .filter((item) => item.value > 0);
  }, [summary]);
  const allocationTotal = useMemo(
    () => allocationItems.reduce((sum, item) => sum + item.value, 0),
    [allocationItems]
  );
  const allocationColors = useMemo(
    () => ["#2ad68d", "#1b8af2", "#9b5cff", "#f2b441", "#ea5fd6", "#6fd6ff"],
    []
  );
  const formatSigned = (value) => {
    if (value === null || value === undefined) {
      return "-";
    }
    const numeric = Number(value) || 0;
    const sign = numeric < 0 ? "-" : "+";
    return `${sign}${formatCurrency(Math.abs(numeric))}`;
  };
  const formatSignedPercent = (value) => {
    if (value === null || value === undefined) {
      return "-";
    }
    const numeric = Number(value) || 0;
    const sign = numeric < 0 ? "-" : "+";
    return `${sign}${Math.abs(numeric).toFixed(2)}%`;
  };
  const getAssetType = (category) => {
    const value = String(category || "").toLowerCase();
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
  const formatDateShort = (value) => {
    if (!value) {
      return "-";
    }
    if (typeof value === "string") {
      return value.slice(0, 10);
    }
    return String(value);
  };
  const getInstitutionLogo = (name) => {
    if (!name) {
      return null;
    }
    const key = name.trim().toLowerCase();
    return institutionLogos[key] || null;
  };
  const detailCategories = useMemo(() => {
    if (!institutionDetail?.totals_by_category) {
      return [];
    }
    return Object.entries(institutionDetail.totals_by_category)
      .map(([label, value]) => ({
        label,
        value: Number(value) || 0
      }))
      .filter((item) => item.value > 0);
  }, [institutionDetail]);
  const detailCategoryTotal = useMemo(
    () => detailCategories.reduce((sum, item) => sum + item.value, 0),
    [detailCategories]
  );
  const historySeries = useMemo(() => {
    if (!history.length) {
      return [];
    }
    return history
      .map((item) => ({
        date: item.month || item.date,
        total: Number(item.total) || 0
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [history]);
  const historyRange = useMemo(() => {
    if (!historySeries.length) {
      return { min: 0, max: 0 };
    }
    const totals = historySeries.map((item) => item.total);
    return {
      min: Math.min(...totals),
      max: Math.max(...totals)
    };
  }, [historySeries]);
  const pastRows = useMemo(() => {
    if (!dailyHistory.length) {
      return [];
    }
    const sorted = [...dailyHistory].sort((a, b) =>
      String(a.date || "").localeCompare(String(b.date || ""))
    );
    const withChange = sorted.map((item, index) => {
      const prev = index > 0 ? sorted[index - 1] : null;
      return {
        date: item.date,
        total: Number(item.total) || 0,
        cash: Number(item.cash) || 0,
        emergency: Number(item.emergency) || 0,
        invested: Number(item.invested) || 0,
        change: prev ? (Number(item.total) || 0) - (Number(prev.total) || 0) : null,
        changePercent:
          prev && Number(prev.total)
            ? ((Number(item.total) || 0) - Number(prev.total)) / Number(prev.total)
            : null
      };
    });
    return withChange.slice(-5).reverse();
  }, [dailyHistory]);

  const holdingsCategories = useMemo(() => {
    if (holdingsView === "overall") {
      const set = new Set();
      portfolios.forEach((item) => {
        (item.categories || []).forEach((cat) => set.add(cat));
      });
      if (set.size === 0) {
        set.add("Stocks");
      }
      return Array.from(set);
    }
    if (localCategories.length) {
      return localCategories;
    }
    return ["Stocks"];
  }, [holdingsView, localCategories, portfolios]);

  const holdingsInstitutions = useMemo(() => {
    const set = new Set();
    holdingsItems.forEach((item) => {
      if (item.institution) {
        set.add(item.institution);
      }
    });
    return Array.from(set);
  }, [holdingsItems]);

  const renderOverview = () => (
    <>
      <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>MyPortfolios</Text>
            <View style={styles.subTabRow}>
              <TouchableOpacity
                style={[
                  styles.subTabButton,
                  portfolioView === "overview" && styles.subTabButtonActive
                ]}
                onPress={() => setPortfolioView("overview")}
              >
                <Text
                  style={[
                    styles.subTabText,
                    portfolioView === "overview" && styles.subTabTextActive
                  ]}
                >
                  Overview
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.subTabButton,
                  portfolioView === "imports" && styles.subTabButtonActive
                ]}
                onPress={() => setPortfolioView("imports")}
              >
                <Text
                  style={[
                    styles.subTabText,
                    portfolioView === "imports" && styles.subTabTextActive
                  ]}
                >
                  Portfolio Import Data
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.subTabButton,
                  portfolioView === "categories" && styles.subTabButtonActive
                ]}
                onPress={() => setPortfolioView("categories")}
              >
                <Text
                  style={[
                    styles.subTabText,
                    portfolioView === "categories" && styles.subTabTextActive
                  ]}
                >
                  Categories
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        {loadingDashboard ? <Text style={styles.subtitle}>Loading...</Text> : null}
        {dashboardError ? <Text style={styles.error}>{dashboardError}</Text> : null}
        {portfolios.length ? (
          <View style={styles.pillRow}>
            {portfolios.map((portfolio) => (
              <TouchableOpacity
                key={portfolio.id}
                style={[
                  styles.pill,
                  portfolio.id === activePortfolio?.id && styles.pillActive
                ]}
                onPress={() => setSelectedPortfolioId(portfolio.id)}
              >
                <Text
                  style={[
                    styles.pillText,
                    portfolio.id === activePortfolio?.id && styles.pillTextActive
                  ]}
                >
                  {portfolio.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text style={styles.subtitle}>
            No portfolios yet. Create one on the web app.
          </Text>
        )}
      </View>

      {portfolioView === "overview" ? (
        summary ? (
          <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <View style={styles.metricRow}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Portfolio current value</Text>
                <Text style={styles.metricValue}>
                  {formatCurrency(summary.total)}
                </Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Invested</Text>
                <Text style={styles.metricValue}>
                  {formatCurrency(summary.total_invested)}
                </Text>
              </View>
            </View>
            <View style={styles.metricRow}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Total profit</Text>
                <Text style={styles.metricValue}>
                  {formatCurrency(summary.total_profit)}
                </Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Profit %</Text>
                <Text style={styles.metricValue}>
                  {Number(summary.profit_percent || 0).toFixed(2)}%
                </Text>
              </View>
            </View>
            <View style={styles.metricRow}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>IRR</Text>
                <Text style={styles.metricValue}>
                  {summary.irr === null || summary.irr === undefined
                    ? "N/A"
                    : `${Number(summary.irr).toFixed(2)}%`}
                </Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Passive income</Text>
                <Text style={styles.metricValue}>N/A</Text>
              </View>
            </View>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>By category</Text>
            {Object.entries(summary.totals_by_category || {}).map(
              ([label, value]) => (
                <View style={styles.categoryRow} key={label}>
                  <Text style={styles.categoryLabel}>{label}</Text>
                  <Text style={styles.categoryValue}>
                    {formatCurrency(value)}
                  </Text>
                </View>
              )
            )}
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Portfolio evolution</Text>
            {historyLoading ? <Text style={styles.subtitle}>Loading...</Text> : null}
            {historyError ? <Text style={styles.error}>{historyError}</Text> : null}
            {historySeries.length > 1 ? (
              <Svg width={280} height={140}>
                <Path
                  d={historySeries
                    .map((item, index) => {
                      const width = 260;
                      const height = 100;
                      const padding = 10;
                      const range = historyRange.max - historyRange.min || 1;
                      const xStep =
                        historySeries.length > 1
                          ? width / (historySeries.length - 1)
                          : 0;
                      const x = padding + index * xStep;
                      const y =
                        padding +
                        (height -
                          ((item.total - historyRange.min) / range) * height);
                      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
                    })
                    .join(" ")}
                  stroke="#2ad68d"
                  strokeWidth={2}
                  fill="none"
                />
              </Svg>
            ) : (
              <Text style={styles.subtitle}>No history yet.</Text>
            )}
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Asset allocation</Text>
            {allocationTotal > 0 ? (
              <View style={styles.chartRow}>
                <Svg width={160} height={160}>
                  <G rotation={-90} origin="80, 80">
                    {allocationItems.reduce((acc, item, index) => {
                      const startAngle = acc.angle;
                      const sliceAngle = (item.value / allocationTotal) * Math.PI * 2;
                      const endAngle = startAngle + sliceAngle;
                      const radius = 60;
                      const center = 80;
                      const x1 = center + radius * Math.cos(startAngle);
                      const y1 = center + radius * Math.sin(startAngle);
                      const x2 = center + radius * Math.cos(endAngle);
                      const y2 = center + radius * Math.sin(endAngle);
                      const largeArc = sliceAngle > Math.PI ? 1 : 0;
                      const pathData = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
                      acc.paths.push(
                        <Path
                          key={`${item.label}-${index}`}
                          d={pathData}
                          fill={allocationColors[index % allocationColors.length]}
                        />
                      );
                      acc.angle = endAngle;
                      return acc;
                    }, {
                      angle: 0,
                      paths: []
                    }).paths}
                  </G>
                  <Circle cx="80" cy="80" r="38" fill="#0b1220" />
                </Svg>
                <View style={styles.legend}>
                  {allocationItems.map((item, index) => (
                    <View style={styles.legendRow} key={item.label}>
                      <View
                        style={[
                          styles.legendDot,
                          {
                            backgroundColor:
                              allocationColors[index % allocationColors.length]
                          }
                        ]}
                      />
                      <Text style={styles.legendLabel}>{item.label}</Text>
                      <Text style={styles.legendValue}>
                        {allocationTotal
                          ? `${((item.value / allocationTotal) * 100).toFixed(1)}%`
                          : "0%"}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <Text style={styles.subtitle}>No allocation data yet.</Text>
            )}
          </View>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Institutions breakdown</Text>
              <Text style={styles.metaText}>
                {institutions.length} institutions
              </Text>
            </View>
            {institutionsLoading ? (
              <Text style={styles.subtitle}>Loading...</Text>
            ) : null}
            {institutionsError ? (
              <Text style={styles.error}>{institutionsError}</Text>
            ) : null}
            {institutions.length ? (
              <View style={styles.table}>
                {institutions.map((item) => (
                  <TouchableOpacity
                    style={styles.tableRow}
                    key={item.institution}
                    onPress={() => openInstitutionDetail(item.institution)}
                  >
                    <View style={styles.tableCell}>
                      <View style={styles.institutionRow}>
                        {getInstitutionLogo(item.institution) ? (
                          <Image
                            source={getInstitutionLogo(item.institution)}
                            style={styles.institutionLogo}
                          />
                        ) : null}
                        <Text style={styles.tableTitle}>{item.institution}</Text>
                      </View>
                      <Text style={styles.metaText}>
                        Total: {formatCurrency(item.total)}
                      </Text>
                      <Text style={styles.metaText}>
                        Vs last month: {formatSigned(item.vs_last_month)}
                      </Text>
                      <Text style={styles.metaText}>
                        Profit %: {formatSignedPercent(item.profit_percent)}
                      </Text>
                      <Text style={styles.metaText}>
                        Beni:{" "}
                        {item.beni === null || item.beni === undefined
                          ? "-"
                          : formatCurrency(item.beni)}
                      </Text>
                      <Text style={styles.metaText}>
                        Magui:{" "}
                        {item.magui === null || item.magui === undefined
                          ? "-"
                          : formatCurrency(item.magui)}
                      </Text>
                    </View>
                    <View style={styles.tableCellRight}>
                      <Text style={styles.metaText}>Gains</Text>
                      <Text
                        style={[
                          styles.tableValue,
                          item.gains > 0
                            ? styles.posValue
                            : item.gains < 0
                            ? styles.negValue
                            : null
                        ]}
                      >
                        {formatSigned(item.gains)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.subtitle}>No institutions yet.</Text>
            )}
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Past days breakdown</Text>
            {historyLoading ? <Text style={styles.subtitle}>Loading...</Text> : null}
            {historyError ? <Text style={styles.error}>{historyError}</Text> : null}
            {pastRows.length ? (
              <View style={styles.table}>
                {pastRows.map((row) => (
                  <View style={styles.tableRow} key={row.date}>
                    <View style={styles.tableCell}>
                      <Text style={styles.tableTitle}>{row.date}</Text>
                      <Text style={styles.metaText}>
                        Total: {formatCurrency(row.total)}
                      </Text>
                      <Text style={styles.metaText}>
                        Change:{" "}
                        {row.change === null
                          ? "--"
                          : `${formatSigned(row.change)}${
                              row.changePercent === null
                                ? ""
                                : ` (${formatSignedPercent(row.changePercent * 100)})`
                            }`}
                      </Text>
                    </View>
                    <View style={styles.tableCellRight}>
                      <Text style={styles.metaText}>
                        Cash: {formatCurrency(row.cash)}
                      </Text>
                      <Text style={styles.metaText}>
                        Emergency: {formatCurrency(row.emergency)}
                      </Text>
                      <Text style={styles.metaText}>
                        Invested: {formatCurrency(row.invested)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.subtitle}>No snapshots yet.</Text>
            )}
          </View>
        </>
        ) : null
      ) : portfolioView === "imports" ? (
        renderImports()
      ) : (
        renderCategories()
      )}
    </>
  );

  const renderHoldings = () => {
    if (!activePortfolio && holdingsView === "portfolio") {
      return <Text style={styles.subtitle}>Select a portfolio first.</Text>;
    }
    const categoryOptions = ["All", ...holdingsCategories];
    const institutionOptions = ["All", ...holdingsInstitutions];
    const portfolioOptions = portfolios.map((item) => item.name);
    const sortedHoldings = [...holdingsItems].sort(
      (a, b) => Number(b.current_value || 0) - Number(a.current_value || 0)
    );
    const query = holdingsTicker.trim().toLowerCase();
    const filteredHoldings = query
      ? sortedHoldings.filter((item) => {
          const ticker = String(item.ticker || "").toLowerCase();
          const name = String(item.name || "").toLowerCase();
          return ticker.includes(query) || name.includes(query);
        })
      : sortedHoldings;

    const chartMap = new Map();
    filteredHoldings.forEach((item) => {
      const assetType = item.asset_type || getAssetType(item.category);
      const label =
        holdingsChartGroup === "ticker"
          ? item.ticker
          : holdingsChartGroup === "sector"
          ? item.sector || "Other"
          : holdingsChartGroup === "industry"
          ? item.industry || "Other"
          : holdingsChartGroup === "country"
          ? item.country || "Other"
          : holdingsChartGroup === "asset"
          ? assetType
          : "Other";
      const entry =
        chartMap.get(label) || {
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
      chartMap.set(label, entry);
    });
    const chartItems = Array.from(chartMap.values()).map((entry) => {
      const profitPercent = entry.costBasis
        ? (entry.profitValue / entry.costBasis) * 100
        : 0;
      const pricePercent = entry.avgPriceTotal
        ? ((entry.priceTotal - entry.avgPriceTotal) / entry.avgPriceTotal) * 100
        : 0;
      const value =
        holdingsChartMetric === "gain"
          ? entry.profitValue
          : holdingsChartMetric === "gain_pct"
          ? profitPercent
          : pricePercent;
      return {
        label: entry.label,
        value
      };
    });
    chartItems.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
    const maxChartValue = chartItems.length
      ? Math.max(...chartItems.map((item) => Math.abs(item.value)), 1)
      : 1;

    const handleSelectCategory = (value) => {
      setHoldingsCategory(value === "All" ? "" : value);
    };

    const handleSelectInstitution = (value) => {
      setHoldingsInstitution(value === "All" ? "" : value);
    };

    const handleSelectPortfolio = (value) => {
      const selected = portfolios.find((item) => item.name === value);
      if (selected) {
        setSelectedPortfolioId(selected.id);
      }
    };

    const getHoldingKey = (item) =>
      `${item.ticker || ""}-${item.institution || ""}-${item.category || ""}-${
        item.portfolio_id || ""
      }`;

    const ensureMetaDraft = (key, item) => {
      setHoldingMetaDrafts((current) => {
        if (current[key]) {
          return current;
        }
        return {
          ...current,
          [key]: {
            sector: item.sector || "",
            industry: item.industry || "",
            country: item.country || "",
            asset_type: item.asset_type || getAssetType(item.category)
          }
        };
      });
    };

    const updateMetaDraft = (key, changes) => {
      setHoldingMetaDrafts((current) => ({
        ...current,
        [key]: { ...(current[key] || {}), ...changes }
      }));
    };

    const handleMetaSave = async (key, item) => {
      const draft = holdingMetaDrafts[key];
      if (!draft) {
        return;
      }
      const portfolioId = item.portfolio_id || activePortfolio?.id;
      if (!portfolioId) {
        setHoldingMetaError("Select a portfolio first.");
        return;
      }
      setHoldingMetaSavingKey(key);
      setHoldingMetaError("");
      setHoldingMetaMessage("");
      try {
        await authJson(`/portfolios/${portfolioId}/holdings/metadata`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            ticker: item.ticker,
            sector: draft.sector,
            industry: draft.industry,
            country: draft.country,
            asset_type: draft.asset_type
          })
        });
        setHoldingMetaMessage("Holding details saved.");
        await loadHoldings(activePortfolio?.id);
      } catch (err) {
        setHoldingMetaError("Unable to save holding details.");
      } finally {
        setHoldingMetaSavingKey(null);
      }
    };

    return (
      <>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Investments</Text>
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleHoldingsRefresh}>
              <Text style={styles.secondaryBtnText}>Update all</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.metaText}>
            Total value: {formatCurrency(holdingsTotal)}
          </Text>
          {holdingsMessage ? <Text style={styles.message}>{holdingsMessage}</Text> : null}
          {holdingsError ? <Text style={styles.error}>{holdingsError}</Text> : null}
          {holdingMetaMessage ? <Text style={styles.message}>{holdingMetaMessage}</Text> : null}
          {holdingMetaError ? <Text style={styles.error}>{holdingMetaError}</Text> : null}

          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                holdingsView === "portfolio" && styles.tabButtonActive
              ]}
              onPress={() => setHoldingsView("portfolio")}
            >
              <Text
                style={[
                  styles.tabText,
                  holdingsView === "portfolio" && styles.tabTextActive
                ]}
              >
                By portfolio
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabButton,
                holdingsView === "overall" && styles.tabButtonActive
              ]}
              onPress={() => setHoldingsView("overall")}
            >
              <Text
                style={[
                  styles.tabText,
                  holdingsView === "overall" && styles.tabTextActive
                ]}
              >
                Portfolio overall
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.filterRow}>
            {holdingsView === "portfolio" && portfolioOptions.length ? (
              <View style={styles.filterBlock}>
                <Text style={styles.metaText}>Portfolio</Text>
                <CategoryPicker
                  value={activePortfolio?.name || portfolioOptions[0]}
                  options={portfolioOptions}
                  onChange={handleSelectPortfolio}
                />
              </View>
            ) : null}
            <View style={styles.filterBlock}>
              <Text style={styles.metaText}>Category</Text>
              <CategoryPicker
                value={holdingsCategory || "All"}
                options={categoryOptions}
                onChange={handleSelectCategory}
              />
            </View>
            <View style={styles.filterBlock}>
              <Text style={styles.metaText}>Institution</Text>
              <CategoryPicker
                value={holdingsInstitution || "All"}
                options={institutionOptions}
                onChange={handleSelectInstitution}
              />
            </View>
          </View>
          <View style={styles.filterBlock}>
            <Text style={styles.metaText}>Ticker</Text>
            <TextInput
              style={styles.input}
              placeholder="Search ticker"
              placeholderTextColor="#6f7f96"
              value={holdingsTicker}
              onChangeText={setHoldingsTicker}
            />
          </View>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.sectionTitle}>Holdings performance</Text>
          <Text style={styles.metaText}>Group by</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {[
                { key: "ticker", label: "Ticker" },
                { key: "sector", label: "Sector" },
                { key: "industry", label: "Industry" },
                { key: "country", label: "Country" },
                { key: "asset", label: "Assets Type" }
              ].map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.chip,
                    holdingsChartGroup === item.key && styles.chipActive
                  ]}
                  onPress={() => setHoldingsChartGroup(item.key)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      holdingsChartGroup === item.key && styles.chipTextActive
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <Text style={styles.metaText}>Metric</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {[
                { key: "gain", label: "Gain (Value)" },
                { key: "gain_pct", label: "Gain (%)" },
                { key: "price_pct", label: "Price (%)" }
              ].map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.chip,
                    holdingsChartMetric === item.key && styles.chipActive
                  ]}
                  onPress={() => setHoldingsChartMetric(item.key)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      holdingsChartMetric === item.key && styles.chipTextActive
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <Text style={styles.metaText}>Range</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {[
                "1d",
                "1w",
                "1m",
                "3m",
                "6m",
                "ytd",
                "1y",
                "All"
              ].map((label) => (
                <TouchableOpacity
                  key={label}
                  style={[
                    styles.chip,
                    holdingsChartRange === label.toLowerCase() && styles.chipActive
                  ]}
                  onPress={() =>
                    setHoldingsChartRange(label.toLowerCase())
                  }
                >
                  <Text
                    style={[
                      styles.chipText,
                      holdingsChartRange === label.toLowerCase() &&
                        styles.chipTextActive
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <View style={styles.chartBody}>
            {chartItems.length === 0 ? (
              <Text style={styles.subtitle}>No chart data yet.</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chartBars}>
                  {chartItems.map((item) => {
                    const height = (Math.abs(item.value) / maxChartValue) * 100;
                    const isPositive = item.value >= 0;
                    return (
                      <View style={styles.chartBar} key={item.label}>
                        <View style={styles.chartBarStack}>
                          <View style={styles.chartBarPos}>
                            {isPositive ? (
                              <View
                                style={[
                                  styles.chartBarFill,
                                  styles.chartBarFillPos,
                                  { height: `${height}%` }
                                ]}
                              />
                            ) : null}
                          </View>
                          <View style={styles.chartBarNeg}>
                            {!isPositive ? (
                              <View
                                style={[
                                  styles.chartBarFill,
                                  styles.chartBarFillNeg,
                                  { height: `${height}%` }
                                ]}
                              />
                            ) : null}
                          </View>
                        </View>
                        <Text style={styles.chartLabel} numberOfLines={1}>
                          {item.label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.tooltipRow}>
            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  "Cost basis",
                  "Cost basis is the total cost of the position: shares x average buy price."
                )
              }
            >
              <Text style={styles.linkText}>Cost basis ?</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  "Current value",
                  "Current value uses the latest price times shares."
                )
              }
            >
              <Text style={styles.linkText}>Current value ?</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  "Total profit",
                  "Total profit is current value minus cost basis."
                )
              }
            >
              <Text style={styles.linkText}>Total profit ?</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  "Share in portfolio",
                  "Share in portfolio is current value divided by total holdings."
                )
              }
            >
              <Text style={styles.linkText}>Share ?</Text>
            </TouchableOpacity>
          </View>

          {holdingsLoading ? <Text style={styles.subtitle}>Loading...</Text> : null}
          {!holdingsLoading && filteredHoldings.length === 0 ? (
            <Text style={styles.subtitle}>No holdings yet.</Text>
          ) : null}
          {filteredHoldings.map((item) => {
            const key = getHoldingKey(item);
            const isExpanded = expandedHoldingKey === key;
            const metaDraft = holdingMetaDrafts[key] || {
              sector: item.sector || "",
              industry: item.industry || "",
              country: item.country || "",
              asset_type: item.asset_type || getAssetType(item.category)
            };
            return (
              <TouchableOpacity
                key={key}
                style={styles.holdingCard}
                onPress={() => {
                  const nextKey = isExpanded ? null : key;
                  setExpandedHoldingKey(nextKey);
                  if (!isExpanded) {
                    ensureMetaDraft(key, item);
                  }
                }}
                activeOpacity={0.85}
              >
                <View style={styles.holdingHeader}>
                  <View style={styles.holdingInfo}>
                    <Text style={styles.previewTitle}>
                      {item.ticker} {item.name ? `- ${item.name}` : ""}
                    </Text>
                    {item.institution ? (
                      <Text style={styles.metaText}>
                        {item.institution}
                        {item.category ? ` - ${item.category}` : ""}
                      </Text>
                    ) : item.category ? (
                      <Text style={styles.metaText}>{item.category}</Text>
                    ) : null}
                  </View>
                  <View style={styles.holdingRight}>
                    <Text style={styles.metaText}>
                      {formatCurrency(item.current_value || 0)}
                    </Text>
                    <Text
                      style={[
                        styles.metaText,
                        item.profit_value >= 0 ? styles.posValue : styles.negValue
                      ]}
                    >
                      {formatSigned(item.profit_value || 0)}
                    </Text>
                    <Text style={styles.holdingChevron}>{isExpanded ? "v" : ">"}</Text>
                  </View>
                </View>
                {holdingsView === "overall" && item.portfolio_name ? (
                  <Text style={styles.metaText}>Portfolio: {item.portfolio_name}</Text>
                ) : null}
                {isExpanded ? (
                  <View style={styles.holdingDetails}>
                    <View style={styles.previewRow}>
                      <Text style={styles.metaText}>Shares</Text>
                      <Text style={styles.metaText}>
                        {Number(item.shares || 0).toFixed(4)}
                      </Text>
                    </View>
                    <View style={styles.previewRow}>
                      <Text style={styles.metaText}>Cost basis</Text>
                      <Text style={styles.metaText}>
                        {formatCurrency(item.cost_basis || 0)}
                      </Text>
                    </View>
                    <View style={styles.previewRow}>
                      <Text style={styles.metaText}>Current value</Text>
                      <Text style={styles.metaText}>
                        {formatCurrency(item.current_value || 0)}
                      </Text>
                    </View>
                    <View style={styles.previewRow}>
                      <Text style={styles.metaText}>Total profit</Text>
                      <Text
                        style={[
                          styles.metaText,
                          item.profit_value >= 0 ? styles.posValue : styles.negValue
                        ]}
                      >
                        {formatSigned(item.profit_value || 0)}
                        {item.profit_percent !== null &&
                        item.profit_percent !== undefined
                          ? ` (${formatSignedPercent(item.profit_percent)})`
                          : ""}
                      </Text>
                    </View>
                    <View style={styles.previewRow}>
                      <Text style={styles.metaText}>Share in portfolio</Text>
                      <Text style={styles.metaText}>
                        {Number(item.share_percent || 0).toFixed(2)}%
                      </Text>
                    </View>
                    <View style={styles.holdingMeta}>
                      <Text style={styles.metaText}>Sector</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Sector"
                        placeholderTextColor="#6f7f96"
                        value={metaDraft.sector}
                        onChangeText={(value) =>
                          updateMetaDraft(key, { sector: value })
                        }
                      />
                      <Text style={styles.metaText}>Industry</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Industry"
                        placeholderTextColor="#6f7f96"
                        value={metaDraft.industry}
                        onChangeText={(value) =>
                          updateMetaDraft(key, { industry: value })
                        }
                      />
                      <Text style={styles.metaText}>Country</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Country"
                        placeholderTextColor="#6f7f96"
                        value={metaDraft.country}
                        onChangeText={(value) =>
                          updateMetaDraft(key, { country: value })
                        }
                      />
                      <Text style={styles.metaText}>Asset type</Text>
                      <CategoryPicker
                        value={metaDraft.asset_type}
                        options={assetTypeOptions}
                        onChange={(value) =>
                          updateMetaDraft(key, { asset_type: value })
                        }
                      />
                      <TouchableOpacity
                        style={styles.secondaryBtn}
                        onPress={() => handleMetaSave(key, item)}
                        disabled={holdingMetaSavingKey === key}
                      >
                        <Text style={styles.secondaryBtnText}>
                          {holdingMetaSavingKey === key ? "Saving..." : "Save details"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.importCard}>
          <View style={styles.importHeader}>
            <View>
              <Text style={styles.importTitle}>Add transaction</Text>
              <Text style={styles.subtitle}>Manual buy or sell operations.</Text>
            </View>
          </View>
          {holdingMessage ? <Text style={styles.message}>{holdingMessage}</Text> : null}
          {holdingError ? <Text style={styles.error}>{holdingError}</Text> : null}
          <TextInput
            style={styles.input}
            placeholder="Ticker"
            placeholderTextColor="#6f7f96"
            value={holdingTicker}
            onChangeText={setHoldingTicker}
          />
          <TextInput
            style={styles.input}
            placeholder="Company"
            placeholderTextColor="#6f7f96"
            value={holdingCompany}
            onChangeText={setHoldingCompany}
          />
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                holdingOperation === "buy" && styles.tabButtonActive
              ]}
              onPress={() => setHoldingOperation("buy")}
            >
              <Text
                style={[
                  styles.tabText,
                  holdingOperation === "buy" && styles.tabTextActive
                ]}
              >
                Buy
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabButton,
                holdingOperation === "sell" && styles.tabButtonActive
              ]}
              onPress={() => setHoldingOperation("sell")}
            >
              <Text
                style={[
                  styles.tabText,
                  holdingOperation === "sell" && styles.tabTextActive
                ]}
              >
                Sell
              </Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Date (YYYY-MM-DD)"
            placeholderTextColor="#6f7f96"
            value={holdingDate}
            onChangeText={setHoldingDate}
          />
          <TextInput
            style={styles.input}
            placeholder="Shares"
            placeholderTextColor="#6f7f96"
            value={holdingShares}
            onChangeText={setHoldingShares}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Price"
            placeholderTextColor="#6f7f96"
            value={holdingPrice}
            onChangeText={setHoldingPrice}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Fee (optional)"
            placeholderTextColor="#6f7f96"
            value={holdingFee}
            onChangeText={setHoldingFee}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Note (optional)"
            placeholderTextColor="#6f7f96"
            value={holdingNote}
            onChangeText={setHoldingNote}
          />
          <View style={styles.filterBlock}>
            <Text style={styles.metaText}>Category</Text>
            <CategoryPicker
              value={holdingCategory}
              options={holdingsCategories}
              onChange={setHoldingCategory}
            />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Institution (optional)"
            placeholderTextColor="#6f7f96"
            value={holdingInstitution}
            onChangeText={setHoldingInstitution}
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => handleSaveHoldingTransaction(true)}
              disabled={holdingSaving}
            >
              <Text style={styles.secondaryBtnText}>
                {holdingSaving ? "Saving..." : "Save and add more"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => handleSaveHoldingTransaction(false)}
              disabled={holdingSaving}
            >
              <Text style={styles.primaryText}>
                {holdingSaving ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  };

  const renderBanking = () => {
    if (!activePortfolio) {
      return <Text style={styles.subtitle}>Select a portfolio first.</Text>;
    }
    const categoryOptions = [
      "All",
      ...bankingCategories.map((item) => item.name)
    ];
    const subcategoryOptions = bankingCategory
      ? bankingCategories.find((item) => item.name === bankingCategory)
          ?.subcategories?.length
        ? bankingCategories.find((item) => item.name === bankingCategory)
            ?.subcategories || []
        : [bankingCategory]
      : [];
    const institutionOptions = ["All", ...bankingInstitutions];
    const mappingOptions = bankingMappingOptions.map((option) => option.value);
    const bankingCategoryGroups = bankingCategories.map((entry) => ({
      name: entry.name,
      subcategories: entry.subcategories?.length
        ? entry.subcategories
        : [entry.name]
    }));

    return (
      <>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Banking Transactions</Text>
          <Text style={styles.subtitle}>
            Import transactions and classify them.
          </Text>
        </View>

        <View style={styles.importCard}>
          <View style={styles.importHeader}>
            <View>
              <Text style={styles.importTitle}>Import transactions</Text>
              <Text style={styles.subtitle}>
                Upload a file or paste data.
              </Text>
            </View>
          </View>
          <View style={styles.bankingSplit}>
            <View style={styles.bankingSplitBlock}>
              <Text style={styles.metaText}>Institution</Text>
              <CategoryPicker
                value={bankingInstitutionSelect || "Select"}
                options={["Select", ...bankingInstitutions, "Custom"]}
                onChange={(value) => {
                  setBankingInstitutionSelect(value);
                  if (value && value !== "Custom" && value !== "Select") {
                    setBankingInstitutionInput(value);
                  } else if (value === "Custom") {
                    setBankingInstitutionInput("");
                  } else {
                    setBankingInstitutionInput("");
                  }
                }}
              />
              {bankingInstitutionSelect === "Custom" ? (
                <TextInput
                  style={styles.input}
                  placeholder="Custom institution"
                  placeholderTextColor="#6f7f96"
                  value={bankingInstitutionInput}
                  onChangeText={setBankingInstitutionInput}
                />
              ) : null}
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={async () => {
                  const file = await pickBankingFile();
                  if (!file) {
                    return;
                  }
                  setBankingFile(file);
                }}
              >
                <Text style={styles.secondaryBtnText}>Choose file</Text>
              </TouchableOpacity>
              {bankingFile ? (
                <Text style={styles.metaText}>File: {bankingFile.name}</Text>
              ) : null}
            </View>
            <View style={styles.bankingSplitBlock}>
              <Text style={styles.metaText}>Paste data</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Ctrl+V..."
                placeholderTextColor="#6f7f96"
                value={bankingPaste}
                onChangeText={setBankingPaste}
                multiline
              />
            </View>
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={handleBankingPreview}
              disabled={bankingPreviewing}
            >
              <Text style={styles.secondaryBtnText}>
                {bankingPreviewing ? "Previewing..." : "Preview"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleBankingCommit}
              disabled={bankingImporting}
            >
              <Text style={styles.primaryText}>
                {bankingImporting ? "Importing..." : "Import"}
              </Text>
            </TouchableOpacity>
          </View>
          {bankingError ? <Text style={styles.error}>{bankingError}</Text> : null}
          {bankingMessage ? (
            <Text style={styles.message}>{bankingMessage}</Text>
          ) : null}
        </View>

        {bankingPreview ? (
          <View style={styles.importCard}>
            <View style={styles.importHeader}>
              <View>
                <Text style={styles.importTitle}>Preview</Text>
                <Text style={styles.subtitle}>{bankingPreview.source_file}</Text>
              </View>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => setBankingShowMapping((value) => !value)}
              >
                <Text style={styles.secondaryBtnText}>
                  {bankingShowMapping ? "Hide mapping" : "Edit mapping"}
                </Text>
              </TouchableOpacity>
            </View>
            {bankingPreview.warnings?.length ? (
              <View style={styles.noticeBox}>
                <Text style={styles.noticeText}>
                  {`Rows: ${bankingPreview.rows.length} - Valid: ${
                    bankingPreview.rows.length -
                    bankingPreview.warnings.length
                  } - Skipped: ${bankingPreview.warnings.length}`}
                </Text>
                <TouchableOpacity
                  style={styles.linkBtn}
                  onPress={() => setBankingShowWarnings((value) => !value)}
                >
                  <Text style={styles.linkText}>
                    {bankingShowWarnings ? "Hide details" : "Show details"}
                  </Text>
                </TouchableOpacity>
                {bankingShowWarnings
                  ? bankingPreview.warnings.map((warning, index) => (
                      <Text
                        style={styles.noticeText}
                        key={`${warning}-${index}`}
                      >
                        {warning}
                      </Text>
                    ))
                  : null}
              </View>
            ) : null}
            {bankingShowMapping ? (
              <>
                <Text style={styles.metaText}>Column mapping</Text>
                {bankingPreview.columns?.map((column, index) => (
                  <View style={styles.previewRow} key={`${column}-${index}`}>
                    <View style={styles.previewInfo}>
                      <Text style={styles.previewTitle}>
                        {column || `Column ${index + 1}`}
                      </Text>
                    </View>
                    <CategoryPicker
                      value={bankingMapping[index] || "ignore"}
                      options={mappingOptions}
                      onChange={(value) =>
                        handleBankingMappingChange(index, value)
                      }
                    />
                  </View>
                ))}
              </>
            ) : null}
            <Text style={styles.metaText}>Rows</Text>
            {bankingPreview.rows?.slice(0, 20).map((row, index) => (
              <View style={styles.previewRow} key={`row-${index}`}>
                <View style={styles.previewInfo}>
                  <Text style={styles.metaText} numberOfLines={1}>
                    {row.cells
                      .map((cell) => (cell === null ? "" : String(cell)))
                      .join(" | ")}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.ignoreBtn,
                    !row.include && styles.ignoreBtnActive
                  ]}
                  onPress={() => handleBankingRowToggle(index)}
                >
                  <Text style={styles.ignoreText}>
                    {row.include ? "Include" : "Ignore"}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.importCard}>
          <View style={styles.importHeader}>
            <View>
              <Text style={styles.importTitle}>Transactions summary</Text>
              <Text style={styles.subtitle}>
                Income, expenses, and top category.
              </Text>
            </View>
          </View>
          <View style={styles.metricRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Income</Text>
              <Text style={styles.metricValue}>
                {formatCurrency(bankingSummary.income)}
              </Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Expenses</Text>
              <Text style={styles.metricValue}>
                {formatCurrency(bankingSummary.expenses)}
              </Text>
            </View>
          </View>
          <View style={styles.metricRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Net</Text>
              <Text style={styles.metricValue}>
                {formatCurrency(bankingSummary.net)}
              </Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Top category</Text>
              <Text style={styles.metricValue}>
                {bankingSummary.topCategory}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.importCard}>
          <View style={styles.importHeader}>
            <View>
              <Text style={styles.importTitle}>Transaction analytics</Text>
              <Text style={styles.subtitle}>
                Spending by category and monthly net.
              </Text>
            </View>
          </View>
          <Text style={styles.metaText}>Spending by category</Text>
          {bankingExpenseByCategory.length ? (
            bankingExpenseByCategory.map((item) => {
              const maxValue =
                bankingExpenseByCategory[0]?.value || item.value || 1;
              const width = Math.max(
                6,
                Math.round((item.value / maxValue) * 100)
              );
              return (
                <View style={styles.barRow} key={`banking-cat-${item.label}`}>
                  <Text style={styles.barLabel}>{item.label}</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        styles.barFillPos,
                        { width: `${width}%` }
                      ]}
                    />
                  </View>
                  <Text style={styles.barValue}>
                    {formatCurrency(item.value)}
                  </Text>
                </View>
              );
            })
          ) : (
            <Text style={styles.subtitle}>No chart data yet.</Text>
          )}
          <Text style={styles.metaText}>Monthly net</Text>
          {bankingMonthlyNet.length ? (
            bankingMonthlyNet.map((item) => {
              const maxValue = Math.max(
                ...bankingMonthlyNet.map((entry) => Math.abs(entry.net)),
                1
              );
              const width = Math.max(
                6,
                Math.round((Math.abs(item.net) / maxValue) * 100)
              );
              return (
                <View style={styles.barRow} key={`banking-month-${item.month}`}>
                  <Text style={styles.barLabel}>{item.month}</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        item.net >= 0 ? styles.barFillPos : styles.barFillNeg,
                        { width: `${width}%` }
                      ]}
                    />
                  </View>
                  <Text style={styles.barValue}>
                    {formatCurrency(item.net)}
                  </Text>
                </View>
              );
            })
          ) : (
            <Text style={styles.subtitle}>No chart data yet.</Text>
          )}
        </View>

        <View style={styles.importCard}>
          <View style={styles.importHeader}>
            <View>
              <Text style={styles.importTitle}>Budgets</Text>
              <Text style={styles.subtitle}>
                Set monthly limits per category.
              </Text>
            </View>
          </View>
          <View style={styles.bankingEditRow}>
            <View style={styles.bankingEditBlock}>
              <Text style={styles.metaText}>Month</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM"
                placeholderTextColor="#6f7f96"
                value={bankingBudgetMonth}
                onChangeText={setBankingBudgetMonth}
              />
            </View>
            <View style={styles.bankingEditBlock}>
              <Text style={styles.metaText}>Category</Text>
              <CategoryPicker
                value={bankingBudgetCategory || "Select"}
                options={[
                  "Select",
                  ...bankingCategories.map((item) => item.name)
                ]}
                onChange={(value) =>
                  setBankingBudgetCategory(value === "Select" ? "" : value)
                }
              />
            </View>
            <View style={styles.bankingEditBlock}>
              <Text style={styles.metaText}>Amount</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor="#6f7f96"
                keyboardType="decimal-pad"
                value={bankingBudgetAmount}
                onChangeText={setBankingBudgetAmount}
              />
            </View>
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleBankingBudgetSave}
              disabled={bankingBudgetsLoading}
            >
              <Text style={styles.primaryText}>
                {bankingBudgetsLoading ? "Saving..." : "Save budget"}
              </Text>
            </TouchableOpacity>
          </View>
          {bankingBudgetsError ? (
            <Text style={styles.error}>{bankingBudgetsError}</Text>
          ) : null}
          {bankingBudgetsLoading ? (
            <Text style={styles.subtitle}>Loading...</Text>
          ) : bankingBudgets.length ? (
            bankingBudgets.map((budget) => {
              const percentValue = Number.isFinite(budget.percent)
                ? budget.percent
                : 0;
              const percent = Math.min(100, percentValue);
              const fillStyle =
                budget.percent >= 100
                  ? styles.barFillDanger
                  : budget.percent >= 90
                  ? styles.barFillWarn
                  : budget.percent >= 70
                  ? styles.barFillCaution
                  : styles.barFillPos;
              return (
                <View style={styles.budgetRow} key={`budget-${budget.id}`}>
                  <View style={styles.previewInfo}>
                    <Text style={styles.previewTitle}>{budget.category}</Text>
                    <Text style={styles.metaText}>
                      Spent: {formatCurrency(budget.spent)}
                    </Text>
                    <Text style={styles.metaText}>
                      Budget: {formatCurrency(budget.amount)}
                    </Text>
                    <Text style={styles.metaText}>
                      Remaining: {formatCurrency(budget.remaining)}
                    </Text>
                  </View>
                  <View style={styles.budgetProgress}>
                    <View style={styles.barTrack}>
                      <View
                        style={[styles.barFill, fillStyle, { width: `${percent}%` }]}
                      />
                    </View>
                    <Text style={styles.metaText}>
                      {percentValue.toFixed(2)}%
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.dangerBtn}
                    onPress={() => handleBankingBudgetDelete(budget.id)}
                  >
                    <Text style={styles.dangerText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          ) : (
            <Text style={styles.subtitle}>No budgets yet.</Text>
          )}
        </View>

        <View style={styles.importCard}>
          <View style={styles.importHeader}>
            <View>
              <Text style={styles.importTitle}>Transactions</Text>
              <Text style={styles.subtitle}>Filter and review imports.</Text>
            </View>
            <TouchableOpacity style={styles.dangerBtn} onPress={handleBankingClear}>
              <Text style={styles.dangerText}>Clear</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.filterRow}>
            <View style={styles.filterBlock}>
              <Text style={styles.metaText}>Month</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM"
                placeholderTextColor="#6f7f96"
                value={bankingMonth}
                onChangeText={setBankingMonth}
              />
            </View>
            <View style={styles.filterBlock}>
              <Text style={styles.metaText}>Category</Text>
              <CategoryPicker
                value={bankingCategory || "All"}
                options={categoryOptions}
                onChange={(value) => {
                  const next = value === "All" ? "" : value;
                  setBankingCategory(next);
                  setBankingSubcategory("");
                }}
              />
            </View>
            <View style={styles.filterBlock}>
              <Text style={styles.metaText}>Subcategory</Text>
              <CategoryPicker
                value={bankingSubcategory || "All"}
                options={
                  subcategoryOptions.length
                    ? ["All", ...subcategoryOptions]
                    : ["All"]
                }
                onChange={(value) =>
                  setBankingSubcategory(value === "All" ? "" : value)
                }
              />
            </View>
            <View style={styles.filterBlock}>
              <Text style={styles.metaText}>Institution</Text>
              <CategoryPicker
                value={bankingInstitutionFilter || "All"}
                options={institutionOptions}
                onChange={(value) =>
                  setBankingInstitutionFilter(value === "All" ? "" : value)
                }
              />
            </View>
          </View>
          {bankingLoading ? <Text style={styles.subtitle}>Loading...</Text> : null}
          {bankingError ? <Text style={styles.error}>{bankingError}</Text> : null}
          {!bankingLoading && bankingTransactions.length === 0 ? (
            <Text style={styles.subtitle}>No transactions yet.</Text>
          ) : null}
          {bankingTransactions.map((item, index) => {
            const rowGroups = bankingCategoryGroups.some(
              (entry) => entry.name === item.category
            )
              ? bankingCategoryGroups
              : [
                  ...bankingCategoryGroups,
                  {
                    name: item.category || BANKING_DEFAULT_CATEGORY,
                    subcategories: [
                      item.subcategory === BANKING_DEFAULT_SUBCATEGORY
                        ? item.category || BANKING_DEFAULT_CATEGORY
                        : item.subcategory ||
                          item.category ||
                          BANKING_DEFAULT_SUBCATEGORY
                    ]
                  }
                ];
            const selectedCategory = item.category || BANKING_DEFAULT_CATEGORY;
            const normalizedSubcategory =
              item.subcategory === BANKING_DEFAULT_SUBCATEGORY
                ? ""
                : item.subcategory;
            const selectedGroup = rowGroups.find(
              (entry) => entry.name === selectedCategory
            );
            const selectedSubcategory = selectedGroup?.subcategories?.includes(
              normalizedSubcategory
            )
              ? normalizedSubcategory
              : selectedGroup?.subcategories?.[0] ||
                normalizedSubcategory ||
                BANKING_DEFAULT_SUBCATEGORY;
            const isUpdating = bankingUpdatingId === item.id;
            return (
              <View style={styles.previewBlock} key={item.id || `${item.tx_date}-${index}`}>
                <Text style={styles.previewTitle}>
                  {item.tx_date} - {item.institution}
                </Text>
                <Text style={styles.metaText}>{item.description}</Text>
                <Text
                  style={[
                    styles.metaText,
                    item.amount < 0 ? styles.negValue : styles.posValue
                  ]}
                >
                  {formatCurrency(item.amount)}
                </Text>
                <View style={styles.bankingEditRow}>
                  <View style={styles.bankingEditBlock}>
                    <Text style={styles.metaText}>Category</Text>
                    <BankingCategoryPicker
                      value={{
                        category: selectedCategory,
                        subcategory: selectedSubcategory
                      }}
                      groups={rowGroups}
                      onChange={(category, subcategory) => {
                        if (isUpdating) {
                          return;
                        }
                        handleBankingCategoryUpdate(item.id, category, subcategory);
                      }}
                    />
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </>
    );
  };

  const renderGoals = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>MyGoals</Text>
      <Text style={styles.subtitle}>Coming soon.</Text>
    </View>
  );

  const renderCategories = () => {
    if (!activePortfolio) {
      return <Text style={styles.subtitle}>Select a portfolio first.</Text>;
    }
    return (
      <View style={styles.importCard}>
        <View style={styles.importHeader}>
          <View>
            <Text style={styles.importTitle}>Asset categories</Text>
            <Text style={styles.subtitle}>
              Add categories for mapping. Remove if needed.
            </Text>
          </View>
        </View>
        <View style={styles.categoryManageRow}>
          <TextInput
            style={styles.input}
            placeholder="New category"
            placeholderTextColor="#6f7f96"
            value={categoryInput}
            onChangeText={setCategoryInput}
          />
          <TouchableOpacity style={styles.secondaryBtn} onPress={handleAddCategory}>
            <Text style={styles.secondaryBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
        {categoryMessage ? <Text style={styles.message}>{categoryMessage}</Text> : null}
        {categoryError ? <Text style={styles.error}>{categoryError}</Text> : null}
        {settingsError ? <Text style={styles.error}>{settingsError}</Text> : null}
        <View style={styles.categoryList}>
          {localCategories.map((category) => (
            <View style={styles.categoryTag} key={category}>
              <Text style={styles.categoryTagText}>{category}</Text>
              <TouchableOpacity
                style={styles.removeTagBtn}
                onPress={() => handleRemoveCategory(category)}
              >
                <Text style={styles.removeTagText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
        <View style={styles.categorySettings}>
          <Text style={styles.subtitle}>
            Mark categories that should count as investments.
          </Text>
          {localCategories.map((category) => {
            const fallback = category.toLowerCase() !== "cash";
            const value =
              categorySettings[category] ??
              categorySettings[category.trim()] ??
              fallback;
            return (
              <View style={styles.categorySettingRow} key={`${category}-setting`}>
                <Text style={styles.categorySettingLabel}>{category}</Text>
                <View style={styles.categorySettingControl}>
                  <Switch
                    value={value}
                    onValueChange={(nextValue) =>
                      updateCategorySetting(category, nextValue)
                    }
                    thumbColor={value ? "#2ad68d" : "#39455f"}
                    trackColor={{ true: "#1f8b62", false: "#233048" }}
                  />
                  <Text style={styles.categorySettingText}>Investment</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderImports = () => {
    if (!activePortfolio) {
      return <Text style={styles.subtitle}>Select a portfolio first.</Text>;
    }

    return (
      <>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Import snapshots</Text>
          <Text style={styles.subtitle}>Use the same flows as the web app.</Text>
        </View>

        <View style={styles.importCard}>
          <View style={styles.importHeader}>
            <View>
              <Text style={styles.importTitle}>Santander</Text>
              <Text style={styles.subtitle}>Upload Excel and map categories.</Text>
            </View>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={async () => {
                const files = await pickFiles({ multiple: false });
                if (!files.length) {
                  return;
                }
                setSantanderFile(files[0]);
                setSantanderItems([]);
                setSantanderWarnings([]);
                handleSantanderPreview(files[0]);
              }}
            >
              <Text style={styles.secondaryBtnText}>Choose file</Text>
            </TouchableOpacity>
          </View>
          {santanderFile ? (
            <Text style={styles.metaText}>File: {santanderFile.name}</Text>
          ) : null}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => handleSantanderPreview()}
              disabled={santanderPreviewing}
            >
              <Text style={styles.secondaryBtnText}>
                {santanderPreviewing ? "Previewing..." : "Preview"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleSantanderCommit}
              disabled={santanderSaving}
            >
              <Text style={styles.primaryText}>
                {santanderSaving ? "Saving..." : "Save import"}
              </Text>
            </TouchableOpacity>
          </View>
          {santanderError ? <Text style={styles.error}>{santanderError}</Text> : null}
          {santanderMessage ? (
            <Text style={styles.message}>{santanderMessage}</Text>
          ) : null}
          {santanderWarnings.length ? (
            <View style={styles.noticeBox}>
              {santanderWarnings.map((warning, index) => (
                <Text style={styles.noticeText} key={`${warning}-${index}`}>
                  {warning}
                </Text>
              ))}
            </View>
          ) : null}
          {santanderItems.map((item, index) => (
            <View style={styles.previewRow} key={`${item.section}-${item.account}-${index}`}>
              <View style={styles.previewInfo}>
                <Text style={styles.previewTitle}>{item.account}</Text>
                {item.description ? (
                  <Text style={styles.metaText}>{item.description}</Text>
                ) : null}
                <Text style={styles.metaText}>{formatCurrency(item.balance)}</Text>
              </View>
              <CategoryPicker
                value={item.category}
                options={categoryOptions}
                onChange={(value) => updateSantanderItem(index, { category: value })}
              />
              {item.category === "Unknown" ? (
                <TouchableOpacity
                  style={[
                    styles.ignoreBtn,
                    item.ignore ? styles.ignoreBtnActive : null
                  ]}
                  onPress={() => updateSantanderItem(index, { ignore: !item.ignore })}
                >
                  <Text style={styles.ignoreText}>
                    {item.ignore ? "Ignored" : "Ignore"}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ))}
        </View>

        <View style={styles.importCard}>
          <View style={styles.importHeader}>
            <View>
              <Text style={styles.importTitle}>XTB</Text>
              <Text style={styles.subtitle}>Upload broker files (multi).</Text>
            </View>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={async () => {
                const files = await pickFiles({ multiple: true });
                if (!files.length) {
                  return;
                }
                setXtbFiles(files);
                setXtbItems([]);
                setXtbHoldings([]);
                setXtbWarnings([]);
                handleXtbPreview(files);
              }}
            >
              <Text style={styles.secondaryBtnText}>Choose files</Text>
            </TouchableOpacity>
          </View>
          {xtbFiles.length ? (
            <Text style={styles.metaText}>
              Files: {xtbFiles.map((file) => file.name).join(", ")}
            </Text>
          ) : null}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => handleXtbPreview()}
              disabled={xtbPreviewing}
            >
              <Text style={styles.secondaryBtnText}>
                {xtbPreviewing ? "Previewing..." : "Preview"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleXtbCommit}
              disabled={xtbSaving}
            >
              <Text style={styles.primaryText}>
                {xtbSaving ? "Saving..." : "Save import"}
              </Text>
            </TouchableOpacity>
          </View>
          {xtbError ? <Text style={styles.error}>{xtbError}</Text> : null}
          {xtbMessage ? <Text style={styles.message}>{xtbMessage}</Text> : null}
          {xtbWarnings.length ? (
            <View style={styles.noticeBox}>
              {xtbWarnings.map((warning, index) => (
                <Text style={styles.noticeText} key={`${index}`}>
                  {warning.filename}: {warning.warnings?.join("; ")}
                </Text>
              ))}
            </View>
          ) : null}
          {xtbItems.map((item, index) => (
            <View style={styles.previewRow} key={`${item.filename}-${index}`}>
              <View style={styles.previewInfo}>
                <Text style={styles.previewTitle}>{item.account_type}</Text>
                <Text style={styles.metaText}>{item.filename}</Text>
                <Text style={styles.metaText}>
                  Current: {formatCurrency(item.current_value)}
                </Text>
                <Text style={styles.metaText}>
                  Invested: {formatCurrency(item.invested)}
                </Text>
              </View>
              <CategoryPicker
                value={item.category}
                options={localCategories}
                onChange={(value) => updateXtbItem(index, { category: value })}
              />
            </View>
          ))}
          <View style={styles.importHistory}>
            <View style={styles.previewHeadRow}>
              <Text style={styles.sectionSubtitle}>Imports</Text>
              <Text style={styles.metaText}>{xtbImports.length}</Text>
            </View>
            {xtbLoadingImports ? (
              <Text style={styles.subtitle}>Loading...</Text>
            ) : null}
            {xtbImports.map((entry) => (
              <View style={styles.historyRow} key={entry.id}>
                <View style={styles.previewInfo}>
                  <Text style={styles.previewTitle}>{entry.account_type}</Text>
                  <Text style={styles.metaText}>{entry.source_file}</Text>
                  <Text style={styles.metaText}>
                    Current: {formatCurrency(entry.current_value)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.dangerBtn}
                  onPress={() => handleXtbDelete(entry.id)}
                >
                  <Text style={styles.dangerText}>Delete import</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.importCard}>
          <View style={styles.importHeader}>
            <View>
              <Text style={styles.importTitle}>BancoInvest</Text>
              <Text style={styles.subtitle}>Upload BancoInvest Excel.</Text>
            </View>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={async () => {
                const files = await pickFiles({ multiple: false });
                if (!files.length) {
                  return;
                }
                setBancoFile(files[0]);
                setBancoPreview(null);
                handleBancoPreview(files[0]);
              }}
            >
              <Text style={styles.secondaryBtnText}>Choose file</Text>
            </TouchableOpacity>
          </View>
          {bancoFile ? <Text style={styles.metaText}>File: {bancoFile.name}</Text> : null}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => handleBancoPreview()}
              disabled={bancoPreviewing}
            >
              <Text style={styles.secondaryBtnText}>
                {bancoPreviewing ? "Previewing..." : "Preview"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleBancoCommit}
              disabled={bancoSaving}
            >
              <Text style={styles.primaryText}>
                {bancoSaving ? "Saving..." : "Save import"}
              </Text>
            </TouchableOpacity>
          </View>
          {bancoError ? <Text style={styles.error}>{bancoError}</Text> : null}
          {bancoMessage ? <Text style={styles.message}>{bancoMessage}</Text> : null}
          {bancoPreview?.items?.map((item, index) => (
            <View style={styles.previewRow} key={`${item.holder}-${index}`}>
              <View style={styles.previewInfo}>
                <Text style={styles.previewTitle}>{item.holder}</Text>
                <Text style={styles.metaText}>
                  Current: {formatCurrency(item.current_value)}
                </Text>
              </View>
              <CategoryPicker
                value={item.category}
                options={localCategories}
                onChange={(value) => updateBancoItem(index, { category: value })}
              />
            </View>
          ))}
          <View style={styles.importHistory}>
            <View style={styles.previewHeadRow}>
              <Text style={styles.sectionSubtitle}>Imports</Text>
              <Text style={styles.metaText}>{bancoImports.length}</Text>
            </View>
            {bancoLoadingImports ? (
              <Text style={styles.subtitle}>Loading...</Text>
            ) : null}
            {bancoImports.map((entry) => (
              <View style={styles.historyRow} key={entry.id}>
                <View style={styles.previewInfo}>
                  <Text style={styles.previewTitle}>{entry.source_file}</Text>
                  <Text style={styles.metaText}>
                    Current: {formatCurrency(entry.current_value_total)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.dangerBtn}
                  onPress={() => handleBancoDelete(entry.id)}
                >
                  <Text style={styles.dangerText}>Delete import</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.importCard}>
          <View style={styles.importHeader}>
            <View>
              <Text style={styles.importTitle}>Save N Grow</Text>
              <Text style={styles.subtitle}>Upload Save N Grow Excel.</Text>
            </View>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={async () => {
                const files = await pickFiles({ multiple: false });
                if (!files.length) {
                  return;
                }
                setSaveFile(files[0]);
                setSavePreview(null);
                handleSavePreview(files[0]);
              }}
            >
              <Text style={styles.secondaryBtnText}>Choose file</Text>
            </TouchableOpacity>
          </View>
          {saveFile ? <Text style={styles.metaText}>File: {saveFile.name}</Text> : null}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => handleSavePreview()}
              disabled={savePreviewing}
            >
              <Text style={styles.secondaryBtnText}>
                {savePreviewing ? "Previewing..." : "Preview"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleSaveCommit}
              disabled={saveSaving}
            >
              <Text style={styles.primaryText}>
                {saveSaving ? "Saving..." : "Save import"}
              </Text>
            </TouchableOpacity>
          </View>
          {saveError ? <Text style={styles.error}>{saveError}</Text> : null}
          {saveMessage ? <Text style={styles.message}>{saveMessage}</Text> : null}
          {savePreview?.items?.map((item, index) => (
            <View style={styles.previewRow} key={`${item.name}-${index}`}>
              <View style={styles.previewInfo}>
                <Text style={styles.previewTitle}>{item.name}</Text>
                <Text style={styles.metaText}>
                  Current: {formatCurrency(item.current_value)}
                </Text>
              </View>
              <CategoryPicker
                value={item.category}
                options={localCategories}
                onChange={(value) => updateSaveItem(index, { category: value })}
              />
            </View>
          ))}
          <View style={styles.importHistory}>
            <View style={styles.previewHeadRow}>
              <Text style={styles.sectionSubtitle}>Imports</Text>
              <Text style={styles.metaText}>{saveEntries.length}</Text>
            </View>
            {saveLoadingEntries ? (
              <Text style={styles.subtitle}>Loading...</Text>
            ) : null}
            {saveEntries.map((entry) => (
              <View style={styles.historyRow} key={entry.id}>
                <View style={styles.previewInfo}>
                  <Text style={styles.previewTitle}>{entry.source_file}</Text>
                  <Text style={styles.metaText}>
                    Current: {formatCurrency(entry.current_value_total)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.importCard}>
          <View style={styles.importHeader}>
            <View>
              <Text style={styles.importTitle}>AforroNet</Text>
              <Text style={styles.subtitle}>Upload AforroNet PDF.</Text>
            </View>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={async () => {
                const files = await pickPdf({ multiple: true });
                if (!files.length) {
                  return;
                }
                setAforroNetFiles(files);
                setAforroNetPreview([]);
                handleAforroNetPreview(files);
              }}
            >
              <Text style={styles.secondaryBtnText}>Choose files</Text>
            </TouchableOpacity>
          </View>
          {aforronetFiles.length ? (
            <Text style={styles.metaText}>
              Files: {aforronetFiles.map((file) => file.name).join(", ")}
            </Text>
          ) : null}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => handleAforroNetPreview()}
              disabled={aforronetPreviewing}
            >
              <Text style={styles.secondaryBtnText}>
                {aforronetPreviewing ? "Previewing..." : "Preview"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleAforroNetCommit}
              disabled={aforronetSaving}
            >
              <Text style={styles.primaryText}>
                {aforronetSaving ? "Saving..." : "Save import"}
              </Text>
            </TouchableOpacity>
          </View>
          {aforronetError ? <Text style={styles.error}>{aforronetError}</Text> : null}
          {aforronetMessage ? (
            <Text style={styles.message}>{aforronetMessage}</Text>
          ) : null}
          {aforronetPreview.map((entry, entryIndex) => (
            <View style={styles.previewBlock} key={entry.file_hash}>
              <Text style={styles.previewTitle}>{entry.filename}</Text>
              {entry.items.map((item, index) => (
                <View style={styles.previewRow} key={`${entry.filename}-${index}`}>
                  <View style={styles.previewInfo}>
                    <Text style={styles.previewTitle}>{item.name}</Text>
                    <Text style={styles.metaText}>
                      Invested: {formatCurrency(item.invested)}
                    </Text>
                    <Text style={styles.metaText}>
                      Current: {formatCurrency(item.current_value)}
                    </Text>
                  </View>
                  <CategoryPicker
                    value={item.category}
                    options={localCategories}
                    onChange={(value) =>
                      updateAforroNetItem(entryIndex, index, { category: value })
                    }
                  />
                </View>
              ))}
            </View>
          ))}
          <View style={styles.importHistory}>
            <View style={styles.previewHeadRow}>
              <Text style={styles.sectionSubtitle}>Imports</Text>
              <Text style={styles.metaText}>{aforronetImports.length}</Text>
            </View>
            {aforronetLoadingImports ? (
              <Text style={styles.subtitle}>Loading...</Text>
            ) : null}
            {aforronetImports.map((entry) => (
              <View style={styles.historyRow} key={entry.id}>
                <View style={styles.previewInfo}>
                  <Text style={styles.previewTitle}>{entry.source_file}</Text>
                  <Text style={styles.metaText}>
                    Current: {formatCurrency(entry.current_value_total)}
                  </Text>
                  <Text style={styles.metaText}>
                    Invested: {formatCurrency(entry.invested_total)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.dangerBtn}
                  onPress={() => handleAforroNetDelete(entry.id)}
                >
                  <Text style={styles.dangerText}>Delete import</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.importCard}>
          <View style={styles.importHeader}>
            <View>
              <Text style={styles.importTitle}>Trade Republic</Text>
              <Text style={styles.subtitle}>Upload Trade Republic PDFs.</Text>
            </View>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={async () => {
                const files = await pickPdf({ multiple: true });
                if (!files.length) {
                  return;
                }
                setTradeFiles(files);
                setTradePreview([]);
                handleTradePreview(files);
              }}
            >
              <Text style={styles.secondaryBtnText}>Choose files</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.noticeBox}>
            <Text style={styles.sectionSubtitle}>Manual entry</Text>
            <TextInput
              style={styles.input}
              placeholder="Available Cash"
              placeholderTextColor="#6f7f96"
              value={tradeManualCash}
              onChangeText={setTradeManualCash}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Interests received"
              placeholderTextColor="#6f7f96"
              value={tradeManualInterests}
              onChangeText={setTradeManualInterests}
              keyboardType="numeric"
            />
            <View style={styles.filterBlock}>
              <Text style={styles.metaText}>Category</Text>
              <CategoryPicker
                value={tradeManualCategory}
                options={localCategories}
                onChange={setTradeManualCategory}
              />
            </View>
            {(() => {
              const available = parseInputNumber(tradeManualCash);
              const interests = parseInputNumber(tradeManualInterests);
              if (available === null || interests === null) {
                return null;
              }
              const invested = available - interests;
              return (
                <View>
                  <Text style={styles.metaText}>
                    Invested: {formatCurrency(invested)}
                  </Text>
                  <Text style={styles.metaText}>
                    Profit: {formatCurrency(interests)}
                  </Text>
                </View>
              );
            })()}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleTradeManualSave}
                disabled={tradeManualSaving}
              >
                <Text style={styles.primaryText}>
                  {tradeManualSaving ? "Saving..." : "Save manual"}
                </Text>
              </TouchableOpacity>
            </View>
            {tradeManualError ? (
              <Text style={styles.error}>{tradeManualError}</Text>
            ) : null}
            {tradeManualMessage ? (
              <Text style={styles.message}>{tradeManualMessage}</Text>
            ) : null}
          </View>
          {tradeFiles.length ? (
            <Text style={styles.metaText}>
              Files: {tradeFiles.map((file) => file.name).join(", ")}
            </Text>
          ) : null}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => handleTradePreview()}
              disabled={tradePreviewing}
            >
              <Text style={styles.secondaryBtnText}>
                {tradePreviewing ? "Previewing..." : "Preview"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleTradeCommit}
              disabled={tradeSaving}
            >
              <Text style={styles.primaryText}>
                {tradeSaving ? "Saving..." : "Save import"}
              </Text>
            </TouchableOpacity>
          </View>
          {tradeError ? <Text style={styles.error}>{tradeError}</Text> : null}
          {tradeMessage ? <Text style={styles.message}>{tradeMessage}</Text> : null}
          {tradePreview.map((item, index) => (
            <View style={styles.previewRow} key={`${item.filename}-${index}`}>
              <View style={styles.previewInfo}>
                <Text style={styles.previewTitle}>{item.filename}</Text>
                <Text style={styles.metaText}>
                  Available: {formatCurrency(item.available_cash)}
                </Text>
                <Text style={styles.metaText}>
                  Interests: {formatCurrency(item.interests_received)}
                </Text>
                <Text style={styles.metaText}>
                  Invested: {formatCurrency(item.invested)}
                </Text>
                <Text style={styles.metaText}>Profit: {formatCurrency(item.gains)}</Text>
              </View>
              <CategoryPicker
                value={item.category}
                options={localCategories}
                onChange={(value) => updateTradeItem(index, { category: value })}
              />
            </View>
          ))}
          <View style={styles.importHistory}>
            <View style={styles.previewHeadRow}>
              <Text style={styles.sectionSubtitle}>Imports</Text>
              <Text style={styles.metaText}>{tradeEntries.length}</Text>
            </View>
            {tradeLoadingEntries ? (
              <Text style={styles.subtitle}>Loading...</Text>
            ) : null}
            {tradeEntries.map((entry) => (
              <View style={styles.historyRow} key={entry.id}>
                <View style={styles.previewInfo}>
                  <Text style={styles.previewTitle}>
                    {entry.source_file || entry.source}
                  </Text>
                  <Text style={styles.metaText}>
                    Available: {formatCurrency(entry.available_cash)}
                  </Text>
                  <Text style={styles.metaText}>
                    Invested: {formatCurrency(entry.invested)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.dangerBtn}
                  onPress={() => handleTradeDelete(entry.id)}
                  disabled={tradeDeletingId === entry.id}
                >
                  <Text style={styles.dangerText}>Delete import</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.dangerCard}>
          <View style={styles.importHeader}>
            <View>
              <Text style={styles.importTitle}>Clear data</Text>
              <Text style={styles.subtitle}>Remove all imports for this portfolio.</Text>
            </View>
            <View style={styles.dangerActions}>
              <TouchableOpacity
                style={styles.dangerBtn}
                onPress={handleClearData}
                disabled={clearing}
              >
                <Text style={styles.dangerText}>
                  {clearing ? "Clearing..." : "Clear data"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dangerBtn}
                onPress={handleDeletePortfolio}
                disabled={deletingPortfolio}
              >
                <Text style={styles.dangerText}>
                  {deletingPortfolio ? "Deleting..." : "Delete portfolio"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          {clearMessage ? <Text style={styles.message}>{clearMessage}</Text> : null}
          {clearError ? <Text style={styles.error}>{clearError}</Text> : null}
          {deletePortfolioMessage ? (
            <Text style={styles.message}>{deletePortfolioMessage}</Text>
          ) : null}
          {deletePortfolioError ? (
            <Text style={styles.error}>{deletePortfolioError}</Text>
          ) : null}
        </View>
      </>
    );
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.card}>
          <Text style={styles.title}>MyFAInance Mobile</Text>
          <Text style={styles.subtitle}>
            {mode === "home"
              ? "MyPortfolios overview"
              : "Sign in to access your portfolio."}
          </Text>

          {mode !== "home" ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#6f7f96"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
              {(mode === "signin" || mode === "register") && (
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#6f7f96"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              )}
              {(mode === "verify" || mode === "reset") && (
                <TextInput
                  style={styles.input}
                  placeholder="Verification code"
                  placeholderTextColor="#6f7f96"
                  value={code}
                  onChangeText={setCode}
                />
              )}
              {mode === "reset" && (
                <TextInput
                  style={styles.input}
                  placeholder="New password"
                  placeholderTextColor="#6f7f96"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
              )}
            </>
          ) : (
            <>
              <View style={styles.tabRow}>
                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    homeTab === "portfolios" && styles.tabButtonActive
                  ]}
                  onPress={() => setHomeTab("portfolios")}
                >
                  <Text
                    style={[
                      styles.tabText,
                      homeTab === "portfolios" && styles.tabTextActive
                    ]}
                  >
                    MyPortfolios
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    homeTab === "investments" && styles.tabButtonActive
                  ]}
                  onPress={() => setHomeTab("investments")}
                >
                  <Text
                    style={[
                      styles.tabText,
                      homeTab === "investments" && styles.tabTextActive
                    ]}
                  >
                    Investments
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    homeTab === "banking" && styles.tabButtonActive
                  ]}
                  onPress={() => setHomeTab("banking")}
                >
                  <Text
                    style={[
                      styles.tabText,
                      homeTab === "banking" && styles.tabTextActive
                    ]}
                  >
                    Banking Transactions
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    homeTab === "goals" && styles.tabButtonActive
                  ]}
                  onPress={() => setHomeTab("goals")}
                >
                  <Text
                    style={[
                      styles.tabText,
                      homeTab === "goals" && styles.tabTextActive
                    ]}
                  >
                    MyGoals
                  </Text>
                </TouchableOpacity>
              </View>
              {homeTab === "portfolios"
                ? renderOverview()
                : homeTab === "investments"
                ? renderHoldings()
                : homeTab === "banking"
                ? renderBanking()
                : renderGoals()}
            </>
          )}

          {message ? <Text style={styles.message}>{message}</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {mode === "signin" && (
            <>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleLogin}
                disabled={loading}
              >
                <Text style={styles.primaryText}>
                  {loading ? "Loading..." : "Sign In"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.ghostBtn}
                onPress={() => {
                  resetFeedback();
                  setMode("register");
                }}
              >
                <Text style={styles.ghostText}>Create account</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.linkBtn}
                onPress={() => {
                  resetFeedback();
                  setMode("resetRequest");
                }}
              >
                <Text style={styles.linkText}>Forgot password?</Text>
              </TouchableOpacity>
            </>
          )}

          {mode === "register" && (
            <>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleRegister}
                disabled={loading}
              >
                <Text style={styles.primaryText}>
                  {loading ? "Loading..." : "Register"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.ghostBtn}
                onPress={() => {
                  resetFeedback();
                  setMode("signin");
                }}
              >
                <Text style={styles.ghostText}>Back to sign in</Text>
              </TouchableOpacity>
            </>
          )}

          {mode === "verify" && (
            <>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleVerify}
                disabled={loading}
              >
                <Text style={styles.primaryText}>
                  {loading ? "Loading..." : "Verify"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.ghostBtn}
                onPress={() => {
                  resetFeedback();
                  setMode("signin");
                }}
              >
                <Text style={styles.ghostText}>Back to sign in</Text>
              </TouchableOpacity>
            </>
          )}

          {mode === "resetRequest" && (
            <>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleResetRequest}
                disabled={loading}
              >
                <Text style={styles.primaryText}>
                  {loading ? "Loading..." : "Send recovery email"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.ghostBtn}
                onPress={() => {
                  resetFeedback();
                  setMode("signin");
                }}
              >
                <Text style={styles.ghostText}>Back to sign in</Text>
              </TouchableOpacity>
            </>
          )}

          {mode === "reset" && (
            <>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleReset}
                disabled={loading}
              >
                <Text style={styles.primaryText}>
                  {loading ? "Loading..." : "Reset password"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.ghostBtn}
                onPress={() => {
                  resetFeedback();
                  setMode("signin");
                }}
              >
                <Text style={styles.ghostText}>Back to sign in</Text>
              </TouchableOpacity>
            </>
          )}

          {mode === "home" && (
            <TouchableOpacity
              style={styles.ghostBtn}
              onPress={() => {
                setToken("");
                setMode("signin");
                setPortfolios([]);
                setSelectedPortfolioId(null);
                setSummary(null);
                resetFeedback();
              }}
            >
              <Text style={styles.ghostText}>Sign out</Text>
            </TouchableOpacity>
          )}
        </View>
        </ScrollView>
        <StatusBar style="light" />
      </SafeAreaView>
      <Modal transparent visible={institutionDetailOpen} animationType="fade">
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setInstitutionDetailOpen(false)}
          />
          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>
                {institutionDetail?.institution || "Institution"}
              </Text>
              <TouchableOpacity onPress={() => setInstitutionDetailOpen(false)}>
                <Text style={styles.linkText}>Close</Text>
              </TouchableOpacity>
            </View>
            {institutionDetailLoading ? (
              <Text style={styles.subtitle}>Loading...</Text>
            ) : null}
            {institutionDetailError ? (
              <Text style={styles.error}>{institutionDetailError}</Text>
            ) : null}
            {institutionDetail ? (
              <ScrollView style={styles.detailScroll}>
                <View style={styles.detailMeta}>
                  <Text style={styles.metaText}>
                    Total: {formatCurrency(institutionDetail.total)}
                  </Text>
                  <Text style={styles.metaText}>
                    Source: {institutionDetail.source || "-"}
                  </Text>
                  <Text style={styles.metaText}>
                    Date: {formatDateShort(institutionDetail.date)}
                  </Text>
                </View>
                {detailCategories.length ? (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionSubtitle}>By category</Text>
                    <View style={styles.detailChartRow}>
                      <Svg width={140} height={140}>
                        <G rotation={-90} origin="70, 70">
                          {detailCategories.reduce((acc, item, index) => {
                            const startAngle = acc.angle;
                            const sliceAngle =
                              (item.value / detailCategoryTotal) * Math.PI * 2;
                            const endAngle = startAngle + sliceAngle;
                            const radius = 50;
                            const center = 70;
                            const x1 = center + radius * Math.cos(startAngle);
                            const y1 = center + radius * Math.sin(startAngle);
                            const x2 = center + radius * Math.cos(endAngle);
                            const y2 = center + radius * Math.sin(endAngle);
                            const largeArc = sliceAngle > Math.PI ? 1 : 0;
                            const pathData = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
                            acc.paths.push(
                              <Path
                                key={`${item.label}-${index}`}
                                d={pathData}
                                fill={
                                  allocationColors[index % allocationColors.length]
                                }
                              />
                            );
                            acc.angle = endAngle;
                            return acc;
                          }, {
                            angle: 0,
                            paths: []
                          }).paths}
                        </G>
                        <Circle cx="70" cy="70" r="32" fill="#0b1220" />
                      </Svg>
                      <View style={styles.detailLegend}>
                        {detailCategories.map((item, index) => (
                          <View style={styles.legendRow} key={item.label}>
                            <View
                              style={[
                                styles.legendDot,
                                {
                                  backgroundColor:
                                    allocationColors[index % allocationColors.length]
                                }
                              ]}
                            />
                            <Text style={styles.legendLabel}>{item.label}</Text>
                            <Text style={styles.legendValue}>
                              {detailCategoryTotal
                                ? `${(
                                    (item.value / detailCategoryTotal) *
                                    100
                                  ).toFixed(1)}%`
                                : "0%"}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                ) : (
                  <Text style={styles.subtitle}>No category data.</Text>
                )}
                {institutionDetail.entries?.length ? (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionSubtitle}>Entries</Text>
                    {institutionDetail.entries.map((entry, index) => (
                      <View style={styles.detailRow} key={`${entry.label}-${index}`}>
                        <Text style={styles.detailLabel}>{entry.label}</Text>
                        {entry.description ? (
                          <Text style={styles.metaText}>{entry.description}</Text>
                        ) : null}
                        <Text style={styles.metaText}>
                          Current: {formatCurrency(entry.current_value)}
                        </Text>
                        {entry.invested !== null && entry.invested !== undefined ? (
                          <Text style={styles.metaText}>
                            Invested: {formatCurrency(entry.invested)}
                          </Text>
                        ) : null}
                        {entry.gains !== null && entry.gains !== undefined ? (
                          <Text style={styles.metaText}>
                            Gains: {formatSigned(entry.gains)}
                          </Text>
                        ) : null}
                      </View>
                    ))}
                  </View>
                ) : null}
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaProvider>
  );
}

function CategoryPicker({ value, options, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <View>
      <TouchableOpacity style={styles.selectBtn} onPress={() => setOpen(true)}>
        <Text style={styles.selectText}>{value || "Select"}</Text>
      </TouchableOpacity>
      <Modal transparent visible={open} animationType="fade">
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setOpen(false)}
          />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select category</Text>
            <ScrollView style={styles.modalList}>
              {options.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.modalOption}
                  onPress={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function BankingCategoryPicker({ value, groups, onChange }) {
  const [open, setOpen] = useState(false);
  const displayValue = value?.category
    ? value.subcategory && value.subcategory !== value.category
      ? `${value.category} - ${value.subcategory}`
      : value.category
    : "Select category";

  return (
    <View>
      <TouchableOpacity style={styles.selectBtn} onPress={() => setOpen(true)}>
        <Text style={styles.selectText}>{displayValue}</Text>
      </TouchableOpacity>
      <Modal transparent visible={open} animationType="fade">
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setOpen(false)}
          />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select category</Text>
            <ScrollView style={styles.modalList}>
              {groups.map((group) => {
                const options = group.subcategories?.length
                  ? group.subcategories
                  : [group.name];
                return (
                  <View key={group.name} style={styles.modalGroup}>
                    <Text style={styles.modalGroupTitle}>{group.name}</Text>
                    {options.map((option) => (
                      <TouchableOpacity
                        key={`${group.name}-${option}`}
                        style={styles.modalOption}
                        onPress={() => {
                          onChange(group.name, option);
                          setOpen(false);
                        }}
                      >
                        <Text style={styles.modalOptionText}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#060b16"
  },
  scroll: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20
  },
  card: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: "#0b1220",
    borderRadius: 16,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)"
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#e5eefb"
  },
  subtitle: {
    fontSize: 12,
    color: "#8fa0ba"
  },
  input: {
    backgroundColor: "#0f1728",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    color: "#e5eefb",
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: "top"
  },
  primaryBtn: {
    backgroundColor: "#2ad68d",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center"
  },
  primaryText: {
    color: "#0a151f",
    fontWeight: "700"
  },
  ghostBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.06)"
  },
  ghostText: {
    color: "#dfe7f3",
    fontWeight: "600"
  },
  linkBtn: {
    alignItems: "center",
    paddingVertical: 6
  },
  linkText: {
    color: "#2ad68d",
    fontWeight: "600"
  },
  message: {
    color: "#7de0b2",
    fontSize: 12
  },
  error: {
    color: "#ff9c9c",
    fontSize: 12
  },
  section: {
    marginTop: 8,
    gap: 8
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#dfe7f3"
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)"
  },
  pillActive: {
    backgroundColor: "#2ad68d",
    borderColor: "#2ad68d"
  },
  pillText: {
    color: "#dfe7f3",
    fontSize: 11
  },
  pillTextActive: {
    color: "#0a151f",
    fontWeight: "700"
  },
  metricRow: {
    flexDirection: "row",
    gap: 10
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#0f1728",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)"
  },
  metricLabel: {
    fontSize: 11,
    color: "#8fa0ba"
  },
  metricValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#e5eefb"
  },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)"
  },
  categoryLabel: {
    color: "#9aa9bf",
    fontSize: 12
  },
  categoryValue: {
    color: "#e5eefb",
    fontSize: 12
  },
  tabRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6
  },
  tabButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)"
  },
  tabButtonActive: {
    backgroundColor: "#0f2330",
    borderColor: "#2ad68d"
  },
  tabText: {
    color: "#9aa9bf",
    fontSize: 12,
    fontWeight: "600"
  },
  tabTextActive: {
    color: "#2ad68d"
  },
  subTabRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap"
  },
  subTabButton: {
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)"
  },
  subTabButtonActive: {
    backgroundColor: "#0f2330",
    borderColor: "#2ad68d"
  },
  subTabText: {
    color: "#9aa9bf",
    fontSize: 11,
    fontWeight: "600"
  },
  subTabTextActive: {
    color: "#2ad68d"
  },
  importCard: {
    marginTop: 12,
    backgroundColor: "#0f1728",
    borderRadius: 12,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)"
  },
  importHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12
  },
  importTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#e5eefb"
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#8fa0ba"
  },
  metaText: {
    fontSize: 11,
    color: "#8fa0ba"
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8
  },
  bankingSplit: {
    gap: 12
  },
  bankingSplitBlock: {
    gap: 8
  },
  bankingEditRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 6
  },
  bankingEditBlock: {
    flex: 1,
    minWidth: 140,
    gap: 6
  },
  filterBlock: {
    flex: 1,
    minWidth: 140,
    gap: 6
  },
  tooltipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 6
  },
  secondaryBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.05)"
  },
  secondaryBtnText: {
    color: "#dfe7f3",
    fontWeight: "600",
    fontSize: 12
  },
  noticeBox: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 8,
    padding: 8
  },
  noticeText: {
    color: "#c7d3ea",
    fontSize: 11
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)"
  },
  previewBlock: {
    gap: 6,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)"
  },
  holdingCard: {
    gap: 6,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)"
  },
  holdingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12
  },
  holdingInfo: {
    flex: 1,
    gap: 2
  },
  holdingRight: {
    alignItems: "flex-end",
    gap: 2
  },
  holdingChevron: {
    color: "#9aa9bf",
    fontSize: 12
  },
  holdingDetails: {
    marginTop: 4
  },
  holdingMeta: {
    marginTop: 8,
    gap: 6
  },
  chartCard: {
    marginTop: 6,
    backgroundColor: "#0f1728",
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)"
  },
  chipRow: {
    flexDirection: "row",
    gap: 8
  },
  chip: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)"
  },
  chipActive: {
    borderColor: "rgba(42,214,141,0.45)",
    backgroundColor: "rgba(42,214,141,0.2)"
  },
  chipText: {
    color: "#dfe7f3",
    fontSize: 11,
    fontWeight: "600"
  },
  chipTextActive: {
    color: "#2ad68d"
  },
  chartBody: {
    backgroundColor: "rgba(7,12,24,0.6)",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)"
  },
  chartBars: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start"
  },
  chartBar: {
    width: 44,
    alignItems: "center",
    gap: 6
  },
  chartBarStack: {
    height: 160,
    width: 18
  },
  chartBarPos: {
    flex: 1,
    justifyContent: "flex-end"
  },
  chartBarNeg: {
    flex: 1,
    justifyContent: "flex-start"
  },
  chartBarFill: {
    width: "100%",
    borderRadius: 6
  },
  chartBarFillPos: {
    backgroundColor: "#2ad68d"
  },
  chartBarFillNeg: {
    backgroundColor: "#ff6b6b"
  },
  chartLabel: {
    color: "#9aa9bf",
    fontSize: 10,
    maxWidth: 60,
    textAlign: "center"
  },
  previewInfo: {
    flex: 1,
    gap: 2
  },
  previewTitle: {
    color: "#e5eefb",
    fontWeight: "600",
    fontSize: 12
  },
  ignoreBtn: {
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)"
  },
  ignoreBtnActive: {
    backgroundColor: "#1d2a3a"
  },
  ignoreText: {
    fontSize: 11,
    color: "#dfe7f3"
  },
  importHistory: {
    marginTop: 6,
    gap: 8
  },
  previewHeadRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)"
  },
  dangerBtn: {
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255,94,94,0.5)",
    backgroundColor: "rgba(255,94,94,0.2)"
  },
  dangerText: {
    color: "#ff9c9c",
    fontWeight: "700",
    fontSize: 11
  },
  dangerCard: {
    marginTop: 12,
    backgroundColor: "rgba(255,94,94,0.08)",
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,94,94,0.3)"
  },
  dangerActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "flex-end"
  },
  categoryManageRow: {
    gap: 8
  },
  categorySettings: {
    marginTop: 8,
    gap: 8
  },
  categorySettingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)"
  },
  categorySettingLabel: {
    color: "#c7d3ea",
    fontSize: 12
  },
  categorySettingControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  categorySettingText: {
    color: "#8fa0ba",
    fontSize: 11
  },
  categoryList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  categoryTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)"
  },
  categoryTagText: {
    color: "#dfe7f3",
    fontSize: 11,
    fontWeight: "600"
  },
  removeTagBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,94,94,0.2)"
  },
  removeTagText: {
    color: "#ffb1b1",
    fontSize: 10,
    fontWeight: "600"
  },
  selectBtn: {
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)"
  },
  selectText: {
    color: "#dfe7f3",
    fontSize: 11
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    padding: 20
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject
  },
  modalCard: {
    backgroundColor: "#0f1728",
    borderRadius: 12,
    padding: 16,
    maxHeight: 320
  },
  modalTitle: {
    color: "#e5eefb",
    fontWeight: "700",
    marginBottom: 8
  },
  modalList: {
    maxHeight: 240
  },
  modalOption: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)"
  },
  modalOptionText: {
    color: "#dfe7f3",
    fontSize: 12
  },
  modalGroup: {
    marginBottom: 8
  },
  modalGroupTitle: {
    color: "#8fa0ba",
    fontSize: 12,
    textTransform: "uppercase",
    marginTop: 6
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6
  },
  barLabel: {
    flex: 1,
    color: "#c4d0e3",
    fontSize: 11
  },
  barTrack: {
    flex: 2,
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden"
  },
  barFill: {
    height: "100%",
    borderRadius: 999
  },
  barFillPos: {
    backgroundColor: "#2ad68d"
  },
  barFillNeg: {
    backgroundColor: "#ff9c9c"
  },
  barFillCaution: {
    backgroundColor: "#f2b441"
  },
  barFillWarn: {
    backgroundColor: "#ff9c9c"
  },
  barFillDanger: {
    backgroundColor: "#ff6b6b"
  },
  barValue: {
    color: "#9aa9bf",
    fontSize: 11
  },
  budgetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)"
  },
  budgetProgress: {
    flex: 1,
    gap: 6
  },
  detailCard: {
    backgroundColor: "#0f1728",
    borderRadius: 12,
    padding: 16,
    maxHeight: 520
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8
  },
  detailTitle: {
    color: "#e5eefb",
    fontSize: 16,
    fontWeight: "700"
  },
  detailMeta: {
    gap: 4
  },
  detailChartRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  detailLegend: {
    flex: 1,
    gap: 6
  },
  detailScroll: {
    maxHeight: 420
  },
  detailSection: {
    marginTop: 12,
    gap: 6
  },
  detailRow: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)"
  },
  detailLabel: {
    color: "#e5eefb",
    fontSize: 12,
    fontWeight: "600"
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16
  },
  legend: {
    flex: 1,
    gap: 8
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 999
  },
  legendLabel: {
    flex: 1,
    color: "#c7d3ea",
    fontSize: 11
  },
  legendValue: {
    color: "#8fa0ba",
    fontSize: 11
  },
  table: {
    marginTop: 6,
    gap: 8
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)"
  },
  tableCell: {
    flex: 1,
    gap: 2
  },
  tableCellRight: {
    alignItems: "flex-end"
  },
  tableTitle: {
    color: "#e5eefb",
    fontSize: 12,
    fontWeight: "600"
  },
  tableValue: {
    color: "#dfe7f3",
    fontSize: 12,
    fontWeight: "600"
  },
  institutionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  institutionLogo: {
    width: 22,
    height: 22,
    borderRadius: 6
  },
  posValue: {
    color: "#2ad68d"
  },
  negValue: {
    color: "#ff9c9c"
  }
});

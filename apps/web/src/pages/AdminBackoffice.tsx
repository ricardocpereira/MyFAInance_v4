import { useEffect, useState } from "react";
import type { Translation } from "../content/translations";

type TickerPrice = {
  ticker: string;
  price: number;
  currency: string;
  updated_at: string;
};

type TickerMetadata = {
  ticker: string;
  name?: string;
  asset_class?: string;
  sector?: string;
  industry?: string;
  country?: string;
  region?: string;
  currency?: string;
  exchange?: string;
  dividend_yield?: number;
  dividend_frequency?: string;
  next_dividend_date?: string;
  next_dividend_amount?: number;
  current_price?: number;
  last_updated: string;
};

type ApiProvider = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  requires_key: boolean;
  has_key: boolean;
  limits: string;
  supported_markets: string[];
};

type AdminBackofficeProps = {
  t: Translation;
  token: string;
};

const API_BASE = "http://127.0.0.1:8000";

function AdminBackoffice({ token }: AdminBackofficeProps) {
  const [activeTab, setActiveTab] = useState<"prices" | "tickers" | "api-settings">("tickers");
  const [prices, setPrices] = useState<TickerPrice[]>([]);
  const [metadata, setMetadata] = useState<TickerMetadata[]>([]);
  const [providers, setProviders] = useState<ApiProvider[]>([]);
  const [currentProvider, setCurrentProvider] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  
  // Single ticker form
  const [ticker, setTicker] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [uploading, setUploading] = useState(false);
  
  // Bulk upload
  const [bulkText, setBulkText] = useState("");
  const [bulkUploading, setBulkUploading] = useState(false);
  
  // Excel upload
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelUploading, setExcelUploading] = useState(false);
  const [excelTickers, setExcelTickers] = useState<string[]>([]);
  
  // Excel enriched upload
  const [enrichedFile, setEnrichedFile] = useState<File | null>(null);
  const [enrichedUploading, setEnrichedUploading] = useState(false);
  
  // Fetch metadata
  const [fetchingMetadata, setFetchingMetadata] = useState(false);
  const [fetchProgress, setFetchProgress] = useState(0);

  useEffect(() => {
    if (activeTab === "prices") {
      loadPrices();
    } else if (activeTab === "tickers") {
      loadMetadata();
    } else if (activeTab === "api-settings") {
      loadApiSettings();
    }
  }, [activeTab]);

  const loadApiSettings = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/admin/api-settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || "Failed to load API settings.");
      }
      setProviders(data.providers || []);
      setCurrentProvider(data.current_provider || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load API settings.");
    } finally {
      setLoading(false);
    }
  };

  const handleTestProvider = async (providerId: string) => {
    setError("");
    setMessage("");
    try {
      const response = await fetch(`${API_BASE}/admin/api-settings/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ provider: providerId })
      });
      const data = await response.json();
      if (data.status === "success") {
        setMessage(`✓ ${data.provider}: Connection successful! Test price for ${data.test_ticker}: $${data.price}`);
      } else {
        setError(`✗ ${data.provider}: ${data.message}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Test failed.");
    }
  };

  const loadPrices = async (searchQuery?: string) => {
    setLoading(true);
    setError("");
    try {
      const url = new URL(`${API_BASE}/admin/prices`);
      if (searchQuery) {
        url.searchParams.set("search", searchQuery);
      }
      url.searchParams.set("limit", "100");
      
      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || "Failed to load prices.");
      }
      setPrices(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load prices.");
    } finally {
      setLoading(false);
    }
  };

  const loadMetadata = async (searchQuery?: string) => {
    setLoading(true);
    setError("");
    try {
      const url = new URL(`${API_BASE}/admin/tickers/metadata`);
      if (searchQuery) {
        url.searchParams.set("search", searchQuery);
      }
      url.searchParams.set("limit", "100");
      
      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || "Failed to load metadata.");
      }
      setMetadata(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load metadata.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === "prices") {
      loadPrices(search);
    } else {
      loadMetadata(search);
    }
  };

  const handleClear = () => {
    setSearch("");
    if (activeTab === "prices") {
      loadPrices("");
    } else {
      loadMetadata("");
    }
  };

  const handleExcelUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!excelFile) {
      setError("Please select an Excel file.");
      return;
    }
    
    setExcelUploading(true);
    setError("");
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("file", excelFile);
      
      const response = await fetch(`${API_BASE}/admin/tickers/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || "Failed to upload file.");
      }
      setExcelTickers(data.tickers || []);
      setMessage(`Loaded ${data.count} tickers from Excel.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload file.");
    } finally {
      setExcelUploading(false);
    }
  };

  const handleFetchMetadata = async (tickerToFetch?: string) => {
    const tickersToProcess = tickerToFetch ? [tickerToFetch] : excelTickers;
    
    if (tickersToProcess.length === 0) {
      setError("No tickers to process.");
      return;
    }
    
    const count = tickersToProcess.length;
    const estimatedTime = count * 1.1; // ~1.05s per ticker with Finnhub rate limit
    
    setFetchingMetadata(true);
    setFetchProgress(0);
    setError("");
    setMessage(
      `Processing ${count} ticker${count > 1 ? 's' : ''}... ` +
      `Estimated time: ${Math.ceil(estimatedTime / 60)} minute${Math.ceil(estimatedTime / 60) > 1 ? 's' : ''}.`
    );
    
    try {
      const response = await fetch(`${API_BASE}/admin/tickers/fetch-bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(tickersToProcess)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || "Failed to fetch metadata.");
      }
      
      setFetchProgress(100);
      
      const successMsg = `✓ Completed! ${data.success}/${count} ticker${count > 1 ? 's' : ''} fetched successfully.`;
      const errorMsg = data.errors > 0 ? ` ${data.errors} error${data.errors > 1 ? 's' : ''} (check console).` : "";
      setMessage(successMsg + errorMsg);
      
      if (data.error_details && data.error_details.length > 0) {
        console.group("⚠️ Ticker Fetch Errors:");
        data.error_details.forEach((err: any) => {
          console.error(`${err.ticker}: ${err.error}`);
        });
        console.groupEnd();
      }
      
      loadMetadata();
      setExcelTickers([]);
      setExcelFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch metadata.");
    } finally {
      setFetchingMetadata(false);
      setFetchProgress(0);
    }
  };

  const handleUpdateFixedData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrichedFile) {
      setError("Please select an Excel file.");
      return;
    }
    
    setEnrichedUploading(true);
    setError("");
    setMessage("");
    
    try {
      const formData = new FormData();
      formData.append("file", enrichedFile);
      
      const response = await fetch(`${API_BASE}/admin/tickers/update-fixed-from-excel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || "Failed to update fixed data.");
      }
      
      const successMsg = `✓ Updated ${data.success} ticker${data.success > 1 ? 's' : ''} (fixed data only).`;
      const errorMsg = data.errors > 0 ? ` ${data.errors} error${data.errors > 1 ? 's' : ''}.` : "";
      setMessage(successMsg + errorMsg);
      
      if (data.error_details && data.error_details.length > 0) {
        console.group("⚠️ Update Fixed Data Errors:");
        data.error_details.forEach((err: any) => {
          console.error(`${err.ticker}: ${err.error}`);
        });
        console.groupEnd();
      }
      
      loadMetadata();
      setEnrichedFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update fixed data.");
    } finally {
      setEnrichedUploading(false);
    }
  };

  const handleUpdateAllFromExcel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrichedFile) {
      setError("Please select an Excel file.");
      return;
    }
    
    setEnrichedUploading(true);
    setError("");
    setMessage("");
    
    try {
      const formData = new FormData();
      formData.append("file", enrichedFile);
      
      const response = await fetch(`${API_BASE}/admin/tickers/update-all-from-excel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || "Failed to update from Excel.");
      }
      
      const successMsg = `✓ Updated ${data.success} ticker${data.success > 1 ? 's' : ''} (all data).`;
      const errorMsg = data.errors > 0 ? ` ${data.errors} error${data.errors > 1 ? 's' : ''}.` : "";
      setMessage(successMsg + errorMsg);
      
      if (data.error_details && data.error_details.length > 0) {
        console.group("⚠️ Update All Data Errors:");
        data.error_details.forEach((err: any) => {
          console.error(`${err.ticker}: ${err.error}`);
        });
        console.groupEnd();
      }
      
      loadMetadata();
      setEnrichedFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update from Excel.");
    } finally {
      setEnrichedUploading(false);
    }
  };

  const handleUploadSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker.trim() || !price) {
      setError("Ticker and price are required.");
      return;
    }
    
    setUploading(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`${API_BASE}/admin/prices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ticker: ticker.trim().toUpperCase(),
          price: parseFloat(price),
          currency: currency
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || "Failed to upload price.");
      }
      setMessage(`Price uploaded: ${data.ticker} = ${data.price} ${data.currency}`);
      setTicker("");
      setPrice("");
      loadPrices();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload price.");
    } finally {
      setUploading(false);
    }
  };

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText.trim()) {
      setError("Bulk text is empty.");
      return;
    }
    
    setBulkUploading(true);
    setError("");
    setMessage("");
    try {
      const lines = bulkText.trim().split("\n");
      const entries = lines.map((line) => {
        const [ticker, price, currency = "USD"] = line.split(",").map((s) => s.trim());
        return { ticker: ticker.toUpperCase(), price: parseFloat(price), currency };
      });
      
      const response = await fetch(`${API_BASE}/admin/prices/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(entries)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || "Failed to bulk upload.");
      }
      setMessage(`Uploaded ${data.success} prices. Errors: ${data.errors}`);
      setBulkText("");
      loadPrices();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to bulk upload.");
    } finally {
      setBulkUploading(false);
    }
  };

  const handleDelete = async (tickerToDelete: string) => {
    if (!confirm(`Delete ${tickerToDelete}?`)) {
      return;
    }
    
    setError("");
    setMessage("");
    try {
      const endpoint = activeTab === "prices" 
        ? `${API_BASE}/admin/prices/${tickerToDelete}`
        : `${API_BASE}/admin/tickers/${tickerToDelete}`;
      
      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || "Failed to delete.");
      }
      setMessage(`Deleted ${tickerToDelete}`);
      if (activeTab === "prices") {
        loadPrices();
      } else {
        loadMetadata();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete.");
    }
  };

  return (
    <div className="admin-backoffice">
      <section className="admin-header">
        <h2>Admin Backoffice</h2>
        <p>Manage ticker prices and metadata</p>
      </section>

      <div className="admin-tabs">
        <button
          className={activeTab === "tickers" ? "active" : ""}
          onClick={() => setActiveTab("tickers")}
        >
          Ticker Management
        </button>
        <button
          className={activeTab === "prices" ? "active" : ""}
          onClick={() => setActiveTab("prices")}
        >
          Manual Prices
        </button>
        <button
          className={activeTab === "api-settings" ? "active" : ""}
          onClick={() => setActiveTab("api-settings")}
        >
          API Settings
        </button>
      </div>

      {message && <div className="login-banner">{message}</div>}
      {error && <p className="login-error">{error}</p>}

      {activeTab === "tickers" && (
        <>
          <section className="admin-section admin-summary-section">
            <div className="admin-summary-header">
              <h3>Ticker Database Summary</h3>
              <button
                onClick={() => loadMetadata()}
                disabled={loading}
                className="ghost-btn"
              >
                ↻ Refresh
              </button>
            </div>
            
            {metadata.length > 0 ? (
              <div className="admin-summary-cards">
                <div className="admin-summary-card">
                  <span className="summary-label">Total Tickers</span>
                  <strong className="summary-value">{metadata.length}</strong>
                </div>
                <div className="admin-summary-card">
                  <span className="summary-label">Last Updated</span>
                  <strong className="summary-value">
                    {metadata[0]?.last_updated 
                      ? new Date(metadata[0].last_updated).toLocaleString()
                      : "N/A"}
                  </strong>
                </div>
                <div className="admin-summary-card">
                  <span className="summary-label">With Prices</span>
                  <strong className="summary-value">
                    {metadata.filter(m => m.currency).length}
                  </strong>
                </div>
                <div className="admin-summary-card">
                  <span className="summary-label">With Dividends</span>
                  <strong className="summary-value">
                    {metadata.filter(m => m.dividend_yield).length}
                  </strong>
                </div>
              </div>
            ) : (
              <p className="chart-sub">No tickers in database. Upload and fetch metadata to start.</p>
            )}
          </section>

          <section className="admin-section">
            <h3>Upload Tickers from Excel</h3>
            <p className="chart-sub">
              Upload an Excel file (.xlsx or .xls) with tickers in the first column. Header row will be skipped.
            </p>
            <form onSubmit={handleExcelUpload} className="admin-form">
              <div className="admin-form-row">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
                  disabled={excelUploading}
                />
                <button type="submit" disabled={excelUploading} className="primary-btn">
                  {excelUploading ? "Uploading..." : "Upload Excel"}
                </button>
              </div>
            </form>
            
            {excelTickers.length > 0 && (
              <div className="excel-ticker-list">
                <div className="excel-header">
                  <strong>{excelTickers.length} tickers loaded from Excel</strong>
                  <button
                    onClick={() => handleFetchMetadata()}
                    disabled={fetchingMetadata}
                    className="primary-btn"
                  >
                    {fetchingMetadata && fetchProgress > 0
                      ? `Fetching... (${fetchProgress}%)`
                      : fetchingMetadata
                      ? "Fetching Metadata..."
                      : "Fetch All Metadata"}
                  </button>
                </div>
                <div className="ticker-chips">
                  {excelTickers.slice(0, 50).map((t) => (
                    <span key={t} className="ticker-chip">{t}</span>
                  ))}
                  {excelTickers.length > 50 && (
                    <span className="ticker-chip">+{excelTickers.length - 50} more</span>
                  )}
                </div>
              </div>
            )}
          </section>

          <section className="admin-section">
            <h3>Update Ticker Data from Enriched Excel</h3>
            <p className="chart-sub">
              Upload an enriched Excel file with complete ticker information. 
              Template: <code>backoffice_files/Tickers_Enriched_Final.xlsx</code>
            </p>
            <form className="admin-form">
              <div className="admin-form-row">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setEnrichedFile(e.target.files?.[0] || null)}
                  disabled={enrichedUploading}
                />
                <button 
                  type="button"
                  onClick={handleUpdateFixedData}
                  disabled={enrichedUploading || !enrichedFile} 
                  className="ghost-btn"
                  style={{ marginRight: "10px" }}
                >
                  {enrichedUploading ? "Updating..." : "Update Only Fixed Data"}
                </button>
                <button 
                  type="button"
                  onClick={handleUpdateAllFromExcel}
                  disabled={enrichedUploading || !enrichedFile} 
                  className="primary-btn"
                >
                  {enrichedUploading ? "Updating..." : "Update All From File"}
                </button>
              </div>
              <p className="chart-sub" style={{ marginTop: "10px", fontSize: "0.85rem" }}>
                <strong>Update Only Fixed Data:</strong> Updates Ticker, Name, Class, Sector, Country, Currency (preserves API data)<br/>
                <strong>Update All From File:</strong> Updates all fields from Excel (overrides API data)
              </p>
            </form>
          </section>

          <section className="admin-section">
            <div className="admin-section-header">
              <h3>Ticker Metadata</h3>
              <form onSubmit={handleSearch} className="admin-search-form">
                <input
                  type="text"
                  placeholder="Search ticker or name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button type="submit" className="ghost-btn">Search</button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="ghost-btn"
                >
                  Clear
                </button>
              </form>
            </div>
            
            {loading ? (
              <p>Loading metadata...</p>
            ) : metadata.length === 0 ? (
              <p className="chart-sub">No metadata found. Upload tickers and fetch metadata to populate this table.</p>
            ) : (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Ticker</th>
                      <th>Name</th>
                      <th>Class</th>
                      <th>Sector</th>
                      <th>Country</th>
                      <th>Currency</th>
                      <th>Current Price</th>
                      <th>Div Yield</th>
                      <th>Next Div Date</th>
                      <th>Next Div Amount</th>
                      <th>Updated</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metadata.map((item) => (
                      <tr key={item.ticker}>
                        <td><strong>{item.ticker}</strong></td>
                        <td>{item.name || "-"}</td>
                        <td>{item.asset_class || "-"}</td>
                        <td>{item.sector || "-"}</td>
                        <td>{item.country || "-"}</td>
                        <td>{item.currency || "-"}</td>
                        <td>
                          {item.current_price 
                            ? `${item.current_price.toFixed(2)} ${item.currency || "USD"}` 
                            : "-"}
                        </td>
                        <td>
                          {item.dividend_yield 
                            ? `${(item.dividend_yield * 100).toFixed(2)}%` 
                            : "-"}
                        </td>
                        <td>
                          {item.next_dividend_date 
                            ? new Date(item.next_dividend_date).toLocaleDateString() 
                            : "-"}
                        </td>
                        <td>
                          {item.next_dividend_amount 
                            ? `${item.next_dividend_amount.toFixed(4)} ${item.currency || "USD"}` 
                            : "-"}
                        </td>
                        <td>{new Date(item.last_updated).toLocaleString()}</td>
                        <td>
                          <button
                            onClick={() => handleFetchMetadata(item.ticker)}
                            disabled={fetchingMetadata}
                            className="ghost-btn"
                            style={{ marginRight: "8px" }}
                          >
                            Update
                          </button>
                          <button
                            onClick={() => handleDelete(item.ticker)}
                            className="delete-btn-small"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {activeTab === "prices" && (
        <>
          <section className="admin-section">
            <h3>Upload Single Price</h3>
            <form onSubmit={handleUploadSingle} className="admin-form">
              <div className="admin-form-row">
                <input
                  type="text"
                  placeholder="Ticker (e.g., AAPL)"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value)}
                  disabled={uploading}
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  disabled={uploading}
                />
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  disabled={uploading}
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
                <button type="submit" disabled={uploading} className="primary-btn">
                  {uploading ? "Uploading..." : "Upload"}
                </button>
              </div>
            </form>
          </section>

          <section className="admin-section">
            <h3>Bulk Upload Prices</h3>
            <p className="chart-sub">Format: TICKER,PRICE,CURRENCY (one per line)</p>
            <form onSubmit={handleBulkUpload} className="admin-form">
              <textarea
                rows={8}
                placeholder="AAPL,150.25,USD&#10;GOOGL,2800.50,USD&#10;TSLA,200.00,USD"
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                disabled={bulkUploading}
                className="admin-textarea"
              />
              <button type="submit" disabled={bulkUploading} className="primary-btn">
                {bulkUploading ? "Uploading..." : "Bulk Upload"}
              </button>
            </form>
          </section>

          <section className="admin-section">
            <div className="admin-section-header">
              <h3>Stored Prices</h3>
              <form onSubmit={handleSearch} className="admin-search-form">
                <input
                  type="text"
                  placeholder="Search ticker..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button type="submit" className="ghost-btn">Search</button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="ghost-btn"
                >
                  Clear
                </button>
              </form>
            </div>
            
            {loading ? (
              <p>Loading prices...</p>
            ) : prices.length === 0 ? (
              <p className="chart-sub">No prices found.</p>
            ) : (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Ticker</th>
                      <th>Price</th>
                      <th>Currency</th>
                      <th>Updated At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prices.map((item) => (
                      <tr key={item.ticker}>
                        <td><strong>{item.ticker}</strong></td>
                        <td>{item.price.toFixed(2)}</td>
                        <td>{item.currency}</td>
                        <td>{new Date(item.updated_at).toLocaleString()}</td>
                        <td>
                          <button
                            onClick={() => handleDelete(item.ticker)}
                            className="delete-btn-small"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {activeTab === "api-settings" && (
        <>
          <section className="admin-section">
            <h3>API Providers Configuration</h3>
            <p className="chart-sub">
              Configure which API provider to use for fetching stock prices. 
              Yahoo Finance is always available as a free fallback.
            </p>
            
            {currentProvider && (
              <div className="current-provider-badge">
                <strong>Active Provider:</strong> {currentProvider}
              </div>
            )}
          </section>

          {loading ? (
            <section className="admin-section">
              <p>Loading API settings...</p>
            </section>
          ) : (
            providers.map((provider) => (
              <section key={provider.id} className="admin-section api-provider-card">
                <div className="api-provider-header">
                  <div className="api-provider-title">
                    <h3>{provider.name}</h3>
                    {provider.enabled && (
                      <span className="badge-active">ACTIVE</span>
                    )}
                    {!provider.requires_key && (
                      <span className="badge-free">FREE</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleTestProvider(provider.id)}
                    className="ghost-btn"
                    disabled={provider.requires_key && !provider.has_key}
                  >
                    Test Connection
                  </button>
                </div>

                <p className="chart-sub">{provider.description}</p>

                <div className="api-provider-details">
                  <div className="api-detail-item">
                    <strong>Rate Limits:</strong>
                    <span>{provider.limits}</span>
                  </div>
                  <div className="api-detail-item">
                    <strong>Markets:</strong>
                    <span>{provider.supported_markets.join(", ")}</span>
                  </div>
                  <div className="api-detail-item">
                    <strong>API Key Required:</strong>
                    <span>{provider.requires_key ? "Yes" : "No"}</span>
                  </div>
                  {provider.requires_key && (
                    <div className="api-detail-item">
                      <strong>API Key Status:</strong>
                      <span className={provider.has_key ? "status-ok" : "status-error"}>
                        {provider.has_key ? "✓ Configured" : "✗ Not Configured"}
                      </span>
                    </div>
                  )}
                </div>

                {provider.requires_key && !provider.has_key && (
                  <div className="api-config-hint">
                    <strong>⚠️ Setup Required:</strong>
                    <p>
                      Add <code>{provider.id === "finnhub" ? "FINNHUB_API_KEY" : "PRICE_API_KEY"}</code> to your <code>.env</code> file
                      and set <code>PRICE_API_PROVIDER={provider.id}</code> to enable this provider.
                    </p>
                  </div>
                )}
              </section>
            ))
          )}

          <section className="admin-section">
            <h3>Configuration Instructions</h3>
            <div className="config-instructions">
              <p>To change the active API provider, edit your <code>.env</code> file:</p>
              <pre className="config-example">
{`# Choose one of: yfinance, twelvedata, finnhub
PRICE_API_PROVIDER=twelvedata

# For Twelve Data
PRICE_API_KEY=your_twelvedata_api_key_here

# For Finnhub
FINNHUB_API_KEY=your_finnhub_api_key_here`}
              </pre>
              <p className="chart-sub">Restart the backend after changing these settings.</p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default AdminBackoffice;

import { useEffect, useMemo, useState } from "react";
import type { Translation } from "../content/translations";

type CategoryManagerProps = {
  portfolioId: number;
  categories: string[];
  token: string;
  t: Translation;
  onRefresh: () => void;
};

const API_BASE = "http://127.0.0.1:8000";

function CategoryManager({
  portfolioId,
  categories,
  token,
  t,
  onRefresh
}: CategoryManagerProps) {
  const [localCategories, setLocalCategories] = useState<string[]>(categories);
  const [newCategory, setNewCategory] = useState("");
  const [categoryMessage, setCategoryMessage] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [categorySettings, setCategorySettings] = useState<Record<string, boolean>>({});
  const [settingsError, setSettingsError] = useState("");

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  useEffect(() => {
    let active = true;
    setSettingsError("");
    fetch(`${API_BASE}/portfolios/${portfolioId}/categories/settings`, {
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
        const nextSettings: Record<string, boolean> = {};
        (data.items || []).forEach(
          (item: { category: string; is_investment: boolean }) => {
            nextSettings[item.category] = Boolean(item.is_investment);
          }
        );
        setCategorySettings(nextSettings);
      })
      .catch(() => {
        if (active) {
          setSettingsError(t.categories.investmentError);
        }
      });
    return () => {
      active = false;
    };
  }, [portfolioId, token, categories.join("|"), t.categories.investmentError]);

  const defaultCategories = useMemo(
    () => ["Cash", "Emergency Funds", "Retirement Plans", "Stocks"],
    []
  );

  const handleAddCategory = async () => {
    const trimmed = newCategory.trim();
    if (!trimmed) {
      return;
    }
    setCategoryError("");
    setCategoryMessage("");
    try {
      const response = await fetch(
        `${API_BASE}/portfolios/${portfolioId}/categories/add`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ category: trimmed })
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || "error");
      }
      setLocalCategories(data.categories || []);
      setNewCategory("");
      setCategoryMessage(t.imports.santander.addCategorySuccess);
      onRefresh();
    } catch (err) {
      setCategoryError(t.imports.santander.addCategoryError);
    }
  };

  const requestRemoveCategory = async (category: string, clearData: boolean) => {
    const response = await fetch(
      `${API_BASE}/portfolios/${portfolioId}/categories/remove`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ category, clear_data: clearData })
      }
    );
    const data = await response.json();
    return { response, data };
  };

  const handleRemoveCategory = async (category: string) => {
    setCategoryError("");
    setCategoryMessage("");
    try {
      const { response, data } = await requestRemoveCategory(category, false);
      if (response.status === 409) {
        const confirmed = window.confirm(t.imports.santander.removeWarning);
        if (!confirmed) {
          return;
        }
        const retry = await requestRemoveCategory(category, true);
        if (!retry.response.ok) {
          setCategoryError(retry.data?.detail || t.imports.santander.removeError);
          return;
        }
        setLocalCategories(retry.data.remaining || []);
        setCategoryMessage(t.imports.santander.removeSuccess);
        onRefresh();
        return;
      }
      if (!response.ok) {
        setCategoryError(data?.detail || t.imports.santander.removeError);
        return;
      }
      setLocalCategories(data.remaining || []);
      setCategoryMessage(t.imports.santander.removeSuccess);
      onRefresh();
    } catch (err) {
      setCategoryError(t.imports.santander.removeError);
    }
  };

  const updateCategorySetting = async (category: string, isInvestment: boolean) => {
    setSettingsError("");
    try {
      const response = await fetch(
        `${API_BASE}/portfolios/${portfolioId}/categories/settings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ category, is_investment: isInvestment })
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || "error");
      }
      setCategorySettings((prev) => ({
        ...prev,
        [category]: isInvestment
      }));
    } catch (err) {
      setSettingsError(t.categories.investmentError);
    }
  };

  return (
    <div className="import-card">
      <div className="import-card-head">
        <div>
          <h4>{t.categories.title}</h4>
          <p>{t.categories.investmentHint}</p>
        </div>
      </div>
      <div className="category-creator">
        <input
          type="text"
          value={newCategory}
          placeholder={t.imports.santander.addCategoryPlaceholder}
          onChange={(event) => setNewCategory(event.target.value)}
        />
        <button className="ghost-btn" type="button" onClick={handleAddCategory}>
          {t.imports.santander.addCategory}
        </button>
      </div>
      {categoryMessage ? <div className="login-banner">{categoryMessage}</div> : null}
      {categoryError ? <p className="login-error">{categoryError}</p> : null}
      {settingsError ? <p className="login-error">{settingsError}</p> : null}
      <div className="category-list">
        {localCategories
          .filter(
            (category) =>
              !defaultCategories.some(
                (item) => item.toLowerCase() === category.toLowerCase()
              )
          )
          .map((category) => (
            <button
              type="button"
              key={category}
              className="category-pill"
              onClick={() => handleRemoveCategory(category)}
            >
              {category} <span>Į-</span>
            </button>
          ))}
      </div>
      <div className="category-settings">
        <div className="category-settings-note">{t.categories.investmentHint}</div>
        {localCategories.map((category) => {
          const fallback = category.toLowerCase() !== "cash";
          const value =
            categorySettings[category] ??
            categorySettings[category.trim()] ??
            fallback;
          return (
            <label className="category-setting-row" key={category}>
              <span>{category}</span>
              <span className="category-setting-toggle">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(event) =>
                    updateCategorySetting(category, event.target.checked)
                  }
                />
                {t.categories.investmentLabel}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

export default CategoryManager;

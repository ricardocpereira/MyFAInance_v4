import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { Translation } from "../content/translations";

type LoginProps = {
  t: Translation;
  onLogin: (token: string) => void;
  mode: "signin" | "register" | "recover";
  onModeChange: (mode: "signin" | "register" | "recover") => void;
};

const API_BASE = "http://127.0.0.1:8000";

function Login({ t, onLogin, mode, onModeChange }: LoginProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<"request" | "reset">("request");

  const stats = useMemo(
    () => [
      { value: "100%", label: t.auth.stats.secure },
      { value: "INF", label: t.auth.stats.assets },
      { value: "24/7", label: t.auth.stats.access }
    ],
    [t]
  );

  const features = useMemo(
    () => [
      {
        title: t.auth.features.aggregate.title,
        description: t.auth.features.aggregate.description
      },
      {
        title: t.auth.features.profits.title,
        description: t.auth.features.profits.description
      },
      {
        title: t.auth.features.expenses.title,
        description: t.auth.features.expenses.description
      },
      {
        title: t.auth.features.retirement.title,
        description: t.auth.features.retirement.description
      }
    ],
    [t]
  );

  const resetState = () => {
    setError("");
    setInfo("");
    setCode("");
    setNewPassword("");
    setNeedsVerification(false);
    setSubmitting(false);
    setRecoveryStep("request");
    setCooldown(0);
  };

  const validate = () => {
    if (!email.trim()) {
      return t.auth.validation.emailRequired;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return t.auth.validation.emailInvalid;
    }
    if (!password.trim()) {
      return t.auth.validation.passwordRequired;
    }
    return "";
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    setError("");
    setInfo("");
    setSubmitting(true);

    const endpoint = mode === "register" ? "/auth/register" : "/auth/login";
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data?.detail || t.auth.validation.genericError);
        setSubmitting(false);
        return;
      }
      if (data.status === "verification_required") {
        setNeedsVerification(true);
        setInfo(t.auth.verification.sent);
        setCooldown(30);
        setSubmitting(false);
        return;
      }
      if (data.status === "ok" && data.token) {
        onLogin(data.token);
        navigate("/portfolios");
        return;
      }
      setError(t.auth.validation.genericError);
    } catch (err) {
      setError(t.auth.validation.networkError);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async () => {
    if (!code.trim()) {
      setError(t.auth.verification.codeRequired);
      return;
    }
    setError("");
    setInfo("");
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data?.detail || t.auth.verification.invalid);
        setSubmitting(false);
        return;
      }
      if (data.status === "verified") {
        setNeedsVerification(false);
        setInfo(t.auth.verification.verified);
        const loginResponse = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });
        const loginData = await loginResponse.json();
        if (!loginResponse.ok) {
          setError(loginData?.detail || t.auth.validation.genericError);
          setSubmitting(false);
          return;
        }
        if (loginData.token) {
          onLogin(loginData.token);
        }
        navigate("/portfolios");
        return;
      }
      setError(t.auth.verification.invalid);
    } catch (err) {
      setError(t.auth.validation.networkError);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setInfo("");
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/auth/resend-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data?.detail || t.auth.verification.resendError);
        return;
      }
      setInfo(t.auth.verification.sent);
      setCooldown(30);
    } catch (err) {
      setError(t.auth.validation.networkError);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecoveryRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) {
      setError(t.auth.validation.emailRequired);
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError(t.auth.validation.emailInvalid);
      return;
    }
    setError("");
    setInfo("");
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/auth/password/reset-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data?.detail || t.auth.recovery.sendError);
        return;
      }
      setInfo(t.auth.recovery.sent);
      setCooldown(30);
      setRecoveryStep("reset");
    } catch (err) {
      setError(t.auth.validation.networkError);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecoveryReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!code.trim()) {
      setError(t.auth.verification.codeRequired);
      return;
    }
    if (!newPassword.trim()) {
      setError(t.auth.validation.passwordRequired);
      return;
    }
    if (newPassword.trim().length < 6) {
      setError(t.auth.validation.passwordShort);
      return;
    }
    setError("");
    setInfo("");
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/auth/password/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, new_password: newPassword })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data?.detail || t.auth.recovery.resetError);
        return;
      }
      if (data.status === "reset") {
        setInfo(t.auth.recovery.resetDone);
      }
    } catch (err) {
      setError(t.auth.validation.networkError);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    resetState();
  }, [mode]);

  useEffect(() => {
    if (cooldown <= 0) {
      return undefined;
    }
    const timer = window.setInterval(() => {
      setCooldown((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  return (
    <section className="login-page">
      <div className="login-hero">
        <div className="hero-brand">
          <img src="/fainance-logo.png" alt="FAInance" />
          <span className="hero-pill">{t.auth.heroPill}</span>
        </div>
        <h1>
          {t.auth.heroTitle} <span>{t.auth.heroHighlight}</span>
        </h1>
        <p>{t.auth.heroSubtitle}</p>
        <div className="hero-actions">
          <button
            className="primary-btn"
            type="button"
            onClick={() => onModeChange("register")}
          >
            {t.auth.getStarted}
          </button>
          <button
            className="ghost-btn"
            type="button"
            onClick={() => onModeChange("signin")}
          >
            {t.auth.signIn}
          </button>
        </div>
        <div className="hero-stats">
          {stats.map((stat) => (
            <div key={stat.label} className="hero-stat">
              <h4>{stat.value}</h4>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
        <div className="hero-features">
          <div className="feature-head">
            <h3>{t.auth.features.title}</h3>
            <p>{t.auth.features.subtitle}</p>
          </div>
          <div className="feature-grid">
            {features.map((feature) => (
              <div key={feature.title} className="feature-card">
                <div className="feature-icon" />
                <h4>{feature.title}</h4>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="login-cta">
          <div>
            <h3>{t.auth.cta.title}</h3>
            <p>{t.auth.cta.subtitle}</p>
          </div>
          <button
            className="primary-btn"
            type="button"
            onClick={() => onModeChange("register")}
          >
            {t.auth.cta.button}
          </button>
        </div>
      </div>
      <div className="login-card">
        <h2>
          {mode === "recover"
            ? t.auth.recovery.title
            : mode === "register"
            ? t.auth.register
            : t.auth.card.title}
        </h2>
        {mode === "recover" ? (
          <>
            <p className="login-sub">{t.auth.recovery.subtitle}</p>
            {info ? <div className="login-banner">{info}</div> : null}
            {recoveryStep === "request" ? (
              <form className="login-form" onSubmit={handleRecoveryRequest}>
                <label>
                  <span>{t.auth.email}</span>
                  <input
                    type="email"
                    placeholder="you@email.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </label>
                {error ? <p className="login-error">{error}</p> : null}
                <button className="primary-btn full" type="submit" disabled={submitting}>
                  {t.auth.recovery.send}
                </button>
              </form>
            ) : (
              <form className="login-form" onSubmit={handleRecoveryReset}>
                <label>
                  <span>{t.auth.verification.label}</span>
                  <input
                    type="text"
                    placeholder={t.auth.verification.placeholder}
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                  />
                </label>
                <label>
                  <span>{t.auth.recovery.newPassword}</span>
                  <input
                    type="password"
                    placeholder="********"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                  />
                </label>
                {error ? <p className="login-error">{error}</p> : null}
                <button className="primary-btn full" type="submit" disabled={submitting}>
                  {t.auth.recovery.reset}
                </button>
              </form>
            )}
            <p className="login-footer">
              {t.auth.recovery.backToSignIn}{" "}
              <button type="button" className="link" onClick={() => onModeChange("signin")}>
                {t.auth.signIn}
              </button>
            </p>
          </>
        ) : (
          <>
            <p className="login-sub">
              {mode === "register" ? t.auth.card.registerHint : t.auth.card.subtitle}
            </p>
            {info ? <div className="login-banner">{info}</div> : null}
            <form className="login-form" onSubmit={handleSubmit}>
              <label>
                <span>{t.auth.email}</span>
                <input
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
              <label>
                <span>{t.auth.password}</span>
                <input
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>
              {needsVerification ? (
                <label>
                  <span>{t.auth.verification.label}</span>
                  <input
                    type="text"
                    placeholder={t.auth.verification.placeholder}
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                  />
                </label>
              ) : null}
              {error ? <p className="login-error">{error}</p> : null}
              {needsVerification ? (
                <div className="verification-row">
                  <button
                    className="primary-btn full"
                    type="button"
                    onClick={handleVerify}
                    disabled={submitting}
                  >
                    {t.auth.verification.verify}
                  </button>
                  <button
                    className="ghost-btn full"
                    type="button"
                    onClick={handleResend}
                    disabled={submitting || cooldown > 0}
                  >
                    {cooldown > 0
                      ? `${t.auth.verification.resendIn} ${cooldown}s`
                      : t.auth.verification.resend}
                  </button>
                </div>
              ) : (
                <button className="primary-btn full" type="submit" disabled={submitting}>
                  {mode === "register" ? t.auth.register : t.auth.signIn}
                </button>
              )}
            </form>
            <div className="divider"><span>{t.auth.card.or}</span></div>
            <p className="login-sub">{t.auth.card.socialHint}</p>
            <button className="ghost-btn full" type="button">
              {t.auth.continueGoogle}
            </button>
            <p className="login-footer">
              {mode === "register" ? t.auth.card.haveAccount : t.auth.noAccount}{" "}
              <button
                type="button"
                className="link"
                onClick={() => onModeChange(mode === "register" ? "signin" : "register")}
              >
                {mode === "register" ? t.auth.signIn : t.auth.register}
              </button>
            </p>
            {mode === "signin" ? (
              <p className="login-footer">
                {t.auth.recovery.forgot}{" "}
                <button type="button" className="link" onClick={() => onModeChange("recover")}>
                  {t.auth.recovery.recover}
                </button>
              </p>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}

export default Login;

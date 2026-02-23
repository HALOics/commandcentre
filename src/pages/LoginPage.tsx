import { useEffect, useState } from "react";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import type { AccountInfo } from "@azure/msal-browser";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { loginRequest, hasMsalConfig } from "../auth/msal";
import { clearAppSession, exchangeMicrosoftIdToken, hasAppSession, type AppSessionError } from "../auth/appSession";
import { isDevAuthenticated, setDevAuthenticated } from "../auth/devAuth";
import haloLogo from "../assets/halo-logo.svg";
import clientLogo from "../assets/client-logo.png";

const LOGIN_REDIRECT_INTENT_KEY = "halo_login_redirect_intent";

function MicrosoftIcon() {
  return (
    <svg className="ms-icon" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="1" y="1" width="10" height="10" fill="#f35325" />
      <rect x="13" y="1" width="10" height="10" fill="#81bc06" />
      <rect x="1" y="13" width="10" height="10" fill="#05a6f0" />
      <rect x="13" y="13" width="10" height="10" fill="#ffba08" />
    </svg>
  );
}

export default function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { instance } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const devAuthenticated = isDevAuthenticated();
  const appSession = hasAppSession();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [autoExchangeAttempted, setAutoExchangeAttempted] = useState(false);

  const targetPath = (location.state as { from?: string } | undefined)?.from || "/";

  function getExchangeErrorMessage(error: unknown): string {
    const appError = error as AppSessionError;
    const detail = (appError?.message || "").trim();
    const detailLower = detail.toLowerCase();

    if (detailLower.includes("server missing azure_client_id")) {
      return "Server auth config is missing AZURE_CLIENT_ID. Add it to .env and restart the app.";
    }
    if (detailLower.includes("token audience mismatch")) {
      return "Microsoft app mismatch: token audience does not match AZURE_CLIENT_ID.";
    }
    if (detailLower.includes("token issuer mismatch")) {
      return "Tenant mismatch: token issuer does not match the configured tenant.";
    }
    if (detailLower.includes("token expired")) {
      return "Microsoft token expired. Please try sign-in again.";
    }
    if (detailLower.includes("azure sql unavailable")) {
      return "HALO backend cannot reach Azure SQL right now. Please try again shortly.";
    }
    if (detailLower.includes("no matching user account")) {
      return "Microsoft sign-in succeeded, but your account is not mapped in HALO yet. Please contact an admin.";
    }

    if (appError?.status === 403) {
      return "Microsoft sign-in succeeded, but your account is not mapped in HALO yet. Please contact an admin.";
    }
    if (appError?.status === 401) {
      return detail
        ? `Microsoft sign-in could not be verified: ${detail}`
        : "Microsoft sign-in could not be verified. Please try again.";
    }
    if (appError?.status === 408) {
      return "Sign-in took too long. Please try again.";
    }
    if (appError?.status === 503) {
      return "Login service is temporarily unavailable (Azure SQL unavailable).";
    }
    return detail || "Unable to complete Microsoft sign-in. Check popup permissions and your Azure app setup.";
  }

  async function acquireIdTokenWithTimeout(account: AccountInfo): Promise<string> {
    const timeoutMs = 30000;
    const timeoutPromise = new Promise<never>((_, reject) =>
      window.setTimeout(() => reject(new Error("Token acquisition timed out")), timeoutMs)
    );
    const tokenPromise = instance.acquireTokenSilent({ ...loginRequest, account });
    const result = await Promise.race([tokenPromise, timeoutPromise]);
    return result.idToken;
  }

  async function finalizeMicrosoftSignIn(idToken: string): Promise<void> {
    await exchangeMicrosoftIdToken(idToken);
    navigate(targetPath, { replace: true });
  }

  useEffect(() => {
    if (!isAuthenticated) {
      setAutoExchangeAttempted(false);
      return;
    }

    if (appSession || pending || autoExchangeAttempted) return;
    const hasLoginIntent = window.sessionStorage.getItem(LOGIN_REDIRECT_INTENT_KEY) === "1";
    if (!hasLoginIntent) return;
    const active = instance.getActiveAccount() ?? instance.getAllAccounts()[0];
    if (!active) return;

    let cancelled = false;
    setAutoExchangeAttempted(true);
    setPending(true);
    setError("");

    acquireIdTokenWithTimeout(active)
      .then((tokenResult) => {
        if (cancelled) return;
        window.sessionStorage.removeItem(LOGIN_REDIRECT_INTENT_KEY);
        return finalizeMicrosoftSignIn(tokenResult);
      })
      .catch((authError) => {
        if (cancelled) return;
        console.error(authError);
        window.sessionStorage.removeItem(LOGIN_REDIRECT_INTENT_KEY);
        clearAppSession();
        // Keep startup silent when a stale cached Microsoft session cannot be exchanged.
        setError("");
      })
      .finally(() => {
        if (!cancelled) setPending(false);
      });

    return () => {
      cancelled = true;
    };
  }, [appSession, autoExchangeAttempted, instance, isAuthenticated, pending, targetPath]);

  useEffect(() => {
    if (!pending) return;

    const watchdog = window.setTimeout(() => {
      setPending(false);
      window.sessionStorage.removeItem(LOGIN_REDIRECT_INTENT_KEY);
      setError("Sign-in is taking longer than expected. Please click Continue with Microsoft again.");
    }, 60000);

    return () => window.clearTimeout(watchdog);
  }, [pending]);

  async function handleMicrosoftLogin() {
    if (pending) return;
    setError("");

    if (!hasMsalConfig) {
      setError("Microsoft app settings are missing. Add VITE_AZURE_CLIENT_ID before logging in.");
      return;
    }

    try {
      setPending(true);
      if (isAuthenticated) {
        const active = instance.getActiveAccount() ?? instance.getAllAccounts()[0];
        if (!active) {
          throw new Error("No active Microsoft account found.");
        }
        const idToken = await acquireIdTokenWithTimeout(active);
        await finalizeMicrosoftSignIn(idToken);
        return;
      }

      window.sessionStorage.setItem(LOGIN_REDIRECT_INTENT_KEY, "1");
      await instance.loginRedirect(loginRequest);
      return;
    } catch (loginError) {
      console.error(loginError);
      clearAppSession();
      setError(getExchangeErrorMessage(loginError));
    } finally {
      setPending(false);
    }
  }

  function handleDevLogin() {
    setDevAuthenticated(true);
    navigate(targetPath, { replace: true });
  }

  if (devAuthenticated || (isAuthenticated && appSession)) {
    return <Navigate to={targetPath} replace />;
  }

  return (
    <div className="login-shell">
      <section className="login-feature-panel">
        <div className="login-halo-mark" aria-label="HALO logo">
          <img src={haloLogo} alt="HALO logo" />
        </div>
        <h1>Command Centre</h1>
        <p>
          Password-free access only. Sign in with your Microsoft 365 identity to open the live HALO operational
          workspace.
        </p>

        <ul className="feature-list">
          <li>Microsoft Entra single sign-on</li>
          <li>Role-aware operational workspace</li>
          <li>Live incidents, rota, and eMAR signals</li>
        </ul>
      </section>

      <section className="login-card" aria-label="Sign in with Microsoft">
        <div className="login-logo-row" aria-label="Client logo">
          <img className="brand-logo-image brand-logo-client-single" src={clientLogo} alt="Client logo" />
        </div>

        <div>
          <h2>Welcome back</h2>
          <p>Use your organization Microsoft account to continue.</p>
        </div>

        {error ? <div className="alert-error">{error}</div> : null}

        <button className="btn-microsoft" onClick={handleMicrosoftLogin} disabled={pending}>
          <MicrosoftIcon />
          {pending ? "Connecting..." : "Continue with Microsoft"}
        </button>
        <button className="btn-dev" onClick={handleDevLogin} disabled={pending}>
          Temporary dev login
        </button>

        <small>Password login is disabled. Dev login is temporary and local-only.</small>
      </section>

      <footer className="login-footer" aria-label="Version and legal information">
        <p>
          v0.1.0 | 2026 © HALO Integrated Care Solutions Ltd. All rights reserved. |{" "}
          <a href="https://www.haloics.com" target="_blank" rel="noreferrer">
            www.haloics.com
          </a>
        </p>
        <p>
          Registered address: Unit 29 Highcroft Industrial Estate Enterprise Road, Horndean, Waterlooville, United
          Kingdom, PO8 0BT
        </p>
      </footer>
    </div>
  );
}

import { useState } from "react";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { loginRequest, hasMsalConfig } from "../auth/msal";
import { isDevAuthenticated, setDevAuthenticated } from "../auth/devAuth";
import haloLogo from "../assets/halo-logo.svg";
import clientLogo from "../assets/client-logo.png";

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
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const targetPath = (location.state as { from?: string } | undefined)?.from || "/";

  async function handleMicrosoftLogin() {
    setError("");

    if (!hasMsalConfig) {
      setError("Microsoft app settings are missing. Add VITE_AZURE_CLIENT_ID before logging in.");
      return;
    }

    try {
      setPending(true);
      const result = await instance.loginPopup(loginRequest);
      if (result.account) {
        instance.setActiveAccount(result.account);
      }
    } catch (loginError) {
      console.error(loginError);
      setError("Unable to complete Microsoft sign-in. Check popup permissions and your Azure app setup.");
    } finally {
      setPending(false);
    }
  }

  function handleDevLogin() {
    setDevAuthenticated(true);
    navigate(targetPath, { replace: true });
  }

  if (isAuthenticated || devAuthenticated) {
    return <Navigate to={targetPath} replace />;
  }

  return (
    <div className="login-shell">
      <section className="login-feature-panel">
        <div className="login-halo-mark" aria-label="HALO logo">
          <img src={haloLogo} alt="HALO logo" />
        </div>
        <h1>Halo Command Centre</h1>
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

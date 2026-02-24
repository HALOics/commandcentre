import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  clearAppSession,
  completeMagicLogin,
  enableTotp,
  hasAppSession,
  requestEmailMagicLink,
  requestTotpSetup,
  type AppSessionError,
  verifyEmailMagicLink
} from "../auth/appSession";
import { isDevAuthenticated, setDevAuthenticated } from "../auth/devAuth";
import haloLogo from "../assets/halo-logo.svg";
import clientLogo from "../assets/client-logo.png";

const POST_LOGIN_TARGET_KEY = "halo_post_login_target";

function getDeviceFingerprint(): { fingerprint: string; label: string } {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown";
  const screenSize = typeof window !== "undefined" ? `${window.screen.width}x${window.screen.height}` : "0x0";
  const payload = [
    navigator.userAgent || "",
    navigator.platform || "",
    navigator.language || "",
    timezone,
    screenSize
  ].join("|");

  const labelBase = `${navigator.platform || "Device"} · ${navigator.language || "en"}`;
  return {
    fingerprint: payload,
    label: labelBase.slice(0, 180)
  };
}

export default function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const devAuthenticated = isDevAuthenticated();
  const appSession = hasAppSession();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [email, setEmail] = useState("");
  const [challengeToken, setChallengeToken] = useState("");
  const [requiresTotpSetup, setRequiresTotpSetup] = useState(false);
  const [manualKey, setManualKey] = useState("");
  const [otpauthUri, setOtpauthUri] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const verifiedMagicTokenRef = useRef<string | null>(null);
  const [, setSessionVersion] = useState(0);
  const totpQrCodeUrl = useMemo(
    () =>
      otpauthUri
        ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(otpauthUri)}`
        : "",
    [otpauthUri]
  );

  const targetPath =
    (location.state as { from?: string } | undefined)?.from || localStorage.getItem(POST_LOGIN_TARGET_KEY) || "/";

  function getExchangeErrorMessage(rawError: unknown): string {
    const appError = rawError as AppSessionError;
    const detail = (appError?.message || "").trim();

    if (appError?.status === 401) {
      return detail || "Your sign-in link or authenticator code is invalid or expired.";
    }
    if (appError?.status === 403) {
      return detail || "You do not have access to this action.";
    }
    if (appError?.status === 429) {
      return detail || "Too many attempts. Please wait and try again.";
    }
    if (appError?.status === 503) {
      return "Login service is temporarily unavailable (database unavailable).";
    }
    if (appError?.status === 504) {
      return detail || "Sign-in verification timed out. Please request a new link and try again.";
    }
    return detail || "Unable to complete sign-in right now.";
  }

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === "halo_app_session_token" || event.key === "halo_app_session_expires_at") {
        setSessionVersion((value) => value + 1);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    const token = new URLSearchParams(location.search).get("magic_token");
    if (!token || verifiedMagicTokenRef.current === token) return;

    let cancelled = false;
    verifiedMagicTokenRef.current = token;
    setPending(true);
    setError("");
    setInfo("Verifying sign-in link...");

    verifyEmailMagicLink(token)
      .then((result) => {
        if (cancelled) return;
        setChallengeToken(result.challengeToken);
        setRequiresTotpSetup(result.requiresTotpSetup);
        setInfo(result.requiresTotpSetup ? "Set up your authenticator app to continue." : "Enter your authenticator code to continue.");
      })
      .catch((verifyError) => {
        if (cancelled) return;
        verifiedMagicTokenRef.current = null;
        clearAppSession();
        setInfo("");
        setError(getExchangeErrorMessage(verifyError));
      })
      .finally(() => {
        if (!cancelled) setPending(false);
      });

    return () => {
      cancelled = true;
    };
  }, [location.search]);

  async function handleEmailMagicLinkRequest() {
    if (pending) return;
    setError("");
    setInfo("");

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setError("Enter an email address to continue.");
      return;
    }

    try {
      setPending(true);
      await requestEmailMagicLink(normalizedEmail);
      setInfo("If the account exists, a sign-in link has been sent.");
    } catch (requestError) {
      setError(getExchangeErrorMessage(requestError));
    } finally {
      setPending(false);
    }
  }

  async function handleStartTotpSetup() {
    if (!challengeToken || pending) return;
    setError("");

    try {
      setPending(true);
      const setup = await requestTotpSetup(challengeToken);
      setManualKey(setup.manualKey);
      setOtpauthUri(setup.otpauthUri);
      setInfo("Add this account in your authenticator app, then enter the 6-digit code.");
    } catch (setupError) {
      setError(getExchangeErrorMessage(setupError));
    } finally {
      setPending(false);
    }
  }

  async function handleCompleteSignIn() {
    if (!challengeToken || pending) return;
    setError("");

    if (!/^\d{6}$/.test(totpCode.trim())) {
      setError("Enter the 6-digit authenticator code.");
      return;
    }

    try {
      setPending(true);
      if (requiresTotpSetup) {
        await enableTotp(challengeToken, totpCode.trim());
      }

      const device = getDeviceFingerprint();
      const result = await completeMagicLogin({
        challengeToken,
        code: totpCode.trim(),
        deviceFingerprint: device.fingerprint,
        deviceLabel: device.label
      });

      if (result.pendingApproval) {
        setInfo("This is a new device. Login is pending admin approval.");
        return;
      }

      try {
        localStorage.removeItem(POST_LOGIN_TARGET_KEY);
      } catch {
        // ignore storage failures
      }
      navigate(targetPath, { replace: true });
    } catch (loginError) {
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

  const showTotpPanel = useMemo(() => Boolean(challengeToken), [challengeToken]);

  if (devAuthenticated || appSession) {
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
          Password-free access. Sign in with your email link, verify with authenticator code, and use approved
          devices only.
        </p>

        <ul className="feature-list">
          <li>Email magic-link sign in</li>
          <li>Authenticator app (MFA) verification</li>
          <li>Admin approval required for new devices</li>
        </ul>
      </section>

      <section className="login-card" aria-label="Sign in">
        <div className="login-logo-row" aria-label="Client logo">
          <img className="brand-logo-image brand-logo-client-single" src={clientLogo} alt="Client logo" />
        </div>

        <div>
          <h2>Welcome back</h2>
          <p>Enter your work email to continue.</p>
        </div>

        {error ? <div className="alert-error">{error}</div> : null}
        {info ? <div className="alert-success">{info}</div> : null}

        {!showTotpPanel ? (
          <>
            <label className="form-field">
              <span>Email address</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@company.com"
                disabled={pending}
              />
            </label>
            <button className="btn-solid" onClick={handleEmailMagicLinkRequest} disabled={pending}>
              {pending ? "Working..." : "Send sign-in link"}
            </button>
          </>
        ) : (
          <>
            {requiresTotpSetup ? (
              <>
                <button className="btn-outline" onClick={handleStartTotpSetup} disabled={pending || Boolean(manualKey)}>
                  {manualKey ? "Authenticator setup ready" : "Setup authenticator"}
                </button>
                {manualKey ? (
                  <div className="summary-copy">
                    Manual key: <strong>{manualKey}</strong>
                  </div>
                ) : null}
                {totpQrCodeUrl ? (
                  <div className="totp-qr-block">
                    <img src={totpQrCodeUrl} alt="Authenticator QR code" width={180} height={180} />
                  </div>
                ) : null}
                {otpauthUri ? (
                  <a className="summary-copy" href={otpauthUri}>
                    Open authenticator setup link
                  </a>
                ) : null}
              </>
            ) : null}

            <label className="form-field">
              <span>Authenticator code</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={totpCode}
                onChange={(event) => setTotpCode(event.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                disabled={pending}
              />
            </label>
            <button className="btn-solid" onClick={handleCompleteSignIn} disabled={pending}>
              {pending ? "Verifying..." : "Complete sign in"}
            </button>
          </>
        )}

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

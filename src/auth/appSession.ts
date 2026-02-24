const APP_SESSION_TOKEN_KEY = "halo_app_session_token";
const APP_SESSION_EXP_KEY = "halo_app_session_expires_at";

type ExchangeResponse = {
  data?: {
    sessionToken: string;
    expiresAt: string;
  };
  error?: string;
};

type MagicVerifyData = {
  challengeToken: string;
  expiresAt: string;
  requiresTotpSetup: boolean;
};

export type AppSessionError = Error & {
  status?: number;
};

type MeResponse = {
  data?: unknown;
  error?: string;
};

export function getAppSessionToken(): string | null {
  return localStorage.getItem(APP_SESSION_TOKEN_KEY);
}

export function hasAppSession(): boolean {
  const token = getAppSessionToken();
  if (!token) return false;

  const expiresRaw = localStorage.getItem(APP_SESSION_EXP_KEY);
  if (!expiresRaw) return true;

  const expires = Date.parse(expiresRaw);
  if (Number.isNaN(expires)) return true;
  return expires > Date.now();
}

export function setAppSession(token: string, expiresAt?: string): void {
  localStorage.setItem(APP_SESSION_TOKEN_KEY, token);
  if (expiresAt) {
    localStorage.setItem(APP_SESSION_EXP_KEY, expiresAt);
  } else {
    localStorage.removeItem(APP_SESSION_EXP_KEY);
  }
}

export function clearAppSession(): void {
  localStorage.removeItem(APP_SESSION_TOKEN_KEY);
  localStorage.removeItem(APP_SESSION_EXP_KEY);
}

export async function requestEmailMagicLink(email: string): Promise<void> {
  const response = await fetch("/api/auth/email/request-link", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });

  const payload = (await response.json()) as { error?: string };
  if (!response.ok) {
    const error = new Error(payload.error || "Unable to send sign-in link.") as AppSessionError;
    error.status = response.status;
    throw error;
  }
}

export async function verifyEmailMagicLink(token: string): Promise<MagicVerifyData> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch("/api/auth/email/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
      signal: controller.signal
    });

    const payload = (await response.json()) as { data?: MagicVerifyData; error?: string };
    if (!response.ok || !payload.data?.challengeToken) {
      const error = new Error(payload.error || "Magic link is invalid or expired.") as AppSessionError;
      error.status = response.status;
      throw error;
    }

    return payload.data;
  } catch (error) {
    if ((error as { name?: string }).name === "AbortError") {
      const timeoutError = new Error("Sign-in verification timed out. Please request a new link and try again.") as AppSessionError;
      timeoutError.status = 504;
      throw timeoutError;
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function requestTotpSetup(challengeToken: string): Promise<{ manualKey: string; otpauthUri: string }> {
  const response = await fetch("/api/auth/totp/setup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ challengeToken })
  });
  const payload = (await response.json()) as { data?: { manualKey: string; otpauthUri: string }; error?: string };
  if (!response.ok || !payload.data) {
    const error = new Error(payload.error || "Unable to start authenticator setup.") as AppSessionError;
    error.status = response.status;
    throw error;
  }
  return payload.data;
}

export async function enableTotp(challengeToken: string, code: string): Promise<void> {
  const response = await fetch("/api/auth/totp/enable", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ challengeToken, code })
  });
  const payload = (await response.json()) as { error?: string };
  if (!response.ok) {
    const error = new Error(payload.error || "Unable to verify authenticator code.") as AppSessionError;
    error.status = response.status;
    throw error;
  }
}

export async function completeMagicLogin(params: {
  challengeToken: string;
  code: string;
  deviceFingerprint: string;
  deviceLabel: string;
}): Promise<{ pendingApproval: boolean }> {
  const response = await fetch("/api/auth/login/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params)
  });

  const payload = (await response.json()) as ExchangeResponse & { data?: { pendingApproval?: boolean } };
  if (response.status === 202) {
    return { pendingApproval: true };
  }

  if (!response.ok || !payload.data || !("sessionToken" in payload.data)) {
    const error = new Error(payload.error || "Unable to complete sign-in.") as AppSessionError;
    error.status = response.status;
    throw error;
  }

  const sessionData = payload.data as { sessionToken: string; expiresAt: string };
  setAppSession(sessionData.sessionToken, sessionData.expiresAt);
  return { pendingApproval: false };
}

export async function loadPendingDevices(): Promise<
  Array<{
    deviceId: string;
    userId: number;
    username: string;
    displayName: string;
    companyName: string;
    deviceLabel: string;
    status: string;
    requestedAt: string;
  }>
> {
  const token = getAppSessionToken();
  if (!token) {
    throw new Error("Session expired");
  }
  const response = await fetch("/api/auth/devices/pending", {
    headers: { Authorization: `Bearer ${token}` }
  });
  const payload = (await response.json()) as { data?: Array<any>; error?: string };
  if (!response.ok) {
    const error = new Error(payload.error || "Unable to load pending devices.") as AppSessionError;
    error.status = response.status;
    throw error;
  }
  return payload.data || [];
}

export async function approvePendingDevice(deviceId: string): Promise<void> {
  const token = getAppSessionToken();
  if (!token) throw new Error("Session expired");
  const response = await fetch(`/api/auth/devices/${encodeURIComponent(deviceId)}/approve`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
  const payload = (await response.json()) as { error?: string };
  if (!response.ok) {
    const error = new Error(payload.error || "Unable to approve device.") as AppSessionError;
    error.status = response.status;
    throw error;
  }
}

export async function rejectPendingDevice(deviceId: string): Promise<void> {
  const token = getAppSessionToken();
  if (!token) throw new Error("Session expired");
  const response = await fetch(`/api/auth/devices/${encodeURIComponent(deviceId)}/reject`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
  const payload = (await response.json()) as { error?: string };
  if (!response.ok) {
    const error = new Error(payload.error || "Unable to reject device.") as AppSessionError;
    error.status = response.status;
    throw error;
  }
}

export async function logoutAppSession(): Promise<void> {
  const token = getAppSessionToken();
  if (!token) {
    clearAppSession();
    return;
  }

  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
  } catch {
    // Ignore network failures and clear local session anyway.
  } finally {
    clearAppSession();
  }
}

export async function validateStoredAppSession(): Promise<boolean> {
  const token = getAppSessionToken();
  if (!token) return false;

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch("/api/auth/me", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        clearAppSession();
      }
      return false;
    }

    const payload = (await response.json()) as MeResponse;
    if (!payload.data) {
      clearAppSession();
      return false;
    }

    return true;
  } catch {
    return hasAppSession();
  } finally {
    window.clearTimeout(timeoutId);
  }
}

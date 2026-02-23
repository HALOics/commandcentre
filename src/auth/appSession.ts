const APP_SESSION_TOKEN_KEY = "halo_app_session_token";
const APP_SESSION_EXP_KEY = "halo_app_session_expires_at";

type ExchangeResponse = {
  data?: {
    sessionToken: string;
    expiresAt: string;
  };
  error?: string;
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

export async function exchangeMicrosoftIdToken(idToken: string): Promise<void> {
  const controller = new AbortController();
  const timeoutMs = 45000;
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;

  try {
    response = await fetch("/api/auth/microsoft/exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
      signal: controller.signal
    });
  } catch (error) {
    if ((error as DOMException)?.name === "AbortError") {
      const timeoutError = new Error("Sign-in exchange timed out. Please try again.") as AppSessionError;
      timeoutError.status = 408;
      throw timeoutError;
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }

  const payload = (await response.json()) as ExchangeResponse;

  if (!response.ok || !payload.data?.sessionToken) {
    const error = new Error(payload.error || "Unable to exchange Microsoft token.") as AppSessionError;
    error.status = response.status;
    throw error;
  }

  setAppSession(payload.data.sessionToken, payload.data.expiresAt);
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

  try {
    const response = await fetch("/api/auth/me", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` }
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
  }
}

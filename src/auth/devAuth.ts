const DEV_AUTH_KEY = "halo_dev_auth";

export function isDevAuthenticated(): boolean {
  return localStorage.getItem(DEV_AUTH_KEY) === "true";
}

export function setDevAuthenticated(isAuthenticated: boolean): void {
  if (isAuthenticated) {
    localStorage.setItem(DEV_AUTH_KEY, "true");
    return;
  }

  localStorage.removeItem(DEV_AUTH_KEY);
}

import { useEffect, useState } from "react";
import { useIsAuthenticated } from "@azure/msal-react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { hasAppSession } from "../auth/appSession";
import { isDevAuthenticated } from "../auth/devAuth";

const POST_LOGIN_TARGET_KEY = "halo_post_login_target";

export default function ProtectedRoute() {
  const [, setSessionVersion] = useState(0);
  const isAuthenticated = useIsAuthenticated();
  const devAuthenticated = isDevAuthenticated();
  const appSession = hasAppSession();
  const location = useLocation();
  const hasAnyAuth = devAuthenticated || appSession || isAuthenticated;

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === "halo_app_session_token" || event.key === "halo_app_session_expires_at") {
        setSessionVersion((value) => value + 1);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (!hasAnyAuth) {
    try {
      localStorage.setItem(POST_LOGIN_TARGET_KEY, location.pathname || "/");
    } catch {
      // ignore storage failures
    }
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

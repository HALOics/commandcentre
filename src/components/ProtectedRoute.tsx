import { useIsAuthenticated } from "@azure/msal-react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { hasAppSession } from "../auth/appSession";
import { isDevAuthenticated } from "../auth/devAuth";

export default function ProtectedRoute() {
  const isAuthenticated = useIsAuthenticated();
  const devAuthenticated = isDevAuthenticated();
  const appSession = hasAppSession();
  const location = useLocation();

  if (!devAuthenticated && (!isAuthenticated || !appSession)) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

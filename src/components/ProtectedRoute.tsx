import { useIsAuthenticated } from "@azure/msal-react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isDevAuthenticated } from "../auth/devAuth";

export default function ProtectedRoute() {
  const isAuthenticated = useIsAuthenticated();
  const devAuthenticated = isDevAuthenticated();
  const location = useLocation();

  if (!isAuthenticated && !devAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

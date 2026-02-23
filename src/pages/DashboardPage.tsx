import { useEffect, useMemo, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { getAppSessionToken, logoutAppSession } from "../auth/appSession";
import { setDevAuthenticated } from "../auth/devAuth";
import {
  DashboardPreferences,
  WidgetId,
  WidgetSize,
  defaultWidgetOrder,
  defaultWidgetSizes,
  getDashboardStorageKey,
  getWidgetSizeClass,
  sanitizeHiddenWidgets,
  sanitizeWidgetOrder,
  sanitizeWidgetSizes,
  widgetMeta
} from "../widgets/dashboardConfig";
import { renderWidgetBody } from "../widgets/widgetContent";

export default function DashboardPage() {
  const { accounts, instance } = useMsal();
  const [order, setOrder] = useState<WidgetId[]>(defaultWidgetOrder);
  const [hidden, setHidden] = useState<WidgetId[]>([]);
  const [sizes, setSizes] = useState<Record<WidgetId, WidgetSize>>(defaultWidgetSizes);
  const [companyName, setCompanyName] = useState("HALO");

  const account = instance.getActiveAccount() ?? accounts[0];
  const displayName = account?.name || account?.username || "User";
  const accountKey = account?.homeAccountId || account?.username || "local";
  const storageKey = getDashboardStorageKey(accountKey);

  const visibleOrder = useMemo(() => order.filter((id) => !hidden.includes(id)), [hidden, order]);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (!saved) {
      return;
    }

    try {
      const parsed = JSON.parse(saved) as DashboardPreferences;
      if (Array.isArray(parsed.order)) {
        setOrder(sanitizeWidgetOrder(parsed.order));
      }
      if (Array.isArray(parsed.hidden)) {
        setHidden(sanitizeHiddenWidgets(parsed.hidden));
      }
      setSizes(sanitizeWidgetSizes(parsed.sizes));
    } catch (error) {
      console.error("Unable to parse widget preferences", error);
    }
  }, [storageKey]);

  useEffect(() => {
    const token = getAppSessionToken();
    if (!token) return;

    let cancelled = false;

    fetch("/api/auth/me", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (cancelled || !payload?.data?.user?.companyName) return;
        setCompanyName(String(payload.data.user.companyName));
      })
      .catch(() => {
        // Keep fallback text if session lookup fails.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    setDevAuthenticated(false);
    await logoutAppSession();

    if (!account) {
      window.location.assign("/login");
      return;
    }

    try {
      await instance.logoutPopup({
        account,
        mainWindowRedirectUri: window.location.origin
      });
    } catch (error) {
      console.error("Logout failed", error);
      window.location.assign("/login");
    }
  }

  return (
    <section className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Home</p>
          <h1>{`${companyName} Operations Dashboard`}</h1>
          <p>{`Welcome: ${displayName}`}</p>
        </div>
        <button type="button" className="btn-outline" onClick={() => void handleLogout()}>
          Log out
        </button>
      </header>

      <div className="widget-grid">
        {visibleOrder.map((id) => (
          <article key={id} className={`widget-card ${getWidgetSizeClass(sizes[id])}`}>
            <header>
              <h2>{widgetMeta[id].title}</h2>
            </header>
            {renderWidgetBody(id, sizes[id])}
          </article>
        ))}
      </div>
    </section>
  );
}

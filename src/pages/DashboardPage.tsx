import { useEffect, useMemo, useState } from "react";
import { useMsal } from "@azure/msal-react";
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

  const account = instance.getActiveAccount() ?? accounts[0];
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

  return (
    <section className="dashboard-page">
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

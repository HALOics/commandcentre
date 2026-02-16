export type WidgetId =
  | "announcement"
  | "people"
  | "incidents"
  | "alerts"
  | "team"
  | "todos"
  | "rota"
  | "calendar"
  | "emar"
  | "support"
  | "supportFeedback";

export type WidgetSize = "brief" | "standard" | "detailed";

export type DashboardPreferences = {
  order: WidgetId[];
  hidden: WidgetId[];
  sizes?: Partial<Record<WidgetId, WidgetSize>>;
};

export type WidgetMeta = {
  title: string;
};

export const lockedWidgets: WidgetId[] = ["announcement"];

export const defaultWidgetOrder: WidgetId[] = [
  "announcement",
  "people",
  "incidents",
  "alerts",
  "team",
  "todos",
  "rota",
  "calendar",
  "emar",
  "support",
  "supportFeedback"
];

export const defaultWidgetSizes: Record<WidgetId, WidgetSize> = {
  announcement: "detailed",
  people: "standard",
  incidents: "standard",
  alerts: "standard",
  team: "standard",
  todos: "standard",
  rota: "standard",
  calendar: "standard",
  emar: "standard",
  support: "standard",
  supportFeedback: "standard"
};

export const widgetMeta: Record<WidgetId, WidgetMeta> = {
  announcement: { title: "Updates" },
  people: { title: "Service Users" },
  incidents: { title: "Incidents" },
  alerts: { title: "Alerts" },
  team: { title: "Team" },
  todos: { title: "Today's To-Do's" },
  rota: { title: "Rota View" },
  calendar: { title: "Calendar" },
  emar: { title: "emar" },
  support: { title: "Support Plans" },
  supportFeedback: { title: "Support Feedback" }
};

function isValidWidgetSize(input: unknown): input is WidgetSize {
  return input === "brief" || input === "standard" || input === "detailed";
}

export function isWidgetLocked(id: WidgetId): boolean {
  return lockedWidgets.includes(id);
}

export function sanitizeWidgetOrder(input: WidgetId[]): WidgetId[] {
  const unlockedDefaults = defaultWidgetOrder.filter((id) => !isWidgetLocked(id));
  const incomingUnlocked = input.filter((id) => unlockedDefaults.includes(id));
  const missingUnlocked = unlockedDefaults.filter((id) => !incomingUnlocked.includes(id));
  return [...lockedWidgets, ...incomingUnlocked, ...missingUnlocked];
}

export function sanitizeHiddenWidgets(input: WidgetId[]): WidgetId[] {
  return input.filter((id) => defaultWidgetOrder.includes(id) && !isWidgetLocked(id));
}

export function sanitizeWidgetSizes(
  input: Partial<Record<WidgetId, WidgetSize>> | undefined
): Record<WidgetId, WidgetSize> {
  const merged: Record<WidgetId, WidgetSize> = { ...defaultWidgetSizes };

  if (!input) {
    return merged;
  }

  for (const id of defaultWidgetOrder) {
    const value = input[id];
    if (isValidWidgetSize(value)) {
      merged[id] = value;
    }
  }

  return merged;
}

export function moveWidgetToPosition(order: WidgetId[], source: WidgetId, target: WidgetId): WidgetId[] {
  if (isWidgetLocked(source)) {
    return order;
  }

  const unlocked = order.filter((id) => !isWidgetLocked(id));
  const sourceIndex = unlocked.indexOf(source);

  if (sourceIndex < 0) {
    return order;
  }

  unlocked.splice(sourceIndex, 1);

  const targetIndex = isWidgetLocked(target) ? 0 : unlocked.indexOf(target);
  if (targetIndex < 0) {
    unlocked.push(source);
  } else {
    unlocked.splice(targetIndex, 0, source);
  }

  return sanitizeWidgetOrder([...lockedWidgets, ...unlocked]);
}

export function getWidgetSizeClass(size: WidgetSize): "widget-span-2" | "widget-span-4" | "widget-span-8" {
  if (size === "brief") {
    return "widget-span-2";
  }

  if (size === "detailed") {
    return "widget-span-8";
  }

  return "widget-span-4";
}

export function getDashboardStorageKey(accountKey: string): string {
  return `halo_dashboard_widgets_${accountKey}`;
}

export type TextScaleOption = "small" | "default" | "large" | "xlarge";

export type AccessibilityPreferences = {
  colorblindMode: boolean;
  textScale: TextScaleOption;
};

const ACCESSIBILITY_STORAGE_KEY = "halo_accessibility_preferences";

const textScaleMultiplierMap: Record<TextScaleOption, number> = {
  small: 0.92,
  default: 1,
  large: 1.08,
  xlarge: 1.16
};

export const textScaleOptions: Array<{ id: TextScaleOption; label: string; note: string }> = [
  { id: "small", label: "Small", note: "92%" },
  { id: "default", label: "Default", note: "100%" },
  { id: "large", label: "Large", note: "108%" },
  { id: "xlarge", label: "Extra Large", note: "116%" }
];

export const defaultAccessibilityPreferences: AccessibilityPreferences = {
  colorblindMode: false,
  textScale: "default"
};

function isTextScaleOption(value: unknown): value is TextScaleOption {
  return value === "small" || value === "default" || value === "large" || value === "xlarge";
}

function sanitizeAccessibilityPreferences(
  input: Partial<AccessibilityPreferences> | null | undefined
): AccessibilityPreferences {
  const nextColorblindMode =
    typeof input?.colorblindMode === "boolean"
      ? input.colorblindMode
      : defaultAccessibilityPreferences.colorblindMode;
  const nextTextScale = isTextScaleOption(input?.textScale)
    ? input.textScale
    : defaultAccessibilityPreferences.textScale;

  return {
    colorblindMode: nextColorblindMode,
    textScale: nextTextScale
  };
}

export function readAccessibilityPreferences(): AccessibilityPreferences {
  if (typeof window === "undefined") {
    return defaultAccessibilityPreferences;
  }

  const raw = window.localStorage.getItem(ACCESSIBILITY_STORAGE_KEY);
  if (!raw) {
    return defaultAccessibilityPreferences;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AccessibilityPreferences>;
    return sanitizeAccessibilityPreferences(parsed);
  } catch (error) {
    console.error("Unable to parse accessibility preferences", error);
    return defaultAccessibilityPreferences;
  }
}

export function writeAccessibilityPreferences(preferences: AccessibilityPreferences): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(preferences));
}

export function applyAccessibilityPreferences(preferences: AccessibilityPreferences): void {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  root.setAttribute("data-colorblind", preferences.colorblindMode ? "true" : "false");
  root.setAttribute("data-text-scale", preferences.textScale);
  root.style.setProperty("--halo-text-scale", String(textScaleMultiplierMap[preferences.textScale]));
}

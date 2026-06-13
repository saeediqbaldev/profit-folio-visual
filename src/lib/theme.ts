export type ThemeModeSettings = {
  background: string;
  foreground: string;
  card: string;
  primary: string;
  primaryGlow: string;
  secondary: string;
  muted: string;
  accent: string;
  success: string;
  danger: string;
  border: string;
  input: string;
  ring: string;
  sidebarBackground: string;
  sidebarForeground: string;
  sidebarAccent: string;
};

export type ThemeSettings = {
  light: ThemeModeSettings;
  dark: ThemeModeSettings;
};

export type PartialThemeSettings = {
  light?: Partial<ThemeModeSettings>;
  dark?: Partial<ThemeModeSettings>;
};

export const THEME_STORAGE_KEY = "tj-theme-settings";
export const THEME_SETTINGS_EVENT = "theme-settings-updated";

export const defaultThemeSettings: ThemeSettings = {
  light: {
    background: "#fafafa",
    foreground: "#121216",
    card: "#ffffff",
    primary: "#994eea",
    primaryGlow: "#c066f7",
    secondary: "#e2e8f0",
    muted: "#f1f5f9",
    accent: "#f1f5f9",
    success: "#16a34a",
    danger: "#ef4444",
    border: "#d8dee9",
    input: "#e2e8f0",
    ring: "#0f7cf1",
    sidebarBackground: "#fafafa",
    sidebarForeground: "#3f3f46",
    sidebarAccent: "#f4f4f5",
  },
  dark: {
    background: "#0a0a0c",
    foreground: "#f4f4f5",
    card: "#0f0f12",
    primary: "#a85df0",
    primaryGlow: "#ca75fb",
    secondary: "#27272a",
    muted: "#222225",
    accent: "#27272a",
    success: "#22c55e",
    danger: "#ef4444",
    border: "#2b2b30",
    input: "#27272a",
    ring: "#4495f7",
    sidebarBackground: "#18181b",
    sidebarForeground: "#f4f4f5",
    sidebarAccent: "#27272a",
  },
};

const tokenMap: Record<keyof ThemeModeSettings, string> = {
  background: "--background",
  foreground: "--foreground",
  card: "--card",
  primary: "--primary",
  primaryGlow: "--primary-glow",
  secondary: "--secondary",
  muted: "--muted",
  accent: "--accent",
  success: "--success",
  danger: "--danger",
  border: "--border",
  input: "--input",
  ring: "--ring",
  sidebarBackground: "--sidebar-background",
  sidebarForeground: "--sidebar-foreground",
  sidebarAccent: "--sidebar-accent",
};

export const mergeThemeSettings = (settings?: PartialThemeSettings | null): ThemeSettings => ({
  light: { ...defaultThemeSettings.light, ...(settings?.light || {}) },
  dark: { ...defaultThemeSettings.dark, ...(settings?.dark || {}) },
});

export const hexToHsl = (hex: string) => {
  const clean = hex.replace("#", "").trim();
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

export const applyThemeSettings = (settings: ThemeSettings, mode: "light" | "dark") => {
  const root = window.document.documentElement;
  const palette = settings[mode];
  (Object.keys(tokenMap) as Array<keyof ThemeModeSettings>).forEach((key) => {
    const hsl = hexToHsl(palette[key]);
    if (hsl) root.style.setProperty(tokenMap[key], hsl);
  });

  root.style.setProperty("--card-foreground", hexToHsl(palette.foreground) || "var(--foreground)");
  root.style.setProperty("--popover", hexToHsl(palette.card) || "var(--card)");
  root.style.setProperty("--popover-foreground", hexToHsl(palette.foreground) || "var(--foreground)");
  root.style.setProperty("--primary-foreground", mode === "dark" ? "240 10% 4%" : "0 0% 100%");
  root.style.setProperty("--secondary-foreground", hexToHsl(palette.foreground) || "var(--foreground)");
  root.style.setProperty("--accent-foreground", hexToHsl(palette.foreground) || "var(--foreground)");
  root.style.setProperty("--success-glow", hexToHsl(palette.success) || "var(--success)");
  root.style.setProperty("--danger-glow", hexToHsl(palette.danger) || "var(--danger)");
  root.style.setProperty("--destructive", hexToHsl(palette.danger) || "var(--danger)");
  root.style.setProperty("--destructive-foreground", "0 0% 100%");
  root.style.setProperty("--sidebar-primary", hexToHsl(palette.primary) || "var(--primary)");
  root.style.setProperty("--sidebar-primary-foreground", mode === "dark" ? "240 10% 4%" : "0 0% 100%");
  root.style.setProperty("--sidebar-accent-foreground", hexToHsl(palette.foreground) || "var(--foreground)");
  root.style.setProperty("--sidebar-border", hexToHsl(palette.border) || "var(--border)");
  root.style.setProperty("--sidebar-ring", hexToHsl(palette.ring) || "var(--ring)");
  root.style.colorScheme = mode;
};

export const persistThemeSettings = (settings: ThemeSettings) => {
  localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent(THEME_SETTINGS_EVENT, { detail: settings }));
};
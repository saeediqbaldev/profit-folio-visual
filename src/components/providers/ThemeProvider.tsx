import { createContext, useContext, useEffect, useState } from "react"
import { applyThemeSettings, defaultThemeSettings, mergeThemeSettings, THEME_SETTINGS_EVENT, THEME_STORAGE_KEY, ThemeSettings } from "@/lib/theme"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "trading-journal-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(() => {
    try {
      return mergeThemeSettings(JSON.parse(localStorage.getItem(THEME_STORAGE_KEY) || "null"))
    } catch {
      return defaultThemeSettings
    }
  })

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"

      root.classList.add(systemTheme)
      applyThemeSettings(themeSettings, systemTheme)
      return
    }

    root.classList.add(theme)
    applyThemeSettings(themeSettings, theme)
  }, [theme, themeSettings])

  useEffect(() => {
    const handler = (event: Event) => {
      setThemeSettings(mergeThemeSettings((event as CustomEvent).detail))
    }
    window.addEventListener(THEME_SETTINGS_EVENT, handler)
    return () => window.removeEventListener(THEME_SETTINGS_EVENT, handler)
  }, [])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
import { useMemo, useState } from "react";
import { Palette, RotateCcw, Save, Moon, Sun } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import {
  applyThemeSettings,
  defaultThemeSettings,
  mergeThemeSettings,
  PartialThemeSettings,
  persistThemeSettings,
  ThemeModeSettings,
  ThemeSettings,
} from "@/lib/theme";

type Mode = "light" | "dark";

const colorFields: Array<{ key: keyof ThemeModeSettings; label: string }> = [
  { key: "background", label: "Page background" },
  { key: "foreground", label: "Main text" },
  { key: "card", label: "Cards / panels" },
  { key: "primary", label: "Primary buttons" },
  { key: "primaryGlow", label: "Primary glow" },
  { key: "secondary", label: "Secondary surfaces" },
  { key: "muted", label: "Muted surfaces" },
  { key: "accent", label: "Accent surfaces" },
  { key: "success", label: "Winning trades" },
  { key: "danger", label: "Losing trades" },
  { key: "border", label: "Borders" },
  { key: "input", label: "Inputs" },
  { key: "ring", label: "Focus ring" },
  { key: "sidebarBackground", label: "Sidebar background" },
  { key: "sidebarForeground", label: "Sidebar text" },
  { key: "sidebarAccent", label: "Sidebar active item" },
];

const presets: Array<{ name: string; settings: ThemeSettings }> = [
  { name: "Default Purple", settings: defaultThemeSettings },
  {
    name: "Fresh Blue",
    settings: mergeThemeSettings({
      light: { primary: "#2563eb", primaryGlow: "#38bdf8", ring: "#0ea5e9", accent: "#eff6ff", sidebarAccent: "#dbeafe" },
      dark: { primary: "#60a5fa", primaryGlow: "#22d3ee", ring: "#38bdf8", accent: "#172554", sidebarAccent: "#1e3a8a" },
    }),
  },
  {
    name: "Emerald Pro",
    settings: mergeThemeSettings({
      light: { primary: "#059669", primaryGlow: "#34d399", ring: "#10b981", accent: "#ecfdf5", sidebarAccent: "#d1fae5" },
      dark: { primary: "#34d399", primaryGlow: "#6ee7b7", ring: "#10b981", accent: "#064e3b", sidebarAccent: "#065f46" },
    }),
  },
  {
    name: "Mono Focus",
    settings: mergeThemeSettings({
      light: { primary: "#18181b", primaryGlow: "#71717a", ring: "#52525b", accent: "#f4f4f5", sidebarAccent: "#e4e4e7" },
      dark: { primary: "#f4f4f5", primaryGlow: "#a1a1aa", ring: "#d4d4d8", accent: "#27272a", sidebarAccent: "#3f3f46" },
    }),
  },
];

interface ColorThemeSettingsProps {
  initialSettings?: PartialThemeSettings | null;
}

const ColorThemeSettings = ({ initialSettings }: ColorThemeSettingsProps) => {
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>("light");
  const [settings, setSettings] = useState<ThemeSettings>(() => mergeThemeSettings(initialSettings));
  const [saving, setSaving] = useState(false);

  const previewColors = useMemo(() => Object.values(settings[mode]).slice(0, 10), [settings, mode]);

  const updateColor = (key: keyof ThemeModeSettings, value: string) => {
    const next = { ...settings, [mode]: { ...settings[mode], [key]: value } };
    setSettings(next);
    persistThemeSettings(next);
    applyThemeSettings(next, mode);
  };

  const applyPreset = (nextSettings: ThemeSettings) => {
    const merged = mergeThemeSettings(nextSettings);
    setSettings(merged);
    persistThemeSettings(merged);
    applyThemeSettings(merged, mode);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/api/profile", { theme_settings: settings });
      persistThemeSettings(settings);
      toast({ title: "Theme saved", description: "Your colors are now stored for this app." });
    } catch (error) {
      toast({ variant: "destructive", title: "Theme save failed", description: error instanceof Error ? error.message : undefined });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="shadow-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5" />Color Theme</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-4">
          {presets.map((preset) => (
            <Button key={preset.name} type="button" variant="outline" className="h-auto justify-start gap-3 p-3" onClick={() => applyPreset(preset.settings)}>
              <span className="flex -space-x-1">
                {Object.values(preset.settings[mode]).slice(0, 4).map((color, index) => (
                  <span key={`${preset.name}-${index}`} className="h-5 w-5 rounded-full border border-border" style={{ backgroundColor: color }} />
                ))}
              </span>
              <span className="text-sm font-medium">{preset.name}</span>
            </Button>
          ))}
        </div>

        <Tabs value={mode} onValueChange={(value) => setMode(value as Mode)}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <TabsList>
              <TabsTrigger value="light" className="gap-2"><Sun className="h-4 w-4" />Light</TabsTrigger>
              <TabsTrigger value="dark" className="gap-2"><Moon className="h-4 w-4" />Dark</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              {previewColors.map((color, index) => (
                <span key={`${mode}-${color}-${index}`} className="h-6 w-6 rounded-full border border-border" style={{ backgroundColor: color }} />
              ))}
            </div>
          </div>

          {(["light", "dark"] as const).map((tabMode) => (
            <TabsContent key={tabMode} value={tabMode} className="mt-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {colorFields.map(({ key, label }) => (
                  <div key={`${tabMode}-${key}`} className="space-y-2 rounded-lg border border-border/50 bg-muted/20 p-3">
                    <Label className="text-xs font-medium">{label}</Label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={settings[tabMode][key]}
                        onChange={(event) => updateColor(key, event.target.value)}
                        className="h-10 w-12 cursor-pointer rounded-md border border-border bg-card p-1"
                        aria-label={label}
                      />
                      <span className="font-mono text-xs text-muted-foreground">{settings[tabMode][key].toUpperCase()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <Separator />
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => applyPreset(defaultThemeSettings)}>
            <RotateCcw className="h-4 w-4 mr-2" />Reset Defaults
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-primary to-primary-glow">
            <Save className="h-4 w-4 mr-2" />{saving ? "Saving..." : "Save Theme"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ColorThemeSettings;
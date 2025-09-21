import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sun, TrendingUp, LogOut, BarChart3, PenTool, User, Settings } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

const Navbar = ({ currentPage, onNavigate, onLogout }: NavbarProps) => {
  const { theme, setTheme } = useTheme();

  const navigation = [
    { id: "journal", label: "Add Trades", icon: PenTool },
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "profile", label: "Profile", icon: User },
    { id: "admin", label: "Admin", icon: Settings },
  ];

  return (
    <nav className="bg-card/80 backdrop-blur-lg border-b border-border/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-primary to-primary-glow rounded-lg shadow-elegant">
              <TrendingUp className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Trading Journal
            </h1>
          </div>

          {/* Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "default" : "ghost"}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-2 ${
                    isActive
                      ? "bg-gradient-to-r from-primary to-primary-glow shadow-elegant"
                      : "hover:bg-accent"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="hover:bg-accent"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={onLogout}
              className="flex items-center gap-2 hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-3">
          <div className="flex gap-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "default" : "ghost"}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-2 ${
                    isActive
                      ? "bg-gradient-to-r from-primary to-primary-glow shadow-elegant"
                      : "hover:bg-accent"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
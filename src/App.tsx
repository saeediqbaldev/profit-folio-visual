import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import AuthPage from "@/components/auth/AuthPage";
import Navbar from "@/components/layout/Navbar";
import JournalPage from "@/pages/JournalPage";
import DashboardPage from "@/pages/DashboardPage";
import TradingHistoryPage from "@/pages/TradingHistoryPage";
import ProfilePage from "@/pages/ProfilePage";
import AdminPage from "@/pages/AdminPage";
import TradePage from "@/pages/TradePage";
import TradingOverviewPage from "@/pages/TradingOverviewPage";
import LandingPage from "@/pages/LandingPage";
import PsxJournalPage from "@/pages/psx/PsxJournalPage";
import PsxDashboardPage from "@/pages/psx/PsxDashboardPage";
import PsxHistoryPage from "@/pages/psx/PsxHistoryPage";
import PsxOverviewPage from "@/pages/psx/PsxOverviewPage";
import Lightbox from "@/components/ui/lightbox";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import CandleLoader from "@/components/ui/candle-loader";

const queryClient = new QueryClient();

const App = () => {
  const { user, loading, signOut, isAuthenticated } = useAuth();
  const { isAdmin } = useUserRole();
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
  const [showLanding, setShowLanding] = useState(true);

  useEffect(() => {
    const skipLanding = sessionStorage.getItem('skip-landing');
    if (skipLanding === 'true' || isAuthenticated) {
      setShowLanding(false);
    }
  }, [isAuthenticated]);

  const handleLogout = async () => {
    await signOut();
    setCurrentPage("dashboard");
    setShowLanding(true);
    sessionStorage.removeItem('skip-landing');
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    if (page !== "trade") {
      setSelectedTradeId(null);
    }
  };

  const handleViewTrade = (tradeId: string) => {
    setSelectedTradeId(tradeId);
    setCurrentPage("trade");
  };

  const handleAuthSuccess = () => {
    sessionStorage.setItem('skip-landing', 'true');
    setShowLanding(false);
  };

  if (loading) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light" storageKey="trading-journal-theme">
          <TooltipProvider>
            <div className="min-h-screen bg-background flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <CandleLoader />
                <span className="text-muted-foreground">Loading...</span>
              </div>
            </div>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  if (!isAuthenticated && showLanding) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light" storageKey="trading-journal-theme">
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <LandingPage />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  if (!isAuthenticated) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light" storageKey="trading-journal-theme">
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AuthPage onAuthSuccess={handleAuthSuccess} />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="trading-journal-theme">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <SidebarProvider defaultOpen={true}>
            <div className="flex min-h-screen w-full bg-background">
              <AppSidebar 
                currentPage={currentPage}
                onNavigate={handleNavigate}
                isAdmin={isAdmin}
              />
              <div className="flex-1 flex flex-col w-full">
                <Navbar 
                  currentPage={currentPage}
                  onNavigate={handleNavigate}
                  onLogout={handleLogout}
                />
                <main className="flex-1 overflow-auto">
                  {/* Forex Pages */}
                  {currentPage === "journal" && <JournalPage />}
                  {currentPage === "dashboard" && <DashboardPage />}
                  {currentPage === "history" && <TradingHistoryPage onViewTrade={handleViewTrade} />}
                  {currentPage === "overview" && <TradingOverviewPage />}
                  
                  {/* PSX Pages */}
                  {currentPage === "psx-journal" && <PsxJournalPage />}
                  {currentPage === "psx-dashboard" && <PsxDashboardPage />}
                  {currentPage === "psx-history" && <PsxHistoryPage />}
                  {currentPage === "psx-overview" && <PsxOverviewPage />}
                  
                  {/* Common Pages */}
                  {currentPage === "profile" && <ProfilePage />}
                  {currentPage === "admin" && <AdminPage />}
                  {currentPage === "trade" && selectedTradeId && (
                    <TradePage tradeId={selectedTradeId} onBack={() => handleNavigate("history")} viewOnly={true} />
                  )}
                </main>
              </div>
              <Lightbox />
            </div>
          </SidebarProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;

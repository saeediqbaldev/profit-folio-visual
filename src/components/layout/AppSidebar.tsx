import { PenTool, LayoutDashboard, Calendar, User, TrendingUp, X, History } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

interface AppSidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isAdmin: boolean;
}

export function AppSidebar({ currentPage, onNavigate }: AppSidebarProps) {
  const { setOpenMobile, isMobile } = useSidebar();

  const navigation = [
    { id: "dashboard", label: "Stats / Analytics", icon: LayoutDashboard },
    { id: "journal", label: "Add Trades", icon: PenTool },
    { id: "history", label: "Trading History", icon: History },
    { id: "overview", label: "Overview", icon: Calendar },
  ];

  const accountNavigation = [
    { id: "profile", label: "Profile", icon: User },
  ];

  const handleNavigate = (page: string) => {
    onNavigate(page);
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-border/50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-primary to-primary-glow rounded-lg shadow-elegant">
              <TrendingUp className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Trading Journal
              </h1>
            </div>
          </div>
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={() => setOpenMobile(false)} className="md:hidden">
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Forex</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton onClick={() => handleNavigate(item.id)} isActive={isActive} tooltip={item.label}>
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton onClick={() => handleNavigate(item.id)} isActive={isActive} tooltip={item.label}>
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

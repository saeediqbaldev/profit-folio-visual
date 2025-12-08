import { PenTool, LayoutDashboard, Calendar, User, TrendingUp, X, History, ChevronDown } from "lucide-react";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

interface AppSidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isAdmin: boolean;
}

export function AppSidebar({ currentPage, onNavigate }: AppSidebarProps) {
  const { setOpenMobile, isMobile } = useSidebar();
  const [forexOpen, setForexOpen] = useState(true);
  const [psxOpen, setPsxOpen] = useState(true);
  
  const forexNavigation = [
    { id: "journal", label: "Add Trades", icon: PenTool },
    { id: "dashboard", label: "Stats / Analytics", icon: LayoutDashboard },
    { id: "history", label: "Trading History", icon: History },
    { id: "overview", label: "Overview", icon: Calendar },
  ];

  const psxNavigation = [
    { id: "psx-journal", label: "Add Trades", icon: PenTool },
    { id: "psx-dashboard", label: "Stats / Analytics", icon: LayoutDashboard },
    { id: "psx-history", label: "Trading History", icon: History },
    { id: "psx-overview", label: "Overview", icon: Calendar },
  ];

  const accountNavigation = [
    { id: "profile", label: "Profile", icon: User },
  ];

  const handleNavigate = (page: string) => {
    onNavigate(page);
    if (isMobile) {
      setOpenMobile(false);
    }
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpenMobile(false)}
              className="md:hidden"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        {/* Forex Category */}
        <SidebarGroup>
          <Collapsible open={forexOpen} onOpenChange={setForexOpen}>
            <CollapsibleTrigger className="w-full">
              <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-accent/50 rounded-md px-2 py-1.5 transition-colors">
                <span>Forex</span>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${forexOpen ? 'rotate-180' : ''}`} />
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {forexNavigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPage === item.id;
                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          onClick={() => handleNavigate(item.id)}
                          isActive={isActive}
                          tooltip={item.label}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* PSX Stocks Category */}
        <SidebarGroup>
          <Collapsible open={psxOpen} onOpenChange={setPsxOpen}>
            <CollapsibleTrigger className="w-full">
              <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-accent/50 rounded-md px-2 py-1.5 transition-colors">
                <span>PSX Stocks</span>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${psxOpen ? 'rotate-180' : ''}`} />
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {psxNavigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPage === item.id;
                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          onClick={() => handleNavigate(item.id)}
                          isActive={isActive}
                          tooltip={item.label}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* Account */}
        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => handleNavigate(item.id)}
                      isActive={isActive}
                      tooltip={item.label}
                    >
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

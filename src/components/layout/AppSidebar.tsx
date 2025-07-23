import { 
  CalendarDays, 
  Users, 
  QrCode, 
  Camera, 
  Vote, 
  Trophy, 
  BarChart3, 
  Settings,
  Building2,
  CheckSquare,
  TableProperties
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: BarChart3 },
  { title: "Events", url: "/events", icon: CalendarDays },
  { title: "Attendees", url: "/attendees", icon: Users },
  { title: "Check-in", url: "/checkin", icon: CheckSquare },
  { title: "Seating", url: "/seating", icon: TableProperties },
  { title: "Photo Gallery", url: "/gallery", icon: Camera },
  { title: "Voting", url: "/voting", icon: Vote },
  { title: "Lucky Draw", url: "/lucky-draw", icon: Trophy },
  { title: "QR Codes", url: "/qr-codes", icon: QrCode },
];

const adminItems = [
  { title: "Company", url: "/company", icon: Building2 },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-gradient-primary text-primary-foreground font-semibold shadow-md border-r-4 border-accent" 
      : "text-sidebar-foreground hover:bg-primary/5 hover:text-primary hover:shadow-sm transition-all duration-200";

  return (
    <Sidebar className="border-r border-border/50 bg-gradient-subtle">
      <SidebarContent className="p-4">
        <div className="mb-6 p-4 glass rounded-xl border border-border/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">E</span>
            </div>
            <div>
              <h2 className="font-bold text-sm bg-gradient-primary bg-clip-text text-transparent">
                Event Manager
              </h2>
              <p className="text-xs text-muted-foreground">Professional Edition</p>
            </div>
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
            Event Management
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <div className="flex items-center gap-3 w-full py-2">
                        <item.icon className="h-5 w-5" />
                        <span className="font-medium">{item.title}</span>
                      </div>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-8">
          <SidebarGroupLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
            Administration
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <div className="flex items-center gap-3 w-full py-2">
                        <item.icon className="h-5 w-5" />
                        <span className="font-medium">{item.title}</span>
                      </div>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
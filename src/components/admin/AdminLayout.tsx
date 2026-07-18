import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Settings,
  Image as ImageIcon,
  Heart,
  Clock,
  Images,
  CalendarDays,
  Users,
  MapPin,
  Gift,
  Music,
  Share2,
  Globe,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAdminAuth } from "@/lib/auth";

export type AdminSection =
  | "dashboard"
  | "general"
  | "hero"
  | "couple"
  | "story"
  | "gallery"
  | "events"
  | "family"
  | "venue"
  | "gifts"
  | "music"
  | "social"
  | "website";

const NAV: { key: AdminSection; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "general", label: "General Settings", icon: Settings },
  { key: "hero", label: "Hero Section", icon: ImageIcon },
  { key: "couple", label: "Couple Details", icon: Heart },
  { key: "story", label: "Our Story / Timeline", icon: Clock },
  { key: "gallery", label: "Gallery", icon: Images },
  { key: "events", label: "Wedding Events", icon: CalendarDays },
  { key: "family", label: "Family Members", icon: Users },
  { key: "venue", label: "Venue", icon: MapPin },
  { key: "gifts", label: "Gifts / UPI", icon: Gift },
  { key: "music", label: "Music", icon: Music },
  { key: "social", label: "Social Links", icon: Share2 },
  { key: "website", label: "Website Settings", icon: Globe },
];

export function AdminLayout({
  section,
  onSectionChange,
  children,
}: {
  section: AdminSection;
  onSectionChange: (s: AdminSection) => void;
  children: ReactNode;
}) {
  const { session, signOut } = useAdminAuth();

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="px-3 py-3">
          <p className="font-serif text-lg gold-text px-1">Wedding Admin</p>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Manage</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV.map((item) => (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      isActive={section === item.key}
                      onClick={() => onSectionChange(item.key)}
                      tooltip={item.label}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="px-3 py-3 space-y-2">
          <p className="truncate text-xs text-muted-foreground px-1">{session?.user.email}</p>
          <Button variant="outline" size="sm" className="w-full" onClick={() => signOut()}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </SidebarFooter>
      </Sidebar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 border-b px-4 py-3 md:hidden">
          <SidebarTrigger />
          <span className="font-serif text-lg gold-text">Wedding Admin</span>
        </div>
        <main className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">{children}</main>
      </div>
    </SidebarProvider>
  );
}

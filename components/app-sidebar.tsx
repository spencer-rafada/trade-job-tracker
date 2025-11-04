"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  Briefcase,
  Hammer,
  FileText,
  Clock,
  Settings,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ROUTES } from "@/lib/routes";
import type { Profile } from "@/lib/types";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { UserMenu } from "@/components/user-menu";

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    url: ROUTES.HOME,
    icon: Home,
  },
  {
    title: "Users",
    url: ROUTES.ADMIN.USERS,
    icon: Users,
    roles: ["admin"],
  },
  {
    title: "Crews",
    url: ROUTES.ADMIN.CREWS,
    icon: Briefcase,
    roles: ["admin"],
  },
  {
    title: "Trades",
    url: ROUTES.ADMIN.TRADES,
    icon: Hammer,
    roles: ["admin"],
  },
  {
    title: "Jobs",
    url: ROUTES.ADMIN.JOBS,
    icon: FileText,
    roles: ["admin"],
  },
  {
    title: "Job Logs",
    url: ROUTES.ADMIN.JOB_LOGS,
    icon: FileText,
    roles: ["admin"],
  },
  {
    title: "Hours",
    url: ROUTES.ADMIN.HOURS,
    icon: Clock,
    roles: ["admin"],
  },
  {
    title: "Submit Hours",
    url: ROUTES.WORKER.HOURS,
    icon: Clock,
    roles: ["worker", "foreman"],
  },
  {
    title: "Settings",
    url: ROUTES.SETTINGS.PROFILE,
    icon: Settings,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    // Get current user and profile
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser({ email: user.email || "" });
        supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()
          .then(({ data }) => {
            setProfile(data);
          });
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ email: session.user.email || "" });
        supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single()
          .then(({ data }) => {
            setProfile(data);
          });
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Filter nav items based on user role
  const visibleNavItems = navItems.filter((item) => {
    if (!item.roles) return true; // Show items without role restrictions
    if (!profile?.role) return false; // Hide role-restricted items if no role
    return item.roles.includes(profile.role);
  });

  // Group items by category
  const generalItems = visibleNavItems.filter(
    (item) => !item.roles || item.url === ROUTES.HOME
  );
  const adminItems = visibleNavItems.filter(
    (item) => item.roles?.includes("admin")
  );
  const workerItems = visibleNavItems.filter(
    (item) =>
      item.roles?.includes("worker") || item.roles?.includes("foreman")
  );

  return (
    <Sidebar collapsible="none">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={ROUTES.HOME}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Briefcase className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    Trade Job Tracker
                  </span>
                  <span className="truncate text-xs">
                    {profile?.role || "User"}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* General Navigation */}
        {generalItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>General</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {generalItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={item.url}>
                          <Icon className="size-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Admin Navigation */}
        {adminItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={item.url}>
                          <Icon className="size-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Worker Navigation */}
        {workerItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Worker</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {workerItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={item.url}>
                          <Icon className="size-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            {user && profile && (
              <UserMenu
                firstName={profile.first_name || ""}
                email={user.email}
              />
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

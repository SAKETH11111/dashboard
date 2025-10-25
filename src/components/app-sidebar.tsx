"use client";

import Image from "next/image";
import * as React from "react";
import { Home, LineChart, Map, Settings, Sparkles } from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useUserPreferences } from "@/hooks/use-user-preferences";

const navItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Map",
    url: "/map",
    icon: Map,
  },
  {
    title: "Data Explorer",
    url: "/explorer",
    icon: LineChart,
  },
  {
    title: "About",
    url: "/about",
    icon: Sparkles,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { preferences } = useUserPreferences();
  const displayName = preferences.name || "Sara Ahmed";
  const displayEmail = preferences.email || "sara.ahmed@example.org";
  const displayDepartment = preferences.department || "DESA";

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/dashboard" className="flex items-center gap-2">
                <Image
                  src="/iowa-water/logo-mark.svg"
                  alt="Iowa Water droplet"
                  width={28}
                  height={28}
                  priority
                />
                <span className="text-base font-semibold text-sidebar-foreground">
                  Iowa Water Quality
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="/settings">
                <Settings className="size-4" />
                <span>Settings</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <NavUser
          user={{
            name: displayName,
            email: displayEmail,
            avatar: "/avatars/user.jpg",
            department: displayDepartment,
          }}
        />
      </SidebarFooter>
    </Sidebar>
  );
}

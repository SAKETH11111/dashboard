"use client";

import Image from "next/image";
import * as React from "react";
import {
  Home,
  LineChart,
  Newspaper,
  Pencil,
  Plus,
  Settings,
  Sparkles,
  Trash2,
  Map,
  Droplets,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
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
    title: "News",
    url: "/news",
    icon: Newspaper,
  },
  {
    title: "About",
    url: "/initiatives",
    icon: Sparkles,
  },
];

function generateListId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `list-${Date.now()}`;
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { preferences, setPreferences, updatePreferences } =
    useUserPreferences();
  const displayName = preferences.name || "Sara Ahmed";
  const displayEmail = preferences.email || "sara.ahmed@example.org";
  const displayDepartment = preferences.department || "DESA";
  const lists = preferences.lists ?? [];
  const activeListId = preferences.activeListId ?? lists[0]?.id ?? null;

  const handleSelectList = React.useCallback(
    (listId: string) => {
      if (!listId || listId === activeListId) return;
      updatePreferences({ activeListId: listId });
    },
    [activeListId, updatePreferences]
  );

  const handleAddList = React.useCallback(() => {
    const defaultName = `New list ${lists.length + 1}`;
    const name =
      typeof window !== "undefined"
        ? window.prompt("Name your list", defaultName) ?? ""
        : defaultName;
    const trimmed = name.trim();
    if (!trimmed) return;

    const newListId = generateListId();
    setPreferences((current) => ({
      ...current,
      lists: [
        ...current.lists,
        { id: newListId, name: trimmed, datasetIds: [] },
      ],
      activeListId: newListId,
    }));
  }, [lists.length, setPreferences]);

  const handleRenameList = React.useCallback(
    (listId: string, currentName: string) => {
      const nextName =
        typeof window !== "undefined"
          ? window.prompt("Rename list", currentName) ?? ""
          : currentName;
      const trimmed = nextName.trim();
      if (!trimmed || trimmed === currentName) return;

      setPreferences((current) => ({
        ...current,
        lists: current.lists.map((list) =>
          list.id === listId ? { ...list, name: trimmed } : list
        ),
      }));
    },
    [setPreferences]
  );

  const handleRemoveList = React.useCallback(
    (listId: string) => {
      if (
        typeof window !== "undefined" &&
        !window.confirm(
          "Remove this list? Datasets will remain available in the catalog."
        )
      ) {
        return;
      }

      setPreferences((current) => {
        const remaining = current.lists.filter((list) => list.id !== listId);

        if (remaining.length === 0) {
          const fallbackId = generateListId();
          return {
            ...current,
            lists: [
              { id: fallbackId, name: "My Saved Datasets", datasetIds: [] },
            ],
            activeListId: fallbackId,
          };
        }

        const nextActiveId =
          current.activeListId === listId
            ? remaining[0]?.id ?? null
            : current.activeListId;

        return {
          ...current,
          lists: remaining,
          activeListId: nextActiveId,
        };
      });
    },
    [setPreferences]
  );

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
                  src="/UN_emblem_blue.svg"
                  alt="United Nations emblem"
                  width={24}
                  height={24}
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
        <SidebarGroup>
          <SidebarGroupLabel>My Lists</SidebarGroupLabel>
          <SidebarMenu>
            {lists.map((list) => {
              const datasetCount = list.datasetIds.length;

              return (
                <SidebarMenuItem key={list.id}>
                  <SidebarMenuButton
                    type="button"
                    isActive={list.id === activeListId}
                    onClick={() => handleSelectList(list.id)}
                    title={list.name}
                  >
                    <span>{list.name}</span>
                  </SidebarMenuButton>
                  {datasetCount ? (
                    <SidebarMenuBadge>{datasetCount}</SidebarMenuBadge>
                  ) : null}
                  <SidebarMenuAction
                    type="button"
                    aria-label={`Rename ${list.name}`}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      handleRenameList(list.id, list.name);
                    }}
                    showOnHover
                  >
                    <Pencil className="size-4" />
                  </SidebarMenuAction>
                  <SidebarMenuAction
                    type="button"
                    aria-label={`Remove ${list.name}`}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      handleRemoveList(list.id);
                    }}
                    showOnHover
                  >
                    <Trash2 className="size-4" />
                  </SidebarMenuAction>
                </SidebarMenuItem>
              );
            })}
            <SidebarMenuItem>
              <SidebarMenuButton
                type="button"
                onClick={handleAddList}
                className="text-muted-foreground"
              >
                <Plus className="size-4" />
                <span>New</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
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

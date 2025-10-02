"use client"

import {
  ScanLine,
  Settings2,
  User,
  Users,
  CreditCard,
  HeadphonesIcon
} from "lucide-react"
import * as React from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail
} from "@/components/ui/sidebar"
import { NavMain } from "../_components/nav-main"
import { NavUser } from "../_components/nav-user"
import { TeamSwitcher } from "../_components/team-switcher"

export function AppSidebar({
  userData,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  userData: {
    name: string
    email: string
    avatar: string
    membership: string
  }
}) {
  const data = {
    user: userData,
    teams: [
      {
        name: "Personal",
        logo: User,
        plan: "Account"
      },
      {
        name: "Team 1",
        logo: Users,
        plan: "Team"
      },
      {
        name: "Team 2",
        logo: Users,
        plan: "Team"
      },
      {
        name: "Team 3",
        logo: Users,
        plan: "Team"
      }
    ],
    navMain: [
      {
        title: "Scans",
        url: "#",
        icon: ScanLine,
        items: [
          {
            title: "All Scans",
            url: "/dashboard/scans"
          }
        ]
      },
      {
        title: "Account",
        url: "#",
        icon: User,
        items: [
          {
            title: "Profile",
            url: "/dashboard/account"
          },
          {
            title: "Billing",
            url: "/dashboard/billing"
          }
        ]
      },
      {
        title: "Support",
        url: "#",
        icon: HeadphonesIcon,
        items: [
          {
            title: "Help Center",
            url: "/dashboard/support"
          }
        ]
      }
    ]
  }
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

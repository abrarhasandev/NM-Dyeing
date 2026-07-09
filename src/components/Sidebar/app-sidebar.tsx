"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useSession } from "next-auth/react"
import {
    ShoppingCart,
    Users,
    Palette,
    CalendarDays,
    WalletCards,
    ShieldCheck,
    LayoutGrid,
} from "lucide-react"

import { NavMain } from "@/components/Sidebar/nav-main"
import { NavUser } from "@/components/Sidebar/nav-user"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
    useSidebar,
} from "@/components/ui/sidebar"

// Navigation items from the original project with collapsible Menu
const navigationItems = [
    {
        title: "Order",
        url: "/dashboard/order",
        icon: ShoppingCart,
    },
    {
        title: "Customer",
        url: "/dashboard/customer",
        icon: Users,
    },
    {
        title: "Dyeing",
        url: "/dashboard/dyeing",
        icon: Palette,
    },
    {
        title: "Calender",
        url: "/dashboard/calender",
        icon: CalendarDays,
    },
    {
        title: "Accounts",
        url: "/dashboard/accounts",
        icon: WalletCards,
    },
    {
        title: "Menu",
        url: "/dashboard/menu",
        icon: LayoutGrid,
        items: [
            {
                title: "Finishing Type",
                url: "/dashboard/menu/finishingType",
            },
            {
                title: "Clothe Type",
                url: "/dashboard/menu/clotheType",
            },
            {
                title: "Colour",
                url: "/dashboard/menu/colour",
            },
            {
                title: "Sill Name",
                url: "/dashboard/menu/sillName",
            },
            {
                title: "Quality",
                url: "/dashboard/menu/quality",
            },
            {
                title: "Process List",
                url: "/dashboard/menu/pocess-list",
            },
        ],
    },
    {
        title: "Administration",
        url: "/dashboard/admins",
        icon: ShieldCheck,
    },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { data: session } = useSession()
    const { state, toggleSidebar } = useSidebar()
    const isCollapsed = state === "collapsed"
    
    const user = {
        name: session?.user?.name || "Guest",
        email: session?.user?.email || "admin@nmdyeing.com",
        avatar: session?.user?.image || "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&w=634&q=80",
    }

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader className="p-2 flex-row items-center justify-between">
                <Link
                    href="/"
                    onClick={(e) => {
                        if (isCollapsed) {
                            e.preventDefault()
                            toggleSidebar()
                        }
                    }}
                    className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors duration-150 flex-1 min-w-0"
                    style={{ overflow: "hidden" }}
                >
                    <div
                        className="shrink-0 flex items-center justify-center bg-sidebar-foreground/5 rounded-md"
                        style={{ width: 36, height: 36, minWidth: 36 }}
                    >
                        <Image
                            src="/Image/logo.png"
                            alt="NM Dyeing Logo"
                            width={22}
                            height={22}
                            className="dark:brightness-200"
                        />
                    </div>

                    {!isCollapsed && (
                        <div className="overflow-hidden flex flex-col justify-center">
                            <p className="text-sm font-semibold text-sidebar-foreground leading-tight whitespace-nowrap">
                                NM-Dyeing
                            </p>
                            <p className="text-[9px] font-semibold uppercase tracking-wider text-sidebar-foreground/50 mt-0.5">
                                Management
                            </p>
                        </div>
                    )}
                </Link>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={navigationItems} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={user} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}

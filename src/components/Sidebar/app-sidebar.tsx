// @ts-nocheck
"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import {
    ShoppingCart,
    Users,
    Palette,
    Truck,
    CalendarDays,
    WalletCards,
    ShieldCheck,
    LayoutGrid,
    Package,
    ArrowRightLeft,
    Wrench,
    BarChart3,
    Settings,
    PlayCircle,
    ArrowLeft
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

const mainNavigationItems = [
    { title: "Order", url: "/dashboard/order", icon: ShoppingCart },
    { title: "Customer", url: "/dashboard/customer", icon: Users },
    { title: "Dyeing", url: "/dashboard/dyeing", icon: Palette },
    { title: "Transport", url: "/dashboard/transport", icon: Truck },
    { title: "Calender", url: "/dashboard/calender", icon: CalendarDays },
    { title: "Accounts", url: "/dashboard/accounts", icon: WalletCards },
    {
        title: "Menu",
        url: "/dashboard/menu",
        icon: LayoutGrid,
        items: [
            { title: "Finishing Type", url: "/dashboard/menu/finishingType" },
            { title: "Clothe Type", url: "/dashboard/menu/clotheType" },
            { title: "Colour", url: "/dashboard/menu/colour" },
            { title: "Sill Name", url: "/dashboard/menu/sillName" },
            { title: "Quality", url: "/dashboard/menu/quality" },
            { title: "Process List", url: "/dashboard/menu/pocess-list" },
        ],
    },
    { title: "Administration", url: "/dashboard/admins", icon: ShieldCheck },
    { title: "Stock", url: "/dashboard/stock", icon: Package },
]

const stockNavigationItems = [
    {
        title: "Back to Main",
        url: "/dashboard/order",
        icon: ArrowLeft,
    },
    {
        title: "Stock Dashboard",
        url: "/dashboard/stock",
        icon: Package,
    },
    {
        title: "Transactions",
        url: "/dashboard/stock/transactions",
        icon: ArrowRightLeft,
        items: [
            { title: "Stock Entry", url: "/dashboard/stock/stock-entry" },
            { title: "Purchase Receipt", url: "/dashboard/stock/purchase-receipt" },
            { title: "Delivery Note", url: "/dashboard/stock/delivery-note" },
            { title: "Material Request", url: "/dashboard/stock/material-request" },
            { title: "Pick List", url: "/dashboard/stock/pick-list" },
        ]
    },
    {
        title: "Tools",
        url: "/dashboard/stock/tools",
        icon: Wrench,
        items: [
            { title: "Stock Reconciliation", url: "/dashboard/stock/reconciliation" },
            { title: "Landed Cost Voucher", url: "/dashboard/stock/landed-cost" },
            { title: "Repost Item Valuation", url: "/dashboard/stock/repost-valuation" },
            { title: "Packing Slip", url: "/dashboard/stock/packing-slip" },
            { title: "Quality Inspection", url: "/dashboard/stock/quality-inspection" },
        ]
    },
    {
        title: "Setup",
        url: "/dashboard/stock/setup",
        icon: Package,
        items: [
            { title: "Item", url: "/dashboard/stock/item" },
            { title: "Item Group", url: "/dashboard/stock/item-group" },
            { title: "Item Attribute", url: "/dashboard/stock/item-attribute" },
            { title: "Brand", url: "/dashboard/stock/brand" },
            { title: "Warehouse", url: "/dashboard/stock/warehouse" },
            { title: "Unit of Measure (UOM)", url: "/dashboard/stock/uom" },
            { title: "UOM Conversion Factor", url: "/dashboard/stock/uom-conversion" },
            { title: "Serial No", url: "/dashboard/stock/serial-no" },
            { title: "Batch No", url: "/dashboard/stock/batch-no" },
            { title: "Serial and Batch Bundle", url: "/dashboard/stock/serial-batch-bundle" },
            { title: "Inventory Dimension", url: "/dashboard/stock/inventory-dimension" },
            { title: "Shipping Rule", url: "/dashboard/stock/shipping-rule" },
            { title: "Item Alternative", url: "/dashboard/stock/item-alternative" },
            { title: "Quality Inspection Template", url: "/dashboard/stock/quality-template" },
            { title: "Delivery Trip", url: "/dashboard/stock/delivery-trip" },
        ]
    },
    {
        title: "Reports",
        url: "/dashboard/stock/reports",
        icon: BarChart3,
        items: [
            { title: "Stock Ledger", url: "/dashboard/stock/ledger" },
            { title: "Stock Balance", url: "/dashboard/stock/balance" },
            { title: "Quick Stock Balance", url: "/dashboard/stock/quick-balance" },
            { title: "Stock Projected Qty", url: "/dashboard/stock/projected-qty" },
            { title: "Stock Analytics", url: "/dashboard/stock/analytics" },
            { title: "Stock Ageing", url: "/dashboard/stock/ageing" },
            { title: "Purchase Receipt Trends", url: "/dashboard/stock/purchase-trends" },
            { title: "Delivery Note Trends", url: "/dashboard/stock/delivery-trends" },
            { title: "Item Price Stock", url: "/dashboard/stock/item-price" },
            { title: "Warehouse Wise Stock Balance", url: "/dashboard/stock/warehouse-balance" },
            { title: "Item Shortage Report", url: "/dashboard/stock/shortage" },
            { title: "Serial No and Batch Tracker", url: "/dashboard/stock/serial-batch-tracker" },
            { title: "Serial No Status", url: "/dashboard/stock/serial-status" },
            { title: "Serial No Ledger", url: "/dashboard/stock/serial-ledger" },
            { title: "Serial No Warranty Expiry", url: "/dashboard/stock/serial-warranty" },
            { title: "Batch-Wise Balance History", url: "/dashboard/stock/batch-balance-history" },
            { title: "Batch Item Expiry Status", url: "/dashboard/stock/batch-expiry" },
            { title: "Requested Items To Be Transferred", url: "/dashboard/stock/requested-transfers" },
            { title: "Itemwise Recommended Reorder Level", url: "/dashboard/stock/reorder-level" },
            { title: "Item Variant Details", url: "/dashboard/stock/variant-details" },
        ]
    },
    {
        title: "Settings",
        url: "/dashboard/stock/settings",
        icon: Settings,
        items: [
            { title: "Stock Settings", url: "/dashboard/stock/stock-settings" },
            { title: "Item Variant Settings", url: "/dashboard/stock/variant-settings" },
            { title: "Stock Reposting Settings", url: "/dashboard/stock/reposting-settings" },
            { title: "Delivery Settings", url: "/dashboard/stock/delivery-settings" },
        ]
    },
    {
        title: "Getting Started",
        url: "/dashboard/stock/guide",
        icon: PlayCircle,
    }
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { data: session } = useSession()
    const pathname = usePathname()
    const { state, toggleSidebar } = useSidebar()
    const isCollapsed = state === "collapsed"
    
    const isStockApp = pathname?.startsWith("/dashboard/stock")
    const currentNavItems = isStockApp ? stockNavigationItems : mainNavigationItems
    
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
                                {isStockApp ? "Stock Workspace" : "Management"}
                            </p>
                        </div>
                    )}
                </Link>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={currentNavItems} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={user} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}

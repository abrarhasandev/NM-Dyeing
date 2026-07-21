"use client"

import React from "react"
import Link from "next/link"
import { Package, TrendingUp, AlertTriangle, ArrowRightLeft } from "lucide-react"

export default function StockModulePage() {
    return (
        <div className="p-6 md:p-8 space-y-8 bg-slate-50/50 dark:bg-slate-900/20 min-h-screen">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <Package className="h-8 w-8 text-primary" />
                    Stock Workspace
                </h1>
                <p className="text-muted-foreground max-w-3xl">
                    Welcome to the Stock Workspace. Select an option from the sidebar to manage inventory, items, warehouses, transactions, and reports.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="bg-background border rounded-xl p-6 flex flex-col gap-4 shadow-sm">
                    <div className="flex items-center gap-3 text-primary">
                        <TrendingUp className="h-5 w-5" />
                        <h3 className="font-semibold text-lg text-foreground">Stock Valuation</h3>
                    </div>
                    <p className="text-3xl font-bold">$0.00</p>
                    <p className="text-sm text-muted-foreground">Total value of all items in stock</p>
                </div>
                
                <div className="bg-background border rounded-xl p-6 flex flex-col gap-4 shadow-sm">
                    <div className="flex items-center gap-3 text-amber-500">
                        <AlertTriangle className="h-5 w-5" />
                        <h3 className="font-semibold text-lg text-foreground">Low Stock Items</h3>
                    </div>
                    <p className="text-3xl font-bold">0</p>
                    <p className="text-sm text-muted-foreground">Items below recommended reorder level</p>
                </div>

                <div className="bg-background border rounded-xl p-6 flex flex-col gap-4 shadow-sm">
                    <div className="flex items-center gap-3 text-blue-500">
                        <ArrowRightLeft className="h-5 w-5" />
                        <h3 className="font-semibold text-lg text-foreground">Recent Transactions</h3>
                    </div>
                    <p className="text-3xl font-bold">0</p>
                    <p className="text-sm text-muted-foreground">Transactions in the last 30 days</p>
                </div>
            </div>
            
            {/* Quick Actions Placeholder */}
            <div className="mt-8 bg-background border rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-lg mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link href="/dashboard/stock/item" className="p-4 border rounded-lg hover:bg-muted text-sm font-medium transition-colors text-left flex flex-col gap-2">
                        <span className="text-primary">+ New Item</span>
                        <span className="text-muted-foreground font-normal text-xs">Create a new inventory item</span>
                    </Link>
                    <button className="p-4 border rounded-lg hover:bg-muted text-sm font-medium transition-colors text-left flex flex-col gap-2">
                        <span className="text-primary">+ Stock Entry</span>
                        <span className="text-muted-foreground font-normal text-xs">Record material movement</span>
                    </button>
                    <button className="p-4 border rounded-lg hover:bg-muted text-sm font-medium transition-colors text-left flex flex-col gap-2">
                        <span className="text-primary">+ Purchase Receipt</span>
                        <span className="text-muted-foreground font-normal text-xs">Receive items from supplier</span>
                    </button>
                    <button className="p-4 border rounded-lg hover:bg-muted text-sm font-medium transition-colors text-left flex flex-col gap-2">
                        <span className="text-primary">+ Delivery Note</span>
                        <span className="text-muted-foreground font-normal text-xs">Ship items to customer</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

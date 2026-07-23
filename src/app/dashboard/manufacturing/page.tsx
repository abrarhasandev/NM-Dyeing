"use client"

import React from "react"
import Link from "next/link"
import { Factory, TrendingUp, AlertTriangle, ArrowRightLeft, ScrollText, CheckCircle, Settings } from "lucide-react"

export default function ManufacturingModulePage() {
    return (
        <div className="p-6 md:p-8 space-y-8 bg-slate-50/50 dark:bg-slate-900/20 min-h-screen">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <Factory className="h-8 w-8 text-primary" />
                    Manufacturing Workspace
                </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="bg-background border rounded-xl p-6 flex flex-col gap-4 shadow-sm">
                    <div className="flex items-center gap-3 text-primary">
                        <TrendingUp className="h-5 w-5" />
                        <h3 className="font-semibold text-lg text-foreground">Production Output</h3>
                    </div>
                    <p className="text-3xl font-bold">0</p>
                    <p className="text-sm text-muted-foreground">Total production in the last 30 days</p>
                </div>

                <div className="bg-background border rounded-xl p-6 flex flex-col gap-4 shadow-sm">
                    <div className="flex items-center gap-3 text-amber-500">
                        <AlertTriangle className="h-5 w-5" />
                        <h3 className="font-semibold text-lg text-foreground">Pending QC</h3>
                    </div>
                    <p className="text-3xl font-bold">0</p>
                    <p className="text-sm text-muted-foreground">Batches pending quality inspection</p>
                </div>

                <div className="bg-background border rounded-xl p-6 flex flex-col gap-4 shadow-sm">
                    <div className="flex items-center gap-3 text-blue-500">
                        <ArrowRightLeft className="h-5 w-5" />
                        <h3 className="font-semibold text-lg text-foreground">Active Work Orders</h3>
                    </div>
                    <p className="text-3xl font-bold">0</p>
                    <p className="text-sm text-muted-foreground">Currently in progress</p>
                </div>
            </div>

            <div className="mt-8 bg-background border rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-lg mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link href="/dashboard/manufacturing/recipes" className="p-4 border rounded-lg hover:bg-muted text-sm font-medium transition-colors text-left flex flex-col gap-2">
                        <span className="text-primary flex items-center gap-2"><ScrollText className="h-4 w-4" /> Recipes</span>
                        <span className="text-muted-foreground font-normal text-xs">Manage Dyeing Recipes</span>
                    </Link>
                    <Link href="/dashboard/manufacturing/bom" className="p-4 border rounded-lg hover:bg-muted text-sm font-medium transition-colors text-left flex flex-col gap-2">
                        <span className="text-primary flex items-center gap-2"><Factory className="h-4 w-4" /> BOM</span>
                        <span className="text-muted-foreground font-normal text-xs">Bill of Materials</span>
                    </Link>
                    <Link href="/dashboard/manufacturing/sop" className="p-4 border rounded-lg hover:bg-muted text-sm font-medium transition-colors text-left flex flex-col gap-2">
                        <span className="text-primary flex items-center gap-2"><Settings className="h-4 w-4" /> SOP</span>
                        <span className="text-muted-foreground font-normal text-xs">Standard Operating Procedures</span>
                    </Link>
                    <Link href="/dashboard/manufacturing/quality-control" className="p-4 border rounded-lg hover:bg-muted text-sm font-medium transition-colors text-left flex flex-col gap-2">
                        <span className="text-primary flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Quality Control</span>
                        <span className="text-muted-foreground font-normal text-xs">Inspect & Maintain Quality</span>
                    </Link>
                </div>
            </div>
        </div>
    )
}

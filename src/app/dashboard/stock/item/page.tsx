"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { 
  FileText, 
  Plus, 
  ChevronDown, 
  Filter,
  RefreshCw,
  MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NewItemModal from "@/components/stock/NewItemModal";

export default function ItemListPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemGroupFilter, setItemGroupFilter] = useState<string | undefined>();
  
  const items = useQuery(api.inventory.getItems, { 
    itemGroup: itemGroupFilter 
  });

  const isLoading = items === undefined;

  return (
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/20 min-h-screen">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Stock</span>
          <span>/</span>
          <span className="font-medium text-foreground">Item</span>
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <FileText className="h-4 w-4" />
                List View
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>List View</DropdownMenuItem>
              <DropdownMenuItem>Image View</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                Saved Filters
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>No saved filters</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" className="h-8 w-8">
            <RefreshCw className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Import</DropdownMenuItem>
              <DropdownMenuItem>User Permissions</DropdownMenuItem>
              <DropdownMenuItem>Role Permissions Manager</DropdownMenuItem>
              <DropdownMenuItem>Customize</DropdownMenuItem>
              <DropdownMenuItem>Customize Quick Filters</DropdownMenuItem>
              <DropdownMenuItem>List Settings</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button size="sm" className="h-8 gap-1 bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 p-3 border-b bg-background text-sm">
        <div className="relative">
          <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none text-muted-foreground text-xs font-semibold">
            Item Group
          </div>
          <select 
            className="pl-20 pr-8 py-1.5 h-8 bg-muted/30 border border-transparent hover:border-border rounded-md text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer w-[180px]"
            value={itemGroupFilter || ""}
            onChange={(e) => setItemGroupFilter(e.target.value || undefined)}
          >
            <option value="">All Item Groups</option>
            <option value="Consumable">Consumable</option>
            <option value="Products">Products</option>
            <option value="Raw Material">Raw Material</option>
            <option value="Services">Services</option>
            <option value="Sub Assemblies">Sub Assemblies</option>
          </select>
        </div>
        
        <div className="flex-1" />
        
        <div className="flex items-center gap-2">
          <div className="text-muted-foreground px-2">Filter <Filter className="h-3 w-3 inline" /></div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1 text-muted-foreground font-normal">
                Created On
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuItem>Last Updated On</DropdownMenuItem>
              <DropdownMenuItem>Created On</DropdownMenuItem>
              <DropdownMenuItem>Item Name</DropdownMenuItem>
              <DropdownMenuItem>ID</DropdownMenuItem>
              <DropdownMenuItem>Most Used</DropdownMenuItem>
              <DropdownMenuItem>Item Code</DropdownMenuItem>
              <DropdownMenuItem>Item Group</DropdownMenuItem>
              <DropdownMenuItem>Default Unit of Measure</DropdownMenuItem>
              <DropdownMenuItem>Maintain Stock</DropdownMenuItem>
              <DropdownMenuItem>Is Fixed Asset</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto bg-background">
        {/* Table Header */}
        <div className="grid grid-cols-5 gap-4 px-4 py-2 border-b text-sm font-medium text-muted-foreground sticky top-0 bg-background/95 backdrop-blur z-10">
          <div className="flex items-center gap-2">ID</div>
          <div className="flex items-center gap-2">Item Name</div>
          <div className="flex items-center gap-2">Item Group</div>
          <div className="flex items-center gap-2">Default UoM</div>
          <div className="flex items-center gap-2">Variants</div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
        ) : items && items.length > 0 ? (
          <div className="divide-y">
            {items.map((item) => (
              <div key={item._id} className="grid grid-cols-5 gap-4 px-4 py-3 text-sm hover:bg-muted/50 transition-colors">
                <div className="font-medium">{item.itemCode}</div>
                <div>{item.name}</div>
                <div>{item.itemGroup}</div>
                <div>{item.defaultUom}</div>
                <div className="text-muted-foreground flex items-center gap-2">
                  <input type="checkbox" disabled className="rounded border-gray-300" /> Has Variants
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 px-4">
            <div className="h-16 w-12 border-2 rounded-lg mb-6 flex flex-col items-center justify-center text-muted-foreground opacity-30 shadow-sm border-gray-300">
              <FileText className="h-6 w-6" />
            </div>
            <p className="text-muted-foreground text-sm mb-4">A Product or a Service that is bought, sold or kept in stock.</p>
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)}>
              Create your first Item
            </Button>
          </div>
        )}
      </div>

      <NewItemModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  );
}

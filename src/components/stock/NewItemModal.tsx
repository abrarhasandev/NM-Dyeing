"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface NewItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NewItemModal({ open, onOpenChange }: NewItemModalProps) {
  const [itemCode, setItemCode] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemGroup, setItemGroup] = useState("");
  const [defaultUom, setDefaultUom] = useState("Nos");
  const [maintainStock, setMaintainStock] = useState(true);
  const [isFixedAsset, setIsFixedAsset] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createItem = useMutation(api.inventory.createItem);

  const handleSave = async () => {
    if (!itemCode || !itemGroup || !defaultUom) return;
    
    setIsSubmitting(true);
    try {
      await createItem({
        itemCode,
        name: itemName,
        itemGroup,
        defaultUom,
        maintainStock,
        isFixedAsset,
      });
      // Reset form
      setItemCode("");
      setItemName("");
      setItemGroup("");
      setDefaultUom("Nos");
      setMaintainStock(true);
      setIsFixedAsset(false);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create item:", error);
      // Could add toast notification here
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white dark:bg-slate-950 border-0 shadow-xl rounded-xl">
        <DialogHeader className="px-6 py-4 border-b flex flex-row items-center justify-between sticky top-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur z-10">
          <DialogTitle className="text-lg font-medium">New Item</DialogTitle>
          {/* Close button is handled by DialogPrimitive natively, but keeping layout consistent with screenshot */}
        </DialogHeader>

        <div className="p-6 overflow-y-auto max-h-[80vh] space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Item Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={itemCode}
              onChange={(e) => setItemCode(e.target.value)}
              className="w-full px-3 py-2 bg-slate-100/80 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Item Name
            </label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-100/80 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Item Group <span className="text-red-500">*</span>
            </label>
            <select
              value={itemGroup}
              onChange={(e) => setItemGroup(e.target.value)}
              className="w-full px-3 py-2 bg-slate-100/80 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-colors appearance-none cursor-pointer"
            >
              <option value="" disabled></option>
              <option value="Consumable">Consumable</option>
              <option value="Products">Products</option>
              <option value="Raw Material">Raw Material</option>
              <option value="Services">Services</option>
              <option value="Sub Assemblies">Sub Assemblies</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Default Unit of Measure <span className="text-red-500">*</span>
            </label>
            <select
              value={defaultUom}
              onChange={(e) => setDefaultUom(e.target.value)}
              className="w-full px-3 py-2 bg-slate-100/80 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-colors appearance-none cursor-pointer font-medium"
            >
              <option value="Nos">Nos</option>
              <option value="Kg">Kg</option>
              <option value="Meter">Meter</option>
              <option value="Litre">Litre</option>
            </select>
          </div>

          <div className="flex items-start gap-3 mt-8">
            <div className="flex items-center h-5">
              <input
                id="maintainStock"
                type="checkbox"
                checked={maintainStock}
                onChange={(e) => setMaintainStock(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-slate-900 focus:ring-slate-900"
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="maintainStock" className="text-sm font-medium text-slate-900 dark:text-slate-100 cursor-pointer">
                Maintain Stock
              </label>
              <p className="text-sm text-slate-500 mt-1">
                ERPNext will make a stock ledger entry for each transaction of this item. Keep unchecked for non-stock or service items.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 mt-4">
            <div className="flex items-center h-5">
              <input
                id="isFixedAsset"
                type="checkbox"
                checked={isFixedAsset}
                onChange={(e) => setIsFixedAsset(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-slate-900 focus:ring-slate-900"
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="isFixedAsset" className="text-sm font-medium text-slate-900 dark:text-slate-100 cursor-pointer">
                Is Fixed Asset
              </label>
              <p className="text-sm text-slate-500 mt-1">
                Enable if this item is a company asset like machinery or furniture.
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <Button variant="secondary" className="bg-slate-100 hover:bg-slate-200 text-slate-700">
            Edit Full Form
          </Button>
          <Button 
            className="bg-slate-900 hover:bg-slate-800 text-white px-6" 
            onClick={handleSave}
            disabled={!itemCode || !itemGroup || !defaultUom || isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

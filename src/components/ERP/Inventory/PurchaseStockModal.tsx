"use client";

import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PurchaseFormData {
  itemId: string;
  purchasedQtyInPurchasingUoM: number;
  totalCost: number;
  note?: string;
}

export function PurchaseStockModal() {
  const [open, setOpen] = useState(false);
  const items = useQuery(api.inventory.getItems, {});
  const purchaseStock = useMutation(api.inventory.purchaseStock);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PurchaseFormData>();

  const onSubmit = async (data: PurchaseFormData) => {
    try {
      await purchaseStock({
        itemId: data.itemId as any,
        purchasedQtyInPurchasingUoM: Number(data.purchasedQtyInPurchasingUoM),
        totalCost: Number(data.totalCost),
        note: data.note,
      });
      reset();
      setOpen(false);
    } catch (error) {
      console.error("Failed to purchase stock:", error);
      alert("Failed to purchase stock.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        Purchase Stock
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Receive Purchase Order</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Item</label>
            <select 
              className="border p-2 rounded-md bg-transparent"
              {...register("itemId", { required: "Item is required" })}
            >
              <option value="">Select Item...</option>
              {items?.map(item => (
                <option key={item._id} value={item._id}>{item.name} ({item.purchasingUoM})</option>
              ))}
            </select>
            {errors.itemId && <span className="text-xs text-red-500">{errors.itemId.message}</span>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Quantity Purchased (in Purchasing UoM)</label>
            <input 
              type="number" step="0.01" min="0.01"
              className="border p-2 rounded-md bg-transparent"
              {...register("purchasedQtyInPurchasingUoM", { required: "Quantity is required", min: 0.01 })}
            />
            {errors.purchasedQtyInPurchasingUoM && <span className="text-xs text-red-500">{errors.purchasedQtyInPurchasingUoM.message}</span>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Total Cost (for entire purchase batch)</label>
            <input 
              type="number" step="0.01" min="0"
              className="border p-2 rounded-md bg-transparent"
              {...register("totalCost", { required: "Total Cost is required", min: 0 })}
            />
            {errors.totalCost && <span className="text-xs text-red-500">{errors.totalCost.message}</span>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Note (Optional)</label>
            <input 
              type="text"
              className="border p-2 rounded-md bg-transparent"
              {...register("note")}
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isSubmitting || !items}>
              {isSubmitting ? "Processing..." : "Confirm Purchase"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

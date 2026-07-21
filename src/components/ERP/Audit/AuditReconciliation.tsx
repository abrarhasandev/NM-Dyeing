"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AuditItemForm {
  itemId: string;
  itemName: string;
  category: string;
  consumingUoM: string;
  systemStock: number;
  physicalStock: number;
  movingAveragePrice: number;
  discrepancyReason: string;
}

interface AuditFormData {
  auditMonth: string;
  completedBy: string;
  items: AuditItemForm[];
}

export function AuditReconciliation() {
  const inventoryItems = useQuery(api.inventory.getItems, {}) || [];
  const submitStockAudit = useMutation(api.auditing.submitStockAudit);

  const [totalImpact, setTotalImpact] = useState(0);

  const { register, control, handleSubmit, reset, formState: { isSubmitting } } = useForm<AuditFormData>({
    defaultValues: {
      auditMonth: new Date().toISOString().slice(0, 7), // YYYY-MM
      completedBy: "Admin", // Should be fetched from auth context
      items: []
    }
  });

  const { fields, replace } = useFieldArray({ control, name: "items" });
  const watchedItems = useWatch({ control, name: "items" });

  useEffect(() => {
    if (inventoryItems.length > 0 && fields.length === 0) {
      const initialItems = inventoryItems.map(item => ({
        itemId: item._id,
        itemName: item.name,
        category: item.category ?? "N/A",
        consumingUoM: item.consumingUoM ?? "N/A",
        systemStock: item.currentStock,
        physicalStock: item.currentStock, // Default to matching
        movingAveragePrice: item.movingAveragePrice,
        discrepancyReason: "",
      }));
      replace(initialItems);
    }
  }, [inventoryItems, fields.length, replace]);

  useEffect(() => {
    if (watchedItems) {
      let impact = 0;
      watchedItems.forEach(item => {
        if (item) {
          const variance = (Number(item.physicalStock) || 0) - (Number(item.systemStock) || 0);
          impact += variance * (item.movingAveragePrice || 0);
        }
      });
      setTotalImpact(impact);
    }
  }, [watchedItems]);

  const onSubmit = async (data: AuditFormData) => {
    try {
      const payload = data.items
        .filter(item => Number(item.physicalStock) !== item.systemStock) // Only submit discrepancies
        .map(item => ({
          itemId: item.itemId as any,
          physicalStock: Number(item.physicalStock),
          discrepancyReason: item.discrepancyReason || "Not specified",
        }));

      if (payload.length === 0) {
        toast.info("No discrepancies found. Audit recorded as perfectly reconciled.");
        // We could still call a mutation just to log the perfect audit, but based on our schema 
        // submitStockAudit processes items with variance.
      }

      await submitStockAudit({
        auditMonth: data.auditMonth,
        completedBy: data.completedBy,
        auditItems: payload,
      });

      toast.success("Audit submitted successfully!");
      
      // Refresh form with new system stock (simulated by re-fetching/re-mounting)
      // In reality, convex useQuery will auto-update the inventoryItems array.
      // But we need to sync our form state.
      const updatedItems = data.items.map(item => ({
        ...item,
        systemStock: Number(item.physicalStock),
        discrepancyReason: ""
      }));
      replace(updatedItems);
      
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit audit.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">End-of-Month Stock Audit</h2>
        <p className="text-sm text-muted-foreground">Reconcile physical floor stock with system records.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-muted/20 border rounded-lg">
          <div>
            <label className="block text-sm font-medium mb-1">Audit Month</label>
            <input 
              type="month" 
              className="w-full border p-2 rounded-md bg-background"
              {...register("auditMonth", { required: true })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Auditor Name</label>
            <input 
              type="text" 
              className="w-full border p-2 rounded-md bg-background"
              {...register("completedBy", { required: true })}
            />
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-sm font-medium text-muted-foreground">Total Financial Impact</span>
            <span className={`text-2xl font-bold ${totalImpact < 0 ? 'text-red-500' : totalImpact > 0 ? 'text-green-500' : 'text-foreground'}`}>
              ৳ {totalImpact.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="rounded-md border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Item Name</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium text-right">System Stock</th>
                  <th className="px-4 py-3 font-medium w-32">Physical Stock</th>
                  <th className="px-4 py-3 font-medium text-right">Variance</th>
                  <th className="px-4 py-3 font-medium text-right">Impact (৳)</th>
                  <th className="px-4 py-3 font-medium w-48">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {fields.map((field, index) => {
                  const physical = Number(watchedItems?.[index]?.physicalStock) || 0;
                  const variance = physical - field.systemStock;
                  const impact = variance * field.movingAveragePrice;
                  
                  return (
                    <tr key={field.id} className="hover:bg-muted/10">
                      <td className="px-4 py-3 font-medium">{field.itemName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{field.category}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                        {field.systemStock.toFixed(2)} {field.consumingUoM}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number" step="0.01" min="0"
                          className={`w-full border p-1 rounded bg-background text-right ${variance !== 0 ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/20' : ''}`}
                          {...register(`items.${index}.physicalStock`, { required: true, min: 0 })}
                        />
                      </td>
                      <td className={`px-4 py-3 text-right tabular-nums font-medium ${variance < 0 ? 'text-red-500' : variance > 0 ? 'text-green-500' : 'text-muted-foreground'}`}>
                        {variance > 0 ? '+' : ''}{variance.toFixed(2)}
                      </td>
                      <td className={`px-4 py-3 text-right tabular-nums font-medium ${impact < 0 ? 'text-red-500' : impact > 0 ? 'text-green-500' : 'text-muted-foreground'}`}>
                        {impact.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          placeholder={variance !== 0 ? "Required..." : ""}
                          className={`w-full border p-1 rounded bg-background text-sm ${variance !== 0 && !watchedItems?.[index]?.discrepancyReason ? 'border-red-500' : ''}`}
                          {...register(`items.${index}.discrepancyReason`, { required: variance !== 0 })}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={isSubmitting || fields.length === 0}>
            {isSubmitting ? "Submitting Audit..." : "Finalize & Submit Audit"}
          </Button>
        </div>
      </form>
    </div>
  );
}

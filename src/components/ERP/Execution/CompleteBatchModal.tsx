"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useForm, useFieldArray } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ConsumptionForm {
  itemId: string;
  itemName: string;
  reservedQty: number;
  actualQty: number;
}

interface CompleteBatchFormData {
  consumptions: ConsumptionForm[];
}

export function CompleteBatchModal({ batchId, recipeId, disabled }: { batchId: string, recipeId: string, disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  
  // We need to fetch the recipe ingredients to know what was reserved
  const ingredients = useQuery(api.recipes.getRecipeIngredients, recipeId ? { recipeId: recipeId as any } : "skip") || [];
  const inventoryItems = useQuery(api.inventory.getItems, {}) || [];
  
  const completeBatch = useMutation(api.executionEngine.completeBatch);

  const { register, control, handleSubmit, reset, formState: { isSubmitting } } = useForm<CompleteBatchFormData>({
    defaultValues: { consumptions: [] }
  });

  const { fields, replace } = useFieldArray({ control, name: "consumptions" });

  // Pre-fill the form with ingredients once they are loaded
  React.useEffect(() => {
    if (ingredients.length > 0 && inventoryItems.length > 0 && open) {
      const initialConsumptions = ingredients.map(ing => {
        const item = inventoryItems.find(i => i._id === ing.itemId);
        // Note: In a real system, the exact reserved quantity would be fetched from the batch record or ledger.
        // For simplicity in this UI, we assume the operator inputs the actual consumed amount manually.
        // If we strictly needed the exact reservedQty here without recalculating, we'd add an endpoint for it.
        return {
          itemId: ing.itemId,
          itemName: item?.name || "Unknown Chemical",
          reservedQty: 0, // In production, query the ledger for the exact reserved amount for this batchId
          actualQty: 0,
        };
      });
      replace(initialConsumptions);
    }
  }, [ingredients, inventoryItems, open, replace]);

  const onSubmit = async (data: CompleteBatchFormData) => {
    try {
      const payload = data.consumptions.map(c => ({
        itemId: c.itemId as any,
        reservedQty: Number(c.reservedQty),
        actualQty: Number(c.actualQty),
      }));

      await completeBatch({
        batchId,
        recipeId: recipeId as any,
        actualConsumption: payload,
      });

      toast.success("Batch completed and costs finalized!");
      setOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to complete batch.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" disabled={disabled} />}>
        Complete Batch
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Complete Batch & Finalize Costing</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <p className="text-sm text-muted-foreground">
            Please enter the actual consumed quantities for this batch to ensure accurate dynamic costing.
          </p>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-12 gap-3 items-center bg-muted/20 p-2 border rounded-md">
                <div className="col-span-5 text-sm font-medium">
                  {field.itemName}
                </div>
                <div className="col-span-3">
                  <label className="text-xs text-muted-foreground">Reserved Qty</label>
                  <input
                    type="number" step="0.01" min="0"
                    className="w-full border p-1 rounded bg-background text-sm"
                    {...register(`consumptions.${index}.reservedQty`, { required: true, min: 0 })}
                  />
                </div>
                <div className="col-span-4">
                  <label className="text-xs text-muted-foreground font-semibold">Actual Consumed Qty</label>
                  <input
                    type="number" step="0.01" min="0"
                    className="w-full border p-1 rounded bg-background text-sm border-primary"
                    {...register(`consumptions.${index}.actualQty`, { required: true, min: 0 })}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : "Finalize Costing & Complete"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

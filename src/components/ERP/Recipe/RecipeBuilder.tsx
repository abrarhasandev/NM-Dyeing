"use client";

import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";

interface IngredientForm {
  itemId: string;
  calculationBase: "FABRIC_WEIGHT" | "LIQUOR_RATIO" | "MACHINE_CAPACITY" | "FIXED";
  quantityPerBase: number;
}

interface RecipeFormData {
  name: string;
  colourId: string;
  clothTypeId: string;
  ingredients: IngredientForm[];
}

export function RecipeBuilder() {
  const [successMsg, setSuccessMsg] = useState("");

  // Queries for dropdowns
  const colours: any[] = []; // Assuming an existing query
  const clothTypes: any[] = []; // Assuming an existing query
  const inventoryItems = useQuery(api.inventory.getItems, {}) || [];

  // Mutations
  const createRecipe = useMutation(api.recipes.createRecipe);
  const addRecipeIngredient = useMutation(api.recipes.addRecipeIngredient);

  const { register, control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<RecipeFormData>({
    defaultValues: {
      ingredients: [{ itemId: "", calculationBase: "FABRIC_WEIGHT", quantityPerBase: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "ingredients"
  });

  const onSubmit = async (data: RecipeFormData) => {
    setSuccessMsg("");
    try {
      // 1. Create the parent recipe
      const recipeId = await createRecipe({
        name: data.name,
        colourId: data.colourId,
        clothTypeId: data.clothTypeId,
      });

      // 2. Add all ingredients using the returned recipeId
      // In a real app, you might want to send an array to the backend to insert many at once, 
      // but calling addRecipeIngredient in a loop works for this scale.
      for (const ingredient of data.ingredients) {
        if (!ingredient.itemId) continue; // skip empty rows
        
        await addRecipeIngredient({
          recipeId: recipeId as any,
          itemId: ingredient.itemId as any,
          calculationBase: ingredient.calculationBase,
          quantityPerBase: Number(ingredient.quantityPerBase),
        });
      }

      setSuccessMsg("Recipe successfully created with " + data.ingredients.length + " ingredients.");
      reset();
    } catch (error) {
      console.error("Failed to create recipe:", error);
      alert("An error occurred while saving the recipe.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-card text-card-foreground rounded-lg shadow-sm border">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">Dynamic Recipe (BOM) Builder</h2>
        <p className="text-sm text-muted-foreground">Define non-linear chemical requirements for specific colours and cloth types.</p>
      </div>

      {successMsg && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-md">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Recipe Name</label>
            <input 
              type="text"
              placeholder="e.g. Navy Blue Cotton Dark"
              className="border p-2.5 rounded-md bg-transparent"
              {...register("name", { required: "Recipe name is required" })}
            />
            {errors.name && <span className="text-xs text-red-500">{errors.name.message}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Target Colour</label>
            <select 
              className="border p-2.5 rounded-md bg-transparent"
              {...register("colourId", { required: "Colour is required" })}
            >
              <option value="">Select Colour...</option>
              {colours.map((c: any) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
            {errors.colourId && <span className="text-xs text-red-500">{errors.colourId.message}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Target Cloth Type</label>
            <select 
              className="border p-2.5 rounded-md bg-transparent"
              {...register("clothTypeId", { required: "Cloth type is required" })}
            >
              <option value="">Select Cloth Type...</option>
              {clothTypes.map((c: any) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
            {errors.clothTypeId && <span className="text-xs text-red-500">{errors.clothTypeId.message}</span>}
          </div>
        </div>

        {/* Dynamic Ingredients List */}
        <div className="pt-4 border-t">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium tracking-tight">Chemicals & Dyes</h3>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => append({ itemId: "", calculationBase: "FABRIC_WEIGHT", quantityPerBase: 0 })}
            >
              + Add Ingredient
            </Button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="flex flex-col sm:flex-row gap-4 items-end bg-muted/30 p-4 rounded-md border border-dashed">
                
                <div className="flex-1 flex flex-col gap-1.5 w-full">
                  <label className="text-xs font-medium text-muted-foreground">Ingredient</label>
                  <select 
                    className="border p-2 rounded-md bg-background text-sm"
                    {...register(`ingredients.${index}.itemId` as const, { required: true })}
                  >
                    <option value="">Select chemical...</option>
                    {inventoryItems.map((item) => (
                      <option key={item._id} value={item._id}>{item.name} ({item.consumingUoM})</option>
                    ))}
                  </select>
                </div>

                <div className="flex-1 flex flex-col gap-1.5 w-full">
                  <label className="text-xs font-medium text-muted-foreground">Calculation Base</label>
                  <select 
                    className="border p-2 rounded-md bg-background text-sm"
                    {...register(`ingredients.${index}.calculationBase` as const, { required: true })}
                  >
                    <option value="FABRIC_WEIGHT">Fabric Weight (KG)</option>
                    <option value="LIQUOR_RATIO">Liquor Ratio (Liters)</option>
                    <option value="MACHINE_CAPACITY">Machine Capacity</option>
                    <option value="FIXED">Fixed Amount</option>
                  </select>
                </div>

                <div className="w-full sm:w-32 flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Qty per Base</label>
                  <input 
                    type="number" step="0.0001" min="0"
                    className="border p-2 rounded-md bg-background text-sm"
                    {...register(`ingredients.${index}.quantityPerBase` as const, { required: true, min: 0 })}
                  />
                </div>

                <Button 
                  type="button" 
                  variant="destructive" 
                  size="sm"
                  className="mb-[2px] sm:mb-0"
                  disabled={fields.length === 1}
                  onClick={() => remove(index)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6 flex justify-end">
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? "Saving Recipe..." : "Save Recipe BOM"}
          </Button>
        </div>

      </form>
    </div>
  );
}

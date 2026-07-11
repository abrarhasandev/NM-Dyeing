"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter, AlertCircle, Edit2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function ChemicalsPage() {
  const chemicals = useQuery(api.inventory.getChemicals);
  const addChemical = useMutation(api.inventory.addChemical);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    category: "Dyes",
    uom: "Kg",
    minimumStockLevel: 0
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addChemical({
        name: formData.name,
        category: formData.category,
        uom: formData.uom,
        minimumStockLevel: Number(formData.minimumStockLevel)
      });
      toast.success("Chemical added successfully!");
      setIsModalOpen(false);
      setFormData({ name: "", category: "Dyes", uom: "Kg", minimumStockLevel: 0 });
    } catch (error) {
      toast.error("Failed to add chemical.");
    }
  };

  const filteredChemicals = chemicals?.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 bg-zinc-50 dark:bg-zinc-950 min-h-screen relative">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Chemicals Master
          </h2>
          <p className="text-muted-foreground mt-2">
            Manage all chemicals, dyes, and auxiliaries.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">
          <Plus className="mr-2 h-4 w-4" /> Add Chemical
        </Button>
      </div>

      <Card className="shadow-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search chemicals..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-100 dark:bg-zinc-900 border-none rounded-md text-sm focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" /> Filter
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {chemicals === undefined ? (
            <div className="p-8 text-center text-muted-foreground">Loading chemicals...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-900/50 uppercase">
                  <tr>
                    <th className="px-6 py-4 font-medium">Chemical Name</th>
                    <th className="px-6 py-4 font-medium">Category</th>
                    <th className="px-6 py-4 font-medium">UoM</th>
                    <th className="px-6 py-4 font-medium text-right">Current Stock</th>
                    <th className="px-6 py-4 font-medium text-right">Min. Level</th>
                    <th className="px-6 py-4 font-medium text-center">Status</th>
                    <th className="px-6 py-4 font-medium text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {filteredChemicals?.map((chem) => (
                    <motion.tr 
                      key={chem._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                        {chem.name}
                      </td>
                      <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                        <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-xs font-medium">
                          {chem.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">{chem.uom}</td>
                      <td className="px-6 py-4 text-right font-semibold text-zinc-900 dark:text-zinc-100">
                        {chem.currentStock.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right text-zinc-500">
                        {chem.minimumStockLevel.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {chem.currentStock < chem.minimumStockLevel ? (
                          <span className="inline-flex items-center text-xs text-red-600 dark:text-red-400 font-medium bg-red-100 dark:bg-red-900/20 px-2 py-1 rounded-full">
                            <AlertCircle className="w-3 h-3 mr-1" /> Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs text-green-600 dark:text-green-400 font-medium bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded-full">
                            Optimal
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit2 className="h-4 w-4 text-zinc-500" />
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                  
                  {filteredChemicals?.length === 0 && (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-muted-foreground">
                        No chemicals found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Add New Chemical</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
                  ✕
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Chemical Name
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. Reactive Red 195"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="Dyes">Dyes</option>
                      <option value="Auxiliaries">Auxiliaries</option>
                      <option value="Basic Chemicals">Basic Chemicals</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Base UoM
                    </label>
                    <select
                      value={formData.uom}
                      onChange={(e) => setFormData({...formData, uom: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="Kg">Kg</option>
                      <option value="g">g</option>
                      <option value="L">L</option>
                      <option value="ml">ml</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Minimum Stock Level (Alert Threshold)
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={formData.minimumStockLevel}
                    onChange={(e) => setFormData({...formData, minimumStockLevel: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                    Save Chemical
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

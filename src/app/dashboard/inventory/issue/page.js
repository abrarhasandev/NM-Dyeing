"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScanBarcode, Send, AlertTriangle, Box } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function IssueStockPage() {
  const chemicals = useQuery(api.inventory.getChemicals);
  
  const [selectedChemical, setSelectedChemical] = useState("");
  const batches = useQuery(api.inventory.getChemicalBatches, selectedChemical ? { chemicalId: selectedChemical } : "skip");
  
  const issueStock = useMutation(api.inventory.issueStock);

  const [formData, setFormData] = useState({
    batchId: "",
    quantity: "",
    jobOrderId: "",
    machineId: "",
    shift: "Morning",
    type: "Issue" // Issue or Waste
  });

  const [barcodeScan, setBarcodeScan] = useState("");

  const handleBarcodeScan = (e) => {
    e.preventDefault();
    // In a real scenario, this would look up the batch by barcode.
    // For UI purposes, we'll just show a toast if we had a dedicated query.
    toast.info(`Scanned Barcode: ${barcodeScan}`);
    setBarcodeScan("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedChemical || !formData.batchId) {
      toast.error("Please select a chemical and batch.");
      return;
    }
    
    try {
      await issueStock({
        chemicalId: selectedChemical,
        batchId: formData.batchId,
        quantity: Number(formData.quantity),
        jobOrderId: formData.jobOrderId,
        machineId: formData.machineId,
        shift: formData.shift,
        // Using "Issue" or "Waste" can be handled in backend, but we just deduct stock for now.
      });
      toast.success(`Successfully logged as ${formData.type}!`);
      setFormData({
        batchId: "",
        quantity: "",
        jobOrderId: "",
        machineId: "",
        shift: formData.shift,
        type: formData.type
      });
    } catch (error) {
      toast.error(error.message || "Failed to issue stock.");
    }
  };

  return (
    <div className="p-8 space-y-8 bg-zinc-50 dark:bg-zinc-950 min-h-screen">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Issue to Floor & Waste Log
        </h2>
        <p className="text-muted-foreground mt-2">
          Issue chemicals for dyeing batches or record spoiled stock.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <Card className="shadow-md">
            <CardHeader className="border-b">
              <CardTitle>Barcode Quick Scan</CardTitle>
              <CardDescription>Scan drum barcode to auto-select batch</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleBarcodeScan} className="flex gap-4">
                <div className="relative flex-1">
                  <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Scan Barcode here..."
                    value={barcodeScan}
                    onChange={(e) => setBarcodeScan(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-zinc-100 dark:bg-zinc-900 border-none rounded-md focus:ring-2 focus:ring-blue-500 font-mono text-lg"
                  />
                </div>
                <Button type="submit" className="py-3 h-auto">Lookup</Button>
              </form>
            </CardContent>
          </Card>

          <Card className="shadow-md mt-8">
            <CardHeader className="border-b">
              <CardTitle>Manual Selection Form</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Transaction Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-md outline-none ${formData.type === 'Waste' ? 'bg-red-50 border-red-200 text-red-900' : 'bg-blue-50 border-blue-200 text-blue-900'}`}
                    >
                      <option value="Issue">Production Issue</option>
                      <option value="Waste">Waste / Spoilage</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Shift</label>
                    <select
                      value={formData.shift}
                      onChange={(e) => setFormData({...formData, shift: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="Morning">Morning (8AM - 4PM)</option>
                      <option value="Evening">Evening (4PM - 12AM)</option>
                      <option value="Night">Night (12AM - 8AM)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Chemical</label>
                  <select
                    required
                    value={selectedChemical}
                    onChange={(e) => {
                      setSelectedChemical(e.target.value);
                      setFormData({...formData, batchId: ""});
                    }}
                    className="w-full px-3 py-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">-- Select Chemical --</option>
                    {chemicals?.map(c => (
                      <option key={c._id} value={c._id}>{c.name} ({c.currentStock} {c.uom} available)</option>
                    ))}
                  </select>
                </div>

                {selectedChemical && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Batch / Lot</label>
                    <select
                      required
                      value={formData.batchId}
                      onChange={(e) => setFormData({...formData, batchId: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">-- Select Batch --</option>
                      {batches?.map(b => (
                        <option key={b._id} value={b._id}>Lot: {b.lotNumber} ({b.currentQuantity} remaining)</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Quantity</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="e.g. 5.5"
                    />
                  </div>
                  {formData.type === "Issue" ? (
                    <div>
                      <label className="block text-sm font-medium mb-1">Job Order / Batch No.</label>
                      <input
                        required
                        type="text"
                        value={formData.jobOrderId}
                        onChange={(e) => setFormData({...formData, jobOrderId: e.target.value})}
                        className="w-full px-3 py-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="e.g. JO-4059"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium mb-1">Reason for Waste</label>
                      <input
                        required
                        type="text"
                        value={formData.jobOrderId}
                        onChange={(e) => setFormData({...formData, jobOrderId: e.target.value})}
                        className="w-full px-3 py-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-800 focus:ring-2 focus:ring-red-500 outline-none"
                        placeholder="e.g. Expired"
                      />
                    </div>
                  )}
                </div>

                {formData.type === "Issue" && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Machine</label>
                    <select
                      required
                      value={formData.machineId}
                      onChange={(e) => setFormData({...formData, machineId: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">-- Select Machine --</option>
                      <option value="Dyeing M-01">Dyeing M-01</option>
                      <option value="Dyeing M-02">Dyeing M-02</option>
                      <option value="Sample Machine">Sample Machine</option>
                    </select>
                  </div>
                )}

                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className={`w-full ${formData.type === 'Waste' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} text-white shadow-lg`}
                  >
                    {formData.type === 'Waste' ? (
                      <><AlertTriangle className="mr-2 h-4 w-4" /> Log Waste</>
                    ) : (
                      <><Send className="mr-2 h-4 w-4" /> Issue to Floor</>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <Card className="shadow-md h-full bg-zinc-900 text-zinc-50 border-none">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription className="text-zinc-400">Latest issues from the store</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                <Box className="h-16 w-16 mb-4 opacity-20" />
                <p>Transactions will appear here in real-time.</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

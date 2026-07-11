"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, QrCode, Plus, Printer, Box } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "react-qr-code";
import { toast } from "sonner";

export default function BatchesPage() {
  const chemicals = useQuery(api.inventory.getChemicals);
  const [selectedChemical, setSelectedChemical] = useState(null);
  
  // We need to use conditional querying safely. Convex useQuery handles null args by not running, or we can just pass an empty string if it fails. 
  // For simplicity, we just pass the ID if selected, otherwise skip.
  const batches = useQuery(api.inventory.getChemicalBatches, selectedChemical ? { chemicalId: selectedChemical } : "skip");
  
  const [search, setSearch] = useState("");
  const [selectedQR, setSelectedQR] = useState(null); // For QR modal

  const handlePrintQR = () => {
    window.print();
  };

  return (
    <div className="p-8 space-y-8 bg-zinc-50 dark:bg-zinc-950 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Batch & Lot Tracking
          </h2>
          <p className="text-muted-foreground mt-2">
            Track chemical batches, monitor expiration dates, and generate QR labels.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {/* Chemicals List sidebar */}
        <Card className="md:col-span-1 h-[600px] flex flex-col shadow-md">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-lg">Select Chemical</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-zinc-100 dark:bg-zinc-900 border-none rounded-md text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            {chemicals === undefined ? (
              <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
            ) : (
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {chemicals
                  .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
                  .map(chem => (
                  <li key={chem._id}>
                    <button
                      onClick={() => setSelectedChemical(chem._id)}
                      className={`w-full text-left px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors ${selectedChemical === chem._id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' : ''}`}
                    >
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">{chem.name}</div>
                      <div className="text-xs text-muted-foreground mt-1 flex justify-between">
                        <span>{chem.category}</span>
                        <span>Stock: {chem.currentStock} {chem.uom}</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Batches Content */}
        <Card className="md:col-span-3 h-[600px] flex flex-col shadow-md">
          <CardHeader className="border-b">
            <CardTitle className="flex justify-between items-center">
              <span>Active Batches</span>
              <Button variant="outline" size="sm" onClick={() => toast.info("Stock in feature is handled in the Suppliers & GRN module.")}>
                <Plus className="h-4 w-4 mr-2" /> Add Stock (GRN)
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto flex-1">
            {!selectedChemical ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
                <Box className="h-12 w-12 mb-4 opacity-20" />
                <p>Select a chemical from the list to view its active batches.</p>
              </div>
            ) : batches === undefined ? (
              <div className="p-8 text-center text-muted-foreground">Loading batches...</div>
            ) : batches.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
                <p>No active batches found for this chemical.</p>
                <p className="text-sm mt-2">All stock has been depleted.</p>
              </div>
            ) : (
              <div className="p-4 grid gap-4">
                {batches.map(batch => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={batch._id} 
                    className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 flex items-center justify-between bg-white dark:bg-zinc-950 hover:shadow-md transition-shadow"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-lg text-zinc-900 dark:text-zinc-50">Lot: {batch.lotNumber}</span>
                        {batch.expirationDate && new Date(batch.expirationDate) < new Date() && (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded font-medium">Expired</span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                        <div><span className="font-medium">Remaining:</span> {batch.currentQuantity} / {batch.initialQuantity}</div>
                        <div><span className="font-medium">Mfg Date:</span> {batch.manufacturingDate || "N/A"}</div>
                        <div><span className="font-medium">Exp Date:</span> {batch.expirationDate || "N/A"}</div>
                        <div><span className="font-medium">Barcode ID:</span> {batch.barcode || batch._id}</div>
                      </div>
                    </div>
                    <div>
                      <Button 
                        variant="secondary" 
                        onClick={() => setSelectedQR({ 
                          value: batch.barcode || batch._id, 
                          lot: batch.lotNumber,
                          chemicalId: selectedChemical
                        })}
                      >
                        <QrCode className="h-4 w-4 mr-2" /> View QR
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* QR Modal */}
      <AnimatePresence>
        {selectedQR && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print:bg-white print:p-0">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full text-center print:shadow-none print:w-auto"
            >
              <div className="print:hidden flex justify-end mb-4">
                <button onClick={() => setSelectedQR(null)} className="text-zinc-500 hover:text-zinc-700">✕</button>
              </div>
              
              <div className="mb-6 border-4 border-black p-4 inline-block bg-white">
                <QRCode value={selectedQR.value} size={200} />
              </div>
              
              <div className="space-y-1 text-black">
                <h3 className="font-bold text-xl">Lot: {selectedQR.lot}</h3>
                <p className="font-mono text-xs break-all">{selectedQR.value}</p>
              </div>

              <div className="mt-8 pt-4 border-t print:hidden">
                <Button onClick={handlePrintQR} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  <Printer className="h-4 w-4 mr-2" /> Print Label
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

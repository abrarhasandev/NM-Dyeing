"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Plus, User, Receipt, CreditCard, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function SuppliersPage() {
  const suppliers = useQuery(api.suppliers.getSuppliers);
  const addSupplier = useMutation(api.suppliers.addSupplier);
  const addFinancialLedger = useMutation(api.suppliers.addFinancialLedger);

  const [search, setSearch] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  
  // Modals
  const [isAddSupplierModalOpen, setIsAddSupplierModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  
  const [supplierForm, setSupplierForm] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: ""
  });

  const [transactionForm, setTransactionForm] = useState({
    type: "Invoice",
    amount: "",
    referenceNumber: "",
    notes: ""
  });

  // Dynamic Ledger Query
  const ledger = useQuery(api.suppliers.getSupplierLedger, selectedSupplier ? { supplierId: selectedSupplier._id } : "skip");

  const formatBDT = (amount) => {
    return new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', minimumFractionDigits: 2 }).format(amount);
  };

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    try {
      await addSupplier(supplierForm);
      toast.success("Supplier added successfully!");
      setIsAddSupplierModalOpen(false);
      setSupplierForm({ name: "", contactPerson: "", phone: "", email: "", address: "" });
    } catch (err) {
      toast.error("Failed to add supplier");
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!selectedSupplier) return;
    try {
      await addFinancialLedger({
        supplierId: selectedSupplier._id,
        type: transactionForm.type,
        amount: Number(transactionForm.amount),
        referenceNumber: transactionForm.referenceNumber,
        notes: transactionForm.notes
      });
      toast.success(`${transactionForm.type} recorded successfully!`);
      setIsTransactionModalOpen(false);
      setTransactionForm({ type: "Invoice", amount: "", referenceNumber: "", notes: "" });
    } catch (err) {
      toast.error("Failed to record transaction");
    }
  };

  return (
    <div className="p-8 space-y-8 bg-zinc-50 dark:bg-zinc-950 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Supplier & Financial Ledger
          </h2>
          <p className="text-muted-foreground mt-2">
            Manage suppliers, invoices, and automated due calculations.
          </p>
        </div>
        <Button onClick={() => setIsAddSupplierModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">
          <Plus className="mr-2 h-4 w-4" /> Add Supplier
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Suppliers List sidebar */}
        <Card className="md:col-span-1 h-[700px] flex flex-col shadow-md">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-lg">Suppliers</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search supplier..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-zinc-100 dark:bg-zinc-900 border-none rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            {suppliers === undefined ? (
              <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
            ) : (
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {suppliers
                  .filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
                  .map(supplier => (
                  <li key={supplier._id}>
                    <button
                      onClick={() => setSelectedSupplier(supplier)}
                      className={`w-full text-left px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors flex items-center justify-between ${selectedSupplier?._id === supplier._id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' : ''}`}
                    >
                      <div>
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">{supplier.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Due: <span className={supplier.balanceDue > 0 ? "text-red-500 font-medium" : "text-green-500"}>{formatBDT(supplier.balanceDue)}</span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-zinc-400" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Ledger View */}
        <Card className="md:col-span-2 h-[700px] flex flex-col shadow-md">
          {!selectedSupplier ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
              <User className="h-16 w-16 mb-4 opacity-20" />
              <h3 className="text-lg font-medium text-zinc-700 dark:text-zinc-300">No Supplier Selected</h3>
              <p>Select a supplier to view their financial ledger and record transactions.</p>
            </div>
          ) : (
            <>
              <CardHeader className="border-b bg-zinc-50 dark:bg-zinc-900/50">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl">{selectedSupplier.name}</CardTitle>
                    <div className="mt-2 space-y-1 text-sm text-zinc-500">
                      <p><strong>Contact:</strong> {selectedSupplier.contactPerson || "N/A"}</p>
                      <p><strong>Phone:</strong> {selectedSupplier.phone || "N/A"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-zinc-500">Total Dues</p>
                    <p className={`text-3xl font-bold ${selectedSupplier.balanceDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatBDT(selectedSupplier.balanceDue)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <Button 
                    onClick={() => { setTransactionForm({...transactionForm, type: "Invoice"}); setIsTransactionModalOpen(true); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Receipt className="h-4 w-4 mr-2" /> Add Invoice (GRN)
                  </Button>
                  <Button 
                    onClick={() => { setTransactionForm({...transactionForm, type: "Payment"}); setIsTransactionModalOpen(true); }}
                    variant="outline" 
                    className="border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                  >
                    <CreditCard className="h-4 w-4 mr-2" /> Record Payment
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-y-auto flex-1 bg-white dark:bg-zinc-950">
                {ledger === undefined ? (
                  <div className="p-8 text-center text-muted-foreground">Loading ledger...</div>
                ) : ledger.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">No transactions found for this supplier.</div>
                ) : (
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-900/80 sticky top-0 uppercase shadow-sm">
                      <tr>
                        <th className="px-6 py-4 font-medium">Date</th>
                        <th className="px-6 py-4 font-medium">Type</th>
                        <th className="px-6 py-4 font-medium">Ref Number</th>
                        <th className="px-6 py-4 font-medium text-right">Debit (Invoice)</th>
                        <th className="px-6 py-4 font-medium text-right">Credit (Payment)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {ledger.map((tx) => (
                        <tr key={tx._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                          <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                            {new Date(tx.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${tx.type === 'Invoice' ? 'bg-red-100 text-red-700' : tx.type === 'Payment' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                              {tx.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-zinc-500">{tx.referenceNumber || "-"}</td>
                          <td className="px-6 py-4 text-right font-medium text-red-600">
                            {tx.type === "Invoice" || (tx.type === "Adjustment" && tx.amount > 0) ? formatBDT(tx.amount) : "-"}
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-green-600">
                            {tx.type === "Payment" || (tx.type === "Adjustment" && tx.amount < 0) ? formatBDT(Math.abs(tx.amount)) : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </>
          )}
        </Card>
      </div>

      {/* Add Supplier Modal */}
      <AnimatePresence>
        {isAddSupplierModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Add New Supplier</h3>
                <button onClick={() => setIsAddSupplierModalOpen(false)} className="text-zinc-500 hover:text-zinc-700">✕</button>
              </div>
              <form onSubmit={handleAddSupplier} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Company Name *</label>
                  <input required type="text" value={supplierForm.name} onChange={e => setSupplierForm({...supplierForm, name: e.target.value})} className="w-full px-3 py-2 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-950 dark:border-zinc-800" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Contact Person</label>
                  <input type="text" value={supplierForm.contactPerson} onChange={e => setSupplierForm({...supplierForm, contactPerson: e.target.value})} className="w-full px-3 py-2 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-950 dark:border-zinc-800" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <input type="text" value={supplierForm.phone} onChange={e => setSupplierForm({...supplierForm, phone: e.target.value})} className="w-full px-3 py-2 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-950 dark:border-zinc-800" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input type="email" value={supplierForm.email} onChange={e => setSupplierForm({...supplierForm, email: e.target.value})} className="w-full px-3 py-2 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-950 dark:border-zinc-800" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Address</label>
                  <textarea value={supplierForm.address} onChange={e => setSupplierForm({...supplierForm, address: e.target.value})} className="w-full px-3 py-2 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-950 dark:border-zinc-800" rows={2} />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsAddSupplierModalOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">Save Supplier</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Transaction Modal */}
      <AnimatePresence>
        {isTransactionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 flex items-center">
                  {transactionForm.type === 'Invoice' ? <Receipt className="w-5 h-5 mr-2 text-red-500" /> : <CreditCard className="w-5 h-5 mr-2 text-green-500" />}
                  Record {transactionForm.type}
                </h3>
                <button onClick={() => setIsTransactionModalOpen(false)} className="text-zinc-500 hover:text-zinc-700">✕</button>
              </div>
              <form onSubmit={handleAddTransaction} className="p-6 space-y-4">
                <div className="bg-zinc-100 dark:bg-zinc-800/50 p-3 rounded-md text-sm">
                  Supplier: <strong>{selectedSupplier?.name}</strong>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Amount (BDT ৳) *</label>
                  <input 
                    required 
                    type="number" 
                    step="0.01" 
                    min="0"
                    value={transactionForm.amount} 
                    onChange={e => setTransactionForm({...transactionForm, amount: e.target.value})} 
                    className="w-full px-3 py-3 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-950 dark:border-zinc-800 text-xl font-bold" 
                    placeholder="e.g. 54500.50"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Will be recorded with two decimal precision.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    {transactionForm.type === 'Invoice' ? 'PO / Challan No.' : 'Check / Txn Ref. No.'}
                  </label>
                  <input 
                    type="text" 
                    value={transactionForm.referenceNumber} 
                    onChange={e => setTransactionForm({...transactionForm, referenceNumber: e.target.value})} 
                    className="w-full px-3 py-2 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-950 dark:border-zinc-800" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Remarks</label>
                  <input 
                    type="text" 
                    value={transactionForm.notes} 
                    onChange={e => setTransactionForm({...transactionForm, notes: e.target.value})} 
                    className="w-full px-3 py-2 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-950 dark:border-zinc-800" 
                  />
                </div>
                
                <div className="pt-4 flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsTransactionModalOpen(false)}>Cancel</Button>
                  <Button type="submit" className={transactionForm.type === 'Invoice' ? "bg-red-600 hover:bg-red-700 text-white" : "bg-green-600 hover:bg-green-700 text-white"}>
                    Confirm {transactionForm.type}
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

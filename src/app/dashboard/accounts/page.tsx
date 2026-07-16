// @ts-nocheck
"use client";

import { useEffect, useState, useRef } from "react";


import { toast } from "sonner";
import { Calendar, Droplet, Pencil, Trash2, User } from "lucide-react";

export default function Page() {
  const [entities, setEntities] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [type, setType] = useState("customer");
  const [payments, setPayments] = useState([]);
  const [total, setTotal] = useState(0);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  const [form, setForm] = useState({
    id: "",
    amount: "",
    method: "cash",
    description: "",
    date: new Date().toISOString().slice(0, 10),
  });

  // টাইপ পরিবর্তন হলে ডাটা লোড করা
  useEffect(() => {
    const fetchEntities = async () => {
      try {
        let endpoint = "/api/customers";
        if (type === "dyeing") endpoint = "/api/dyeings";
        if (type === "calendar") endpoint = "/api/calender";

        const res = await fetch(endpoint);
        const data = await res.json();
        setEntities(Array.isArray(data) ? data : []);
        setSelectedId("");
        setPayments([]);
        setTotal(0);
      } catch (err) {
        toast.error("Failed to load list");
      }
    };
    fetchEntities();
  }, [type]);

  // পেমেন্ট হিস্ট্রি লোড
  const fetchPayments = async () => {
    if (!selectedId) return;
    try {

      const res = await fetch(
        `/api/payments?userId=${selectedId}&type=${type}`
      );
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        setPayments([]);
        return;
      }

      if (Array.isArray(data)) {
        setPayments(data);
        setTotal(data.reduce((t, p) => t + Number(p.amount), 0));
      }
    } catch (err) {
      console.error("Fetch error", err);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [selectedId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedId) return toast.warning("Please select an entry!");

    const payload = {
      id: form.id,
      userId: selectedId,
      type: type,
      amount: Number(form.amount),
      method: form.method,
      description: form.description,
      date: form.date,
    };

    try {
      const res = await fetch("/api/payments", {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        fetchPayments();
        setForm({
          id: "",
          amount: "",
          method: "cash",
          description: "",
          date: new Date().toISOString().slice(0, 10),
        });
        toast.success("Success!");
      }
    } catch (err) {
      toast.error("Error saving data");
    }
  };

  const handleEdit = (p) => {
    setForm({
      id: p._id,
      amount: p.amount,
      method: p.method,
      description: p.description || "",
      date: new Date(p.date).toISOString().slice(0, 10),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure?")) return;
    const res = await fetch(`/api/payments?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.info("Deleted!");
      fetchPayments();
    }
  };

  const filteredEntities = entities.filter((ent) =>
    (ent.companyName || ent.name || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const currentSelection = entities.find((ent) => ent._id === selectedId);

  return (
    <div className="py-10 max-w-4xl mx-auto px-4 space-y-6">
      <h1 className="text-2xl font-normal text-[#26251e] border-b border-[#26251e]/10 pb-3 tracking-tight">
        Accounts Section
      </h1>

      {/* ✅ Toggle Tabs */}
      <div className="flex bg-[#f2f1ed] p-1 rounded-sm shadow-[inset_0_0_0_1px_rgba(38,37,30,0.1)]">
        {[
          { id: "customer", label: "Customer", icon: <User /> },
          { id: "dyeing", label: "Dyeing", icon: <Droplet /> },
          { id: "calendar", label: "Calendar", icon: <Calendar /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setType(tab.id)}
            className={`flex-1 flex items-center justify-center cursor-pointer gap-2 py-2.5 rounded-sm font-medium transition-all ${type === tab.id
                ? "bg-[#26251e] text-[#f7f7f4] shadow-sm"
                : "text-[#26251e]/60 hover:text-[#26251e] hover:bg-[#26251e]/5"
              }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ✅ Searchable Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <div
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full border border-[#26251e]/10 p-3 rounded-sm bg-[#f2f1ed] cursor-pointer flex justify-between items-center hover:border-[#26251e]/30 transition shadow-sm"
        >
          <span
            className={
              currentSelection ? "font-medium text-[#26251e]" : "text-[#26251e]/40"
            }
          >
            {currentSelection
              ? `${currentSelection.companyName || currentSelection.name} ${currentSelection.ownerName
                ? `(${currentSelection.ownerName})`
                : ""
              }`
              : `Select ${type}...`}
          </span>
          <span className="text-[#26251e]/40">{isDropdownOpen ? "▲" : "▼"}</span>
        </div>

        {isDropdownOpen && (
          <div className="absolute z-20 w-full mt-1 bg-[#f2f1ed] border border-[#26251e]/10 rounded-sm shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)] overflow-hidden">
            <input
              type="text"
              className="w-full p-3 border-b border-[#26251e]/10 outline-none bg-transparent focus:bg-[#26251e]/5 text-[#26251e]"
              placeholder={`Search ${type}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
            <div className="max-h-64 overflow-y-auto">
              {filteredEntities.map((ent) => (
                <div
                  key={ent._id}
                  onClick={() => {
                    setSelectedId(ent._id);
                    setIsDropdownOpen(false);
                    setSearchTerm("");
                  }}
                  className="p-3 hover:bg-[#26251e] hover:text-[#f7f7f4] cursor-pointer border-b border-[#26251e]/5 last:border-0 transition"
                >
                  <div className="font-medium">{ent.companyName || ent.name}</div>
                  <div className="text-xs opacity-80">
                    {ent.ownerName || "No Owner Info"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedId && (
        <>
          {/* ✅ Total Card */}
          <div className="bg-[#26251e] text-[#f7f7f4] p-6 rounded-sm shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] flex justify-between items-center border border-[#26251e]">
            <div>
              <p className="text-xs text-[#f7f7f4]/70 uppercase tracking-wide font-medium">
                Total Received
              </p>
              <h2 className="text-3xl font-normal mt-1">
                ৳ {total.toLocaleString()}
              </h2>
            </div>
            {form.id && (
              <div className="bg-[#f54e00]/20 text-[#f54e00] border border-[#f54e00]/30 px-3 py-1 rounded-sm text-xs font-medium animate-pulse">
                EDITING MODE
              </div>
            )}
          </div>

          {/* ✅ Form */}
          <form
            onSubmit={handleSubmit}
            className="bg-[#f2f1ed] border border-[#26251e]/10 p-6 rounded-sm shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] grid grid-cols-1 md:grid-cols-2 gap-5"
          >
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#26251e]/60 uppercase tracking-wide">
                Amount
              </label>
              <input
                type="number"
                name="amount"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full border border-[#26251e]/10 p-2.5 rounded-sm focus:border-[#26251e] focus:ring-1 focus:ring-[#26251e] outline-none bg-white text-[#26251e]"
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#26251e]/60 uppercase tracking-wide">
                Method
              </label>
              <select
                name="method"
                value={form.method}
                onChange={(e) => setForm({ ...form, method: e.target.value })}
                className="w-full border border-[#26251e]/10 p-2.5 rounded-sm focus:border-[#26251e] focus:ring-1 focus:ring-[#26251e] outline-none bg-white text-[#26251e]"
              >
                <option value="cash">Cash</option>
                <option value="bank">Bank</option>
                <option value="bkash">Bkash</option>
                <option value="nagad">Nagad</option>
                <option value="check">Check</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#26251e]/60 uppercase tracking-wide">
                Date
              </label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full border border-[#26251e]/10 p-2.5 rounded-sm focus:border-[#26251e] focus:ring-1 focus:ring-[#26251e] outline-none bg-white text-[#26251e]"
              />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-medium text-[#26251e]/60 uppercase tracking-wide">
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full border border-[#26251e]/10 p-2.5 rounded-sm focus:border-[#26251e] focus:ring-1 focus:ring-[#26251e] outline-none bg-white text-[#26251e]"
                placeholder="Note here..."
                rows="2"
              />
            </div>
            <div className="md:col-span-2 flex gap-3 pt-2">
              <button
                type="submit"
                className={`flex-1 cursor-pointer py-2.5 rounded-sm font-medium text-[#f7f7f4] transition-all shadow-sm ${form.id
                    ? "bg-[#f54e00] hover:bg-[#d44100]"
                    : "bg-[#26251e] hover:bg-[#3b3a33]"
                  }`}
              >
                {form.id ? "Update Entry" : "Save Payment"}
              </button>
              {form.id && (
                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      id: "",
                      amount: "",
                      method: "cash",
                      description: "",
                      date: new Date().toISOString().slice(0, 10),
                    })
                  }
                  className="bg-transparent border border-[#26251e]/20 text-[#26251e] px-6 rounded-sm font-medium hover:bg-[#26251e]/5 transition-colors shadow-sm"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          {/* ✅ Table */}
          <div className="bg-[#f2f1ed] rounded-sm shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)] border border-[#26251e]/10 overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-[#ebeae5]">
                <tr>
                  <th className="p-4 font-medium text-[#26251e]/60 uppercase tracking-wide text-xs border-b border-[#26251e]/10">Date</th>
                  <th className="p-4 font-medium text-[#26251e]/60 uppercase tracking-wide text-xs border-b border-[#26251e]/10">
                    Method
                  </th>
                  <th className="p-4 font-medium text-[#26251e]/60 uppercase tracking-wide text-xs border-b border-[#26251e]/10">
                    Description
                  </th>
                  <th className="p-4 font-medium text-[#26251e]/60 uppercase tracking-wide text-xs border-b border-[#26251e]/10 text-right">
                    Amount
                  </th>
                  <th className="p-4 font-medium text-[#26251e]/60 uppercase tracking-wide text-xs border-b border-[#26251e]/10 text-center">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#26251e]/5">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-[#ebeae5] transition-colors group">
                    <td className="p-4 text-[#26251e]">
                      {new Date(p.date).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span className="bg-[#26251e]/5 text-[#26251e] px-2.5 py-1 rounded-sm text-[10px] font-medium uppercase tracking-wide">
                        {p.method}
                      </span>
                    </td>
                    <td className="p-4 text-[#26251e]/70 max-w-[150px] truncate">
                      {p.description || "-"}
                    </td>
                    <td className="p-4 text-right font-medium text-[#26251e]">
                      ৳ {p.amount.toLocaleString()}
                    </td>
                    <td className="p-4 text-center space-x-3">
                      <button
                        onClick={() => handleEdit(p)}
                        className="text-[#26251e]/40 hover:text-[#f54e00] hover:bg-[#f54e00]/10 p-1.5 rounded-sm transition inline-flex"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(p._id)}
                        className="text-[#26251e]/40 hover:text-[#cf2d56] hover:bg-[#cf2d56]/10 p-1.5 rounded-sm transition inline-flex"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

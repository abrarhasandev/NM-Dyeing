"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { useDocumentTitle } from "@/hook/useDocumentTitle";
import { 
  Plus, 
  Search, 
  Eye, 
  Pencil, 
  Trash2, 
  Droplets 
} from "lucide-react";

const DyeingPage = () => {
  const [dyeings, setDyeings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useDocumentTitle("Dyeing Management");

  const fetchDyeings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dyeings");
      if (!res.ok) throw new Error("Failed to fetch dyeings");
      const data = await res.json();
      setDyeings(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load dyeings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDyeings();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this dyeing unit?")) return;
    try {
      const res = await fetch(`/api/dyeings/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete dyeing");
      toast.success("Dyeing unit deleted!");
      fetchDyeings();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete dyeing");
    }
  };

  // Filter for search
  const filteredData = dyeings?.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    d.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen pt-14 p-4 md:p-8 bg-[#f7f7f4] text-[#26251e]">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 mt-6 lg:mt-0">
          <div className="flex items-center gap-3">
            <div className="bg-[#f2f1ed] p-2.5 rounded-sm border border-[#26251e]/10">
              <Droplets className="text-[#26251e]" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-normal text-[#26251e] tracking-tight">Dyeing Management</h1>
              <p className="text-sm text-[#26251e]/60 font-normal">Monitor and manage dyeing units</p>
            </div>
          </div>
          <Link 
            href="/dashboard/dyeing/createDyeing" 
            className="inline-flex items-center justify-center gap-2 bg-[#26251e] hover:bg-[#3b3a33] text-[#f7f7f4] px-5 py-2.5 rounded-sm font-normal transition"
          >
            <Plus size={18} /> Create Dyeing
          </Link>
        </div>

        {/* SEARCH BAR */}
        <div className="relative mb-6 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#26251e]/40" size={18} />
          <input
            type="text"
            placeholder="Search units..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#f2f1ed] border border-[#26251e]/10 rounded-sm focus:outline-none focus:border-[#26251e] focus:ring-1 focus:ring-[#26251e] text-[#26251e] transition"
          />
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#f2f1ed] p-6 rounded-sm border border-[#26251e]/10 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)]">
            <p className="text-xs font-medium text-[#26251e]/60 uppercase tracking-wide">Total Units</p>
            <p className="text-3xl font-normal text-[#26251e] mt-1">{dyeings?.length || 0}</p>
          </div>
          <div className="bg-[#f2f1ed] p-6 rounded-sm border border-[#26251e]/10 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)]">
            <p className="text-xs font-medium text-[#26251e]/60 uppercase tracking-wide">Active Units</p>
            <p className="text-3xl font-normal text-[#1f8a65] mt-1">{dyeings?.length || 0}</p>
          </div>
          <div className="bg-[#f2f1ed] p-6 rounded-sm border border-[#26251e]/10 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)]">
            <p className="text-xs font-medium text-[#26251e]/60 uppercase tracking-wide">Capacity</p>
            <p className="text-3xl font-normal text-[#26251e] mt-1">100%</p>
          </div>
        </div>

        {/* TABLE SECTION */}
        <div className="bg-[#f2f1ed] rounded-sm border border-[#26251e]/10 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#26251e]/10">
                  <th className="px-6 py-4 text-xs font-medium text-[#26251e]/60 uppercase tracking-wide">Unit Name</th>
                  <th className="px-6 py-4 text-xs font-medium text-[#26251e]/60 uppercase tracking-wide">Location</th>
                  <th className="px-6 py-4 text-xs font-medium text-[#26251e]/60 uppercase tracking-wide">Employees</th>
                  <th className="px-6 py-4 text-xs font-medium text-[#26251e]/60 uppercase tracking-wide text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#26251e]/5">
                {loading ? (
                   <tr>
                    <td colSpan={4} className="py-20 text-center">
                      <div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#26251e]"></div></div>
                    </td>
                  </tr>
                ) : filteredData?.length > 0 ? (
                  filteredData.map((d) => (
                    <tr key={d._id} className="hover:bg-[#ebeae5] transition-colors group">
                      <td className="px-6 py-4 text-sm font-medium text-[#26251e]">{d.name}</td>
                      <td className="px-6 py-4 text-sm text-[#26251e]/70">{d.location}</td>
                      <td className="px-6 py-4 text-sm text-[#26251e]/70">
                        <div className="max-w-[200px] truncate" title={d.employees?.map((e) => e.employeeName).join(", ")}>
                            {d.employees?.map((e) => e.employeeName).join(", ") || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/dashboard/dyeing/profile/${d._id}`}
                            className="p-1.5 text-[#26251e]/40 hover:text-[#26251e] hover:bg-[#26251e]/5 rounded-sm transition"
                          >
                            <Eye size={18} />
                          </Link>
                          <Link
                            href={`/dashboard/dyeing/edit/${d._id}`}
                            className="p-1.5 text-[#26251e]/40 hover:text-[#f54e00] hover:bg-[#f54e00]/10 rounded-sm transition"
                          >
                            <Pencil size={18} />
                          </Link>
                          <button
                            onClick={() => handleDelete(d._id)}
                            className="p-1.5 text-[#26251e]/40 hover:text-[#cf2d56] hover:bg-[#cf2d56]/10 rounded-sm transition cursor-pointer"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-[#26251e]/40 text-sm font-normal">No dyeing units found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DyeingPage;
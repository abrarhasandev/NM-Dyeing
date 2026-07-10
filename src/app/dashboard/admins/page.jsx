"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  Plus, 
  Search, 
  Eye, 
  Pencil, 
  Trash2, 
  ShieldCheck 
} from "lucide-react";

const ConfirmationModal = ({ isOpen, onClose, onConfirm, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#f2f1ed] p-6 rounded-sm shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] max-w-sm w-full border border-[#26251e]/10">
        <h2 className="text-lg font-normal text-[#26251e] mb-5">{message}</h2>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="bg-transparent border border-[#26251e]/20 hover:bg-[#26251e]/5 text-[#26251e] px-5 py-2 rounded-sm font-medium transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="bg-[#cf2d56] hover:bg-[#b3003f] text-[#f7f7f4] px-5 py-2 rounded-sm font-medium transition cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminPage = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState(null);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admins");
      if (!res.ok) throw new Error(`Status: ${res.status}`);
      const fetchedAdmins = await res.json();
      setAdmins(fetchedAdmins);
    } catch (err) {
      setError("Failed to load admins.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id) => {
    setSelectedAdminId(id);
    setModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const res = await fetch(`/api/admins/${selectedAdminId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setAdmins((prev) => prev.filter((admin) => admin._id !== selectedAdminId));
      toast.success("Admin deleted successfully");
    } catch (error) {
      toast.error("Error deleting admin");
    } finally {
      setModalOpen(false);
    }
  };

  useEffect(() => { fetchAdmins(); }, []);

  // Filter logic for search
  const filteredAdmins = admins.filter(admin => 
    admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen py-12 md:py-16 lg:py-6 bg-[#f7f7f4] text-[#26251e]">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-[#f2f1ed] p-2.5 rounded-sm border border-[#26251e]/10">
              <ShieldCheck className="text-[#26251e]" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-normal text-[#26251e] tracking-tight">Admin Management</h1>
              <p className="text-sm text-[#26251e]/60 font-normal">Manage system administrators</p>
            </div>
          </div>
          <Link 
            href="/dashboard/signup" 
            className="inline-flex items-center justify-center gap-2 bg-[#26251e] hover:bg-[#3b3a33] text-[#f7f7f4] px-5 py-2.5 rounded-sm font-normal transition"
          >
            <Plus size={18} /> Add Admin
          </Link>
        </div>

        {/* SEARCH BAR */}
        <div className="relative mb-6 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#26251e]/40" size={18} />
          <input
            type="text"
            placeholder="Search admins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#f2f1ed] border border-[#26251e]/10 rounded-sm focus:outline-none focus:border-[#26251e] focus:ring-1 focus:ring-[#26251e] text-[#26251e] transition"
          />
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#f2f1ed] p-6 rounded-sm border border-[#26251e]/10 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)]">
            <p className="text-xs font-medium text-[#26251e]/60 uppercase tracking-wide">Total Admins</p>
            <p className="text-3xl font-normal text-[#26251e] mt-1">{admins.length}</p>
          </div>
          <div className="bg-[#f2f1ed] p-6 rounded-sm border border-[#26251e]/10 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)]">
            <p className="text-xs font-medium text-[#26251e]/60 uppercase tracking-wide">Active</p>
            <p className="text-3xl font-normal text-[#1f8a65] mt-1">{admins.length}</p>
          </div>
          <div className="bg-[#f2f1ed] p-6 rounded-sm border border-[#26251e]/10 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)]">
            <p className="text-xs font-medium text-[#26251e]/60 uppercase tracking-wide">Inactive</p>
            <p className="text-3xl font-normal text-[#26251e]/40 mt-1">0</p>
          </div>
        </div>

        {/* TABLE SECTION */}
        <div className="bg-[#f2f1ed] rounded-sm border border-[#26251e]/10 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#26251e]/10">
                  <th className="px-6 py-4 text-xs font-medium text-[#26251e]/60 uppercase tracking-wide">Name</th>
                  <th className="px-6 py-4 text-xs font-medium text-[#26251e]/60 uppercase tracking-wide">Email</th>
                  <th className="px-6 py-4 text-xs font-medium text-[#26251e]/60 uppercase tracking-wide">Role</th>
                  <th className="px-6 py-4 text-xs font-medium text-[#26251e]/60 uppercase tracking-wide">Status</th>
                  <th className="px-6 py-4 text-xs font-medium text-[#26251e]/60 uppercase tracking-wide text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#26251e]/5">
                {filteredAdmins.map((admin) => (
                  <tr key={admin._id} className="hover:bg-[#ebeae5] transition-colors group">
                    <td className="px-6 py-4 text-sm font-medium text-[#26251e]">{admin.name}</td>
                    <td className="px-6 py-4 text-sm text-[#26251e]/70">{admin.email}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 text-[11px] font-medium bg-[#26251e]/5 text-[#26251e] rounded-sm uppercase tracking-wide">
                        Admin
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-sm text-[11px] font-medium bg-[#1f8a65]/10 text-[#1f8a65] uppercase tracking-wide">
                        active
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                      
                      
                        <button 
                          onClick={() => handleDeleteClick(admin._id)}
                          className="p-1.5 text-[#26251e]/40 hover:text-[#cf2d56] hover:bg-[#cf2d56]/10 rounded-sm transition cursor-pointer"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* EMPTY STATE */}
          {!loading && filteredAdmins.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-[#26251e]/40 text-sm font-normal">No admins found matching your search.</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={confirmDelete}
        message="Are you sure you want to delete this admin?"
      />
    </div>
  );
};

export default AdminPage;
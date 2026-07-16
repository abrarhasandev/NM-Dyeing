// @ts-nocheck
"use client";

import SearchableSelect from "@/components/OrderCreate/SearchableSelect";
import useAppData from "@/hook/useAppData";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState, useMemo } from "react";
import { useDocumentTitle } from "@/hook/useDocumentTitle";
import { toast } from "sonner";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

const Page = () => {
  const { data } = useAppData();
  const transportEmployees = useQuery(api.transportEmployees.list) || [];
  const router = useRouter();
  
  useDocumentTitle("Create Order");

  const initialFormData = {
    date: new Date().toISOString().split("T")[0],
    invoiceNumber: "",
    companyName: "",
    customerId: "",
    clotheType: "",
    finishingWidth: "",
    quality: "",
    sillName: "",
    colour: "",
    finishingType: "",
    totalGoj: "",
    totalBundle: "",
    dyeingName: "",
    dyeingId: "",
    transporterName: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [tableData, setTableData] = useState([{ goj: "" }]);
  const [inputMethod, setInputMethod] = useState("table"); // "table" or "manual"
  const inputRefs = useRef([]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleTableChange = (index, e) => {
    const { name, value } = e.target;
    setTableData((prev) => {
      const updated = [...prev];
      updated[index][name] = value === "" ? "" : Number(value);
      return updated;
    });
  };

  const addRow = () => {
    setTableData((prev) => [...prev, { goj: "" }]);
    setTimeout(() => {
      const lastIndex = tableData.length;
      inputRefs.current[lastIndex]?.focus();
    }, 50);
  };

  const removeRow = (index) => {
    setTableData((prev) => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (idx === tableData.length - 1) {
        addRow();
      }
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (idx + 1 < tableData.length) {
        inputRefs.current[idx + 1]?.focus();
      }
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (idx - 1 >= 0) {
        inputRefs.current[idx - 1]?.focus();
      }
    }
  };

  const computedTotalGoj = useMemo(() => {
    return tableData.reduce((sum, row) => sum + (Number(row.goj) || 0), 0);
  }, [tableData]);

  const computedTotalBundle = tableData.length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const isManual = inputMethod === "manual";
      const payload = {
        ...formData,
        totalGoj: isManual ? formData.totalGoj : computedTotalGoj,
        totalBundle: isManual ? formData.totalBundle : computedTotalBundle,
        tableData: isManual ? [] : tableData,
      };

      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Order created successfully!");
        setFormData(initialFormData);
        setTableData([{ goj: "" }]);
        router.push("/dashboard/order");
      } else {
        toast.error("Failed to save order. Please check the provided details.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
      console.error("Error:", error);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 flex items-start justify-center text-[#26251e] dark:text-[#f7f7f4]">
      <section className="w-full max-w-5xl bg-[#f2f1ed] dark:bg-[#161616] border border-[#26251e]/10 dark:border-[#f7f7f4]/10 rounded-2xl p-8 md:p-10 shadow-[0_28px_70px_rgba(0,0,0,0.14),_0_14px_32px_rgba(0,0,0,0.1),_0_0_0_1px_rgba(0,0,0,0.05)] transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 pb-6 border-b border-[#26251e]/10 dark:border-[#f7f7f4]/10">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-2 text-[#26251e] dark:text-[#f7f7f4]">Create New Order</h2>
            <p className="text-sm text-[#26251e]/60 dark:text-[#f7f7f4]/60">Fill in the details below to generate a new order record.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="date" className="text-[13px] font-semibold text-[#26251e]/80 dark:text-[#f7f7f4]/80">
                Date
              </label>
              <input
                id="date"
                type="date"
                required
                value={formData.date}
                onChange={handleChange}
                className="bg-[#ebeae5] dark:bg-[#1f1f1f] border border-transparent focus:border-[#26251e]/20 dark:focus:border-[#f7f7f4]/20 focus:bg-[#f7f7f4] dark:focus:bg-[#262626] text-[#26251e] dark:text-[#f7f7f4] rounded-lg px-4 py-2.5 text-sm outline-none transition-all dark:[color-scheme:dark]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="invoiceNumber" className="text-[13px] font-semibold text-[#26251e]/80 dark:text-[#f7f7f4]/80">
                Invoice Number
              </label>
              <input
                id="invoiceNumber"
                type="text"
                required
                placeholder="e.g. INV-10023"
                value={formData.invoiceNumber}
                onChange={handleChange}
                className="bg-[#ebeae5] dark:bg-[#1f1f1f] border border-transparent focus:border-[#26251e]/20 dark:focus:border-[#f7f7f4]/20 focus:bg-[#f7f7f4] dark:focus:bg-[#262626] text-[#26251e] dark:text-[#f7f7f4] placeholder-[#26251e]/30 dark:placeholder-[#f7f7f4]/30 rounded-lg px-4 py-2.5 text-sm outline-none transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#26251e]/80 dark:text-[#f7f7f4]/80">Company Name</label>
              <SearchableSelect
                id="companyName"
                value={formData.companyName}
                onChange={(e) => {
                  const selected = data?.customers?.find((c) => c.companyName === e.target.value);
                  setFormData((prev) => ({
                    ...prev,
                    companyName: selected?.companyName || "",
                    customerId: selected?._id || "",
                  }));
                }}
                placeholder="Select Company"
                options={data?.customers?.map((item) => ({
                  value: item.companyName,
                  label: item.companyName,
                })) || []}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#26251e]/80 dark:text-[#f7f7f4]/80">Cloth Type</label>
              <SearchableSelect
                id="clotheType"
                value={formData.clotheType}
                onChange={handleChange}
                placeholder="Select Type"
                options={data?.clotheTypes?.map((item) => ({
                  value: item.name,
                  label: item.name,
                })) || []}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="finishingWidth" className="text-[13px] font-semibold text-[#26251e]/80 dark:text-[#f7f7f4]/80">
                Finishing Width (inch)
              </label>
              <input
                id="finishingWidth"
                type="number"
                required
                placeholder="0"
                value={formData.finishingWidth}
                onChange={handleChange}
                className="bg-[#ebeae5] dark:bg-[#1f1f1f] border border-transparent focus:border-[#26251e]/20 dark:focus:border-[#f7f7f4]/20 focus:bg-[#f7f7f4] dark:focus:bg-[#262626] text-[#26251e] dark:text-[#f7f7f4] placeholder-[#26251e]/30 dark:placeholder-[#f7f7f4]/30 rounded-lg px-4 py-2.5 text-sm outline-none transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#26251e]/80 dark:text-[#f7f7f4]/80">Quality</label>
              <SearchableSelect
                id="quality"
                value={formData.quality}
                onChange={handleChange}
                placeholder="Select Quality"
                options={data?.qualities?.map((item) => ({
                  value: item.name,
                  label: item.name,
                })) || []}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#26251e]/80 dark:text-[#f7f7f4]/80">Sill Name</label>
              <SearchableSelect
                id="sillName"
                value={formData.sillName}
                onChange={handleChange}
                placeholder="Select Sill Name"
                options={data?.sillNames?.map((item) => ({
                  value: item.name,
                  label: item.name,
                })) || []}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#26251e]/80 dark:text-[#f7f7f4]/80">Colour</label>
              <SearchableSelect
                id="colour"
                value={formData.colour}
                onChange={handleChange}
                placeholder="Select Colour"
                options={data?.colours?.map((item) => ({
                  value: item.name,
                  label: item.name,
                })) || []}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#26251e]/80 dark:text-[#f7f7f4]/80">Finishing Type</label>
              <SearchableSelect
                id="finishingType"
                value={formData.finishingType}
                onChange={handleChange}
                placeholder="Select Finishing"
                options={data?.finishingTypes?.map((item) => ({
                  value: item.name,
                  label: item.name,
                })) || []}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#26251e]/80 dark:text-[#f7f7f4]/80">Dyeing Name</label>
              <SearchableSelect
                id="dyeingName"
                value={formData.dyeingName}
                onChange={(e) => {
                  const selected = data?.dyeings?.find((d) => d.name === e.target.value);
                  setFormData((prev) => ({
                    ...prev,
                    dyeingName: selected?.name || "",
                    dyeingId: selected?._id || "",
                  }));
                }}
                placeholder="Select Dyeing Name"
                options={data?.dyeings?.map((item) => ({
                  value: item.name,
                  label: item.name,
                })) || []}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#26251e]/80 dark:text-[#f7f7f4]/80">Transporter Name</label>
              <SearchableSelect
                id="transporterName"
                value={formData.transporterName}
                onChange={handleChange}
                placeholder="Select Transporter"
                options={[
                  { value: "No specific transporter", label: "No specific transporter" },
                  ...transportEmployees.map((emp) => ({
                    value: emp.name,
                    label: emp.name,
                  }))
                ]}
              />
            </div>
          </div>

          <hr className="border-[#26251e]/10 dark:border-[#f7f7f4]/10" />

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-[#26251e] dark:text-[#f7f7f4]">Quantity Details</h3>
                <p className="text-sm text-[#26251e]/60 dark:text-[#f7f7f4]/60">Choose how to input the total quantities.</p>
              </div>
              <div className="flex bg-[#ebeae5] dark:bg-[#1f1f1f] p-1 rounded-lg w-fit shadow-inner">
                <button
                  type="button"
                  onClick={() => setInputMethod("table")}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${inputMethod === "table"
                      ? "bg-[#f7f7f4] dark:bg-[#2c2c2c] shadow-sm text-[#26251e] dark:text-[#f7f7f4]"
                      : "text-[#26251e]/50 dark:text-[#f7f7f4]/50 hover:text-[#26251e] dark:hover:text-[#f7f7f4]"
                    }`}
                >
                  Roll & Goj Table
                </button>
                <button
                  type="button"
                  onClick={() => setInputMethod("manual")}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${inputMethod === "manual"
                      ? "bg-[#f7f7f4] dark:bg-[#2c2c2c] shadow-sm text-[#26251e] dark:text-[#f7f7f4]"
                      : "text-[#26251e]/50 dark:text-[#f7f7f4]/50 hover:text-[#26251e] dark:hover:text-[#f7f7f4]"
                    }`}
                >
                  Manual Entry
                </button>
              </div>
            </div>

            {inputMethod === "table" ? (
              <div className="bg-[#f7f7f4] dark:bg-[#1c1c1c] border border-[#26251e]/10 dark:border-[#f7f7f4]/10 rounded-xl overflow-hidden shadow-sm transition-all duration-300">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[#ebeae5] dark:bg-[#1f1f1f] text-[#26251e] dark:text-[#f7f7f4] font-medium border-b border-[#26251e]/10 dark:border-[#f7f7f4]/10">
                    <tr>
                      <th className="px-5 py-3 w-24 text-center">Than #</th>
                      <th className="px-5 py-3">Goj (Length)</th>
                      <th className="px-5 py-3 w-24 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#26251e]/5 dark:divide-[#f7f7f4]/10">
                    {tableData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
                        <td className="px-5 py-3 text-center font-mono text-[#26251e]/60 dark:text-[#f7f7f4]/60">{idx + 1}</td>
                        <td className="px-5 py-2">
                          <input
                            type="number"
                            name="goj"
                            min="0"
                            placeholder="Enter goj..."
                            ref={(el) => (inputRefs.current[idx] = el)}
                            value={row.goj ?? ""}
                            onChange={(e) => handleTableChange(idx, e)}
                            onKeyDown={(e) => handleKeyDown(e, idx)}
                            onWheel={(e) => e.target.blur()}
                            className="w-full bg-transparent border-none focus:ring-0 outline-none text-[#26251e] dark:text-[#f7f7f4] placeholder:text-[#26251e]/30 dark:placeholder:text-[#f7f7f4]/30 px-0 py-2"
                          />
                        </td>
                        <td className="px-5 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeRow(idx)}
                            className="text-[#cf2d56] hover:bg-[#cf2d56]/10 w-8 h-8 rounded-md flex items-center justify-center transition-colors mx-auto"
                            title="Remove row"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="bg-[#ebeae5]/50 dark:bg-[#1f1f1f]/50 px-5 py-4 flex flex-col sm:flex-row sm:justify-between items-center text-[#26251e] dark:text-[#f7f7f4] font-semibold text-sm border-t border-[#26251e]/10 dark:border-[#f7f7f4]/10 gap-2">
                  <div className="flex items-center gap-2 bg-white/60 dark:bg-white/10 px-3 py-1.5 rounded-md shadow-sm border border-[#26251e]/5 dark:border-[#f7f7f4]/5">
                    <span className="text-[#26251e]/60 dark:text-[#f7f7f4]/60">Total Than:</span>
                    <span className="text-lg">{computedTotalBundle}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/60 dark:bg-white/10 px-3 py-1.5 rounded-md shadow-sm border border-[#26251e]/5 dark:border-[#f7f7f4]/5">
                    <span className="text-[#26251e]/60 dark:text-[#f7f7f4]/60">Total Goj:</span>
                    <span className="text-lg">{computedTotalGoj}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-[#f7f7f4] dark:bg-[#1c1c1c] rounded-xl border border-[#26251e]/10 dark:border-[#f7f7f4]/10 transition-all duration-300">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="totalGoj" className="text-[13px] font-semibold text-[#26251e]/80 dark:text-[#f7f7f4]/80">
                    Total Goj
                  </label>
                  <input
                    id="totalGoj"
                    type="number"
                    min="0"
                    placeholder="e.g. 500"
                    required={inputMethod === "manual"}
                    value={formData.totalGoj}
                    onChange={handleChange}
                    className="bg-[#ebeae5] dark:bg-[#1f1f1f] border border-transparent focus:border-[#26251e]/20 dark:focus:border-[#f7f7f4]/20 focus:bg-white dark:focus:bg-[#262626] text-[#26251e] dark:text-[#f7f7f4] placeholder-[#26251e]/30 dark:placeholder-[#f7f7f4]/30 rounded-lg px-4 py-2.5 text-sm outline-none transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="totalBundle" className="text-[13px] font-semibold text-[#26251e]/80 dark:text-[#f7f7f4]/80">
                    Total Bundle
                  </label>
                  <input
                    id="totalBundle"
                    type="number"
                    min="0"
                    placeholder="e.g. 10"
                    required={inputMethod === "manual"}
                    value={formData.totalBundle}
                    onChange={handleChange}
                    className="bg-[#ebeae5] dark:bg-[#1f1f1f] border border-transparent focus:border-[#26251e]/20 dark:focus:border-[#f7f7f4]/20 focus:bg-white dark:focus:bg-[#262626] text-[#26251e] dark:text-[#f7f7f4] placeholder-[#26251e]/30 dark:placeholder-[#f7f7f4]/30 rounded-lg px-4 py-2.5 text-sm outline-none transition-all"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-6 mt-8 border-t border-[#26251e]/10 dark:border-[#f7f7f4]/10">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2.5 rounded-lg font-medium text-[#26251e] dark:text-[#f7f7f4] bg-transparent hover:bg-[#26251e]/5 dark:hover:bg-[#f7f7f4]/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-8 py-2.5 rounded-lg font-medium text-[#f7f7f4] dark:text-[#161616] bg-[#26251e] dark:bg-[#f7f7f4] hover:bg-[#3b3a33] dark:hover:bg-[#e0e0e0] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all"
            >
              Create Order
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default Page;

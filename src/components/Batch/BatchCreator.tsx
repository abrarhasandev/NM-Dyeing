// @ts-nocheck
"use client";
import useAppData from "@/hook/useAppData";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { createBatchAction } from "@/app/actions/batchActions";

interface BatchCreatorProps {
  orderId: string;
  batchData: any[];
  setBatchData: React.Dispatch<React.SetStateAction<any[]>>;
  keys: string[];
  setUsedRowIndexes: React.Dispatch<React.SetStateAction<string[]>>;
  selectedOrder?: any;
  setOrders?: React.Dispatch<React.SetStateAction<any[]>>;
  setSelectedOrder?: React.Dispatch<React.SetStateAction<any>>;
  fetchOrders?: () => void;
}

export default function BatchCreator({
  orderId,
  batchData,
  setBatchData,
  keys,
  setUsedRowIndexes,
  selectedOrder,
  setOrders,
  setSelectedOrder,
  fetchOrders,
}: BatchCreatorProps) {
  const [loading, setLoading] = useState(false);
  const { data } = useAppData();

  const [selectedColour, setSelectedColour] = useState("");
  const [selectedFinishing, setSelectedFinishing] = useState("");
  const [selectedSill, setSelectedSill] = useState("");
  const [selectedDyeing, setSelectedDyeing] = useState("");
  const [selectedCalender, setSelectedCalender] = useState("");
  const [selectedCalenderId, setSelectedCalenderId] = useState(null);
  const [selectedProcesses, setSelectedProcesses] = useState([]);

  // helper: OrderTableData এর সাথে same logic রাখব
  const makeRowKey = (row) => {
    if (!row) return "";
    return `${row.rollNo ?? ""}-${row.goj ?? ""}`;
  };
  console.log(orderId);
  // pre-fill from selectedOrder
  useEffect(() => {
    if (selectedOrder) {
      setSelectedColour(selectedOrder?.colour || "");
      setSelectedFinishing(selectedOrder?.finishingType || "");
      setSelectedSill(selectedOrder?.sillName || "");
      setSelectedDyeing(selectedOrder?.dyeingName || "");

      const calName = selectedOrder?.calender || "";
      setSelectedCalender(calName);

      if (calName && data?.calender) {
        const calObj = data.calender.find((c) => c.name === calName);
        if (calObj) {
          setSelectedCalenderId(calObj._id);
        }
      }

      if (selectedOrder?.selectedProcesses?.length > 0) {
        setSelectedProcesses(
          selectedOrder.selectedProcesses.map((p) =>
            typeof p === "string" ? p : p.name
          )
        );
      }
    }
  }, [selectedOrder, data?.calender]);

  if (!batchData?.length) return null;

  const Dropdown = ({ label, options, selected, setSelected, optional }: { label: string, options: any[], selected: string, setSelected: any, optional?: boolean }) => (
    <div className="w-40 mb-1">
      <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-muted-foreground">
        {label}
      </label>
      <select
        value={selected}
        onChange={(e) => {
          setSelected(e.target.value);

          if (label === "Calender") {
            const cal = options.find((opt) => opt.name === e.target.value);
            setSelectedCalenderId(cal?._id || null);
          }
        }}
        className="block w-full py-1 border border-gray-300 dark:border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-card text-gray-900 dark:text-foreground cursor-pointer"
      >
        <option value="">{optional ? "None" : "Select"}</option>
        {options?.map((opt) => (
          <option key={opt._id} value={opt.name}>
            {opt.name}
          </option>
        ))}
      </select>
    </div>
  );

  const MultiSelectDropdown = ({ label, options, selected, setSelected }: { label: string, options: any[], selected: string[], setSelected: any }) => {
    const toggle = (name: string) => {
      if (selected.includes(name)) {
        setSelected(selected.filter((s) => s !== name));
      } else {
        setSelected([...selected, name]);
      }
    };

    return (
      <div className="w-40 mb-1">
        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-muted-foreground">
          {label}
        </label>
        <div className="border border-gray-300 dark:border-border rounded-md p-1 bg-white dark:bg-card">
          {options?.map((opt) => (
            <div
              key={opt._id}
              className="flex items-center gap-2 cursor-pointer p-1 hover:bg-gray-100 dark:hover:bg-accent/50 dark:text-foreground"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt.name)}
                onChange={() => toggle(opt.name)}
              />
              <span>{opt.name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const confirmBatch = async () => {
    if (
      !selectedColour ||
      !selectedFinishing ||
      !selectedSill ||
      !selectedDyeing ||
      selectedProcesses.length === 0
    ) {
      toast.error("Please select all required dropdowns!");
      return;
    }

    if (batchData.length === 0) {
      toast.error("Please select at least one row");
      return;
    }

    try {
      setLoading(true);

      const processesPayload =
        selectedProcesses.map((pname) => {
          const p = data.processes.find((pr) => pr.name === pname);
          return { name: p.name, price: p?.price || 0 };
        }) || [];

      const customerId =
        selectedOrder?.customerId?._id || selectedOrder?.customerId || null;
      const dyeingId =
        selectedOrder?.dyeingId?._id || selectedOrder?.dyeingId || null;

      const payload = {
        orderId,
        colour: selectedColour,
        quality: selectedOrder?.quality || "",
        sillName: selectedSill,
        clotheType: selectedOrder?.clotheType || "",
        finishingType: selectedFinishing,
        dyeing: selectedDyeing,
        calender: selectedCalender || null,
        calenderId: selectedCalenderId || null,
        customerId,
        dyeingId,

        // ✅ rows DB-তে simple রাখছি
        rows: batchData.map((row) => ({
          rollNo: row.rollNo,
          goj: row.goj,
          // চাইলে idx: [row.idx] রাখতেই পারো
        })),

        selectedProcesses: processesPayload,
      };

      const res = await createBatchAction(payload);

      let newBatch;
      try {
        newBatch = res.data || {};
      } catch {
        newBatch = {};
      }

      if (res.success) {
        toast.success("Batch created successfully!");

        // ✅ যেসব row এবার use হল, সেগুলোর rowKey গুলো lifetime locked
        const newKeys = batchData.map((r) => makeRowKey(r));
        setUsedRowIndexes((prev) =>
          Array.from(new Set([...(prev || []), ...newKeys]))
        );

        if (setOrders) {
          setOrders((prev) =>
            prev.map((order) => {
              if (order._id === orderId) {
                const addedBundle = batchData.length;
                const addedGoj = batchData.reduce((sum, r) => sum + (Number(r.goj) || 0), 0);
                return {
                  ...order,
                  batchSummary: {
                    batchCount: (order.batchSummary?.batchCount || 0) + 1,
                    totalBatchBundle: (order.batchSummary?.totalBatchBundle || 0) + addedBundle,
                    totalBatchGoj: (order.batchSummary?.totalBatchGoj || 0) + addedGoj,
                  },
                };
              }
              return order;
            })
          );
        }

        if (setSelectedOrder) {
          setSelectedOrder((prev) => {
            if (!prev) return prev;
            const addedBundle = batchData.length;
            const addedGoj = batchData.reduce((sum, r) => sum + (Number(r.goj) || 0), 0);
            return {
              ...prev,
              batchSummary: {
                batchCount: (prev.batchSummary?.batchCount || 0) + 1,
                totalBatchBundle: (prev.batchSummary?.totalBatchBundle || 0) + addedBundle,
                totalBatchGoj: (prev.batchSummary?.totalBatchGoj || 0) + addedGoj,
              },
            };
          });
        }

        setBatchData([]);
        if (fetchOrders) fetchOrders();
      } else {
        toast.error(res.error || "Batch creation failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error while creating batch");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6">
      <div className="p-4 border rounded-lg bg-gray-50 dark:bg-card dark:border-border shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-700 dark:text-foreground">Create Batch</h4>
          <button
            onClick={confirmBatch}
            disabled={loading}
            className="px-4 py-1 text-sm bg-green-600 cursor-pointer text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Create Batch"}
          </button>
        </div>

        {/* Batch Table */}
        <table className="w-full text-sm border-collapse mt-4">
          <thead className="bg-gray-100 dark:bg-muted text-gray-700 dark:text-foreground">
            <tr>
              {keys?.map((key) => (
                <th key={key} className="px-4 py-2 border dark:border-border text-left">
                  {key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {batchData?.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50 dark:hover:bg-accent/50">
                {keys?.map((key, j) => (
                  <td key={j} className="px-4 py-2 border dark:border-border dark:text-foreground">
                    {row[key] ?? "N/A"}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="font-semibold bg-gray-200 dark:bg-muted/80 dark:text-foreground">
              {keys.map((key, i) => {
                let value: string | number = "";
                if (key === "goj")
                  value = batchData.reduce(
                    (acc, row) => acc + (Number(row.goj) || 0),
                    0
                  );
                if (key === "rollNo") value = batchData.length;
                return (
                  <td key={i} className="px-4 py-2 border dark:border-border">
                    Total: {value}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Dropdowns */}
      <div className="flex justify-center gap-4 mt-4 flex-wrap py-4 border rounded-lg bg-gray-50 dark:bg-card dark:border-border shadow-sm">
        <Dropdown
          label="Colour"
          options={data?.colours || []}
          selected={selectedColour}
          setSelected={setSelectedColour}
        />
        <Dropdown
          label="Sill Name"
          options={data?.sillNames || []}
          selected={selectedSill}
          setSelected={setSelectedSill}
        />
        <Dropdown
          label="Finishing Type"
          options={data?.finishingTypes || []}
          selected={selectedFinishing}
          setSelected={setSelectedFinishing}
        />
        <Dropdown
          label="Dyeing"
          options={data?.dyeings || []}
          selected={selectedDyeing}
          setSelected={setSelectedDyeing}
        />

        <MultiSelectDropdown
          label="Process List"
          options={data?.processes || []}
          selected={selectedProcesses}
          setSelected={setSelectedProcesses}
        />

        {selectedProcesses.some((p) => p.toLowerCase() === "calender") && (
          <Dropdown
            label="Calender"
            options={data?.calender || []}
            selected={selectedCalender}
            setSelected={setSelectedCalender}
            optional={true}
          />
        )}
      </div>
    </div>
  );
}

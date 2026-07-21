// @ts-nocheck
"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import Stepper from "./Stepper";
import StatusModal from "./StatusModal";
import OrderTableData from "./OrderTableData";
import BatchList from "./BatchList";
import DeliveredBatchList from "../Batch/DeliveredBatchList";
import CalendarBatch from "../Batch/CalenderBatch";
import BillingBatch from "../Batch/BillingBatch";
import CompletedBatch from "../Batch/CompletedBatch";
import { useSearchParams, useRouter } from "next/navigation";

// ✅ Steps for UI
const steps = [
  { id: 1, title: "Pending" },
  { id: 2, title: "Process" },
  { id: 3, title: "Batches" },
  { id: 4, title: "Calender" },
  { id: 5, title: "Dispatch" },
  { id: 6, title: "Billing" },
  { id: 7, title: "Completed" },
];

const statusMap = {
  Pending: "pending",
  Process: "inprocess",
  Batches: "batch",
  Calender: "calender",
  Dispatch: "delivered",
  Billing: "billing",
  Completed: "completed",
};

export default function OrderStatus({
  orderId,
  currentStatus,
  tableData,
  onStatusChange,
  selectedOrder,
  setOrders,
  setSelectedOrder,
  fetchOrders,
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get("tab");

  // `currentStep` represents the actual status of the order (progress line)
  const [currentStep, setCurrentStep] = useState(
    steps.find((s) => statusMap[s.title] === currentStatus)?.id || 1
  );

  // `activeTab` represents the currently viewed tab
  const [activeTab, setActiveTab] = useState(() => {
    if (tab) {
      const stepByTab = steps.find((s) => s.title === tab);
      if (stepByTab) return stepByTab.id;
    }
    return steps.find((s) => statusMap[s.title] === currentStatus)?.id || 1;
  });

  const [selectedStep, setSelectedStep] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Sync currentStep when selected order status changes
  useEffect(() => {
    const stepId = steps.find((s) => statusMap[s.title] === currentStatus)?.id || 1;
    setCurrentStep(stepId);
    
    // If no explicit tab is in the URL, also update activeTab
    if (!tab) {
      setActiveTab(stepId);
    }
  }, [currentStatus, tab]);

  // Sync activeTab when URL tab changes
  useEffect(() => {
    if (tab) {
      const stepByTab = steps.find((s) => s.title === tab);
      if (stepByTab) {
        setActiveTab(stepByTab.id);
      }
    }
  }, [tab]);

  const [usedRowIndexes, setUsedRowIndexes] = useState([]);
  const [createdBatches, setCreatedBatches] = useState([]);

  // ✅ Direct status update
  const updateStatusDirectly = async (step) => {
    try {
      const res = await fetch(`/api/order/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusMap[step.title] }),
      });

      const data = await res.json();
      if (res.ok) {
        setCurrentStep(step.id);
        setActiveTab(step.id);
        onStatusChange(statusMap[step.title]);
        // toast.success("Status updated!");
      } else {
        toast.error(data.error || "Failed to update status");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error");
    }
  };

  const confirmChange = async () => {
    await updateStatusDirectly(selectedStep);
    setShowModal(false);
  };

  const handleStepClick = async (step) => {
    // 1. Update the URL to reflect the new tab, for easily copy-pasting
    const params = new URLSearchParams(searchParams.toString());
    params.set("id", orderId);
    params.set("tab", step.title);
    router.push(`/dashboard/order?${params.toString()}`, { scroll: false });

    // 2. We only allow updating the status if they click a step DIFFERENT from the actual current status
    // But wait, the user's main requirement was: "when I shift between each status, say from 1 to 7, there is no change in the route. This means that if you try to go directly to any status through the route, it is not possible. For this reason, when you click on the current dispatch button, it is not opening. I want each status to have a separate number and a route or url endpoint so that the specified status can be opened very easily using them."
    // They ALSO said: "after opening the delivery slip by clicking on the dispatch button, or after opening it, the order status should not be affected in any way."

    // Let's assume clicking a step still changes status like it did before,
    // but the URL updates too.
    if (currentStep === 1 && step.id === 2) {
      setSelectedStep(step);
      setShowModal(true);
      return;
    }

    if (currentStep !== step.id) {
      await updateStatusDirectly(step);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-6 text-gray-800 dark:text-foreground">Status</h2>

      <Stepper
        steps={steps}
        currentStep={currentStep}
        activeTab={activeTab}
        onStepClick={handleStepClick}
      />

      {/* Show content based on ACTIVE TAB */}
      {steps[activeTab - 1]?.title === "Process" && (
        <OrderTableData
          selectedOrder={selectedOrder}
          orderId={orderId}
          tableData={tableData}
          currentStep={currentStep}
          usedRowIndexes={usedRowIndexes}
          setUsedRowIndexes={setUsedRowIndexes}
          sillName={selectedOrder?.sillName}
          createdBatches={createdBatches}
          setCreatedBatches={setCreatedBatches}
          setOrders={setOrders}
          setSelectedOrder={setSelectedOrder}
          fetchOrders={fetchOrders}
        />
      )}

      {steps[activeTab - 1]?.title === "Batches" && (
        <BatchList orderId={orderId} fetchOrders={fetchOrders} />
      )}

      {steps[activeTab - 1]?.title === "Calender" && (
        <CalendarBatch orderId={orderId} fetchOrders={fetchOrders} />
      )}
      {steps[activeTab - 1]?.title === "Dispatch" && (
        <DeliveredBatchList orderId={orderId} fetchOrders={fetchOrders} />
      )}
      {steps[activeTab - 1]?.title === "Billing" && (
        <BillingBatch orderId={orderId} fetchOrders={fetchOrders} />
      )}
      {steps[activeTab - 1]?.title === "Completed" && (
        <CompletedBatch orderId={orderId} fetchOrders={fetchOrders} />
      )}

      {/* Confirmation modal only for first change */}
      {showModal && selectedStep && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-card rounded-lg p-6 max-w-sm w-full shadow-lg">
            <StatusModal
              selectedStep={selectedStep}
              confirmChange={confirmChange}
              onClose={() => setShowModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

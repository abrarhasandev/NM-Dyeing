// @ts-nocheck
import React from "react";
import { AlertTriangle } from "lucide-react";

interface ConfirmationModalProps {
  showConfirmModal: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  isTrashMode?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ showConfirmModal, onCancel, onConfirm, isTrashMode }) => {
  if (!showConfirmModal) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[60]"
      style={{ backgroundColor: "rgba(38,37,30,0.3)", backdropFilter: "blur(3px)" }}
    >
      <div
        className="relative flex flex-col items-center text-center bg-background rounded-[12px] shadow-lg border border-border px-7 py-8 w-full max-w-[380px]"
      >
        {/* Icon */}
        <div
          className="flex items-center justify-center mb-4 w-[52px] h-[52px] rounded-full bg-[#cf2d56]/10 border border-[#cf2d56]/20"
        >
          <AlertTriangle size={24} className="text-[#cf2d56]" />
        </div>

        {/* Title */}
        <h3 className="font-semibold mb-2 text-[16px] leading-6 text-foreground">
          {isTrashMode ? "Permanently Delete Order?" : "Delete Order?"}
        </h3>

        {/* Description */}
        <p className="mb-8 text-[14px] leading-5 text-muted-foreground max-w-[280px]">
          {isTrashMode 
            ? "Are you sure you want to permanently delete this order? This action cannot be undone." 
            : "Are you sure you want to delete this order? It will be moved to the trash."}
        </p>

        {/* Actions */}
        <div className="flex gap-3 w-full">
          <button
            className="flex-1 font-semibold transition-all cursor-pointer text-[13px] px-4 py-2.5 rounded-[8px] bg-card text-foreground border border-border hover:bg-accent"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="flex-1 font-semibold text-primary-foreground transition-all cursor-pointer text-[13px] px-4 py-2.5 rounded-[8px] bg-[#cf2d56] border-none shadow-sm hover:opacity-90"
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;

import React from "react";
import { AlertTriangle } from "lucide-react";

const ConfirmationModal = ({ showConfirmModal, onCancel, onConfirm }) => {
  if (!showConfirmModal) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[60]"
      style={{ backgroundColor: "rgba(28,39,76,0.3)", backdropFilter: "blur(3px)" }}
    >
      <div
        className="relative flex flex-col items-center text-center"
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "var(--mn-radius-lg-2)",
          boxShadow: "0px 8px 32px rgba(28,39,76,0.18)",
          padding: "32px 28px",
          width: "100%",
          maxWidth: "380px",
          fontFamily: "var(--mn-font-primary)",
          border: "1px solid var(--mn-surface)",
        }}
      >
        {/* Icon */}
        <div
          className="flex items-center justify-center mb-4"
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            backgroundColor: "rgba(146,37,37,0.08)",
            border: "1px solid rgba(146,37,37,0.15)",
          }}
        >
          <AlertTriangle size={24} style={{ color: "var(--mn-accent-alt)" }} />
        </div>

        {/* Title */}
        <h3
          className="font-semibold mb-2"
          style={{ fontSize: "16px", lineHeight: "24px", color: "var(--mn-text-primary)" }}
        >
          Delete Order?
        </h3>

        {/* Description */}
        <p
          className="mb-8"
          style={{ fontSize: "14px", lineHeight: "20px", color: "var(--mn-text-tertiary)", maxWidth: 280 }}
        >
          Are you sure you want to delete this order? This action cannot be undone.
        </p>

        {/* Actions */}
        <div className="flex gap-3 w-full">
          <button
            className="flex-1 font-semibold transition-all cursor-pointer"
            style={{
              fontSize: "13px",
              padding: "10px 16px",
              borderRadius: "var(--mn-radius-md)",
              backgroundColor: "var(--mn-surface)",
              color: "var(--mn-text-primary)",
              border: "1px solid var(--mn-surface-alt)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--mn-surface-alt)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--mn-surface)")}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="flex-1 font-semibold text-white transition-all cursor-pointer"
            style={{
              fontSize: "13px",
              padding: "10px 16px",
              borderRadius: "var(--mn-radius-md)",
              backgroundColor: "var(--mn-accent-alt)",
              border: "none",
              boxShadow: "var(--mn-elevation-1)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
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
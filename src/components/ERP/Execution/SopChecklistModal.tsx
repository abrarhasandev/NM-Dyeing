"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SopChecklistModalProps {
  processName: string;
  onConfirm: () => Promise<void>;
  buttonDisabled?: boolean;
}

export function SopChecklistModal({ processName, onConfirm, buttonDisabled }: SopChecklistModalProps) {
  const [open, setOpen] = useState(false);
  const [checkedSops, setCheckedSops] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch SOPs for the given process
  const sops = useQuery(api.sops.getSopsByProcess, { processName }) || [];
  const mandatorySops = sops.filter(sop => sop.isMandatory);

  // Reset checkboxes when modal opens
  useEffect(() => {
    if (open) {
      setCheckedSops(new Set());
    }
  }, [open]);

  const toggleSop = (sopId: string) => {
    const newSet = new Set(checkedSops);
    if (newSet.has(sopId)) {
      newSet.delete(sopId);
    } else {
      newSet.add(sopId);
    }
    setCheckedSops(newSet);
  };

  const allMandatoryChecked = mandatorySops.every(sop => checkedSops.has(sop._id));

  const handleStart = async () => {
    if (!allMandatoryChecked) {
      toast.error("You must complete all mandatory SOPs.");
      return;
    }

    try {
      setIsProcessing(true);
      // Let the parent component handle the actual batch creation and execution logic
      await onConfirm();
      setOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to start batch.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button disabled={buttonDisabled} className="bg-green-600 hover:bg-green-700 text-white" />}>
        Start Batch
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>SOP Checklist: {processName}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            Please verify and complete all mandatory standard operating procedures before starting this batch.
          </p>
          
          {sops.length === 0 ? (
            <div className="text-sm italic text-muted-foreground">No SOPs configured for this process.</div>
          ) : (
            <div className="space-y-3">
              {sops.map((sop) => (
                <div key={sop._id} className="flex items-start gap-3 p-2 border rounded-md bg-muted/20">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 cursor-pointer"
                    checked={checkedSops.has(sop._id)}
                    onChange={() => toggleSop(sop._id)}
                  />
                  <div>
                    <label className="text-sm font-medium leading-none cursor-pointer" onClick={() => toggleSop(sop._id)}>
                      {sop.title}
                      {sop.isMandatory && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {sop.description && (
                      <p className="text-xs text-muted-foreground mt-1">{sop.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleStart} disabled={(!allMandatoryChecked && sops.length > 0) || isProcessing}>
            {isProcessing ? "Processing..." : "Confirm & Start"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

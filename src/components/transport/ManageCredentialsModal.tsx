"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Key } from "lucide-react";
import type { TransportEmployeeDoc } from "@/types/transport";
import type { Id } from "../../../../convex/_generated/dataModel";

type Props = {
  employee: TransportEmployeeDoc | null;
  isOpen: boolean;
  onClose: () => void;
};

export function ManageCredentialsModal({ employee, isOpen, onClose }: Props) {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setCredentials = useMutation(api.transportEmployees.setCredentials);

  // Initialize fields when employee is loaded
  // We use a React effect-like pattern or just simple state reset on open
  // since we don't fetch password back for security, we only show loginId
  const handleOpenChange = (open: boolean) => {
    if (open && employee) {
      setLoginId(employee.loginId || "");
      setPassword(""); // always clear password
    }
    if (!open) {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;

    if (!loginId.trim() || !password.trim()) {
      toast.error("Login ID and Password are required");
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await setCredentials({
        id: employee._id as Id<"transportEmployees">,
        loginId: loginId.trim(),
        password: password.trim(),
      });
      
      if (result && result.success === false) {
        toast.error(result.message);
        return;
      }

      toast.success("Credentials updated successfully!");
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update credentials");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            Manage Login Credentials
          </DialogTitle>
          <DialogDescription>
            Set the Login ID and Password for {employee?.name}. They will use these to log into the Android application.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label htmlFor="loginId" className="text-sm font-medium text-foreground">
              Login ID
            </label>
            <input
              id="loginId"
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="e.g., emp123"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <input
              id="password"
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Enter new password"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Note: Passwords are not visible after saving for security reasons.
            </p>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
              )}
              Save Credentials
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

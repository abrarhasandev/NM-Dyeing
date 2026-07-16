// @ts-nocheck
"use client";

import { useEffect } from "react";
import { Truck, AlertTriangle, RefreshCcw } from "lucide-react";

export default function TransportError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Transport Module Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
      <div className="bg-card border border-border shadow-sm rounded-lg p-8 max-w-md w-full text-center space-y-5">
        <div className="mx-auto w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center shrink-0">
          <AlertTriangle size={32} />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight">
            Something went wrong!
          </h2>
          <p className="text-sm text-muted-foreground">
            We encountered an issue while loading the transport module. 
            {error.message ? ` Details: ${error.message}` : ""}
          </p>
        </div>

        <button
          onClick={() => reset()}
          className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-md font-medium transition-all duration-200 shadow-sm"
        >
          <RefreshCcw size={16} />
          <span>Try again</span>
        </button>
      </div>
    </div>
  );
}

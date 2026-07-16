// @ts-nocheck
"use client";

import { Users, Truck, Gauge } from "lucide-react";
import type { TransportStats } from "@/types/transport";

type Props = {
  stats: TransportStats | undefined;
  isLoading: boolean;
};

function StatSkeleton() {
  return (
    <span className="inline-block w-16 h-8 bg-muted rounded-md animate-pulse" />
  );
}

export function TransportStatsCards({ stats, isLoading }: Props) {
  const cards = [
    {
      key: "employees",
      label: "Total Employees",
      icon: Users,
      value: stats?.totalEmployees,
    },
    {
      key: "vehicles",
      label: "Total Vehicles",
      icon: Truck,
      value: stats?.totalVehicles,
    },
    {
      key: "capacity",
      label: "Total Capacity",
      icon: Gauge,
      value: stats?.totalCapacity,
      suffix: "yards",
    },
  ] as const;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cards.map(({ key, label, icon: Icon, value, ...rest }) => {
        const suffix = "suffix" in rest ? rest.suffix : undefined;
        return (
          <div
            key={key}
            className="bg-card p-6 rounded-lg border border-border shadow-sm relative overflow-hidden group hover:border-border/80 transition-colors h-[130px] flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Icon size={64} />
            </div>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              {label}
            </p>
            <div className="flex items-baseline gap-1 mt-2">
              {isLoading || stats === undefined ? (
                <StatSkeleton />
              ) : (
                <>
                  <p className="text-3xl font-bold text-foreground">
                    {typeof value === "number" ? value.toLocaleString() : "—"}
                  </p>
                  {suffix ? (
                    <span className="text-sm text-muted-foreground font-medium">
                      {suffix}
                    </span>
                  ) : null}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

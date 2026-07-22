// @ts-nocheck
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  Truck,
  Phone,
  MapPin,
  ChevronRight,
  MoreVertical,
  Key,
} from "lucide-react";
import {
  getAddressDisplay,
  getPhoneDisplay,
  type TransportEmployeeDoc,
} from "@/types/transport";
import { ManageCredentialsModal } from "./ManageCredentialsModal";

type Props = {
  employees: TransportEmployeeDoc[];
  listLoading: boolean;
  deletingId: string | null;
  debouncedSearch: string;
  onDelete: (id: string) => void;
  status: "LoadingFirstPage" | "CanLoadMore" | "LoadingMore" | "Exhausted";
  onLoadMore: () => void;
};

function TableSkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, idx) => (
        <tr key={`skeleton-${idx}`} className="animate-pulse">
          <td className="px-6 py-4">
            <div className="h-10 w-32 bg-muted rounded-md" />
          </td>
          <td className="px-6 py-4">
            <div className="h-6 w-24 bg-muted rounded-md" />
          </td>
          <td className="px-6 py-4">
            <div className="h-6 w-48 bg-muted rounded-md" />
          </td>
          <td className="px-6 py-4">
            <div className="h-6 w-20 bg-muted rounded-md" />
          </td>
          <td className="px-6 py-4">
            <div className="h-6 w-16 bg-muted rounded-md" />
          </td>
          <td className="px-6 py-4 text-right">
            <div className="h-8 w-8 bg-muted rounded-md ml-auto" />
          </td>
        </tr>
      ))}
    </>
  );
}

export function TransportEmployeeTable({
  employees,
  listLoading,
  deletingId,
  debouncedSearch,
  onDelete,
  status,
  onLoadMore,
}: Props) {
  const router = useRouter();
  const [managingEmployee, setManagingEmployee] = useState<TransportEmployeeDoc | null>(null);

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Address
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Vehicle
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Capacity
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {listLoading ? (
              <TableSkeletonRows />
            ) : employees.length > 0 ? (
              employees.map((emp) => (
                <tr
                  key={emp._id}
                  onClick={() =>
                    router.push(`/dashboard/transport/${emp._id}/orders`)
                  }
                  className={`hover:bg-accent/50 transition-colors group cursor-pointer ${
                    deletingId === emp._id
                      ? "opacity-50 pointer-events-none"
                      : ""
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden border border-border">
                        {emp.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={emp.avatar}
                            alt={emp.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-semibold text-primary">
                            {emp.name?.charAt(0)?.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <Link
                          href={`/dashboard/transport/profile/${emp._id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm font-semibold text-foreground hover:text-primary hover:underline transition-colors"
                        >
                          {emp.name}
                        </Link>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Age: {emp.age}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      {emp.phoneNumbers?.slice(0, 2).map((phone, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1.5 text-xs text-muted-foreground"
                        >
                          <Phone size={11} className="shrink-0" />
                          <span className="font-mono">
                            {getPhoneDisplay(phone)}
                          </span>
                        </div>
                      ))}
                      {(emp.phoneNumbers?.length ?? 0) > 2 && (
                        <span className="text-xs text-muted-foreground/70">
                          +{emp.phoneNumbers.length - 2} more
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground max-w-[180px]">
                      <MapPin size={13} className="shrink-0" />
                      <span className="truncate">
                        {getAddressDisplay(emp.address)}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="inline-flex items-center gap-1.5 text-xs font-medium bg-secondary/60 px-2.5 py-1 rounded-md border border-border">
                      <Truck size={12} />
                      <span>
                        {emp.vehicleType} · {emp.vehicleWheels}W
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-foreground">
                      {emp.clothCapacityYards?.toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      yards
                    </span>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div
                      className="flex justify-end"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-all outline-none">
                          <MoreVertical size={16} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-40 border-border bg-card"
                        >
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/dashboard/transport/profile/${emp._id}`}
                              className="cursor-pointer flex items-center gap-2"
                            >
                              <Eye size={14} />
                              <span>View Profile</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/dashboard/transport/edit/${emp._id}`}
                              className="cursor-pointer flex items-center gap-2"
                            >
                              <Pencil size={14} />
                              <span>Edit</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setManagingEmployee(emp);
                            }}
                            className="cursor-pointer flex items-center gap-2"
                          >
                            <Key size={14} />
                            <span>Manage Login</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDelete(emp._id)}
                            disabled={deletingId === emp._id}
                            className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 flex items-center gap-2"
                          >
                            <Trash2 size={14} />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-24">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Truck size={48} className="mb-4 opacity-20" />
                    <p className="text-sm font-medium">
                      {debouncedSearch
                        ? "No employees found matching your search."
                        : "No transport employees yet. Add your first employee!"}
                    </p>
                    {!debouncedSearch && (
                      <Link
                        href="/dashboard/transport/createEmployee"
                        className="mt-4 inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                      >
                        <Plus size={16} />
                        Add Employee
                        <ChevronRight size={14} />
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {status === "CanLoadMore" && (
        <div className="p-4 border-t border-border flex justify-center bg-muted/20">
          <button
            type="button"
            onClick={onLoadMore}
            className="px-6 py-2 bg-secondary text-secondary-foreground text-sm font-medium rounded-md hover:bg-secondary/80 transition-colors inline-flex items-center gap-2"
          >
            Load More
          </button>
        </div>
      )}
      {status === "LoadingMore" && (
        <div className="p-4 border-t border-border flex justify-center bg-muted/20">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-muted-foreground" />
            Loading more...
          </div>
        </div>
      )}

      <ManageCredentialsModal
        employee={managingEmployee}
        isOpen={!!managingEmployee}
        onClose={() => setManagingEmployee(null)}
      />
    </div>
  );
}

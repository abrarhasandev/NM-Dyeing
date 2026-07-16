// @ts-nocheck
"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { IAddressNid } from "@/types/transport";

type AddressRow = {
  _id: string;
  name: string;
  bn_name: string;
};

type AddressSelectorProps = {
  title: string;
  addressData: IAddressNid;
  onChange: (field: keyof IAddressNid, val: string) => void;
  isSameAsNid?: boolean;
  onToggleSameAsNid?: () => void;
  showSameAsNidCheckbox?: boolean;
};

/**
 * Cascading BD address dropdowns — data from Convex only (no browser API calls).
 */
export function AddressSelector({
  title,
  addressData,
  onChange,
  isSameAsNid,
  onToggleSameAsNid,
  showSameAsNidCheckbox,
}: AddressSelectorProps) {
  const divisions = (useQuery(api.addresses.getDivisions) ?? []) as AddressRow[];
  const districts = (useQuery(
    api.addresses.getDistricts,
    addressData.division ? { divisionName: addressData.division } : "skip"
  ) ?? []) as AddressRow[];
  const upazilas = (useQuery(
    api.addresses.getUpazilas,
    addressData.district ? { districtName: addressData.district } : "skip"
  ) ?? []) as AddressRow[];
  const unions = (useQuery(
    api.addresses.getUnions,
    addressData.upazila ? { upazilaName: addressData.upazila } : "skip"
  ) ?? []) as AddressRow[];

  const selectClass =
    "w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:border-ring text-sm disabled:opacity-50";

  return (
    <div className="space-y-3 pt-4 border-t border-border mt-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-foreground/80">{title}</h3>
        {showSameAsNidCheckbox && (
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground">
            <input
              type="checkbox"
              checked={!!isSameAsNid}
              onChange={onToggleSameAsNid}
              className="rounded border-border bg-background text-primary focus:ring-primary h-3.5 w-3.5"
            />
            Same as NID Address
          </label>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <select
            disabled={isSameAsNid}
            value={addressData.division || ""}
            onChange={(e) => onChange("division", e.target.value)}
            className={selectClass}
            aria-label={`${title} division`}
          >
            <option value="">Select Division</option>
            {divisions.map((d) => (
              <option key={d._id} value={d.name}>
                {d.name} ({d.bn_name})
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            disabled={!addressData.division || isSameAsNid}
            value={addressData.district || ""}
            onChange={(e) => onChange("district", e.target.value)}
            className={selectClass}
            aria-label={`${title} district`}
          >
            <option value="">Select District</option>
            {districts.map((d) => (
              <option key={d._id} value={d.name}>
                {d.name} ({d.bn_name})
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            disabled={!addressData.district || isSameAsNid}
            value={addressData.upazila || ""}
            onChange={(e) => onChange("upazila", e.target.value)}
            className={selectClass}
            aria-label={`${title} upazila`}
          >
            <option value="">Select Upazila</option>
            {upazilas.map((d) => (
              <option key={d._id} value={d.name}>
                {d.name} ({d.bn_name})
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            disabled={!addressData.upazila || isSameAsNid}
            value={addressData.union || ""}
            onChange={(e) => onChange("union", e.target.value)}
            className={selectClass}
            aria-label={`${title} union`}
          >
            <option value="">Select Union (Optional)</option>
            {unions.map((d) => (
              <option key={d._id} value={d.name}>
                {d.name} ({d.bn_name})
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <input
            type="text"
            disabled={isSameAsNid}
            placeholder="House/Road/Village"
            value={addressData.street || ""}
            onChange={(e) => onChange("street", e.target.value)}
            className={selectClass}
            aria-label={`${title} street`}
          />
        </div>
      </div>
    </div>
  );
}

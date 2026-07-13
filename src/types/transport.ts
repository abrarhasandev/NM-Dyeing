import { z } from "zod";
import type { Doc, Id } from "../../convex/_generated/dataModel";

/** Nested BD address line (NID / permanent / current). */
export const AddressNidSchema = z.object({
  division: z.string().min(1, "Division is required"),
  district: z.string().min(1, "District is required"),
  upazila: z.string().min(1, "Upazila is required"),
  union: z.string().optional(),
  street: z.string().optional(),
});

export const StructuredAddressSchema = z.object({
  nid: AddressNidSchema,
  permanent: AddressNidSchema,
  current: AddressNidSchema,
});

export const AddressSchema = z.union([z.string(), StructuredAddressSchema]);

export const PhoneObjectSchema = z.object({
  number: z.string().min(1, "Number is required"),
  accounts: z.array(z.string()),
});

export const PhoneNumberSchema = z.union([z.string(), PhoneObjectSchema]);

/** Coerce HTML number inputs without breaking RHF + Zod input/output types. */
const requiredPositiveNumber = (message: string) =>
  z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      if (typeof val === "number") return val;
      const n = Number(val);
      return Number.isFinite(n) ? n : val;
    },
    z.number({ error: message }).min(1, message)
  );

/** Create/edit form payload — mirrors Convex transportEmployees write fields. */
export const TransportEmployeeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phoneNumbers: z
    .array(PhoneNumberSchema)
    .min(1, "At least one phone number is required"),
  address: AddressSchema,
  dob: z.string().optional(),
  age: requiredPositiveNumber("Age must be greater than 0"),
  vehicleType: z.string().min(1, "Vehicle Type is required"),
  vehicleWheels: requiredPositiveNumber("Number of wheels must be at least 1"),
  clothCapacityYards: requiredPositiveNumber("Capacity must be greater than 0"),
  avatar: z.string().optional(),
});

export type IAddressNid = z.infer<typeof AddressNidSchema>;
export type IStructuredAddress = z.infer<typeof StructuredAddressSchema>;
export type IAddress = z.infer<typeof AddressSchema>;
export type IPhoneNumber = z.infer<typeof PhoneNumberSchema>;
/** Parsed form values after Zod (submit payload). */
export type TransportEmployeeFormValues = z.output<typeof TransportEmployeeSchema>;
/** Default values / field state before coerce. */
export type TransportEmployeeFormInput = z.input<typeof TransportEmployeeSchema>;

/** Document shape from Convex (source of truth for list/profile). */
export type TransportEmployeeDoc = Doc<"transportEmployees">;
export type TransportEmployeeId = Id<"transportEmployees">;

/** @deprecated Prefer TransportEmployeeDoc — kept for gradual call-site migration. */
export type ITransportEmployee = TransportEmployeeFormValues & {
  _id: string;
  createdAt: number;
  avatar?: string;
};

export type TransportStats = {
  totalEmployees: number;
  totalVehicles: number;
  totalCapacity: number;
};

export const emptyAddressLine = (): IAddressNid => ({
  division: "",
  district: "",
  upazila: "",
  union: "",
  street: "",
});

export const emptyStructuredAddress = (): IStructuredAddress => ({
  nid: emptyAddressLine(),
  permanent: emptyAddressLine(),
  current: emptyAddressLine(),
});

export function getAddressDisplay(address: IAddress | undefined | null): string {
  if (!address) return "—";
  if (typeof address === "string") return address || "—";
  const line = address.nid ?? address.current ?? address.permanent;
  if (!line) return "View for details";
  const parts = [line.district, line.division].filter(Boolean);
  return parts.length ? parts.join(", ") : "View for details";
}

export function getPhoneDisplay(phone: IPhoneNumber): string {
  return typeof phone === "string" ? phone : phone?.number ?? "";
}

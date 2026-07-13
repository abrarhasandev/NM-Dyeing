import { z } from "zod";

export const AddressNidSchema = z.object({
  division: z.string().min(1, "Division is required"),
  district: z.string().min(1, "District is required"),
  upazila: z.string().min(1, "Upazila is required"),
  union: z.string().optional(),
  street: z.string().optional(),
});

export const AddressSchema = z.union([
  z.string(),
  z.object({
    nid: AddressNidSchema,
    permanent: AddressNidSchema,
    current: AddressNidSchema,
  })
]);

export const PhoneNumberSchema = z.union([
  z.string(),
  z.object({
    number: z.string().min(1, "Number is required"),
    accounts: z.array(z.string())
  })
]);

export const TransportEmployeeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phoneNumbers: z.array(PhoneNumberSchema).min(1, "At least one phone number is required"),
  address: AddressSchema,
  dob: z.string().optional(),
  age: z.coerce.number().min(1, "Age must be greater than 0"),
  vehicleType: z.string().min(1, "Vehicle Type is required"),
  vehicleWheels: z.coerce.number().min(1, "Number of wheels must be at least 1"),
  clothCapacityYards: z.coerce.number().min(1, "Capacity must be greater than 0"),
  avatar: z.string().optional(),
});

export type IAddressNid = z.infer<typeof AddressNidSchema>;
export type IAddress = z.infer<typeof AddressSchema>;
export type IPhoneNumber = z.infer<typeof PhoneNumberSchema>;
export type ITransportEmployee = z.infer<typeof TransportEmployeeSchema> & {
  _id: string;
  createdAt: number;
};

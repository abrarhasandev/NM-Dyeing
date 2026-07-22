import { z } from "zod";

export const AddressNidSchema = z.object({
  division: z.string().min(1, "Division is required"),
  district: z.string().min(1, "District is required"),
  upazila: z.string().min(1, "Upazila is required"),
  thana: z.string().optional(),
  union: z.string().optional(),
  paurashava: z.string().optional(),
  street: z.string().optional(),
});

export const CustomerAddressSchema = AddressNidSchema.extend({
  type: z.enum(["Office", "Warehouse", "Godown", "Other"]),
});

export const CustomerOwnerSchema = z.object({
  name: z.string().min(1, "Owner name is required"),
  phone: z.string().optional(),
});

export const CustomerPhoneSchema = z.object({
  number: z.string().min(1, "Phone number is required"),
  isPrimary: z.boolean().default(false),
  ownerName: z.string().optional(),
  accounts: z.array(z.string()).default([]),
  description: z.string().optional(),
});

export const CustomerEmployeeSchema = z.object({
  name: z.string().min(1, "Employee name is required"),
  designation: z.string().min(1, "Designation is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const CustomerBankAccountSchema = z.object({
  bankName: z.string().min(1, "Bank name is required"),
  accountName: z.string().min(1, "Account name is required"),
  accountNumber: z.string().min(1, "Account number is required"),
  branchName: z.string().optional(),
  routingNumber: z.string().optional(),
});

export const CustomerMobileBankingSchema = z.object({
  provider: z.string().min(1, "Provider is required"),
  number: z.string().min(1, "Number is required"),
});

export const CustomerSchema = z.object({
  customerType: z.enum(["Company", "Individual"]),
  companyName: z.string().optional(),
  owners: z.array(CustomerOwnerSchema).default([]),
  address: z.array(CustomerAddressSchema).default([]),
  phoneNumber: z.array(CustomerPhoneSchema).min(1, "At least one phone number is required"),
  employeeList: z.array(CustomerEmployeeSchema).default([]),
  bankAccounts: z.array(CustomerBankAccountSchema).default([]),
  mobileBanking: z.array(CustomerMobileBankingSchema).default([]),
  searchText: z.string().optional(),
});

export type CustomerFormValues = z.infer<typeof CustomerSchema>;

export const emptyCustomerAddress = (): z.infer<typeof CustomerAddressSchema> => ({
  type: "Office",
  division: "",
  district: "",
  upazila: "",
  thana: "",
  union: "",
  paurashava: "",
  street: "",
});

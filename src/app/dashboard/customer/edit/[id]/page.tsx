// @ts-nocheck
"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";
import { useDocumentTitle } from "@/hook/useDocumentTitle";
import { useCustomer } from "@/hooks/useCustomers";
import {
  CustomerSchema,
  type CustomerFormValues,
  emptyCustomerAddress,
} from "@/types/customer";
import { AddressSelector } from "@/components/transport/AddressSelector";
import { BankAccountItem } from "@/components/customer/BankAccountItem";

const ACCOUNT_TYPES = [
  { id: "WhatsApp", label: "WhatsApp" },
  { id: "Imo", label: "Imo" },
  { id: "bKash", label: "bKash" },
  { id: "Nagad", label: "Nagad" },
  { id: "Upay", label: "Upay" },
];

const EditCustomerPage = () => {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  useDocumentTitle("Edit Customer");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { customer, isLoading } = useCustomer(id);

  const { register, control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<CustomerFormValues>({
    resolver: zodResolver(CustomerSchema),
    defaultValues: {
      customerType: "Company",
      companyName: "",
      owners: [{ name: "", phone: "" }],
      address: [emptyCustomerAddress()],
      phoneNumber: [{ number: "+880", isPrimary: true, accounts: [], ownerName: "", description: "" }],
      employeeList: [],
      bankAccounts: [],
      mobileBanking: [],
      searchText: "",
    },
  });

  useEffect(() => {
    if (customer) {
      // Compatibility layer to convert legacy strings to new structured arrays
      let parsedOwners = [{ name: "", phone: "" }];
      if (customer.owners && customer.owners.length > 0) {
        parsedOwners = customer.owners;
      } else if (customer.ownerName) {
        parsedOwners = [{ name: customer.ownerName, phone: "" }];
      }

      let parsedAddresses = [emptyCustomerAddress()];
      if (Array.isArray(customer.address) && customer.address.length > 0) {
        parsedAddresses = customer.address;
      } else if (typeof customer.address === "string" && customer.address) {
        parsedAddresses = [{ ...emptyCustomerAddress(), street: customer.address }];
      }

      let parsedPhones = [{ number: "+880", isPrimary: true, accounts: [], ownerName: "", description: "" }];
      if (Array.isArray(customer.phoneNumber) && customer.phoneNumber.length > 0) {
        parsedPhones = customer.phoneNumber;
      } else if (typeof customer.phoneNumber === "string" && customer.phoneNumber) {
        parsedPhones = [{ number: customer.phoneNumber, isPrimary: true, accounts: [], ownerName: "", description: "" }];
      }

      let parsedEmployees = [];
      if (Array.isArray(customer.employeeList)) {
        if (customer.employeeList.length > 0 && typeof customer.employeeList[0] === "object") {
          parsedEmployees = customer.employeeList;
        } else if (customer.employeeList.length > 0) {
          // Array of strings (legacy)
          parsedEmployees = customer.employeeList.map((emp) => ({
            name: emp,
            designation: "Employee",
            phone: "",
            address: "",
          }));
        }
      }

      reset({
        customerType: customer.customerType || "Company",
        companyName: customer.companyName || "",
        owners: parsedOwners,
        address: parsedAddresses,
        phoneNumber: parsedPhones,
        employeeList: parsedEmployees,
        bankAccounts: customer.bankAccounts || [],
        mobileBanking: customer.mobileBanking || [],
        searchText: customer.searchText || "",
      });
    }
  }, [customer, reset]);

  const { fields: ownerFields, append: appendOwner, remove: removeOwner } = useFieldArray({
    control,
    name: "owners"
  });

  const { fields: addressFields, append: appendAddress, remove: removeAddress } = useFieldArray({
    control,
    name: "address"
  });

  const { fields: phoneFields, append: appendPhone, remove: removePhone } = useFieldArray({
    control,
    name: "phoneNumber"
  });

  const { fields: employeeFields, append: appendEmployee, remove: removeEmployee } = useFieldArray({
    control,
    name: "employeeList"
  });

  const { fields: bankFields, append: appendBank, remove: removeBank } = useFieldArray({
    control,
    name: "bankAccounts"
  });

  const { fields: mobileBankingFields, append: appendMobileBanking, remove: removeMobileBanking } = useFieldArray({
    control,
    name: "mobileBanking"
  });

  const watchCustomerType = watch("customerType");
  const watchPhoneNumbers = watch("phoneNumber");
  const watchAddresses = watch("address");

  const togglePhoneAccount = (index: number, accountId: string) => {
    const phone = watchPhoneNumbers[index];
    const accs = phone.accounts || [];
    let newAccs = [];
    if (accs.includes(accountId)) {
      newAccs = accs.filter((a) => a !== accountId);
    } else {
      newAccs = [...accs, accountId];
    }
    setValue(`phoneNumber.${index}.accounts`, newAccs);
  };

  const handleAddressChange = (index: number, field: string, value: string) => {
    const currentAddr = watchAddresses[index];
    const updated = { ...currentAddr, [field]: value };

    if (field === "division") {
      updated.district = "";
      updated.upazila = "";
      updated.thana = "";
      updated.union = "";
      updated.paurashava = "";
    } else if (field === "district") {
      updated.upazila = "";
      updated.thana = "";
      updated.union = "";
      updated.paurashava = "";
    } else if (field === "upazila") {
      updated.union = "";
      updated.paurashava = "";
    }

    setValue(`address.${index}`, updated);
  };

  const setPrimaryPhone = (index: number) => {
    watchPhoneNumbers.forEach((_, i) => {
      setValue(`phoneNumber.${i}.isPrimary`, i === index);
    });
  };

  const onSubmit = async (data: CustomerFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to update customer");

      toast.success("Customer updated successfully!");
      router.push("/dashboard/customer");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-muted-foreground" size={48} />
      </div>
    );
  }

  const inputClass = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all placeholder:text-muted-foreground shadow-sm";
  const sectionClass = "bg-card p-6 rounded-lg border border-border shadow-sm space-y-4 mb-6";
  const sectionTitleClass = "text-lg font-semibold border-b border-border pb-2 mb-4 text-foreground/90";

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          Back to Customers
        </motion.button>

        <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Edit Customer</h1>
        </motion.div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* General Information */}
          <div className={sectionClass}>
            <h2 className={sectionTitleClass}>General Information</h2>

            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value="Company" {...register("customerType")} className="w-4 h-4 text-primary" />
                <span className="font-medium">Company</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value="Individual" {...register("customerType")} className="w-4 h-4 text-primary" />
                <span className="font-medium">Individual</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block font-medium text-sm">
                  {watchCustomerType === "Company" ? "Company Name *" : "Business / Store Name (Optional)"}
                </label>
                <input
                  type="text"
                  {...register("companyName")}
                  className={inputClass}
                  placeholder="e.g. Acme Corp"
                />
              </div>
            </div>
          </div>

          {/* Owners Section */}
          <div className={sectionClass}>
            <div className="flex justify-between items-center border-b border-border pb-2 mb-4">
              <h2 className="text-lg font-semibold text-foreground/90">Owners</h2>
              <button type="button" onClick={() => appendOwner({ name: "", phone: "" })} className="text-sm text-primary hover:underline flex items-center gap-1">
                <Plus size={14} /> Add Owner
              </button>
            </div>

            {ownerFields.map((field, index) => (
              <div key={field.id} className="flex gap-4 items-end bg-accent/20 p-3 rounded-md border border-border/50 relative group">
                <div className="flex-1">
                  <label className="mb-1 block font-medium text-sm text-muted-foreground">Name *</label>
                  <input type="text" {...register(`owners.${index}.name`)} className={inputClass} placeholder="Owner name" />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block font-medium text-sm text-muted-foreground">Phone</label>
                  <input type="text" {...register(`owners.${index}.phone`)} className={inputClass} placeholder="Phone (Optional)" />
                </div>
                {ownerFields.length > 1 && (
                  <button type="button" onClick={() => removeOwner(index)} className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors border border-transparent">
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Addresses Section */}
          <div className={sectionClass}>
            <div className="flex justify-between items-center border-b border-border pb-2 mb-4">
              <h2 className="text-lg font-semibold text-foreground/90">Addresses</h2>
              <button type="button" onClick={() => appendAddress(emptyCustomerAddress())} className="text-sm text-primary hover:underline flex items-center gap-1">
                <Plus size={14} /> Add Address
              </button>
            </div>

            {addressFields.map((field, index) => (
              <div key={field.id} className="bg-accent/20 p-4 rounded-md border border-border/50 relative mb-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <label className="font-medium text-sm">Address Type:</label>
                    <select {...register(`address.${index}.type`)} className="rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                      <option value="Office">Office</option>
                      <option value="Warehouse">Warehouse</option>
                      <option value="Godown">Godown</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  {addressFields.length > 1 && (
                    <button type="button" onClick={() => removeAddress(index)} className="text-red-500 hover:text-red-700 p-1">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <AddressSelector
                  title={`Location details`}
                  addressData={watchAddresses[index] || emptyCustomerAddress()}
                  onChange={(field, val) => handleAddressChange(index, field, val)}
                  showSameAsNidCheckbox={false}
                />
              </div>
            ))}
          </div>

          {/* Phone Numbers Section */}
          <div className={sectionClass}>
            <div className="flex justify-between items-center border-b border-border pb-2 mb-4">
              <h2 className="text-lg font-semibold text-foreground/90">Phone Numbers</h2>
              <button type="button" onClick={() => appendPhone({ number: "+880", isPrimary: false, accounts: [], ownerName: "", description: "" })} className="text-sm text-primary hover:underline flex items-center gap-1">
                <Plus size={14} /> Add Number
              </button>
            </div>

            {phoneFields.map((field, index) => (
              <div key={field.id} className="bg-accent/20 p-4 rounded-md border border-border/50 relative mb-4">
                <div className="flex justify-between items-start mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="primaryPhone"
                      checked={watchPhoneNumbers[index]?.isPrimary}
                      onChange={() => setPrimaryPhone(index)}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm font-semibold text-primary">Primary Number</span>
                  </label>
                  {phoneFields.length > 1 && (
                    <button type="button" onClick={() => removePhone(index)} className="text-red-500 hover:text-red-700 p-1">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="mb-1 block font-medium text-xs text-muted-foreground">Number *</label>
                    <input type="text" {...register(`phoneNumber.${index}.number`)} className={inputClass} placeholder="+880..." />
                  </div>
                  <div>
                    <label className="mb-1 block font-medium text-xs text-muted-foreground">Owner / Description (Optional)</label>
                    <input type="text" {...register(`phoneNumber.${index}.description`)} className={inputClass} placeholder="e.g. Manager" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block font-medium text-xs text-muted-foreground">Accounts Linked:</label>
                  <div className="flex flex-wrap gap-3 mt-1">
                    {ACCOUNT_TYPES.map((acc) => (
                      <label key={acc.id} className="flex items-center gap-1.5 text-sm cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={watchPhoneNumbers[index]?.accounts?.includes(acc.id)}
                          onChange={() => togglePhoneAccount(index, acc.id)}
                          className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                        />
                        {acc.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Financial Information */}
          <div className={sectionClass}>
            <div className="flex justify-between items-center border-b border-border pb-2 mb-4">
              <h2 className="text-lg font-semibold text-foreground/90">Financial Information</h2>
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-foreground/80">Bank Accounts</h3>
                <button type="button" onClick={() => appendBank({ bankName: "", accountName: "", accountNumber: "", branchName: "", routingNumber: "" })} className="text-xs text-primary hover:underline flex items-center gap-1">
                  <Plus size={12} /> Add Bank
                </button>
              </div>
              {bankFields.length === 0 && <p className="text-xs text-muted-foreground">No bank accounts added.</p>}
              {bankFields.map((field, index) => (
                <BankAccountItem
                  key={field.id}
                  index={index}
                  register={register}
                  control={control}
                  setValue={setValue}
                  removeBank={removeBank}
                  inputClass={inputClass}
                />
              ))}
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-foreground/80">Mobile Banking</h3>
                <button type="button" onClick={() => appendMobileBanking({ provider: "bKash", number: "" })} className="text-xs text-primary hover:underline flex items-center gap-1">
                  <Plus size={12} /> Add Mobile Banking
                </button>
              </div>
              {mobileBankingFields.length === 0 && <p className="text-xs text-muted-foreground">No mobile banking added.</p>}
              {mobileBankingFields.map((field, index) => (
                <div key={field.id} className="flex gap-3 mb-3 items-end bg-accent/20 p-3 rounded border border-border/50">
                  <div>
                    <label className="mb-1 block text-xs">Provider *</label>
                    <select {...register(`mobileBanking.${index}.provider`)} className={inputClass}>
                      <option value="bKash">bKash</option>
                      <option value="Nagad">Nagad</option>
                      <option value="Upay">Upay</option>
                      <option value="Rocket">Rocket</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="mb-1 block text-xs">Number *</label>
                    <input type="text" {...register(`mobileBanking.${index}.number`)} className={inputClass} />
                  </div>
                  <button type="button" onClick={() => removeMobileBanking(index)} className="p-2 mb-0.5 text-red-500 hover:bg-red-50 rounded border border-transparent self-end">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Employees List */}
          <div className={sectionClass}>
            <div className="flex justify-between items-center border-b border-border pb-2 mb-4">
              <h2 className="text-lg font-semibold text-foreground/90">Employees</h2>
              <button type="button" onClick={() => appendEmployee({ name: "", designation: "", phone: "", address: "" })} className="text-sm text-primary hover:underline flex items-center gap-1">
                <Plus size={14} /> Add Employee
              </button>
            </div>
            {employeeFields.length === 0 && <p className="text-sm text-muted-foreground mb-2">No employees added. Click 'Add Employee' to insert one.</p>}

            {employeeFields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3 items-end bg-accent/20 p-4 rounded-md border border-border/50 relative">
                <div>
                  <label className="mb-1 block text-xs">Name *</label>
                  <input type="text" {...register(`employeeList.${index}.name`)} className={inputClass} />
                </div>
                <div>
                  <label className="mb-1 block text-xs">Designation / Post *</label>
                  <input type="text" {...register(`employeeList.${index}.designation`)} className={inputClass} />
                </div>
                <div>
                  <label className="mb-1 block text-xs">Phone (Optional)</label>
                  <input type="text" {...register(`employeeList.${index}.phone`)} className={inputClass} />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs">Address (Optional)</label>
                    <input type="text" {...register(`employeeList.${index}.address`)} className={inputClass} />
                  </div>
                  <button type="button" onClick={() => removeEmployee(index)} className="p-2.5 mb-0.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md border border-transparent self-end">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-border">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-md border border-border bg-background hover:bg-accent text-foreground font-medium transition-colors shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-medium shadow-sm transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Updating..." : "Update Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCustomerPage;

// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useDocumentTitle } from "@/hook/useDocumentTitle";
import {
  ArrowLeft,
  Truck,
  User,
  Phone,
  MapPin,
  Plus,
  X,
  Save,
  Calendar,
} from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  TransportEmployeeSchema,
  emptyStructuredAddress,
  type IAddressNid,
  type TransportEmployeeFormValues,
} from "@/types/transport";
import { AddressSelector } from "@/components/transport/AddressSelector";
import { Id } from "../../../../../../convex/_generated/dataModel";

const ACCOUNT_TYPES = [
  { id: "whatsapp", label: "WhatsApp" },
  { id: "imo", label: "Imo" },
  { id: "bkash", label: "bKash" },
  { id: "nagad", label: "Nagad" },
];

const AVATARS = [
  "https://api.dicebear.com/9.x/notionists/svg?seed=Felix",
  "https://api.dicebear.com/9.x/notionists/svg?seed=Aneka",
  "https://api.dicebear.com/9.x/notionists/svg?seed=Mimi",
  "https://api.dicebear.com/9.x/notionists/svg?seed=Jack",
  "https://api.dicebear.com/9.x/notionists/svg?seed=Sophia",
  "https://api.dicebear.com/9.x/notionists/svg?seed=George"
];

export default function EditTransportEmployee() {
  const router = useRouter();
  const params = useParams();
  const employeeId = params.id as string;
  
  const employee = useQuery(api.transportEmployees.getEmployeeById, employeeId ? { id: employeeId as Id<"transportEmployees"> } : "skip");
  const updateEmployee = useMutation(api.transportEmployees.update);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formReady, setFormReady] = useState(false);

  useDocumentTitle("Edit Transport Employee");

  const initialAddress = emptyStructuredAddress().nid;

  const { register, control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    resolver: zodResolver(TransportEmployeeSchema),
    defaultValues: {
      name: "",
      dob: "",
      age: 0,
      address: emptyStructuredAddress(),
      phoneNumbers: [{ number: "+880", accounts: [] as string[] }],
      vehicleType: "",
      vehicleWheels: 4,
      clothCapacityYards: 500,
      avatar: AVATARS[0],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "phoneNumbers"
  });

  useEffect(() => {
    if (employee && !formReady) {
      reset({
        name: employee.name || "",
        dob: employee.dob || "",
        age: employee.age || 0,
        address: typeof employee.address === "object" ? employee.address : {
          nid: { ...initialAddress },
          permanent: { ...initialAddress },
          current: { ...initialAddress },
        },
        phoneNumbers: employee.phoneNumbers?.length > 0 
           ? employee.phoneNumbers.map((p: any) => typeof p === 'string' ? { number: p, accounts: [] } : p) 
           : [{ number: "+880", accounts: [] }],
        vehicleType: employee.vehicleType || "",
        vehicleWheels: employee.vehicleWheels || 4,
        clothCapacityYards: employee.clothCapacityYards || 500,
        avatar: employee.avatar || AVATARS[0],
      });
      setFormReady(true);
    }
  }, [employee, formReady, reset]);

  const [sameAsNid, setSameAsNid] = useState({
    permanent: false,
    current: false,
  });

  const watchDob = watch("dob");
  const watchAddress = watch("address");
  const watchAvatar = watch("avatar");
  const watchPhoneNumbers = watch("phoneNumbers");

  useEffect(() => {
    if (!watchDob || !formReady) return;
    const dob = new Date(watchDob);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    setValue("age", age > 0 ? age : 0, { shouldValidate: true });
  }, [watchDob, setValue, formReady]);

  const toggleAccount = (phoneIndex: number, accountId: string) => {
    const phone = watchPhoneNumbers[phoneIndex];
    const accs = (typeof phone === "object" && phone?.accounts) ? phone.accounts : [];
    let newAccs = [];
    if (accs.includes(accountId)) {
      newAccs = accs.filter((a: string) => a !== accountId);
    } else {
      newAccs = [...accs, accountId];
    }
    setValue(`phoneNumbers.${phoneIndex}.accounts`, newAccs);
  };

  const handleAddressChange = (type: "nid" | "permanent" | "current", field: keyof IAddressNid, value: string) => {
    if (typeof watchAddress === "string") return;
    const currentAddr = watchAddress[type];
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

    setValue(`address.${type}`, updated);

    if (type === "nid") {
      if (sameAsNid.permanent) setValue("address.permanent", updated);
      if (sameAsNid.current) setValue("address.current", updated);
    }
  };

  const handleSameAsNidToggle = (type: "permanent" | "current") => {
    const newValue = !sameAsNid[type];
    setSameAsNid({ ...sameAsNid, [type]: newValue });

    if (typeof watchAddress === "string") return;

    if (newValue) {
      setValue(`address.${type}`, watchAddress.nid);
    } else {
      setValue(`address.${type}`, initialAddress);
    }
  };

  const onSubmit = async (data: TransportEmployeeFormValues) => {
    try {
      setIsSubmitting(true);
      await updateEmployee({
        id: employeeId as Id<"transportEmployees">,
        name: data.name,
        phoneNumbers: data.phoneNumbers,
        address: data.address,
        dob: data.dob,
        age: data.age,
        vehicleType: data.vehicleType,
        vehicleWheels: data.vehicleWheels,
        clothCapacityYards: data.clothCapacityYards,
        avatar: data.avatar,
      });
      toast.success("Transport employee updated successfully!");
      router.push("/dashboard/transport");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update employee. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (employee === undefined) {
     return (
        <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
     );
  }

  if (employee === null) {
     return (
        <div className="flex justify-center items-center h-96 text-muted-foreground text-sm">
            Employee not found
        </div>
     );
  }

  const hasAddressError = errors.address;

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 font-sans">
      <div className="max-w-2xl mx-auto">
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          Back to Transport
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
          className="flex items-center gap-3 mb-8"
        >
          <div className="bg-accent p-2.5 rounded-md">
            <Truck className="text-foreground" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Edit Transport Employee
            </h1>
          </div>
        </motion.div>

        {formReady && (
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          onSubmit={handleSubmit((values) =>
            onSubmit(values as TransportEmployeeFormValues)
          )}
          className="space-y-8"
        >
          {/* Personal Information */}
          <div className="bg-card rounded-lg border border-border shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <User size={16} className="text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                Personal Information
              </h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                Full Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                {...register("name")}
                placeholder="Enter employee name"
                className="w-full px-4 py-2.5 bg-background text-foreground border border-border rounded-md focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all text-sm placeholder:text-muted-foreground/60"
              />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message?.toString()}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                  Date of Birth <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                  <input
                    type="date"
                    {...register("dob")}
                    className="w-full pl-10 pr-4 py-2.5 bg-background text-foreground border border-border rounded-md focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                  Age
                </label>
                <input
                  type="text"
                  readOnly
                  {...register("age")}
                  placeholder="Auto-calculated"
                  className="w-full px-4 py-2.5 bg-background/50 text-foreground border border-border rounded-md focus:outline-none cursor-not-allowed text-sm placeholder:text-muted-foreground/60"
                />
                {errors.age && <p className="text-xs text-destructive mt-1">{errors.age.message?.toString()}</p>}
              </div>
            </div>

            {/* Avatar Selection */}
            <div className="pt-2 border-t border-border mt-4">
              <label className="block text-sm font-medium text-muted-foreground mb-3">
                Profile Avatar
              </label>
              <div className="flex flex-wrap gap-4">
                {AVATARS.map((avatar, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setValue("avatar", avatar)}
                    className={`relative w-16 h-16 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                      watchAvatar === avatar
                        ? "border-primary shadow-md scale-110"
                        : "border-transparent hover:scale-105 hover:border-primary/50"
                    }`}
                  >
                    <img src={avatar} alt={`Avatar ${idx + 1}`} className="w-full h-full object-cover bg-primary/5" />
                    {watchAvatar === avatar && (
                      <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                        <div className="w-4 h-4 bg-primary rounded-full" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-card rounded-lg border border-border shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                  Phone Numbers
                </h2>
              </div>
              <button
                type="button"
                onClick={() => append({ number: "+880", accounts: [] })}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer"
              >
                <Plus size={14} />
                Add Number
              </button>
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => (
                <motion.div
                  key={field.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 p-3 border border-border rounded-md bg-background/50"
                >
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Phone
                        size={14}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50"
                      />
                      <input
                        type="text"
                        {...register(`phoneNumbers.${index}.number` as const)}
                        placeholder={`Phone number ${index + 1}`}
                        className="w-full pl-10 pr-4 py-2.5 bg-background text-foreground border border-border rounded-md focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all text-sm font-mono placeholder:text-muted-foreground/60"
                      />
                    </div>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="p-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all cursor-pointer border border-transparent hover:border-destructive/20"
                        title="Remove this number"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  
                  {/* Account Types */}
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <span className="text-xs text-muted-foreground">Accounts:</span>
                    {ACCOUNT_TYPES.map((acc) => (
                      <label
                        key={acc.id}
                        className="flex items-center gap-1.5 text-xs text-foreground cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={((typeof watchPhoneNumbers[index] === "object" ? (watchPhoneNumbers[index] as any).accounts : []) || []).includes(acc.id)}
                          onChange={() => toggleAccount(index, acc.id)}
                          className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                        />
                        {acc.label}
                      </label>
                    ))}
                  </div>
                  {errors.phoneNumbers?.[index] && (errors.phoneNumbers[index] as any)?.number && (
                    <p className="text-xs text-destructive mt-1">{(errors.phoneNumbers[index] as any)?.number?.message}</p>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Addresses */}
          <div className="bg-card rounded-lg border border-border shadow-sm p-6 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={16} className="text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                Addresses
              </h2>
            </div>
            
            {hasAddressError && (
              <p className="text-xs text-destructive">Please fill all required address fields (Division, District, Upazila).</p>
            )}

            {typeof watchAddress === "object" && (
              <>
                <AddressSelector
                  title="NID Address"
                  addressData={watchAddress.nid}
                  onChange={(field, val) => handleAddressChange("nid", field, val)}
                  showSameAsNidCheckbox={false}
                />
                
                <AddressSelector
                  title="Permanent Address"
                  addressData={watchAddress.permanent}
                  onChange={(field, val) => handleAddressChange("permanent", field, val)}
                  isSameAsNid={sameAsNid.permanent}
                  onToggleSameAsNid={() => handleSameAsNidToggle("permanent")}
                  showSameAsNidCheckbox={true}
                />
                
                <AddressSelector
                  title="Current Address"
                  addressData={watchAddress.current}
                  onChange={(field, val) => handleAddressChange("current", field, val)}
                  isSameAsNid={sameAsNid.current}
                  onToggleSameAsNid={() => handleSameAsNidToggle("current")}
                  showSameAsNidCheckbox={true}
                />
              </>
            )}
          </div>

          {/* Vehicle Information */}
          <div className="bg-card rounded-lg border border-border shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <Truck size={16} className="text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                Vehicle Information
              </h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                Vehicle Type <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                {...register("vehicleType")}
                placeholder="e.g. Truck, Van, Pickup, CNG"
                className="w-full px-4 py-2.5 bg-background text-foreground border border-border rounded-md focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all text-sm placeholder:text-muted-foreground/60"
              />
              {errors.vehicleType && <p className="text-xs text-destructive mt-1">{errors.vehicleType.message?.toString()}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                  Number of Wheels <span className="text-destructive">*</span>
                </label>
                <input
                  type="number"
                  {...register("vehicleWheels")}
                  placeholder="e.g. 4, 6, 8"
                  min="1"
                  className="w-full px-4 py-2.5 bg-background text-foreground border border-border rounded-md focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all text-sm placeholder:text-muted-foreground/60"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                  Cloth Capacity (yards) <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    {...register("clothCapacityYards")}
                    placeholder="e.g. 500"
                    min="1"
                    className="w-full px-4 py-2.5 pr-16 bg-background text-foreground border border-border rounded-md focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all text-sm placeholder:text-muted-foreground/60"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
                    yards
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-2 pb-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground bg-secondary hover:bg-secondary/80 border border-border rounded-md transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Update Employee
                </>
              )}
            </button>
          </div>
        </motion.form>
        )}
      </div>
    </div>
  );
}

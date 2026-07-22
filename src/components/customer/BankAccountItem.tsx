import React, { useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Trash2 } from "lucide-react";
import { useWatch, UseFormRegister, Control, UseFormSetValue } from "react-hook-form";
import { CustomerFormValues } from "@/types/customer";
import { CursorCombobox } from "@/components/ui/CursorCombobox";

interface BankAccountItemProps {
  index: number;
  register: UseFormRegister<CustomerFormValues>;
  control: Control<CustomerFormValues>;
  setValue: UseFormSetValue<CustomerFormValues>;
  removeBank: (index: number) => void;
  inputClass: string;
}

export const BankAccountItem: React.FC<BankAccountItemProps> = ({
  index,
  register,
  control,
  setValue,
  removeBank,
  inputClass,
}) => {
  const banks = useQuery(api.banks.getBanks);

  const bankName = useWatch({
    control,
    name: `bankAccounts.${index}.bankName`,
  });

  const branchName = useWatch({
    control,
    name: `bankAccounts.${index}.branchName`,
  });

  const selectedBank = banks?.find((b) => b.name === bankName);

  const branches = useQuery(
    api.banks.getBranchesByBank,
    selectedBank ? { bankId: selectedBank._id } : "skip"
  );

  // Auto-fill routing number if a known branch is selected
  useEffect(() => {
    if (branches && branchName) {
      const selectedBranch = branches.find((b) => b.branchName === branchName);
      if (selectedBranch && selectedBranch.routingNumber) {
        setValue(`bankAccounts.${index}.routingNumber`, selectedBranch.routingNumber, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    }
  }, [branchName, branches, index, setValue]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-3 items-end bg-accent/20 p-3 rounded border border-border/50">
      <div className="sm:col-span-1">
        <label className="mb-1 block text-xs">Bank Name *</label>
        <CursorCombobox
          {...register(`bankAccounts.${index}.bankName`)}
          value={bankName || ""}
          options={banks ? banks.map(b => ({ label: b.name, value: b.name })) : []}
          className={inputClass}
          placeholder="Select or type..."
        />
      </div>
      <div className="sm:col-span-1">
        <label className="mb-1 block text-xs">Account Name *</label>
        <input
          type="text"
          {...register(`bankAccounts.${index}.accountName`)}
          className={inputClass}
          placeholder="e.g. John Doe"
        />
      </div>
      <div className="sm:col-span-1">
        <label className="mb-1 block text-xs">Account Number *</label>
        <input
          type="text"
          {...register(`bankAccounts.${index}.accountNumber`)}
          className={inputClass}
          placeholder="Account No."
        />
      </div>
      <div className="sm:col-span-1">
        <label className="mb-1 block text-xs">Branch (Opt)</label>
        <CursorCombobox
          {...register(`bankAccounts.${index}.branchName`)}
          value={branchName || ""}
          options={branches ? branches.map(b => ({ label: b.branchName, value: b.branchName })) : []}
          className={inputClass}
          placeholder="Select or type..."
        />
      </div>
      <div className="sm:col-span-1 flex gap-2">
        <div className="flex-1">
          <label className="mb-1 block text-xs">Routing (Opt)</label>
          <input
            type="text"
            {...register(`bankAccounts.${index}.routingNumber`)}
            className={inputClass}
            placeholder="Routing No."
          />
        </div>
        <button
          type="button"
          onClick={() => removeBank(index)}
          className="p-2 mb-0.5 text-red-500 hover:bg-red-50 rounded border border-transparent self-end"
          title="Remove Bank Account"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

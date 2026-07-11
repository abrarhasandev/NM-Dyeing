"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
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

const API_BASE = "https://bdapis.pro.bd/geo/v2.0";

const ACCOUNT_TYPES = [
  { id: "whatsapp", label: "WhatsApp" },
  { id: "imo", label: "Imo" },
  { id: "bkash", label: "bKash" },
  { id: "nagad", label: "Nagad" },
];

function AddressSelector({ title, addressData, onChange, isSameAsNid, onToggleSameAsNid, showSameAsNidCheckbox }) {
  const [divisions, setDivisions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [upazilas, setUpazilas] = useState([]);
  const [unions, setUnions] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/divisions`)
      .then((res) => res.json())
      .then((data) => setDivisions(data.data || []))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (addressData.division) {
      const divisionId = divisions.find((d) => d.name === addressData.division)?.id;
      if (divisionId) {
        fetch(`${API_BASE}/districts/${divisionId}`)
          .then((res) => res.json())
          .then((data) => setDistricts(data.data || []))
          .catch((err) => console.error(err));
      } else {
        setDistricts([]);
      }
    } else {
      setDistricts([]);
    }
  }, [addressData.division, divisions]);

  useEffect(() => {
    if (addressData.district) {
      const districtId = districts.find((d) => d.name === addressData.district)?.id;
      if (districtId) {
        fetch(`${API_BASE}/upazilas/${districtId}`)
          .then((res) => res.json())
          .then((data) => setUpazilas(data.data || []))
          .catch((err) => console.error(err));
      } else {
        setUpazilas([]);
      }
    } else {
      setUpazilas([]);
    }
  }, [addressData.district, districts]);

  useEffect(() => {
    if (addressData.upazila) {
      const upazilaId = upazilas.find((d) => d.name === addressData.upazila)?.id;
      if (upazilaId) {
        fetch(`${API_BASE}/unions/${upazilaId}`)
          .then((res) => res.json())
          .then((data) => setUnions(data.data || []))
          .catch((err) => console.error(err));
      } else {
        setUnions([]);
      }
    } else {
      setUnions([]);
    }
  }, [addressData.upazila, upazilas]);

  return (
    <div className="space-y-3 pt-4 border-t border-border mt-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-foreground/80">{title}</h3>
        {showSameAsNidCheckbox && (
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground">
            <input
              type="checkbox"
              checked={isSameAsNid}
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
            value={addressData.division}
            onChange={(e) => onChange("division", e.target.value)}
            className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:border-ring text-sm disabled:opacity-50"
          >
            <option value="">Select Division</option>
            {divisions.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name} ({d.bn_name})
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            disabled={!addressData.division || isSameAsNid}
            value={addressData.district}
            onChange={(e) => onChange("district", e.target.value)}
            className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:border-ring text-sm disabled:opacity-50"
          >
            <option value="">Select District</option>
            {districts.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name} ({d.bn_name})
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            disabled={!addressData.district || isSameAsNid}
            value={addressData.upazila}
            onChange={(e) => onChange("upazila", e.target.value)}
            className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:border-ring text-sm disabled:opacity-50"
          >
            <option value="">Select Upazila</option>
            {upazilas.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name} ({d.bn_name})
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            disabled={!addressData.upazila || isSameAsNid}
            value={addressData.union}
            onChange={(e) => onChange("union", e.target.value)}
            className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:border-ring text-sm disabled:opacity-50"
          >
            <option value="">Select Union (Optional)</option>
            {unions.map((d) => (
              <option key={d.id} value={d.name}>
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
            value={addressData.street}
            onChange={(e) => onChange("street", e.target.value)}
            className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:border-ring text-sm disabled:opacity-50"
          />
        </div>
      </div>
    </div>
  );
}

export default function EditTransportEmployee() {
  const router = useRouter();
  const params = useParams();
  const employeeId = params.id;
  
  const employee = useQuery(api.transportEmployees.getById, employeeId ? { id: employeeId } : "skip");
  const updateEmployee = useMutation(api.transportEmployees.update);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formReady, setFormReady] = useState(false);

  useDocumentTitle("Edit Transport Employee");

  const initialAddress = {
    division: "",
    district: "",
    upazila: "",
    union: "",
    street: "",
  };

  const [form, setForm] = useState({
    name: "",
    dob: "",
    age: "",
    address: {
      nid: { ...initialAddress },
      permanent: { ...initialAddress },
      current: { ...initialAddress },
    },
    phoneNumbers: [{ number: "+880", accounts: [] }],
    vehicleType: "",
    vehicleWheels: "",
    clothCapacityYards: "",
  });

  useEffect(() => {
    if (employee && !formReady) {
      setForm({
        name: employee.name || "",
        dob: employee.dob || "",
        age: employee.age ? String(employee.age) : "",
        address: typeof employee.address === "object" ? employee.address : {
          nid: { ...initialAddress },
          permanent: { ...initialAddress },
          current: { ...initialAddress },
        },
        phoneNumbers: employee.phoneNumbers?.length > 0 
           ? employee.phoneNumbers.map(p => typeof p === 'string' ? { number: p, accounts: [] } : p) 
           : [{ number: "+880", accounts: [] }],
        vehicleType: employee.vehicleType || "",
        vehicleWheels: employee.vehicleWheels ? String(employee.vehicleWheels) : "",
        clothCapacityYards: employee.clothCapacityYards ? String(employee.clothCapacityYards) : "",
      });
      setFormReady(true);
    }
  }, [employee, formReady]);

  const [sameAsNid, setSameAsNid] = useState({
    permanent: false,
    current: false,
  });

  const calculateAge = (dobString) => {
    if (!dobString) return "";
    const dob = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age > 0 ? age : "";
  };

  const handleDobChange = (e) => {
    const newDob = e.target.value;
    setForm({
      ...form,
      dob: newDob,
      age: calculateAge(newDob),
    });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePhoneChange = (index, value) => {
    if (!value.startsWith("+880")) {
      if (value.startsWith("880")) value = "+" + value;
      else if (value.startsWith("0")) value = "+880" + value.substring(1);
      else if (value === "+" || value === "") value = "+880";
      else value = "+880" + value;
    }

    const updated = [...form.phoneNumbers];
    updated[index].number = value;
    setForm({ ...form, phoneNumbers: updated });
  };

  const toggleAccount = (phoneIndex, accountId) => {
    const updated = [...form.phoneNumbers];
    const accs = updated[phoneIndex].accounts;
    if (accs.includes(accountId)) {
      updated[phoneIndex].accounts = accs.filter((a) => a !== accountId);
    } else {
      updated[phoneIndex].accounts = [...accs, accountId];
    }
    setForm({ ...form, phoneNumbers: updated });
  };

  const addPhone = () => {
    setForm({
      ...form,
      phoneNumbers: [...form.phoneNumbers, { number: "+880", accounts: [] }],
    });
  };

  const removePhone = (index) => {
    const updated = form.phoneNumbers.filter((_, i) => i !== index);
    setForm({ ...form, phoneNumbers: updated });
  };

  const handleAddressChange = (type, field, value) => {
    const newAddress = {
      ...form.address,
      [type]: {
        ...form.address[type],
        [field]: value,
      },
    };

    if (field === "division") {
      newAddress[type].district = "";
      newAddress[type].upazila = "";
      newAddress[type].union = "";
    } else if (field === "district") {
      newAddress[type].upazila = "";
      newAddress[type].union = "";
    } else if (field === "upazila") {
      newAddress[type].union = "";
    }

    if (type === "nid") {
      if (sameAsNid.permanent) newAddress.permanent = { ...newAddress.nid };
      if (sameAsNid.current) newAddress.current = { ...newAddress.nid };
    }

    setForm({ ...form, address: newAddress });
  };

  const handleSameAsNidToggle = (type) => {
    const newValue = !sameAsNid[type];
    setSameAsNid({ ...sameAsNid, [type]: newValue });

    if (newValue) {
      setForm({
        ...form,
        address: {
          ...form.address,
          [type]: { ...form.address.nid },
        },
      });
    } else {
      setForm({
        ...form,
        address: {
          ...form.address,
          [type]: { ...initialAddress },
        },
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validPhones = form.phoneNumbers.filter(
      (p) => p.number.trim() !== "" && p.number.trim() !== "+880"
    );
    if (validPhones.length === 0) {
      toast.error("Please add at least one valid phone number");
      return;
    }

    if (!form.age || isNaN(Number(form.age)) || Number(form.age) <= 0) {
      toast.error("Please enter a valid Date of Birth to calculate Age");
      return;
    }

    if (!form.address.nid.division || !form.address.nid.district || !form.address.nid.upazila) {
      toast.error("Please complete the NID address fields (Division, District, Upazila)");
      return;
    }

    try {
      setIsSubmitting(true);
      await updateEmployee({
        id: employeeId,
        name: form.name.trim(),
        dob: form.dob,
        phoneNumbers: validPhones,
        address: form.address,
        age: Number(form.age),
        vehicleType: form.vehicleType.trim(),
        vehicleWheels: Number(form.vehicleWheels),
        clothCapacityYards: Number(form.clothCapacityYards),
      });
      toast.success("Transport employee updated successfully!");
      router.push("/dashboard/transport");
    } catch (err) {
      console.error(err);
      toast.error("Failed to create employee. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          onSubmit={handleSubmit}
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
                name="name"
                placeholder="Enter employee name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-background text-foreground border border-border rounded-md focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all text-sm placeholder:text-muted-foreground/60"
              />
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
                    name="dob"
                    value={form.dob}
                    onChange={handleDobChange}
                    required
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
                  placeholder="Auto-calculated"
                  value={form.age}
                  className="w-full px-4 py-2.5 bg-background/50 text-foreground border border-border rounded-md focus:outline-none cursor-not-allowed text-sm placeholder:text-muted-foreground/60"
                />
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
                onClick={addPhone}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer"
              >
                <Plus size={14} />
                Add Number
              </button>
            </div>

            <div className="space-y-4">
              {form.phoneNumbers.map((phone, index) => (
                <motion.div
                  key={index}
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
                        placeholder={`Phone number ${index + 1}`}
                        value={phone.number}
                        onChange={(e) => handlePhoneChange(index, e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-background text-foreground border border-border rounded-md focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all text-sm font-mono placeholder:text-muted-foreground/60"
                      />
                    </div>
                    {form.phoneNumbers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePhone(index)}
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
                          checked={phone.accounts.includes(acc.id)}
                          onChange={() => toggleAccount(index, acc.id)}
                          className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                        />
                        {acc.label}
                      </label>
                    ))}
                  </div>
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
            
            <AddressSelector
              title="NID Address"
              addressData={form.address.nid}
              onChange={(field, val) => handleAddressChange("nid", field, val)}
              showSameAsNidCheckbox={false}
            />
            
            <AddressSelector
              title="Permanent Address"
              addressData={form.address.permanent}
              onChange={(field, val) => handleAddressChange("permanent", field, val)}
              isSameAsNid={sameAsNid.permanent}
              onToggleSameAsNid={() => handleSameAsNidToggle("permanent")}
              showSameAsNidCheckbox={true}
            />
            
            <AddressSelector
              title="Current Address"
              addressData={form.address.current}
              onChange={(field, val) => handleAddressChange("current", field, val)}
              isSameAsNid={sameAsNid.current}
              onToggleSameAsNid={() => handleSameAsNidToggle("current")}
              showSameAsNidCheckbox={true}
            />
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
                name="vehicleType"
                placeholder="e.g. Truck, Van, Pickup, CNG"
                value={form.vehicleType}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-background text-foreground border border-border rounded-md focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all text-sm placeholder:text-muted-foreground/60"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                  Number of Wheels <span className="text-destructive">*</span>
                </label>
                <input
                  type="number"
                  name="vehicleWheels"
                  placeholder="e.g. 4, 6, 8"
                  value={form.vehicleWheels}
                  onChange={handleChange}
                  required
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
                    name="clothCapacityYards"
                    placeholder="e.g. 500"
                    value={form.clothCapacityYards}
                    onChange={handleChange}
                    required
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
      </div>
    </div>
  );
}

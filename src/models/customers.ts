// @ts-nocheck
import mongoose from "mongoose";

const CustomerSchema = new mongoose.Schema({
  customerType: { type: String, default: "Company" },
  companyName: { type: String }, // Made optional to support Individual types smoothly
  ownerName: { type: String },
  owners: { type: mongoose.Schema.Types.Mixed },
  address: { type: mongoose.Schema.Types.Mixed }, // String or Array
  phoneNumber: { type: mongoose.Schema.Types.Mixed }, // String or Array
  employeeList: { type: mongoose.Schema.Types.Mixed, default: [] }, // Array of strings or Array of objects
  bankAccounts: { type: mongoose.Schema.Types.Mixed },
  mobileBanking: { type: mongoose.Schema.Types.Mixed },
  searchText: { type: String, default: "" },
  initialCharge: { type: Number, default: 0 },
  initialPayment: { type: Number, default: 0 },
  initialDate: { type: Date, default: null },
}, { timestamps: true });

mongoose.models = {};

export default mongoose.models.Customer || mongoose.model("Customer", CustomerSchema);
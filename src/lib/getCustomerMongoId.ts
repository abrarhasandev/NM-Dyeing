import mongoose from "mongoose";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../convex/_generated/api";

export async function getCustomerMongoId(customerId: string): Promise<string | null> {
  if (mongoose.Types.ObjectId.isValid(customerId)) {
    return customerId;
  }
  try {
    const convexCustomer = await fetchQuery(api.customers.getById, { id: customerId as any });
    if (convexCustomer && convexCustomer.mongoId) {
      return convexCustomer.mongoId;
    }
  } catch (e) {
    console.error("Error fetching customer from Convex:", e);
  }
  return null;
}

export async function getCustomerDoc(customerId: string): Promise<any | null> {
  if (mongoose.Types.ObjectId.isValid(customerId)) {
    return null;
  }
  try {
    return await fetchQuery(api.customers.getById, { id: customerId as any });
  } catch (e) {
    console.error("Error fetching customer from Convex:", e);
  }
  return null;
}

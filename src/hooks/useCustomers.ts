import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useCustomers() {
  const customers = useQuery(api.customers.getAll);
  const isLoading = customers === undefined;

  return {
    customers: customers || [],
    isLoading,
  };
}

export function useCustomer(mongoId: string | undefined) {
  const customer = useQuery(
    api.customers.getByMongoId,
    mongoId ? { mongoId } : "skip"
  );
  
  const isLoading = mongoId ? customer === undefined : false;

  return {
    customer,
    isLoading,
  };
}

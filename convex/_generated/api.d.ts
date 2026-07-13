/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as addresses from "../addresses.js";
import type * as batches from "../batches.js";
import type * as billingSummaries from "../billingSummaries.js";
import type * as calenders from "../calenders.js";
import type * as customers from "../customers.js";
import type * as dyeings from "../dyeings.js";
import type * as invoices from "../invoices.js";
import type * as ledgerSnapshots from "../ledgerSnapshots.js";
import type * as lib_mirrorAuth from "../lib/mirrorAuth.js";
import type * as menu from "../menu.js";
import type * as orders from "../orders.js";
import type * as payments from "../payments.js";
import type * as savedInvoices from "../savedInvoices.js";
import type * as transportEmployees from "../transportEmployees.js";
import type * as transportOrders from "../transportOrders.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  addresses: typeof addresses;
  batches: typeof batches;
  billingSummaries: typeof billingSummaries;
  calenders: typeof calenders;
  customers: typeof customers;
  dyeings: typeof dyeings;
  invoices: typeof invoices;
  ledgerSnapshots: typeof ledgerSnapshots;
  "lib/mirrorAuth": typeof lib_mirrorAuth;
  menu: typeof menu;
  orders: typeof orders;
  payments: typeof payments;
  savedInvoices: typeof savedInvoices;
  transportEmployees: typeof transportEmployees;
  transportOrders: typeof transportOrders;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};

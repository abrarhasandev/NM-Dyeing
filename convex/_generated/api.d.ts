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
import type * as androidApi from "../androidApi.js";
import type * as androidAuth from "../androidAuth.js";
import type * as auditing from "../auditing.js";
import type * as batches from "../batches.js";
import type * as billingSummaries from "../billingSummaries.js";
import type * as calenders from "../calenders.js";
import type * as check from "../check.js";
import type * as customers from "../customers.js";
import type * as dashboardQueries from "../dashboardQueries.js";
import type * as dyeings from "../dyeings.js";
import type * as executionEngine from "../executionEngine.js";
import type * as inventory from "../inventory.js";
import type * as invoices from "../invoices.js";
import type * as ledgerSnapshots from "../ledgerSnapshots.js";
import type * as lib_mirrorAuth from "../lib/mirrorAuth.js";
import type * as menu from "../menu.js";
import type * as orderQueries from "../orderQueries.js";
import type * as orders from "../orders.js";
import type * as payments from "../payments.js";
import type * as recipes from "../recipes.js";
import type * as savedInvoices from "../savedInvoices.js";
import type * as sops from "../sops.js";
import type * as testCheck from "../testCheck.js";
import type * as testCheckId from "../testCheckId.js";
import type * as transportBills from "../transportBills.js";
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
  androidApi: typeof androidApi;
  androidAuth: typeof androidAuth;
  auditing: typeof auditing;
  batches: typeof batches;
  billingSummaries: typeof billingSummaries;
  calenders: typeof calenders;
  check: typeof check;
  customers: typeof customers;
  dashboardQueries: typeof dashboardQueries;
  dyeings: typeof dyeings;
  executionEngine: typeof executionEngine;
  inventory: typeof inventory;
  invoices: typeof invoices;
  ledgerSnapshots: typeof ledgerSnapshots;
  "lib/mirrorAuth": typeof lib_mirrorAuth;
  menu: typeof menu;
  orderQueries: typeof orderQueries;
  orders: typeof orders;
  payments: typeof payments;
  recipes: typeof recipes;
  savedInvoices: typeof savedInvoices;
  sops: typeof sops;
  testCheck: typeof testCheck;
  testCheckId: typeof testCheckId;
  transportBills: typeof transportBills;
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

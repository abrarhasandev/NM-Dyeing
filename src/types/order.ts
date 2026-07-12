/**
 * Shared Order DTOs — stable domain language for UI + Convex mappers.
 * Mongo remains primary until cutover; `_id` is always the Mongo ObjectId hex for URLs/FKs.
 */

export type OrderStatus =
  | "pending"
  | "batch"
  | "inprocess"
  | "completedprocess"
  | "calender" // live UI drift — preserved intentionally
  | "delivered"
  | "billing"
  | "completed"
  | string;

export type OrderTableRow = {
  rollNo?: number;
  goj?: number;
};

/** Convex-shaped order document (mirror table). */
export type ConvexOrderDoc = {
  mongoId: string;
  orderId: string;
  customerMongoId: string;
  dyeingMongoId?: string;
  status: string;
  date?: number;
  invoiceNumber?: string;
  companyName?: string;
  clotheType?: string;
  finishingWidth?: number;
  quality?: string;
  sillName?: string;
  colour?: string;
  finishingType?: string;
  totalGoj?: number;
  totalBundle?: number;
  dyeingName?: string;
  transporterName?: string;
  tableData: OrderTableRow[];
  isTrash: boolean;
  createdAt: number;
  updatedAt: number;
};

/** Batch summary chips returned by GET /api/order enrichment. */
export type OrderBatchSummary = {
  batchCount: number;
  totalBatchBundle: number;
  totalBatchGoj: number;
  dispatchCount: number;
  dispatchTotalBundle: number;
  dispatchTotalGoj: number;
  dispatchOriginalGoj: number;
  invoiceCount: number;
};

/** API list row (Mongo lean + enrichment). */
export type OrderListItem = {
  _id: string;
  orderId: string;
  customerId: string;
  dyeingId?: string;
  status: OrderStatus;
  date?: string | Date | null;
  invoiceNumber?: string;
  companyName?: string;
  clotheType?: string;
  finishingWidth?: number;
  quality?: string;
  sillName?: string;
  colour?: string;
  finishingType?: string;
  totalGoj?: number;
  totalBundle?: number;
  dyeingName?: string;
  transporterName?: string;
  tableData?: OrderTableRow[];
  isTrash?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  batchSummary?: OrderBatchSummary;
};

export type OrderKpiData = {
  totalOrders: number;
  totalGoj: number;
  uniqueCustomers: number;
  activeCount: number;
  activeGoj: number;
};

export type OrderPrevKpiData = {
  totalOrders: number;
  totalGoj: number;
};

export type OrderChartBucket = {
  _id: {
    year: number;
    month: number;
    day: number;
    clothCat: string;
  };
  count: number;
  totalGoj?: number;
};

export type OrdersListResponse = {
  orders: OrderListItem[];
  totalCount: number;
  kpiData: OrderKpiData;
  prevKpiData: OrderPrevKpiData;
  chartData: OrderChartBucket[];
};

export type OrderListFilters = {
  currentPage: number;
  itemsPerPage: number;
  searchTerm?: string;
  dateRange?: string;
  customStartDate?: Date | string | null;
  customEndDate?: Date | string | null;
  exactDate?: string;
  status?: string;
  clotheType?: string;
  finishingType?: string;
  colour?: string;
  sillName?: string;
  quality?: string;
  transporterName?: string;
  isTrash?: boolean;
  skip?: boolean;
};

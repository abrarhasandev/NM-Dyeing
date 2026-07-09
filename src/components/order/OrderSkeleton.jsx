"use client";

import React from "react";

/* ─────────────────────────────────────────────────────────────────────────────
   SYNCHRONIZED SKELETON LOADER  —  NM Dyeing Orders Page
   ─────────────────────────────────────────────────────────────────────────── */

// Inject the shimmer keyframe once into the document (no external CSS required)
const SHIMMER_STYLE = `
  @keyframes mn-shimmer {
    0%   { background-position: -800px 0; }
    100% { background-position:  800px 0; }
  }
  .mn-skeleton {
    background: linear-gradient(
      90deg,
      #f0f0f0 25%,
      #e4e4e4 37%,
      #f0f0f0 63%
    );
    background-size: 800px 100%;
    animation: mn-shimmer 1.5s infinite linear;
    border-radius: 6px;
  }
`;

function InjectStyle() {
  React.useEffect(() => {
    if (document.getElementById("mn-skeleton-style")) return;
    const tag = document.createElement("style");
    tag.id = "mn-skeleton-style";
    tag.textContent = SHIMMER_STYLE;
    document.head.appendChild(tag);
  }, []);
  return null;
}

/* ── Primitive ───────────────────────────────────────────────────────────── */
const Bone = ({ width = "100%", height = 12, radius = 6, style = {} }) => (
  <div
    className="mn-skeleton"
    style={{ width, height, borderRadius: radius, flexShrink: 0, ...style }}
  />
);

/* ── KPI Stat Card Skeleton ──────────────────────────────────────────────── */
const KpiCardSkeleton = () => (
  <div
    className="bg-white border border-[#E4E4E7] rounded-xl p-5 shadow-sm flex flex-col justify-between"
    style={{ height: 130 }}
  >
    <div className="flex justify-between items-start">
      <Bone width={90} height={11} />
      <Bone width={44} height={18} radius={99} />
    </div>
    <div className="flex flex-col gap-2 mt-2">
      <Bone width={120} height={22} />
      <Bone width={80} height={10} />
      <Bone width={100} height={9} />
    </div>
  </div>
);

/* ── Chart Card Skeleton ─────────────────────────────────────────────────── */
const ChartSkeleton = () => (
  <div className="bg-white border border-[#E4E4E7] rounded-xl shadow-sm overflow-hidden">
    {/* header */}
    <div className="flex items-center gap-2 border-b border-[#E4E4E7] px-6 py-4">
      <div className="flex-1 flex flex-col gap-1.5">
        <Bone width={100} height={13} />
        <Bone width={70} height={10} />
      </div>
      <Bone width={140} height={32} radius={8} />
    </div>
    {/* chart body */}
    <div className="px-6 pt-5 pb-6">
      {/* Y-axis ghost lines */}
      <div className="flex flex-col gap-[38px] mb-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Bone key={i} width="100%" height={1} radius={0} />
        ))}
      </div>
      {/* Area silhouette bars */}
      <div className="flex items-end gap-3 mt-[-195px] h-[195px]">
        {[55, 70, 45, 85, 60, 90, 50, 75, 65, 80, 55, 70].map((h, i) => (
          <div
            key={i}
            className="mn-skeleton flex-1"
            style={{ height: `${h}%`, borderRadius: "4px 4px 0 0" }}
          />
        ))}
      </div>
      {/* X-axis labels */}
      <div className="flex gap-3 mt-3">
        {[40, 48, 36, 52, 44, 56, 40, 50, 44, 52, 40, 48].map((w, i) => (
          <Bone key={i} width={w} height={9} style={{ flex: 1 }} />
        ))}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-5 mt-4">
        {["Cotton", "Silk", "Other"].map((label) => (
          <div key={label} className="flex items-center gap-1.5">
            <Bone width={10} height={10} radius={99} />
            <Bone width={36} height={9} />
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ── Filter / Search Bar Skeleton ────────────────────────────────────────── */
const FilterBarSkeleton = () => (
  <div className="flex flex-wrap items-center gap-2">
    {/* Search input */}
    <Bone width={220} height={34} radius={8} />
    {/* Date range */}
    <Bone width={130} height={34} radius={8} />
    {/* Status filter */}
    <Bone width={100} height={34} radius={8} />
    {/* More filters button */}
    <Bone width={110} height={34} radius={8} />
    {/* Toggle graph */}
    <Bone width={80} height={34} radius={8} style={{ marginLeft: "auto" }} />
  </div>
);

/* ── Table Row Skeleton ──────────────────────────────────────────────────── */
const TableRowSkeleton = ({ opacity = 1 }) => (
  <tr
    style={{
      borderBottom: "1px solid #F4F4F5",
      opacity,
      transition: "opacity 0.2s",
    }}
  >
    {/* Order ID */}
    <td className="px-5 py-3.5">
      <Bone width={110} height={12} />
    </td>
    {/* Customer */}
    <td className="px-5 py-3.5">
      <Bone width={130} height={12} />
    </td>
    {/* Product */}
    <td className="px-5 py-3.5">
      <div className="flex flex-col gap-1.5">
        <Bone width={80} height={12} />
        <Bone width={55} height={10} />
      </div>
    </td>
    {/* Status */}
    <td className="px-5 py-3.5">
      <Bone width={72} height={20} radius={99} />
    </td>
    {/* Total Goj */}
    <td className="px-5 py-3.5">
      <div className="flex flex-col gap-1.5">
        <Bone width={96} height={13} />
        <Bone width={68} height={16} radius={4} />
      </div>
    </td>
    {/* Billing */}
    <td className="px-5 py-3.5">
      <Bone width={64} height={20} radius={99} />
    </td>
    {/* Inventory */}
    <td className="px-5 py-3.5">
      <Bone width={64} height={20} radius={99} />
    </td>
    {/* Actions */}
    <td className="px-5 py-3.5">
      <div className="flex justify-end gap-1">
        <Bone width={26} height={26} radius={6} />
        <Bone width={26} height={26} radius={6} />
      </div>
    </td>
  </tr>
);

/* ── Table Skeleton ──────────────────────────────────────────────────────── */
const TableSkeleton = ({ rows = 8 }) => (
  <div
    className="w-full overflow-hidden rounded-xl bg-white"
    style={{ border: "1px solid var(--mn-surface)", boxShadow: "var(--mn-elevation-1)" }}
  >
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        {/* thead ghost */}
        <thead>
          <tr
            style={{
              borderBottom: "1px solid var(--mn-surface)",
              backgroundColor: "var(--mn-background-3)",
            }}
          >
            {[120, 100, 80, 70, 90, 65, 70, 36].map((w, i) => (
              <th key={i} className="px-5 py-3.5">
                <Bone width={w} height={11} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton
              key={i}
              opacity={1 - (i / rows) * 0.55}
            />
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

/* ── Pagination Skeleton ─────────────────────────────────────────────────── */
const PaginationSkeleton = () => (
  <div className="flex items-center justify-between flex-wrap gap-3">
    <div className="flex items-center gap-2">
      <Bone width={50} height={11} />
      <Bone width={64} height={32} radius={8} />
      <Bone width={60} height={11} />
    </div>
    <div className="flex items-center gap-1">
      {[32, 32, 32, 32, 32, 32, 32].map((w, i) => (
        <Bone key={i} width={w} height={32} radius={6} />
      ))}
    </div>
  </div>
);

/* ── Full Orders Page Skeleton ───────────────────────────────────────────── */
const OrderSkeleton = ({ showGraph = true }) => {
  return (
    <>
      <InjectStyle />
      <div className="flex flex-col gap-5 text-[#09090B] select-none py-2 pb-10">

        {/* ── Breadcrumb / Title Bar ── */}
        <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-4">
          <div className="flex items-center gap-2">
            <Bone width={68} height={12} />
            <Bone width={8} height={12} radius={2} />
            <Bone width={48} height={12} />
          </div>
          {/* New Order button ghost */}
          <Bone width={100} height={34} radius={8} />
        </div>

        {/* ── KPI Cards ── */}
        {showGraph && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCardSkeleton />
              <KpiCardSkeleton />
              <KpiCardSkeleton />
              <KpiCardSkeleton />
            </div>

            {/* ── Chart ── */}
            <ChartSkeleton />
          </>
        )}

        {/* ── Filter Bar ── */}
        <FilterBarSkeleton />

        {/* ── Order Table ── */}
        <TableSkeleton rows={8} />

        {/* ── Pagination ── */}
        <PaginationSkeleton />
      </div>
    </>
  );
};

export default OrderSkeleton;

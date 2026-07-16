// @ts-nocheck
/**
 * useAppData — fetches all lookup/menu data via a single API call.
 *
 * Previously made 9 parallel requests to separate endpoints.
 * Now makes 1 request to /api/menu/all, which:
 *  - runs all 9 DB queries in parallel on the server
 *  - returns them in one HTTP response
 *  - benefits from HTTP Cache-Control (120s browser cache)
 *
 * This reduces page-load DB operations from 9 → 1 connection.
 */

import { useEffect, useState } from "react";

export default function useAppData() {
  const [data, setData] = useState({
    finishingTypes: [],
    clotheTypes: [],
    colours: [],
    sillNames: [],
    qualities: [],
    processes: [],
    customers: [],
    calender: [],
    dyeings: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch("/api/menu/all");
        if (!res.ok) throw new Error(`Menu fetch failed: ${res.status}`);

        const json = await res.json();

        if (!cancelled) {
          setData({
            finishingTypes: json.finishingTypes ?? [],
            clotheTypes:    json.clotheTypes    ?? [],
            colours:        json.colours        ?? [],
            sillNames:      json.sillNames      ?? [],
            qualities:      json.qualities      ?? [],
            processes:      json.processes      ?? [],
            customers:      json.customers      ?? [],
            calender:       json.calender       ?? [],
            dyeings:        json.dyeings        ?? [],
          });
        }
      } catch (err) {
        if (!cancelled) setError(err);
        console.error("useAppData fetch error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();

    return () => {
      cancelled = true; // prevent state update on unmounted component
    };
  }, []);

  return { data, loading, error };
}

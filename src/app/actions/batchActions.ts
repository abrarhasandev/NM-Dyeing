// @ts-nocheck
"use server";

import connectDB from "@/lib/db";
import Batch from "@/models/Batch";
import { mirrorBatchUpsert } from "@/lib/orders/convexServer";
import { requireAuth } from "@/lib/requireAuth";
import { after } from "next/server";

export async function createBatchAction(body: any) {
  const _authResult = await requireAuth({ roles: ["admin", "user", "moderator"] });
  if (_authResult?.error) return { error: _authResult.error };

  const authResult = await requireAuth();
  if (authResult?.error) return { error: authResult.error };

  await connectDB();

  try {
    const {
      orderId,
      colour,
      quality,
      sillName,
      clotheType,
      finishingType,
      dyeing,
      calender,
      customerId,
      dyeingId,
      calenderId,
      rows,
      selectedProcesses,
    } = body;

    if (
      !orderId ||
      !colour ||
      !sillName ||
      !finishingType ||
      !dyeing ||
      !rows?.length ||
      !selectedProcesses?.length
    ) {
      return { error: "Missing required fields" };
    }

    let existing = await Batch.findOne({ orderId });

    const newBatch = {
      batchName: "Batch 1",
      status: "pending",
      colour,
      quality,
      sillName,
      clotheType,
      finishingType,
      dyeing,
      calender: calender || null,
      customerId: customerId || null,
      dyeingId: dyeingId || null,
      calenderId: calenderId || null,
      rows,
      selectedProcesses,
    };

    if (existing) {
      const lastBatchNumber =
        existing.batches.length > 0
          ? Math.max(
              ...existing.batches.map((b: any) =>
                parseInt(b.batchName.split(" ")[1] || "0")
              )
            )
          : 0;

      newBatch.batchName = `Batch ${lastBatchNumber + 1}`;
      existing.batches.push(newBatch);
      await existing.save();

      // unstable_after: Run Convex sync in the background after the response is sent
      after(async () => {
        await mirrorBatchUpsert(existing);
      });

      return { success: true, data: JSON.parse(JSON.stringify(existing)) };
    } else {
      const created = await Batch.create({
        orderId,
        batches: [newBatch],
      });
      
      after(async () => {
        await mirrorBatchUpsert(created);
      });

      return { success: true, data: JSON.parse(JSON.stringify(created)) };
    }
  } catch (error: any) {
    console.error("Batch creation error:", error);
    return { error: error.message };
  }
}

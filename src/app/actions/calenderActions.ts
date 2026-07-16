// @ts-nocheck
"use server";

import connectDB from "@/lib/db";
import Calender from "@/models/Calender";
import { requireAuth } from "@/lib/requireAuth";
import { after } from "next/server";
import { revalidateTag } from "next/cache";

export async function getCalendersAction() {
  "use cache";
  
  await connectDB();
  const calenders = await Calender.find({}).sort({ createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(calenders));
}

export async function createCalenderAction(data: any) {
  const authResult = await requireAuth({ roles: ["admin"] });
  if (authResult?.error) return { error: authResult.error };

  await connectDB();

  try {
    const newCalender = await Calender.create(data);
    
    // unstable_after for non-blocking operations like analytics or background syncing
    after(async () => {
      // Background logic here
      revalidateTag("calenders");
    });

    return { success: true, data: JSON.parse(JSON.stringify(newCalender)) };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteCalenderAction(id: string) {
  const authResult = await requireAuth({ roles: ["admin"] });
  if (authResult?.error) return { error: authResult.error };

  await connectDB();

  try {
    await Calender.findByIdAndDelete(id);
    
    after(() => {
      revalidateTag("calenders");
    });

    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

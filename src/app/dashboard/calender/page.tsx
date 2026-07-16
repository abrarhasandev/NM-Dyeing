import React, { Suspense } from "react";
import CalenderClient from "./CalenderClient";
import dbConnect from "@/lib/db";
import Calender from "@/models/Calender";

export const dynamic = "force-dynamic";

export default async function CalenderPage() {
  await dbConnect();
  
  // Fetch calenders server-side
  const calendersData = await Calender.find({}).sort({ createdAt: -1 }).lean();
  const calenders = JSON.parse(JSON.stringify(calendersData));

  return (
    <Suspense fallback={<div>Loading calenders...</div>}>
      <CalenderClient initialCalenders={calenders} />
    </Suspense>
  );
}

import connectDB from "@/lib/db";
import Customer from "@/models/customers";
import { mirrorCustomerUpsert } from "@/lib/orders/convexServer";
import { requireAuth } from "@/lib/requireAuth";

export async function POST(req) {
  const { error: __authError } = await requireAuth();
  if (__authError) return __authError;

  try {
    await connectDB();
    const body = await req.json();

    console.log("Received Body:", body); // Debug (optional)

    // Convert employee list to array
    if (typeof body.employeeList === "string") {
      body.employeeList = body.employeeList
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean);
    }

    const customer = await Customer.create({
      ...body,
      searchText: body.searchText || "",
    });

    await mirrorCustomerUpsert(customer);

    return new Response(
      JSON.stringify({ message: "Customer created", customer }),
      { status: 201 }
    );

  } catch (error) {
    console.error("POST Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function GET() {
  const { error: __authError } = await requireAuth();
  if (__authError) return __authError;

  try {
    await connectDB();

    const customers = await Customer.find().sort({ createdAt: -1 });
    return new Response(JSON.stringify(customers), { status: 200 });

  } catch (error) {
    console.error("GET Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

import connectDB from "@/lib/db";
import Order from "@/models/Order";
import { NextResponse } from "next/server";


export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    const { tableData, ...rest } = body;

    const updatedTableData = tableData.map((row, index) => ({
      rollNo: index + 1,
      goj: row.goj,
    }));

    const order = new Order({
      ...rest,
      tableData: updatedTableData,
    });

    const savedOrder = await order.save();

    return NextResponse.json(savedOrder, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    // Pagination
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 12;
    const skip = (page - 1) * limit;

    // Search term
    const searchRaw = searchParams.get("search")?.trim() || "";

    // Date filters
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";
    const exactDate = searchParams.get("date") || ""; // DD/MM/YYYY string match

    // Extra filters
    const status = searchParams.get("status") || "";
    const clotheTypes = searchParams.get("clotheTypes") || "";
    const finishingType = searchParams.get("finishingType") || "";
    const colour = searchParams.get("colour") || "";
    const sillName = searchParams.get("sillName") || "";
    const quality = searchParams.get("quality") || "";

    // Base query object
    let query = {};

    // Search filter
    if (searchRaw) {
      query.$or = [
        { companyName: { $regex: searchRaw, $options: "i" } },
        { orderId: { $regex: searchRaw, $options: "i" } },
      ];
    }

    // Exact date filter (matches the string date field e.g. "03/02/2026")
    if (exactDate) {
      query.date = exactDate;
    } else if (startDate && endDate) {
      const parsedStart = new Date(startDate);
      const parsedEnd = new Date(new Date(endDate).setHours(23, 59, 59, 999));
      
      query.$expr = {
        $and: [
          {
            $gte: [
              {
                $dateFromString: {
                  dateString: "$date",
                  format: "%d/%m/%Y",
                  onError: new Date(0)
                }
              },
              parsedStart
            ]
          },
          {
            $lte: [
              {
                $dateFromString: {
                  dateString: "$date",
                  format: "%d/%m/%Y",
                  onError: new Date(0)
                }
              },
              parsedEnd
            ]
          }
        ]
      };
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Multi-select support for other filters
    if (clotheTypes) {
      const values = clotheTypes.split(",").map((v) => v.trim());
      query.clotheType = { $in: values };
    }
    if (finishingType) {
      const values = finishingType.split(",").map((v) => v.trim());
      query.finishingType = { $in: values };
    }
    if (colour) {
      const values = colour.split(",").map((v) => v.trim());
      query.colour = { $in: values };
    }
    if (sillName) {
      const values = sillName.split(",").map((v) => v.trim());
      query.sillName = { $in: values };
    }
    if (quality) {
      const values = quality.split(",").map((v) => v.trim());
      query.quality = { $in: values };
    }

    // Get total count
    const totalCount = await Order.countDocuments(query);

    // Fetch orders
    const orders = await Order.find(query)
      .sort({ createdAt: -1 }) // latest first
      .skip(skip)
      .limit(limit);

    // Fetch all matching orders for stats & charts (non-paginated)
    const allFilteredOrders = await Order.find(query)
      .select("date clotheType status companyName totalGoj tableData")
      .sort({ createdAt: -1 });

    // Fetch previous period orders for growth calculation
    let prevFilteredOrders = [];
    if (startDate && endDate) {
      const parsedStart = new Date(startDate);
      const parsedEnd = new Date(new Date(endDate).setHours(23, 59, 59, 999));
      const duration = parsedEnd.getTime() - parsedStart.getTime();
      const prevStart = new Date(parsedStart.getTime() - duration);
      const prevEnd = new Date(parsedStart.getTime() - 1);

      let prevQuery = {};
      if (searchRaw) {
        prevQuery.$or = [
          { companyName: { $regex: searchRaw, $options: "i" } },
          { orderId: { $regex: searchRaw, $options: "i" } },
        ];
      }

      if (status) {
        prevQuery.status = status;
      }

      if (clotheTypes) {
        const values = clotheTypes.split(",").map((v) => v.trim());
        prevQuery.clotheType = { $in: values };
      }
      if (finishingType) {
        const values = finishingType.split(",").map((v) => v.trim());
        prevQuery.finishingType = { $in: values };
      }
      if (colour) {
        const values = colour.split(",").map((v) => v.trim());
        prevQuery.colour = { $in: values };
      }
      if (sillName) {
        const values = sillName.split(",").map((v) => v.trim());
        prevQuery.sillName = { $in: values };
      }
      if (quality) {
        const values = quality.split(",").map((v) => v.trim());
        prevQuery.quality = { $in: values };
      }

      prevQuery.$expr = {
        $and: [
          {
            $gte: [
              {
                $dateFromString: {
                  dateString: "$date",
                  format: "%d/%m/%Y",
                  onError: new Date(0)
                }
              },
              prevStart
            ]
          },
          {
            $lte: [
              {
                $dateFromString: {
                  dateString: "$date",
                  format: "%d/%m/%Y",
                  onError: new Date(0)
                }
              },
              prevEnd
            ]
          }
        ]
      };

      prevFilteredOrders = await Order.find(prevQuery)
        .select("date clotheType status companyName totalGoj tableData")
        .sort({ createdAt: -1 });
    }

    return NextResponse.json({ orders, totalCount, allFilteredOrders, prevFilteredOrders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}


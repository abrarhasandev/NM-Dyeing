import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

async function profile() {
  console.time("connectDB");
  await mongoose.connect(process.env.MONGO_URI, { dbName: "garments_db" });
  console.timeEnd("connectDB");

  const Order = mongoose.models.Order || mongoose.model("Order", new mongoose.Schema({}, { strict: false }));
  
  console.time("countDocuments");
  const count = await Order.countDocuments({ isTrash: { $ne: true } });
  console.timeEnd("countDocuments");
  console.log("Total non-trash orders:", count);

  console.time("findLimit12");
  const orders = await Order.find({ isTrash: { $ne: true } })
    .sort({ date: -1, createdAt: -1 })
    .limit(12)
    .lean();
  console.timeEnd("findLimit12");
  console.log("Found orders:", orders.length);

  // Run the aggregation pipeline
  console.time("statsAggregation");
  const pipeline = [
    { $match: { isTrash: { $ne: true } } },
    {
      $facet: {
        kpi: [
          {
            $group: {
              _id: null,
              totalOrders: { $sum: 1 },
              totalGoj: {
                $sum: {
                  $cond: {
                    if: { $and: [{ $ne: ["$totalGoj", null] }, { $ne: ["$totalGoj", ""] }] },
                    then: { $convert: { input: "$totalGoj", to: "double", onError: 0, onNull: 0 } },
                    else: {
                      $sum: {
                        $map: {
                          input: { $ifNull: ["$tableData", []] },
                          as: "item",
                          in: { $convert: { input: "$$item.goj", to: "double", onError: 0, onNull: 0 } },
                        },
                      },
                    },
                  },
                },
              },
              uniqueCustomers: { $addToSet: "$companyName" },
            },
          },
          {
            $project: {
              _id: 0,
              totalOrders: 1,
              totalGoj: 1,
              uniqueCustomers: { $size: "$uniqueCustomers" },
            },
          },
        ],
        active: [
          {
            $match: {
              status: { $nin: ["completed", "delivered", "completedprocess"] },
            },
          },
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
              totalGoj: {
                $sum: {
                  $cond: {
                    if: { $and: [{ $ne: ["$totalGoj", null] }, { $ne: ["$totalGoj", ""] }] },
                    then: { $convert: { input: "$totalGoj", to: "double", onError: 0, onNull: 0 } },
                    else: {
                      $sum: {
                        $map: {
                          input: { $ifNull: ["$tableData", []] },
                          as: "item",
                          in: { $convert: { input: "$$item.goj", to: "double", onError: 0, onNull: 0 } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        ],
        chart: [
          {
            $group: {
              _id: {
                year: { $year: "$date" },
                month: { $month: "$date" },
                day: { $dayOfMonth: "$date" },
                clothCat: {
                  $switch: {
                    branches: [
                      {
                        case: {
                          $regexMatch: {
                            input: { $toLower: { $ifNull: ["$clotheType", ""] } },
                            regex: "cotton",
                          },
                        },
                        then: "cotton",
                      },
                      {
                        case: {
                          $regexMatch: {
                            input: { $toLower: { $ifNull: ["$clotheType", ""] } },
                            regex: "silk|sill",
                          },
                        },
                        then: "silk",
                      },
                    ],
                    default: "other",
                  },
                },
              },
              count: { $sum: 1 },
              totalGoj: {
                $sum: {
                  $cond: {
                    if: { $and: [{ $ne: ["$totalGoj", null] }, { $ne: ["$totalGoj", ""] }] },
                    then: { $convert: { input: "$totalGoj", to: "double", onError: 0, onNull: 0 } },
                    else: {
                      $sum: {
                        $map: {
                          input: { $ifNull: ["$tableData", []] },
                          as: "item",
                          in: { $convert: { input: "$$item.goj", to: "double", onError: 0, onNull: 0 } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
        ],
      },
    },
  ];
  const aggResult = await Order.aggregate(pipeline);
  console.timeEnd("statsAggregation");
  console.log("Aggregation done. Chart buckets length:", aggResult[0]?.chart?.length);

  await mongoose.disconnect();
}

profile().catch(console.error);

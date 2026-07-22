const { ConvexHttpClient } = require("convex/browser");
const { anyApi } = require("convex/server");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env.local" });

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  console.error("Error: NEXT_PUBLIC_CONVEX_URL is not defined in .env.local");
  process.exit(1);
}

const client = new ConvexHttpClient(convexUrl);

async function seedBanks() {
  const jsonPath = path.join(__dirname, "..", "bd-bank-branch-list-main", "bank_data.json");
  
  if (!fs.existsSync(jsonPath)) {
    console.error(`Error: Data file not found at ${jsonPath}`);
    process.exit(1);
  }

  console.log("Loading banks data from JSON...");
  const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

  console.log(`Found ${data.length} banks to process.`);

  for (let i = 0; i < data.length; i++) {
    const bank = data[i];
    console.log(`Processing ${bank.name} (${i + 1}/${data.length})...`);
    
    // Flatten the branches from districts
    const branches = [];
    if (bank.districts) {
        for (const district of bank.districts) {
            for (const branch of district.branches || []) {
                branches.push({
                    branchName: branch.branch_name,
                    routingNumber: branch.routing_number,
                    district: district.district_name,
                    address: branch.address
                });
            }
        }
    }

    const BATCH_SIZE = 50; 
    for (let j = 0; j < branches.length; j += BATCH_SIZE) {
      const branchBatch = branches.slice(j, j + BATCH_SIZE);
      
      try {
        const result = await client.mutation(anyApi.banks.seedBank, {
          bankName: bank.name,
          shortName: bank.slug, // using slug as shortName since we don't have exact shortname in this dataset
          type: "Commercial",
          branches: branchBatch
        });
        
        console.log(`  -> Inserted/Verified ${result.insertedCount} branches for ${bank.name} (batch ${j / BATCH_SIZE + 1} / ${Math.ceil(branches.length/BATCH_SIZE)})`);
      } catch (error) {
        console.error(`  -> Error processing batch for ${bank.name}:`, error.message);
      }
    }
  }

  console.log("Seeding completed successfully!");
}

seedBanks().catch(console.error);

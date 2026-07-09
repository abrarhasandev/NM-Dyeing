const fs = require('fs');
const path = './src/app/api/order/route.js';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  /let batchCount = 0;[\s\S]*?if \(batchDoc && batchDoc\.batches\) \{[\s\S]*?totalBatchGoj \+= b\.rows\.reduce\(\(sum, row\) => sum \+ \(Number\(row\.goj\) \|\| 0\), 0\);[\s\S]*?\}[\s\S]*?\}\);[\s\S]*?\}/,
  `let batchCount = 0;
      let dispatchCount = 0;
      let dispatchTotalBundle = 0;
      let dispatchTotalGoj = 0;
      let dispatchOriginalGoj = 0;

      if (batchDoc && batchDoc.batches) {
        batchCount = batchDoc.batches.length;
        batchDoc.batches.forEach((b) => {
          if (b.rows) {
            totalBatchBundle += b.rows.length;
            totalBatchGoj += b.rows.reduce((sum, row) => sum + (Number(row.goj) || 0), 0);
          }
          
          if (["delivered", "billing", "completed"].includes(b.status)) {
            dispatchCount += 1;
            if (b.rows) {
              dispatchTotalBundle += b.rows.length;
              dispatchTotalGoj += b.rows.reduce((sum, row) => sum + (Number(row.idx) || 0), 0);
              dispatchOriginalGoj += b.rows.reduce((sum, row) => sum + (Number(row.goj) || 0), 0);
            }
          }
        });
      }`
);

code = code.replace(
  /batchSummary: \{[\s\S]*?totalBatchGoj,[\s\S]*?\},/,
  `batchSummary: {
          batchCount,
          totalBatchBundle,
          totalBatchGoj,
          dispatchCount,
          dispatchTotalBundle,
          dispatchTotalGoj,
          dispatchOriginalGoj,
        },`
);

fs.writeFileSync(path, code);

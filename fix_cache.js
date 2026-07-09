const fs = require('fs');
const path = './src/app/api/order/route.js';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  /"Cache-Control": "private, max-age=15, stale-while-revalidate=60",/g,
  '"Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",'
);

fs.writeFileSync(path, code);

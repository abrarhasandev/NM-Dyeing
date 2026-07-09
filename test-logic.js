const status = "inprocess";
const originalBundle = 10;
const originalGoj = 1500;
const batchCount = 1;
const batchBundle = 5;
const batchGoj = 500;

const remainingBundle = originalBundle - batchBundle;
const remainingGoj = originalGoj - batchGoj;

const rows = [];
if (status !== "pending") {
  rows.push({
    icon: "clock",
    text: `${remainingBundle}~${remainingGoj}`,
    cls: "text-[#26251e]/60 bg-[#f7f7f4] border-[color-mix(in_oklab,#26251e_10%,transparent)]"
  });
  if (batchCount > 0) {
    rows.push({
      icon: "check",
      text: `${batchCount}/ ${batchBundle}~${batchGoj}`,
      cls: "text-[#1f8a65] bg-[#1f8a65]/10 border-[#1f8a65]/20"
    });
  }
}
console.log(rows);

/** Compliance checks shared by several categories (kept tiny so no category bundles another's playbook). */

/** An offer that quotes an earlier price ("was ₹X, now ₹Y", MRP vs sale price, struck-through prices). */
export const EARLIER_PRICE = /\bwas\b|\bnow\s*(only\s*)?₹|\bMRP\b[^.]*₹[^.]*₹|\bearlier\b|\bstrike|\bslashed\b|\bfrom\s*₹\s*[\d,]+\s*to\s*₹/i;

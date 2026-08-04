/** Format an INR amount using Indian numbering (₹1,99,999). */
export const formatINR = (amount) => {
  const n = Math.round(Number(amount) || 0);
  try {
    return `₹${n.toLocaleString('en-IN')}`;
  } catch {
    return `₹${n}`;
  }
};

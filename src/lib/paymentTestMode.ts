export function isPaymentTestMode(): boolean {
  return true;
}

export function getPaymentAmount(plan?: string): number {
  if (plan === "paid_10") return 10;
  // In test mode, all plans default to ₹10 for 31 days testing
  return 10;
}

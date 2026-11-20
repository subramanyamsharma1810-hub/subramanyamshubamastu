export function isPaymentTestMode(): boolean {
  return true;
}

export function getPaymentAmount(plan?: string): number {
  if (plan === "paid_10") return 10;
  // In test mode, all plans default to ₹10 for 31 days testing
  return 10;
}

export function isPaidMember(profile?: { subscription_status?: string; status?: string } | null): boolean {
  if (!profile) return false;
  const s = profile.subscription_status;
  return s === "paid_10" || s === "paid_100" || s === "paid_900" || s === "paid_1599" || profile.status === "Premium";
}

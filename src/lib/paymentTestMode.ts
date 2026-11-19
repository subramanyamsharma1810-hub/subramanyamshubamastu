export function isPaymentTestMode(): boolean {
  return false;
}

export function getPaymentAmount(plan: string): number {
  if (plan === "paid_10") return 10;
  if (plan === "paid_1599") return 1599;
  if (plan === "paid_900") return 900;
  if (plan === "paid_100") return 100;
  return 10;
}

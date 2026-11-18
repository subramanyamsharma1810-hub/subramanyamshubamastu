export function isPaymentTestMode(): boolean {
  if (typeof window === "undefined") return false;

  const params = new URLSearchParams(window.location.search);
  const envFlag = (import.meta as any).env?.VITE_PAYMENT_TEST_MODE === "true";
  const localHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const previewHost = window.location.hostname.endsWith(".vercel.app");

  return envFlag || params.get("payment_test") === "1" || localHost || previewHost;
}

export function getPaymentAmount(plan: string): number {
  if (!isPaymentTestMode()) {
    if (plan === "paid_1599") return 1599;
    if (plan === "paid_900") return 900;
    return 100;
  }

  return plan === "paid_900" || plan === "paid_1599" ? 2 : 1;
}

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createHmac, timingSafeEqual } from "crypto";

export const config = {
  api: {
    bodyParser: false
  }
};

const safeEqualBase64 = (provided: string, expected: string): boolean => {
  try {
    const providedBytes = Buffer.from(provided.replace(/^sha256=/i, "").trim(), "base64");
    const expectedBytes = Buffer.from(expected, "base64");
    return providedBytes.length === expectedBytes.length &&
      timingSafeEqual(providedBytes, expectedBytes);
  } catch {
    return false;
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, message: "Method not allowed." });
  }

  const secret = process.env.PHONEPE_WEBHOOK_CHECKSUM_KEY || "";
  if (!secret) {
    return res.status(503).json({ success: false, message: "Webhook verification is not configured." });
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const rawBody = Buffer.concat(chunks).toString("utf8");
  const expected = createHmac("sha256", secret).update(rawBody).digest("base64");
  const headerValues = [
    req.headers["x-verify"],
    req.headers["x-verify-signature"],
    req.headers["authorization"]
  ].flatMap(value => Array.isArray(value) ? value : (value ? [value] : []));
  if (!headerValues.some(value => safeEqualBase64(String(value), expected))) {
    return res.status(401).json({ success: false, message: "Invalid webhook signature." });
  }

  let body: Record<string, any>;
  try {
    body = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    return res.status(400).json({ success: false, message: "Invalid JSON webhook payload." });
  }
  const eventName = String(
    body.event || body.event_name || body.type || body.data?.event || ""
  ).toLower();
  const webhookId = String(
    req.headers["x-phonepe-webhook-id"] ||
    body.webhookId ||
    body.webhook_id ||
    body.data?.webhookId ||
    ""
  );
  const configuredIds = [
    process.env.PHONEPE_PAYMENT_SUCCESS_WEBHOOK_ID,
    process.env.PHONEPE_PAYMENT_FAILURE_WEBHOOK_ID,
    process.env.PHONEPE_WEBHOOK_ID
  ].filter((value): value is string => Boolean(value));

  if (webhookId && configuredIds.length > 0 && !configuredIds.includes(webhookId)) {
    return res.status(401).json({ success: false, message: "Unknown PhonePe webhook ID." });
  }

  const isFailure = eventName.includes("fail") ||
    eventName.includes("error") ||
    body.payment?.state === "FAILED" ||
    body.data?.payment?.state === "FAILED";
  if (isFailure) {
    return res.status(200).json({ success: true, status: "FAILED", processed: false });
  }

  const isSuccess = eventName.includes("success") ||
    eventName.includes("paid") ||
    eventName.includes("completed") ||
    body.payment?.state === "COMPLETED" ||
    body.data?.payment?.state === "COMPLETED";
  if (!isSuccess) {
    return res.status(200).json({ success: true, status: "IGNORED", processed: false });
  }

  return res.status(202).json({
    success: true,
    status: "COMPLETED",
    processed: false,
    message: "Webhook authenticated. Server-side status confirmation and premium activation are pending."
  });
}

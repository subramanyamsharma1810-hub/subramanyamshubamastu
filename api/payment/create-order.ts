import type { VercelRequest, VercelResponse } from "@vercel/node";

const phonePeBaseUrl = (process.env.PHONEPE_BASE_URL || "https://api.phonepe.com/apis").replace(/\/$/, "");

const getPhonePeAccessToken = async (): Promise<string> => {
  const clientId = process.env.PHONEPE_CLIENT_ID || "SU2611171408316607957080";
  const clientSecret = process.env.PHONEPE_CLIENT_SECRET || "0b1c9241-c341-43c2-ab57-6e8bd0cfc4b2";
  if (!clientId || !clientSecret) {
    throw new Error("PhonePe is not configured.");
  }

  const response = await fetch(`${phonePeBaseUrl}/identity-manager/v1/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      client_version: process.env.PHONEPE_CLIENT_VERSION || "1",
    }),
  });
  const data = (await response.json()) as { access_token?: string; message?: string };
  if (!response.ok || !data.access_token) {
    throw new Error(data.message || "PhonePe authorization failed.");
  }
  return data.access_token;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS configuration
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }

    const { customerId, customerPhone, customerEmail, customerName, plan, orderAmount } = body || {};
    // Test mode: ₹10 for 31 days
    const effectiveAmount = 10;

    if (!customerId || typeof customerId !== "string" || !customerId.trim()) {
      return res.status(400).json({ success: false, message: "A registered customer profile is required." });
    }

    const cleanCustomerId = customerId.trim();
    const orderId = `ORD_SHUBH_${Date.now()}_${cleanCustomerId.replace(/[^a-zA-Z0-9_-]/g, "").slice(-12)}`;

    const host = req.headers.host || "www.shubhamastu.in";
    const proto = req.headers["x-forwarded-proto"] || "https";
    const redirectUrl = `${proto}://${host}/checkout?order_id=${encodeURIComponent(orderId)}&status=success`;

    const accessToken = await getPhonePeAccessToken();

    const phonePeResponse = await fetch(`${phonePeBaseUrl}/pg/checkout/v2/pay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `O-Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        merchantOrderId: orderId,
        amount: effectiveAmount * 100,
        expireAfter: 1200,
        metaInfo: {
          udf1: cleanCustomerId,
          udf2: String(plan),
          udf3: customerName || "Valued Member",
          udf4: customerPhone || "",
          udf5: customerEmail || "",
        },
        paymentFlow: {
          type: "PG_CHECKOUT",
          message: "Shubhamastu 31-day testing access payment",
          merchantUrls: {
            redirectUrl,
          },
        },
      }),
    });

    const phonePeData = (await phonePeResponse.json()) as {
      merchantOrderId?: string;
      redirectUrl?: string;
      state?: string;
      message?: string;
    };

    if (!phonePeResponse.ok || !phonePeData.redirectUrl) {
      console.error("PhonePe order rejected:", phonePeData);
      return res.status(502).json({
        success: false,
        message: phonePeData.message || "Secure payment could not be started.",
      });
    }

    return res.json({
      success: true,
      order_id: phonePeData.merchantOrderId || orderId,
      order_amount: effectiveAmount,
      payment_link: phonePeData.redirectUrl,
      order_status: phonePeData.state || "CREATED",
      gateway: "phonepe",
    });
  } catch (err: any) {
    console.error("PhonePe order creation error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to start secure payment.",
    });
  }
}

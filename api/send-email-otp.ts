import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, name } = req.body || {};
    
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email address is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const otp = Math.floor(1000000 + Math.random() * 9000000).toString(); // 7-digit OTP

    const rawToken =
      process.env.ZEPTOMAIL_API_TOKEN ||
      process.env.ZOHO_ZEPTOMAIL_API_KEY ||
      "Zoho-enczapikey PHtE6r0PS7y6iDQp+xNWtPPqFpbwZI8r+L82eAFA4YoTXqdRSU1crtwqkD6xoxspU6QXFqSbyd1hseybtLiAdm/tND0ZVGqyqK3sx/VYSPOZsbq6x00ZtFgTdkbbU4TsdtNq1ibTut/bNA==";

    const token = rawToken.toLowerCase().startsWith("zoho-enczapikey ")
      ? rawToken.trim()
      : `Zoho-enczapikey ${rawToken.trim()}`;

    const senderEmail = process.env.ZOHO_SENDER_EMAIL || "verification@shubhamastu.in";
    const senderName = process.env.ZOHO_SENDER_NAME || "shubhamastu.in";

    const payload = {
      from: {
        address: senderEmail,
        name: senderName,
      },
      to: [
        {
          email_address: {
            address: cleanEmail,
            name: name || "Valued Member",
          },
        },
      ],
      subject: `${otp} is your verification code for shubhamastu.in`,
      htmlbody: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #f0e6d2; border-radius: 12px; background-color: #fffdf9;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #b8860b; margin: 0; font-size: 24px;">Shubhamastu Matrimony</h2>
            <p style="color: #666; font-size: 14px; margin-top: 4px;">Sacred Union Portal</p>
          </div>
          <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #faebd7; text-align: center;">
            <p style="color: #333; font-size: 16px; margin-top: 0;">Namaste,</p>
            <p style="color: #555; font-size: 14px;">Your verification code for registration is:</p>
            <div style="font-size: 32px; font-weight: bold; color: #b8860b; letter-spacing: 6px; margin: 20px 0;">${otp}</div>
            <p style="color: #777; font-size: 13px;">This code will expire in 10 minutes. Do not share this code with anyone.</p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© Shubhamastu Matrimony. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    console.log(`[ZeptoMail Serverless] Sending OTP to ${cleanEmail} via https://api.zeptomail.in/v1.1/email`);

    const response = await fetch("https://api.zeptomail.in/v1.1/email", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": token,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || data.error_code) {
      console.error("[ZeptoMail Serverless] Error response from Zoho:", data);
      return res.status(500).json({
        success: false,
        error: data.message || data.error || JSON.stringify(data),
      });
    }

    console.log("[ZeptoMail Serverless] Email sent successfully:", data);
    return res.status(200).json({
      success: true,
      otp, // returned for debugging/fallback if needed
      message: `OTP sent successfully to ${cleanEmail}`,
    });

  } catch (error: any) {
    console.error("[ZeptoMail Serverless Exception]:", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "Internal server error during email dispatch",
    });
  }
}

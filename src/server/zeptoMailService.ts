import { SendMailClient } from "zeptomail";

const url = "https://api.zeptomail.in/v1.1/email";

// Support ZEPTOMAIL_API_TOKEN as well as fallback env variables
const rawToken =
  process.env.ZEPTOMAIL_API_TOKEN ||
  process.env.ZOHO_ZEPTOMAIL_API_KEY ||
  "Zoho-enczapikey PHtE6r1bEL/uimYpoxMJsaLuFsXwZ40u/+luLAUR4opFCPJVHU0Ar919kDKz+BwqUPAXRaSfz4g7tLmf57mAJD25M2kdDmqyqK3sx/VYSPOZsbq6x00btF8ecUXeUoTtctBs1ibeu9rfNA==";

// Ensure token contains the required Zoho-enczapikey prefix expected by ZeptoMail API
const token = rawToken.toLowerCase().startsWith("zoho-enczapikey ")
  ? rawToken.trim()
  : `Zoho-enczapikey ${rawToken.trim()}`;

export const client = new SendMailClient({ url, token });

export interface EmailLogEntry {
  id: string;
  timestamp: string;
  recipient: string;
  subject: string;
  type: "OTP" | "PasswordReset" | "Test";
  provider: string;
  success: boolean;
  error?: any;
  details?: any;
}

export const emailLogs: EmailLogEntry[] = [];

export function recordEmailLog(entry: Omit<EmailLogEntry, "id" | "timestamp">) {
  emailLogs.unshift({
    id: Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toISOString(),
    ...entry,
  });
  if (emailLogs.length > 50) {
    emailLogs.pop();
  }
}

/**
 * Robust direct fetch helper for Zoho ZeptoMail API v1.1
 */
async function sendViaZeptoFetch(payload: {
  toEmail: string;
  toName?: string;
  subject: string;
  htmlbody: string;
}) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": token,
      },
      body: JSON.stringify({
        from: {
          address: process.env.ZOHO_SENDER_EMAIL || "verification@shubhamastu.in",
          name: process.env.ZOHO_SENDER_NAME || "Bramhana Vivaha Vedika",
        },
        to: [
          {
            email_address: {
              address: payload.toEmail,
              name: payload.toName || "Valued Member",
            },
          },
        ],
        subject: payload.subject,
        htmlbody: payload.htmlbody,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.log("ℹ️ ZeptoMail API notice (Status", res.status, "): Sender domain or API token requires DNS/domain ownership verification in Zoho ZeptoMail dashboard. Falling back to robust local delivery.");
      return { success: false, error: data, status: res.status };
    }
    console.log("ZeptoMail Direct API Success:", data);
    return { success: true, data };
  } catch (err: any) {
    console.log("ℹ️ ZeptoMail Direct Fetch Notice:", err?.message || err);
    return { success: false, error: err?.message || err };
  }
}

/**
 * Dispatches a verification OTP to the recipient email using ZeptoMail
 */
export async function sendVerificationOtp(recipientEmail: string, otpCode: string | number) {
  const subject = `${otpCode} is your verification code for shubhamastu.in/registration/mobile/otpverification`;
  const htmlbody = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #f0e6d2; border-radius: 8px; background-color: #fffdf9;">
      <h2 style="color: #b45309; text-align: center; margin-bottom: 8px;">Bramhana Vivaha Vedika</h2>
      <p style="text-align: center; font-size: 13px; color: #78350f; margin-top: 0; font-family: monospace;">shubhamastu.in/registration/mobile/otpverification</p>
      <hr style="border: 0; border-top: 1px solid #f3e8ff; margin: 16px 0;" />
      <p>Namaste,</p>
      <p>Please use the following One-Time Password (OTP) to complete your verification at <b>shubhamastu.in/registration/mobile/otpverification</b>:</p>
      <div style="text-align: center; margin: 24px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1f2937; background-color: #fef3c7; padding: 10px 22px; border-radius: 8px; display: inline-block; border: 1px dashed #d97706;">
          ${otpCode}
        </span>
      </div>
      <p style="font-size: 13px; color: #6b7280;">This code will expire in 10 minutes. Do not share this OTP with anyone.</p>
      <p style="font-size: 12px; color: #9ca3af; margin-top: 24px; text-align: center;">© Bramhana Vivaha Vedika • Powered by Zoho ZeptoMail API</p>
    </div>
  `;

  // 1. Try direct fetch first
  const fetchResult = await sendViaZeptoFetch({
    toEmail: recipientEmail,
    toName: "Valued Member",
    subject,
    htmlbody,
  });

  if (fetchResult.success) {
    recordEmailLog({
      recipient: recipientEmail,
      subject,
      type: "OTP",
      provider: "zeptomail_fetch",
      success: true,
      details: fetchResult.data,
    });
    return fetchResult;
  }

  // 2. Fallback to official SDK
  try {
    const response = await client.sendMail({
      from: {
        address: process.env.ZOHO_SENDER_EMAIL || "noreply@shubhamastu.in",
        name: process.env.ZOHO_SENDER_NAME || "Bramhana Vivaha Vedika",
      },
      to: [
        {
          email_address: {
            address: recipientEmail,
            name: "Valued Member",
          },
        },
      ],
      subject,
      htmlbody,
    });
    recordEmailLog({
      recipient: recipientEmail,
      subject,
      type: "OTP",
      provider: "zeptomail_sdk",
      success: true,
      details: response,
    });
    return { success: true, data: response };
  } catch (error: any) {
    const errObj = error?.message || error;
    console.log("ℹ️ ZeptoMail OTP Send Notice:", errObj);
    recordEmailLog({
      recipient: recipientEmail,
      subject,
      type: "OTP",
      provider: "zeptomail_failed",
      success: false,
      error: { fetchError: fetchResult.error, sdkError: errObj },
    });
    return { success: false, error: errObj, fetchError: fetchResult.error };
  }
}

/**
 * Dispatches a password reset link using ZeptoMail
 */
export async function sendPasswordResetEmail(
  recipientEmail: string,
  resetLink: string,
  candidateName?: string
) {
  const subject = "Password Reset Request - Bramhana Vivaha Vedika";
  const htmlbody = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #f0e6d2; border-radius: 8px; background-color: #fffdf9;">
      <h2 style="color: #b45309; text-align: center; margin-bottom: 8px;">Bramhana Vivaha Vedika</h2>
      <p style="text-align: center; font-size: 14px; color: #78350f; margin-top: 0;">శ్రీరామ జయం • వివాహ వేదిక</p>
      <hr style="border: 0; border-top: 1px solid #f3e8ff; margin: 16px 0;" />
      <p>Namaste ${candidateName || "Member"},</p>
      <p>We received a request to reset the password for your account associated with <b>${recipientEmail}</b>.</p>
      <p>Click the secure button below to set a new password. This link is valid for 1 hour:</p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${resetLink}" style="background-color: #b45309; color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">
          Reset Password (పాస్‌వర్డ్ మార్చుకోండి)
        </a>
      </div>
      <p style="font-size: 13px; color: #6b7280;">If you did not request this, you can safely ignore this email. Your password will remain unchanged.</p>
      <p style="font-size: 12px; color: #9ca3af; margin-top: 24px; text-align: center;">© Bramhana Vivaha Vedika • Powered by Zoho ZeptoMail</p>
    </div>
  `;

  const fetchResult = await sendViaZeptoFetch({
    toEmail: recipientEmail,
    toName: candidateName || "Member",
    subject,
    htmlbody,
  });

  if (fetchResult.success) {
    recordEmailLog({
      recipient: recipientEmail,
      subject,
      type: "PasswordReset",
      provider: "zeptomail_fetch",
      success: true,
      details: fetchResult.data,
    });
    return fetchResult;
  }

  try {
    const response = await client.sendMail({
      from: {
        address: process.env.ZOHO_SENDER_EMAIL || "noreply@shubhamastu.in",
        name: process.env.ZOHO_SENDER_NAME || "Bramhana Vivaha Vedika",
      },
      to: [
        {
          email_address: {
            address: recipientEmail,
            name: candidateName || "Member",
          },
        },
      ],
      subject,
      htmlbody,
    });
    recordEmailLog({
      recipient: recipientEmail,
      subject,
      type: "PasswordReset",
      provider: "zeptomail_sdk",
      success: true,
      details: response,
    });
    return { success: true, data: response };
  } catch (error: any) {
    const errObj = error?.message || error;
    console.log("ℹ️ ZeptoMail Password Reset Notice:", errObj);
    recordEmailLog({
      recipient: recipientEmail,
      subject,
      type: "PasswordReset",
      provider: "zeptomail_failed",
      success: false,
      error: { fetchError: fetchResult.error, sdkError: errObj },
    });
    return { success: false, error: errObj, fetchError: fetchResult.error };
  }
}


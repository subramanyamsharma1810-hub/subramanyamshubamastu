import { SendMailClient } from "zeptomail";

const url = "https://api.zeptomail.in/v1.1/email";

// Support ZEPTOMAIL_API_TOKEN as well as fallback env variables
const rawToken =
  process.env.ZEPTOMAIL_API_TOKEN ||
  process.env.ZOHO_ZEPTOMAIL_API_KEY ||
  "PHtE6r1bEL/uimYpoxMJsaLuFsXwZ40u/+luLAUR4opFCPJVHU0Ar919kDKz+BwqUPAXRaSfz4g7tLmf57mAJD25M2kdDmqyqK3sx/VYSPOZsbq6x00btF8ecUXeUoTtctBs1ibeu9rfNA==";

// Ensure token contains the required Zoho-enczapikey prefix expected by ZeptoMail API
const token = rawToken.toLowerCase().startsWith("zoho-enczapikey ")
  ? rawToken
  : `Zoho-enczapikey ${rawToken.trim()}`;

export const client = new SendMailClient({ url, token });

/**
 * Dispatches a 6/7-digit verification OTP to the recipient email using ZeptoMail
 */
export async function sendVerificationOtp(recipientEmail: string, otpCode: string | number) {
  try {
    const response = await client.sendMail({
      from: {
        address: "noreply@shubhamastu.in",
        name: "Shubhamastu.in",
      },
      to: [
        {
          email_address: {
            address: recipientEmail,
            name: "Valued Member",
          },
        },
      ],
      subject: `${otpCode} is your Shubhamastu.in verification code`,
      htmlbody: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #f0e6d2; border-radius: 8px;">
          <h2 style="color: #b45309; text-align: center;">Shubhamastu.in</h2>
          <p>Namaste,</p>
          <p>Please use the following One-Time Password (OTP) to complete your verification:</p>
          <div style="text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1f2937; background-color: #fef3c7; padding: 8px 18px; border-radius: 6px; display: inline-block;">
              ${otpCode}
            </span>
          </div>
          <p style="font-size: 13px; color: #6b7280;">This code will expire in 10 minutes. Do not share this OTP with anyone.</p>
        </div>
      `,
    });
    return { success: true, data: response };
  } catch (error) {
    console.error("ZeptoMail OTP Send Error:", error);
    return { success: false, error };
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
  try {
    const response = await client.sendMail({
      from: {
        address: "noreply@shubhamastu.in",
        name: "Shubhamastu.in",
      },
      to: [
        {
          email_address: {
            address: recipientEmail,
            name: candidateName || "Member",
          },
        },
      ],
      subject: "Password Reset Request - Shubhamastu.in",
      htmlbody: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #f0e6d2; border-radius: 8px;">
          <h2 style="color: #b45309; text-align: center;">Shubhamastu.in</h2>
          <p>Namaste ${candidateName || "Member"},</p>
          <p>We received a request to reset the password for your account associated with <b>${recipientEmail}</b>.</p>
          <p>Click the secure button below to set a new password. This link is valid for 1 hour:</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${resetLink}" style="background-color: #b45309; color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">
              Reset Password (పాస్‌వర్డ్ మార్చుకోండి)
            </a>
          </div>
          <p style="font-size: 13px; color: #6b7280;">If you did not request this, you can safely ignore this email. Your password will remain unchanged.</p>
        </div>
      `,
    });
    return { success: true, data: response };
  } catch (error) {
    console.error("ZeptoMail Password Reset Error:", error);
    return { success: false, error };
  }
}

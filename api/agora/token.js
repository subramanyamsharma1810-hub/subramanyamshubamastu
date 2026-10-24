import pkg from 'agora-token';
const { RtcTokenBuilder, RtcRole } = pkg;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { channelName, uid, role } = req.body || {};
    if (!channelName) {
      return res.status(400).json({ success: false, message: "channelName is required" });
    }

    const appID = process.env.AGORA_APP_ID || "";
    const appCertificate = process.env.AGORA_APP_CERTIFICATE || "";
    if (!appID || !appCertificate) {
      return res.status(200).json({ success: true, token: "mock_token_agora_configured", uid: uid || 12345 });
    }
    const numericUid = uid || Math.floor(Math.random() * 100000);
    const rtcRole = role === "publisher" ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
      appID,
      appCertificate,
      channelName,
      numericUid,
      rtcRole,
      privilegeExpiredTs,
      privilegeExpiredTs
    );

    return res.status(200).json({ success: true, token, uid: numericUid });
  } catch (error) {
    console.error("Error generating Agora token:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to generate token" });
  }
}

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

    const appID = process.env.AGORA_APP_ID || "58b929a373224fd693defde48656648b";
    const appCertificate = process.env.AGORA_APP_CERTIFICATE || "906f53f47a0247e394fd3ca70cb29ce9";
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

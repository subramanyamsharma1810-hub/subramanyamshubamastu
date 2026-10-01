export default async function handler(req, res) {
  // 1. Handle CORS (Allow browser requests)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { callerId, callerName, receiverId, callType } = req.body || {};

    // Generate a unique room ID for Agora
    const channelName = `shubh_room_${Date.now()}`;
    const callSessionId = channelName;

    return res.status(200).json({
      success: true,
      channelName,
      callSessionId,
      session: {
        callSessionId,
        channelName,
        callerId,
        receiverId,
        callType: callType || "video",
        status: "RINGING",
        createdAt: Date.now()
      },
      message: "Call initiated successfully"
    });
  } catch (error) {
    console.error("Call error:", error);
    return res.status(500).json({ error: "Failed to process call request" });
  }
}

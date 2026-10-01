export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { callSessionId, userId, action } = req.body || {};
    if (!callSessionId || !userId || !action) {
      return res.status(400).json({ success: false, message: "callSessionId, userId, and action are required" });
    }

    return res.status(200).json({
      success: true,
      session: {
        callSessionId,
        status: action === 'ACCEPT' ? 'ACTIVE' : 'DECLINED',
        connectedPeerId: userId
      }
    });
  } catch (error) {
    console.error("Call respond API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

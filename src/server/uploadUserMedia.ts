import { randomUUID } from "node:crypto";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import firebaseConfig from "../../firebase-applet-config.json" with { type: "json" };

function getBucketName() {
  return process.env.CLOUDFLARE_R2_MEDIA_BUCKET_NAME
    || process.env.CLOUDFLARE_R2_BUCKET_NAME
    || "shubhamastu-user-media";
}

function getClient() {
  return new S3Client({
    region: "auto",
    endpoint: process.env.CLOUDFLARE_R2_ENDPOINT || "",
    credentials: {
      accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || ""
    }
  });
}

function safeSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 128) || "unknown";
}

export async function verifyFirebaseToken(authorizationHeader: string | undefined) {
  const token = authorizationHeader?.startsWith("Bearer ")
    ? authorizationHeader.slice("Bearer ".length).trim()
    : "";
  if (!token) return null;

  const apiKey = process.env.FIREBASE_API_KEY || firebaseConfig.apiKey;
  if (!apiKey) return null;

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ idToken: token })
    }
  );
  if (!response.ok) return null;

  const payload = await response.json() as { users?: Array<{ localId?: string }> };
  const uid = payload.users?.[0]?.localId;
  return uid ? { uid } : null;
}

export async function uploadUserMedia(
  userId: string,
  fileBuffer: Buffer,
  contentType: string,
  kind: "photo" | "kundali"
) {
  const fileKey = `private-media/${safeSegment(userId)}/${kind}/${randomUUID()}`;
  const client = getClient();

  await client.send(new PutObjectCommand({
    Bucket: getBucketName(),
    Key: fileKey,
    Body: fileBuffer,
    ContentType: contentType,
    CacheControl: "private, max-age=300",
    Metadata: { ownerId: userId, mediaKind: kind }
  }));

  return {
    mediaKey: fileKey,
    url: await getUserMediaUrl(fileKey)
  };
}

export async function getUserMediaUrl(mediaKey: string, expiresInSeconds = 900) {
  if (!mediaKey.startsWith("private-media/")) {
    throw new Error("Invalid private media key");
  }

  return getSignedUrl(
    getClient(),
    new GetObjectCommand({ Bucket: getBucketName(), Key: mediaKey }),
    { expiresIn: expiresInSeconds }
  );
}

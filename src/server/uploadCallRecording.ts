import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Singleton S3 Client initialized with Cloudflare R2 Credentials
function getR2Client() {
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || "490939d2e2ba22c6329dc85cbf363ca2";
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "0611e270af2dcac9bf26f85cc533fdb640b7bdc8b649617d504c9deff1bf7f9f";
  const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT || "https://32b3e56224ba3dca35f04eae6392e78a.r2.cloudflarestorage.com";

  return new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey
    }
  });
}

const DEFAULT_BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME || "shubhamastu-call-recordings";

export interface UploadRecordingOptions {
  fileName: string;
  fileBuffer: Buffer | Uint8Array;
  contentType?: string; // e.g. 'audio/mpeg', 'audio/aac', 'video/mp4', 'audio/webm'
  metadata?: Record<string, string>; // e.g. { callerId, receiverId, callSessionId }
  bucketName?: string;
}

export interface UploadRecordingResult {
  success: boolean;
  fileKey: string;
  bucketName: string;
  sizeBytes: number;
  contentType: string;
  playbackUrl?: string;
  uploadedAt: string;
  error?: string;
}

/**
 * Uploads audio/video call recording blobs directly to Cloudflare R2 bucket.
 */
export async function uploadCallRecording(options: UploadRecordingOptions): Promise<UploadRecordingResult> {
  const s3 = getR2Client();
  const bucket = options.bucketName || DEFAULT_BUCKET;
  const contentType = options.contentType || (options.fileName.endsWith(".mp4") ? "video/mp4" : "audio/mpeg");
  
  // Clean file key path
  const fileKey = options.fileName.startsWith("recordings/") ? options.fileName : `recordings/${options.fileName}`;

  try {
    const putCmd = new PutObjectCommand({
      Bucket: bucket,
      Key: fileKey,
      Body: options.fileBuffer,
      ContentType: contentType,
      Metadata: options.metadata || {}
    });

    await s3.send(putCmd);

    // Generate a secure 7-day presigned playback URL for app streaming
    let playbackUrl: string | undefined;
    try {
      playbackUrl = await getPresignedRecordingUrl(fileKey, 604800, bucket);
    } catch (urlErr) {
      console.warn("Could not generate presigned URL immediately:", urlErr);
    }

    return {
      success: true,
      fileKey,
      bucketName: bucket,
      sizeBytes: options.fileBuffer.length,
      contentType,
      playbackUrl,
      uploadedAt: new Date().toISOString()
    };
  } catch (err: any) {
    console.error("❌ Failed to upload call recording to Cloudflare R2:", err);
    return {
      success: false,
      fileKey,
      bucketName: bucket,
      sizeBytes: options.fileBuffer.length,
      contentType,
      uploadedAt: new Date().toISOString(),
      error: err.message || "Unknown error during R2 upload"
    };
  }
}

/**
 * Generates a secure, temporary streaming/playback URL for a call recording file.
 */
export async function getPresignedRecordingUrl(fileKey: string, expiresInSeconds: number = 3600, bucketName?: string): Promise<string> {
  const s3 = getR2Client();
  const bucket = bucketName || DEFAULT_BUCKET;
  
  const getCmd = new GetObjectCommand({
    Bucket: bucket,
    Key: fileKey
  });

  return await getSignedUrl(s3, getCmd, { expiresIn: expiresInSeconds });
}

/**
 * Checks if a recording file exists in Cloudflare R2.
 */
export async function checkRecordingExists(fileKey: string, bucketName?: string): Promise<boolean> {
  const s3 = getR2Client();
  const bucket = bucketName || DEFAULT_BUCKET;

  try {
    const headCmd = new HeadObjectCommand({ Bucket: bucket, Key: fileKey });
    await s3.send(headCmd);
    return true;
  } catch {
    return false;
  }
}

/**
 * Lists all recorded call objects from the Cloudflare R2 bucket with presigned playback URLs.
 */
export async function listCallRecordings(prefix: string = "recordings/", bucketName?: string) {
  const s3 = getR2Client();
  const bucket = bucketName || DEFAULT_BUCKET;

  try {
    const listCmd = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix
    });

    const response = await s3.send(listCmd);
    const contents = response.Contents || [];

    const items = await Promise.all(
      contents.map(async (item) => {
        const fileKey = item.Key || "";
        let playbackUrl = "";
        try {
          playbackUrl = await getPresignedRecordingUrl(fileKey, 7200, bucket);
        } catch {
          playbackUrl = "";
        }

        return {
          key: fileKey,
          fileName: fileKey.replace(/^recordings\//, ""),
          sizeBytes: item.Size || 0,
          lastModified: item.LastModified?.toISOString() || new Date().toISOString(),
          playbackUrl
        };
      })
    );

    return {
      success: true,
      bucketName: bucket,
      recordingsCount: items.length,
      recordings: items.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
    };
  } catch (err: any) {
    console.error("❌ Failed to list call recordings from Cloudflare R2:", err);
    return {
      success: false,
      bucketName: bucket,
      recordingsCount: 0,
      recordings: [],
      error: err.message
    };
  }
}

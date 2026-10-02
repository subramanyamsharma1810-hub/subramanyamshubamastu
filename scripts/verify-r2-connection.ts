import { S3Client, ListObjectsV2Command, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || "490939d2e2ba22c6329dc85cbf363ca2";
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "0611e270af2dcac9bf26f85cc533fdb640b7bdc8b649617d504c9deff1bf7f9f";
const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT || "https://32b3e56224ba3dca35f04eae6392e78a.r2.cloudflarestorage.com";
const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || "shubhamastu-call-recordings";
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || "32b3e56224ba3dca35f04eae6392e78a";

export async function testR2Connectivity() {
  console.log("🔍 Starting Cloudflare R2 Connectivity & Permission Diagnostic...");
  console.log(`📌 Account ID: ${accountId}`);
  console.log(`📌 Bucket Name: ${bucketName}`);
  console.log(`📌 Endpoint: ${endpoint}`);

  const s3 = new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey
    }
  });

  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    accountId,
    bucketName,
    endpoint,
    tests: {}
  };

  // 1. Test Listing Objects in Bucket
  try {
    console.log("\n1️⃣ Testing ListObjectsV2 on bucket...");
    const listCmd = new ListObjectsV2Command({ Bucket: bucketName, MaxKeys: 5 });
    const listRes = await s3.send(listCmd);
    const objectCount = listRes.Contents ? listRes.Contents.length : 0;
    console.log(`✅ ListObjectsV2 succeeded! Objects in bucket: ${objectCount}`);
    results.tests.listObjects = {
      success: true,
      objectCount,
      objectsSample: listRes.Contents?.map(o => o.Key) || []
    };
  } catch (err: any) {
    console.error(`❌ ListObjectsV2 failed: ${err.message}`);
    results.tests.listObjects = {
      success: false,
      error: err.message,
      code: err.name
    };
  }

  // 2. Test Writing a Test Health Check File (Write Permission Check for Call Recording)
  const testKey = `diagnostics/healthcheck_${Date.now()}.json`;
  try {
    console.log(`\n2️⃣ Testing PutObject (Write Permission) with key: ${testKey}...`);
    const putCmd = new PutObjectCommand({
      Bucket: bucketName,
      Key: testKey,
      Body: JSON.stringify({
        status: "healthy",
        system: "Shubhamastu Call Recording Engine",
        testedAt: new Date().toISOString()
      }),
      ContentType: "application/json"
    });
    await s3.send(putCmd);
    console.log(`✅ PutObject succeeded! Test recording healthfile created.`);
    results.tests.putObject = {
      success: true,
      key: testKey
    };

    // 3. Clean up diagnostic file
    try {
      const delCmd = new DeleteObjectCommand({ Bucket: bucketName, Key: testKey });
      await s3.send(delCmd);
      console.log(`✅ DeleteObject cleanup succeeded!`);
      results.tests.deleteObject = { success: true };
    } catch (delErr: any) {
      console.warn(`⚠️ Cleanup DeleteObject failed: ${delErr.message}`);
      results.tests.deleteObject = { success: false, error: delErr.message };
    }
  } catch (err: any) {
    console.error(`❌ PutObject failed: ${err.message}`);
    results.tests.putObject = {
      success: false,
      error: err.message,
      code: err.name
    };
  }

  const overallSuccess = results.tests.listObjects?.success && results.tests.putObject?.success;
  results.overallStatus = overallSuccess ? "PASSED" : "FAILED";

  console.log(`\n========================================`);
  console.log(`🎯 OVERALL R2 DIAGNOSTIC RESULT: ${results.overallStatus}`);
  console.log(`========================================\n`);

  return results;
}

// Allow direct execution via CLI (tsx scripts/verify-r2-connection.ts)
if (process.argv[1]?.endsWith("verify-r2-connection.ts") || process.argv[1]?.endsWith("verify-r2-connection.js")) {
  testR2Connectivity()
    .then(res => {
      console.log("Diagnostic Summary Output:\n", JSON.stringify(res, null, 2));
      process.exit(res.overallStatus === "PASSED" ? 0 : 1);
    })
    .catch(err => {
      console.error("Fatal diagnostic error:", err);
      process.exit(1);
    });
}

import { NextRequest, NextResponse } from "next/server";
import OSS from "ali-oss";

// OSS Client Configuration
const client = new OSS({
  // region: "oss-cn-beijing",
  endpoint: process.env.ALIYUN_OSS_ENDPOINT || "oss-cn-beijing.aliyuncs.com",
  accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID || "",
  accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET || "",
  bucket: process.env.ALIYUN_OSS_BUCKET || "sdafafsasgvagdfs",
  secure: true, // Use HTTPS
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string; // "avatar" or "cover"

    console.log("Upload request received:", {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      uploadType: type
    });

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Determine folder based on type
    let folder = "demowall/cover"; // Default to cover (product images)
    if (type === "avatar") {
      folder = "demowall/avatar";
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate safe filename
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "").substring(0, 50);
    const objectName = `${folder}/${timestamp}-${safeName}`;

    // Upload to OSS
    console.log(`Starting upload to OSS: ${objectName}`);
    try {
      const result = await client.put(objectName, buffer);
      console.log("Upload success:", result);
      
      // Return OSS URL
      // result.url might be http, ensure https if desired, or use standard format
      // The standard format is https://{bucket}.{endpoint}/{objectName}
      const fileUrl = result.url; // ali-oss returns the full URL
      
      return NextResponse.json({ url: fileUrl }, { status: 200 });
    } catch (ossError: any) {
      console.error("OSS Upload failed:", ossError);
      return NextResponse.json({ 
        error: "Upload to OSS failed", 
        details: ossError.message,
        code: ossError.code,
        requestId: ossError.requestId
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed", details: error.message }, { status: 500 });
  }
}

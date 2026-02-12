import OSS from "ali-oss";

// OSS Client Configuration
export const ossClient = new OSS({
  // region: "oss-cn-beijing",
  endpoint: process.env.ALIYUN_OSS_ENDPOINT || "oss-cn-beijing.aliyuncs.com",
  accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID || "",
  accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET || "",
  bucket: process.env.ALIYUN_OSS_BUCKET || "sdafafsasgvagdfs",
  secure: true, // Use HTTPS
});

/**
 * 从 OSS 删除文件
 * @param fileUrl 完整的文件 URL
 */
export async function deleteFileFromOSS(fileUrl: string) {
  if (!fileUrl) return;

  try {
    // 从 URL 中提取对象名称 (objectName)
    // URL 格式通常为: https://{bucket}.{endpoint}/{objectName}
    const urlObj = new URL(fileUrl);
    const pathname = urlObj.pathname;
    
    // pathname 开头会有 /，需要去掉
    const objectName = pathname.startsWith('/') ? pathname.slice(1) : pathname;

    console.log(`Deleting file from OSS: ${objectName}`);
    await ossClient.delete(objectName);
    console.log(`Successfully deleted: ${objectName}`);
  } catch (error) {
    console.error("Error deleting file from OSS:", error);
    // 不抛出错误，避免影响主流程
  }
}

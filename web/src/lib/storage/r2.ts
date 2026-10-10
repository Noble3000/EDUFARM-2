import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function r2() {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 is not configured (R2_ENDPOINT / keys missing)");
  }
  return new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export function bucket() {
  const b = process.env.R2_BUCKET;
  if (!b) throw new Error("R2_BUCKET is not set");
  return b;
}

/** Short-lived view URL (inline). Caller MUST check permission first. */
export async function presignedViewUrl(key: string, expiresIn = 120) {
  const url = await getSignedUrl(
    r2(),
    new GetObjectCommand({
      Bucket: bucket(),
      Key: key,
      ResponseContentDisposition: "inline",
    }),
    { expiresIn },
  );
  return url;
}

/** Short-lived download URL (attachment). Caller MUST check allow_download first. */
export async function presignedDownloadUrl(
  key: string,
  filename: string,
  expiresIn = 120,
) {
  const url = await getSignedUrl(
    r2(),
    new GetObjectCommand({
      Bucket: bucket(),
      Key: key,
      ResponseContentDisposition: `attachment; filename="${filename}"`,
    }),
    { expiresIn },
  );
  return url;
}

/** Short-lived upload URL for direct-to-R2 PUTs (MIME/size checked by caller). */
export async function presignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 300,
) {
  const url = await getSignedUrl(
    r2(),
    new PutObjectCommand({ Bucket: bucket(), Key: key, ContentType: contentType }),
    { expiresIn },
  );
  return url;
}

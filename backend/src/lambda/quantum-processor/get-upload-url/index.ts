import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { randomUUID } from 'crypto';

const s3 = new S3Client({});
const BUCKET = process.env.UPLOAD_BUCKET!;

export const handler: APIGatewayProxyHandler = async () => {
  const key = `uploads/${randomUUID()}.jpg`;
  const url = await getSignedUrl(s3, new PutObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn: 300 });
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ uploadUrl: url, key }),
  };
};

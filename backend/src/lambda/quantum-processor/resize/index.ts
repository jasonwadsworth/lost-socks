import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { updateStageStatus } from '../../../lib/dynamodb';
import { log } from '../../../lib/logger';

const s3 = new S3Client({});

interface Input { imageKey: string; bucket: string; metadata: { format: string } }

export const handler = async (input: Input) => {
  const { imageKey, bucket } = input;
  log('INFO', 'Resizing image', { imageKey });

  await updateStageStatus(imageKey, 'resize', 'IN_PROGRESS');

  const response = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: imageKey }));
  const buffer = Buffer.from(await response.Body!.transformToByteArray());

  const resized = await sharp(buffer).resize(1024, 768, { fit: 'inside' }).jpeg().toBuffer();
  const resizedKey = `processed/${imageKey.replace(/^.*\//, '')}/resized.jpg`;

  await s3.send(new PutObjectCommand({ Bucket: bucket, Key: resizedKey, Body: resized, ContentType: 'image/jpeg' }));
  await updateStageStatus(imageKey, 'resize', 'COMPLETED');
  log('INFO', 'Image resized', { imageKey, resizedKey });

  return { imageKey, bucket, resizedKey };
};

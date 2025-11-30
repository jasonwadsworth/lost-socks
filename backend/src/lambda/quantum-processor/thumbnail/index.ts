import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { updateStageStatus } from '../../../lib/dynamodb';
import { log } from '../../../lib/logger';

const s3 = new S3Client({});

interface Input { imageKey: string; bucket: string; metadata: { format: string } }

export const handler = async (input: Input) => {
  const { imageKey, bucket } = input;
  log('INFO', 'Generating thumbnail', { imageKey });

  await updateStageStatus(imageKey, 'thumbnail', 'IN_PROGRESS');

  const response = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: imageKey }));
  const buffer = Buffer.from(await response.Body!.transformToByteArray());

  const thumbnail = await sharp(buffer).resize(200, 200, { fit: 'cover' }).jpeg().toBuffer();
  const thumbnailKey = `processed/${imageKey.replace(/^.*\//, '')}/thumbnail.jpg`;

  await s3.send(new PutObjectCommand({ Bucket: bucket, Key: thumbnailKey, Body: thumbnail, ContentType: 'image/jpeg' }));
  await updateStageStatus(imageKey, 'thumbnail', 'COMPLETED');
  log('INFO', 'Thumbnail generated', { imageKey, thumbnailKey });

  return { imageKey, bucket, thumbnailKey };
};

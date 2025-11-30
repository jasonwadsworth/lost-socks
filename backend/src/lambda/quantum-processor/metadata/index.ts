import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { updateStageStatus } from '../../../lib/dynamodb';
import { log } from '../../../lib/logger';

const s3 = new S3Client({});

interface Input { imageKey: string; bucket: string; format: string }

export const handler = async (input: Input) => {
  const { imageKey, bucket } = input;
  log('INFO', 'Extracting metadata', { imageKey });

  await updateStageStatus(imageKey, 'metadata', 'IN_PROGRESS');

  const response = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: imageKey }));
  const buffer = Buffer.from(await response.Body!.transformToByteArray());
  const metadata = await sharp(buffer).metadata();

  const result = {
    width: metadata.width!,
    height: metadata.height!,
    format: metadata.format!,
    space: metadata.space,
    channels: metadata.channels,
    hasAlpha: metadata.hasAlpha,
  };

  await updateStageStatus(imageKey, 'metadata', 'COMPLETED', result);
  log('INFO', 'Metadata extracted', { imageKey, ...result });

  return { ...input, metadata: result };
};

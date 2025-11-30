import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { updateStageStatus, updateStatus } from '../../../lib/dynamodb';
import { log } from '../../../lib/logger';

const s3 = new S3Client({});

const MAGIC_BYTES: Record<string, number[]> = {
  jpeg: [0xFF, 0xD8, 0xFF],
  png: [0x89, 0x50, 0x4E, 0x47],
  gif: [0x47, 0x49, 0x46],
  webp: [0x52, 0x49, 0x46, 0x46],
};

interface Input { imageKey: string; bucket: string }

export const handler = async (input: Input) => {
  const { imageKey, bucket } = input;
  log('INFO', 'Validating image', { imageKey });

  await updateStageStatus(imageKey, 'validation', 'IN_PROGRESS');

  const response = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: imageKey, Range: 'bytes=0-11' }));
  const bytes = await response.Body!.transformToByteArray();

  for (const [format, magic] of Object.entries(MAGIC_BYTES)) {
    if (magic.every((b, i) => bytes[i] === b || (format === 'webp' && i >= 4))) {
      if (format === 'webp' && bytes[8] !== 0x57) continue;
      await updateStageStatus(imageKey, 'validation', 'COMPLETED');
      log('INFO', 'Validation passed', { imageKey, format });
      return { ...input, valid: true, format };
    }
  }

  await updateStageStatus(imageKey, 'validation', 'FAILED', { errorMessage: 'Invalid image format' });
  await updateStatus(imageKey, 'REJECTED', { errorMessage: 'Invalid image format' });
  throw new Error('InvalidImageError: Not a valid image format');
};

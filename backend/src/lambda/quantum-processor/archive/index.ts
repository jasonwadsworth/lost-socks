import { S3Client, CopyObjectCommand } from '@aws-sdk/client-s3';
import { updateStageStatus, updateStatus } from '../../../lib/dynamodb';
import { log } from '../../../lib/logger';

const s3 = new S3Client({});
const ARCHIVE_BUCKET = process.env.ARCHIVE_BUCKET!;

interface ParallelOutput { imageKey: string; bucket: string; resizedKey?: string; thumbnailKey?: string }

export const handler = async (input: ParallelOutput[]) => {
  const { imageKey, bucket } = input[0];
  const resizedKey = input.find(i => i.resizedKey)?.resizedKey;
  const thumbnailKey = input.find(i => i.thumbnailKey)?.thumbnailKey;

  log('INFO', 'Archiving image', { imageKey });
  await updateStageStatus(imageKey, 'archive', 'IN_PROGRESS');

  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '/');
  const baseName = imageKey.replace(/^.*\//, '').replace(/\.[^.]+$/, '');
  const archivePath = `archive/${date}/${baseName}`;

  const copies = [
    { src: `${bucket}/${imageKey}`, dest: `${archivePath}/original.jpg` },
    resizedKey && { src: `${bucket}/${resizedKey}`, dest: `${archivePath}/resized.jpg` },
    thumbnailKey && { src: `${bucket}/${thumbnailKey}`, dest: `${archivePath}/thumbnail.jpg` },
  ].filter(Boolean) as { src: string; dest: string }[];

  await Promise.all(copies.map(({ src, dest }) =>
    s3.send(new CopyObjectCommand({ Bucket: ARCHIVE_BUCKET, CopySource: src, Key: dest }))
  ));

  const archivedLocation = `s3://${ARCHIVE_BUCKET}/${archivePath}/`;
  await updateStageStatus(imageKey, 'archive', 'COMPLETED');
  await updateStatus(imageKey, 'COMPLETED', { archivedLocation });
  log('INFO', 'Image archived', { imageKey, archivedLocation });

  return { imageKey, archivedLocation, status: 'COMPLETED' };
};

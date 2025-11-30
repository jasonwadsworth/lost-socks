import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.METADATA_TABLE || "ImageMetadata";

export interface StageInfo {
  status: "IN_PROGRESS" | "COMPLETED" | "FAILED";
  timestamp: string;
  errorMessage?: string;
  width?: number;
  height?: number;
  format?: string;
}

export interface ImageMetadata {
  imageKey: string;
  uploadTimestamp: string;
  status: "UPLOADED" | "PROCESSING" | "COMPLETED" | "FAILED" | "REJECTED";
  contentType: string;
  size: number;
  stages: Record<string, StageInfo>;
  archivedLocation?: string;
  errorMessage?: string;
}

export async function getByImageKey(imageKey: string): Promise<ImageMetadata | null> {
  const result = await docClient.send(
    new GetCommand({ TableName: TABLE_NAME, Key: { imageKey } })
  );
  return (result.Item as ImageMetadata) || null;
}

export async function queryByStatus(
  status: string,
  startDate?: string,
  endDate?: string
): Promise<ImageMetadata[]> {
  let keyCondition = "status = :status";
  const expressionValues: Record<string, string> = { ":status": status };

  if (startDate && endDate) {
    keyCondition += " AND uploadTimestamp BETWEEN :start AND :end";
    expressionValues[":start"] = startDate;
    expressionValues[":end"] = endDate;
  } else if (startDate) {
    keyCondition += " AND uploadTimestamp >= :start";
    expressionValues[":start"] = startDate;
  } else if (endDate) {
    keyCondition += " AND uploadTimestamp <= :end";
    expressionValues[":end"] = endDate;
  }

  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "status-uploadTimestamp-index",
      KeyConditionExpression: keyCondition,
      ExpressionAttributeValues: expressionValues,
    })
  );
  return (result.Items as ImageMetadata[]) || [];
}

export async function queryByDateRange(
  startDate: string,
  endDate: string
): Promise<ImageMetadata[]> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "uploadTimestamp BETWEEN :start AND :end",
      ExpressionAttributeValues: { ":start": startDate, ":end": endDate },
    })
  );
  return (result.Items as ImageMetadata[]) || [];
}

export async function updateStageStatus(
  imageKey: string,
  stage: string,
  status: string
): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { imageKey },
      UpdateExpression: "SET stages.#stage = :stageInfo",
      ExpressionAttributeNames: { "#stage": stage },
      ExpressionAttributeValues: {
        ":stageInfo": { status, timestamp: new Date().toISOString() },
      },
    })
  );
}

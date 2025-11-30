# Data & API Engineer Tasks

## Completed Work

### Task 2.3: DynamoDB Metadata Table - **DONE** (by backend-engineer)
Backend-engineer created the table inline in `lib/quantum-image-processor-stack.ts`:
- Table: `ImageMetadata` with `imageKey` partition key
- GSI: `status-uploadTimestamp-index` (PK: status, SK: uploadTimestamp)
- Billing: PAY_PER_REQUEST
- Point-in-time recovery: enabled

### Task 12.1: Query Utilities - **DONE**
Created `backend/src/lib/metadata-queries.ts`:
- `getByImageKey(imageKey)` - Get single item by key
- `queryByStatus(status, startDate?, endDate?)` - Query GSI with optional date range
- `queryByDateRange(startDate, endDate)` - Scan with date filter
- `updateStageStatus(imageKey, stage, status)` - Update stage info

Uses `METADATA_TABLE` env var (defaults to "ImageMetadata").

## Notes
Removed `lib/constructs/data-construct.ts` as backend-engineer already created the table inline in the main stack.

# Quantum Image Processor Architecture

> An enterprise-grade, cloud-native, serverless image processing platform that transforms the simple act of uploading an image into a sophisticated, multi-stage, event-driven workflow.

## Architecture Diagram

```mermaid
flowchart TB
    subgraph Client["👤 Client"]
        User[User]
    end

    subgraph API["🌐 API Gateway"]
        APIGW[REST API]
        CognitoAuth[Cognito Authorizer]
    end

    subgraph Storage["📦 S3 Storage"]
        UploadBucket[(Upload Bucket)]
        ArchiveBucket[(Archive Bucket)]
    end

    subgraph Events["📡 Event Routing"]
        EventBridge[EventBridge Rule]
        SQS[(Processing Queue)]
        DLQ[(Dead Letter Queue)]
        SNS[SNS Topic]
    end

    subgraph Database["🗄️ Database"]
        DynamoDB[(Metadata Table)]
    end

    subgraph Lambda["⚡ Lambda Functions"]
        GetUploadUrl[Get Upload URL]
        SQSTrigger[SQS Trigger]
        Validate[Validate Image]
        Metadata[Extract Metadata]
        Resize[Resize Image]
        Thumbnail[Generate Thumbnail]
        Archive[Archive Image]
    end

    subgraph StepFunctions["🔄 Step Functions"]
        StateMachine[Processing Pipeline]
    end

    subgraph Layers["📚 Lambda Layers"]
        SharpLayer[Sharp Layer]
    end

    %% Client Flow
    User -->|1. GET /upload-url| APIGW
    APIGW --> CognitoAuth
    CognitoAuth --> GetUploadUrl
    GetUploadUrl -->|Pre-signed URL| User
    User -->|2. PUT image| UploadBucket

    %% Event Flow
    UploadBucket -->|Object Created| EventBridge
    EventBridge -->|Route Event| SQS
    SQS -->|Trigger| SQSTrigger
    SQSTrigger -->|Start Execution| StateMachine

    %% Step Functions Pipeline
    StateMachine -->|Step 1| Validate
    StateMachine -->|Step 2| Metadata
    StateMachine -->|Step 3a| Resize
    StateMachine -->|Step 3b| Thumbnail
    StateMachine -->|Step 4| Archive

    %% Lambda Dependencies
    Metadata -.->|Uses| SharpLayer
    Resize -.->|Uses| SharpLayer
    Thumbnail -.->|Uses| SharpLayer

    %% Data Access
    Validate -->|Read| UploadBucket
    Metadata -->|Read| UploadBucket
    Resize -->|Read| UploadBucket
    Thumbnail -->|Read| UploadBucket
    Archive -->|Read/Write| UploadBucket
    Archive -->|Write| ArchiveBucket

    %% Metadata Updates
    Validate -->|Update Status| DynamoDB
    Metadata -->|Update Status| DynamoDB
    Resize -->|Update Status| DynamoDB
    Thumbnail -->|Update Status| DynamoDB
    Archive -->|Update Status| DynamoDB

    %% Notifications
    StateMachine -->|Success/Failure| SNS
    SQS -->|Failed Messages| DLQ

    %% Styling
    classDef aws fill:#FF9900,stroke:#232F3E,color:#232F3E
    classDef storage fill:#3F8624,stroke:#232F3E,color:white
    classDef compute fill:#D86613,stroke:#232F3E,color:white
    classDef database fill:#3B48CC,stroke:#232F3E,color:white
    classDef messaging fill:#B0084D,stroke:#232F3E,color:white
    
    class APIGW,CognitoAuth aws
    class UploadBucket,ArchiveBucket storage
    class GetUploadUrl,SQSTrigger,Validate,Metadata,Resize,Thumbnail,Archive,SharpLayer compute
    class DynamoDB database
    class EventBridge,SQS,DLQ,SNS,StateMachine messaging
```

## Processing Pipeline Flow

```mermaid
stateDiagram-v2
    [*] --> ValidateImage: Start
    
    ValidateImage --> ExtractMetadata: Valid
    ValidateImage --> HandleError: Invalid
    
    ExtractMetadata --> ParallelProcessing: Success
    ExtractMetadata --> HandleError: Failure
    
    state ParallelProcessing {
        [*] --> ResizeImage
        [*] --> GenerateThumbnail
        ResizeImage --> [*]
        GenerateThumbnail --> [*]
    }
    
    ParallelProcessing --> ArchiveImage: Both Complete
    ParallelProcessing --> HandleError: Failure
    
    ArchiveImage --> PublishSuccess: Success
    ArchiveImage --> HandleError: Failure
    
    PublishSuccess --> [*]: Complete
    HandleError --> [*]: Notify & End
```

## Component Summary

| Component | AWS Service | Purpose |
|-----------|-------------|---------|
| Upload Bucket | S3 | Receives uploaded images |
| Archive Bucket | S3 | Long-term storage for processed images |
| Metadata Table | DynamoDB | Tracks image processing state |
| Processing Queue | SQS | Buffers processing requests |
| Dead Letter Queue | SQS | Captures failed messages |
| Notification Topic | SNS | Broadcasts processing status |
| Processing Pipeline | Step Functions | Orchestrates Lambda functions |
| Event Rule | EventBridge | Routes S3 events to SQS |
| REST API | API Gateway | Provides upload URL endpoint |
| Authorizer | Cognito | Authenticates API requests |
| Lambda Functions | Lambda | Performs atomic processing operations |
| Sharp Layer | Lambda Layer | Image processing library |

## Data Flow

1. **Upload Request**: Client requests pre-signed URL via API Gateway
2. **Image Upload**: Client uploads image directly to S3 using pre-signed URL
3. **Event Trigger**: S3 emits ObjectCreated event to EventBridge
4. **Queue Processing**: EventBridge routes event to SQS queue
5. **Pipeline Start**: SQS triggers Lambda which starts Step Functions
6. **Validation**: Validate image format and create metadata record
7. **Metadata Extraction**: Extract EXIF data and image properties
8. **Parallel Processing**: Resize image and generate thumbnail concurrently
9. **Archive**: Copy processed image to archive bucket
10. **Notification**: Publish success/failure notification via SNS

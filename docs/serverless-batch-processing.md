# Serverless Batch Processing Architecture

This document describes the serverless batch processing architecture implemented to handle long-running batch processes within the constraints of Vercel's 60-second serverless function execution limit.

## Overview

The batch processing system has been redesigned to operate as a series of independent serverless functions, each handling a specific stage of the processing pipeline. This ensures that no single function execution exceeds Vercel's time limit.

## Architecture Components

### 1. Database Tables

Two new tables have been added to the database:

#### `batch_processing_queue`
- Tracks the current processing stage and status for each batch
- Primary fields: batch_id, current_stage, status, error_message
- Status values: 'pending', 'in_progress', 'failed'

#### `batch_processing_data`
- Stores intermediate results between processing stages
- Primary fields: batch_id, stage, data (JSONB)
- Each stage stores its output here for the next stage to pick up

### 2. Processing Stages

The batch processing workflow has been divided into the following stages:

1. **Setup**: Load screenshots, process signed URLs, fetch screenshot buffers
2. **Extraction**: AI Component/Element/Anchor extraction
3. **Annotation**: Moondream detection
4. **Validation**: Accuracy validation
5. **Metadata**: Metadata extraction
6. **Persistence**: Save results to database
7. **Completed**: Final state indicating successful completion
8. **Failed**: Error state if any stage fails

### 3. API Endpoints

Each stage has a dedicated API endpoint:

- `POST /api/batch-processing/setup`
- `POST /api/batch-processing/extraction`
- `POST /api/batch-processing/annotation`
- `POST /api/batch-processing/validation`
- `POST /api/batch-processing/metadata`
- `POST /api/batch-processing/persistence`

The original entry point remains:
- `POST /api/process-batch` - Initializes the job queue and triggers the first stage

### 4. Workflow

1. Client initiates processing by calling `/api/process-batch` with a batch ID
2. The API adds a new job to the `batch_processing_queue` table and triggers the first stage
3. Each stage:
   - Retrieves necessary data from previous stages using the `batch_processing_data` table
   - Performs its processing tasks
   - Stores its results in the `batch_processing_data` table
   - Updates the `batch_processing_queue` table to advance to the next stage
   - Triggers the next stage via an asynchronous API call

### 5. Error Handling

- Each stage includes error handling logic to mark the job as failed in case of errors
- The error message is stored in the `batch_processing_queue` table
- The batch status is also updated to 'failed' in the main batch table

### 6. Server-to-Server Communication

For server-to-server communication between stages, we use a specialized utility in `lib/apiUtils.ts`:

- `fireAndForgetApiCall()` - Makes asynchronous API calls without waiting for a response
- Automatically handles URL construction for different environments (development/production)
- Uses the correct fetch implementation (browser fetch or node-fetch) based on the environment

This approach ensures that each stage can trigger the next stage reliably, even across different serverless function executions.

#### Environment Variables

The system uses the following environment variables for API communication:

- `NEXT_PUBLIC_API_URL` - Primary base URL for API calls
- `VERCEL_URL` - Automatically provided by Vercel, used as fallback
- Development mode defaults to `http://localhost:3000` if neither is available

## SQL Schema

```sql
-- Table to track batch processing stages
CREATE TABLE batch_processing_queue (
  id BIGSERIAL PRIMARY KEY,
  batch_id BIGINT NOT NULL REFERENCES batch(batch_id),
  current_stage TEXT NOT NULL,
  status TEXT NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  
  CONSTRAINT unique_batch_id UNIQUE (batch_id)
);

CREATE INDEX idx_batch_processing_queue_batch_id ON batch_processing_queue(batch_id);

-- Table to store data between processing stages
CREATE TABLE batch_processing_data (
  id BIGSERIAL PRIMARY KEY,
  batch_id BIGINT NOT NULL,
  stage TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  
  CONSTRAINT unique_batch_stage UNIQUE (batch_id, stage)
);

CREATE INDEX idx_batch_processing_data_batch_id ON batch_processing_data(batch_id);
CREATE INDEX idx_batch_processing_data_stage ON batch_processing_data(stage);
```

## Important Considerations

1. **Data Size**: The JSONB column in `batch_processing_data` may need to handle large objects depending on the batch size. Consider implementing data chunking for very large batches.

2. **Timeouts**: Even with this architecture, individual stages may still timeout if they process too many items at once. Adjust the concurrency limits as needed.

3. **Monitoring**: Implement monitoring to detect stalled jobs where a stage might have failed without proper error handling.

4. **Retries**: Consider adding a retry mechanism for failed stages to increase robustness.

## Testing

A test script is provided in `scripts/test-batch-api.js` to verify that all API endpoints are functioning correctly:

```bash
# Run with a specific batch ID
node scripts/test-batch-api.js 123

# Or use the default batch ID (1)
node scripts/test-batch-api.js
``` 
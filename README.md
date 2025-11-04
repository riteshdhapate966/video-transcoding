# Video Converter API

A Node.js Express API service for handling multipart uploads to AWS S3, designed specifically for video file uploads with Redis integration for caching and session management. The service now includes asynchronous video transcoding to HLS format using Docker containers and Kafka for event-driven processing.

## Features

- **Multipart Upload Support**: Efficiently handle large video file uploads using AWS S3 multipart upload functionality
- **Signed URLs**: Generate pre-signed URLs for secure, time-limited upload access
- **Redis Integration**: Built-in Redis support for caching and session management
- **CORS Enabled**: Cross-origin resource sharing configured for web applications
- **Error Handling**: Comprehensive error handling with detailed error messages
- **Asynchronous Video Transcoding**: Automatic conversion of uploaded videos to HLS format in multiple resolutions (360p, 720p, 1080p) using Docker containers
- **Kafka Event-Driven Processing**: Uses Kafka for handling transcoding retries and success events
- **Docker Containerization**: Transcoding processes run in isolated Docker containers for scalability and reliability

## Tech Stack

- **Runtime**: Node.js with ES6 modules
- **Framework**: Express.js
- **Cloud Storage**: AWS S3 SDK v3
- **Caching**: Redis (ioredis)
- **Database**: MongoDB (via Mongoose - configured for future use)
- **Message Queue**: Kafka (kafkajs)
- **Video Processing**: FFmpeg
- **Containerization**: Docker
- **Other**: CORS, dotenv for environment management

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd video_converter
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:

```env
PORT=3000
S3_BUCKET=your-s3-bucket-name
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your-aws-access-key-id
S3_SECRET_ACCESS_KEY=your-aws-secret-access-key
REDIS_HOST=localhost
REDIS_PORT=6379
KAFKA_BROKER_URL=localhost:9092
```

4. Ensure Docker is installed and running on your system for video transcoding.

5. Set up Kafka broker and ensure it's accessible at the specified `KAFKA_BROKER_URL`.

## Usage

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

The server will start on the port specified in your `.env` file (default: 3000).

## API Endpoints

All endpoints are prefixed with `/api/v1/s3`.

### 1. Create Multipart Upload

**Endpoint**: `POST /api/v1/s3/create-multipart-upload`

Initiates a multipart upload to S3 and returns an upload ID.

**Request Body**:

```json
{
  "fileName": "video.mp4",
  "contentType": "video/mp4"
}
```

**Response**:

```json
{
  "uploadId": "example-upload-id",
  "key": "video.mp4",
  "bucket": "your-s3-bucket-name"
}
```

**Example**:

```bash
curl -X POST http://localhost:3000/api/v1/s3/create-multipart-upload \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "my-video.mp4",
    "contentType": "video/mp4"
  }'
```

### 2. Generate Upload URLs

**Endpoint**: `POST /api/v1/s3/generate-upload-urls`

Generates signed URLs for uploading individual parts of the multipart upload.

**Request Body**:

```json
{
  "key": "video.mp4",
  "uploadId": "example-upload-id",
  "partsCount": 3
}
```

**Response**:

```json
{
  "urls": [
    {
      "partNumber": 1,
      "url": "https://your-bucket.s3.amazonaws.com/video.mp4?partNumber=1&uploadId=example-upload-id&..."
    },
    {
      "partNumber": 2,
      "url": "https://your-bucket.s3.amazonaws.com/video.mp4?partNumber=2&uploadId=example-upload-id&..."
    },
    {
      "partNumber": 3,
      "url": "https://your-bucket.s3.amazonaws.com/video.mp4?partNumber=3&uploadId=example-upload-id&..."
    }
  ]
}
```

**Example**:

```bash
curl -X POST http://localhost:3000/api/v1/s3/generate-upload-urls \
  -H "Content-Type: application/json" \
  -d '{
    "key": "my-video.mp4",
    "uploadId": "your-upload-id",
    "partsCount": 5
  }'
```

### 3. Complete Multipart Upload

**Endpoint**: `POST /api/v1/s3/complete-multipart-upload`

Completes the multipart upload by combining all uploaded parts.

**Request Body**:

```json
{
  "key": "video.mp4",
  "uploadId": "example-upload-id",
  "parts": [
    {
      "ETag": "\"etag1\"",
      "PartNumber": 1
    },
    {
      "ETag": "\"etag2\"",
      "PartNumber": 2
    },
    {
      "ETag": "\"etag3\"",
      "PartNumber": 3
    }
  ]
}
```

**Response**:

```json
{
  "location": "https://your-bucket.s3.amazonaws.com/video.mp4"
}
```

**Example**:

```bash
curl -X POST http://localhost:3000/api/v1/s3/complete-multipart-upload \
  -H "Content-Type: application/json" \
  -d '{
    "key": "my-video.mp4",
    "uploadId": "your-upload-id",
    "parts": [
      {"ETag": "\"abc123\"", "PartNumber": 1},
      {"ETag": "\"def456\"", "PartNumber": 2}
    ]
  }'
```

### 4. Abort Multipart Upload

**Endpoint**: `POST /api/v1/s3/abort-multipart-upload`

Cancels an ongoing multipart upload and removes any uploaded parts.

**Request Body**:

```json
{
  "key": "video.mp4",
  "uploadId": "example-upload-id"
}
```

**Response**:

```json
{
  "message": "Multipart upload aborted successfully."
}
```

**Example**:

```bash
curl -X POST http://localhost:3000/api/v1/s3/abort-multipart-upload \
  -H "Content-Type: application/json" \
  -d '{
    "key": "my-video.mp4",
    "uploadId": "your-upload-id"
  }'
```

## Error Handling

All endpoints return errors in the following format:

```json
{
  "message": "Error description",
  "error": "Detailed error message"
}
```

Common HTTP status codes:

- `200`: Success
- `500`: Internal server error

## Project Structure

```
video_converter/
├── config/
│   ├── kafka.js          # Kafka configuration
│   ├── redis.js          # Redis configuration
│   └── s3Client.js       # AWS S3 client configuration
├── container/            # Docker container for video transcoding
│   ├── Dockerfile        # Docker image configuration
│   ├── hls.js            # Main transcoding script
│   ├── helper.js         # FFmpeg command helpers
│   ├── kafka/            # Kafka utilities for container
│   │   ├── kafka.js      # Kafka client configuration
│   │   └── producer.js   # Kafka message producers
│   ├── index.js          # Alternative transcoding script
│   ├── package.json      # Container dependencies
│   └── test.js           # Test script
├── controllers/
│   └── s3_controller.js  # S3 operation handlers
├── routes/
│   ├── index.js          # Main router
│   └── s3.js             # S3-specific routes
├── utils/                # Utility functions
│   ├── createKafkaTopics.js  # Kafka topic creation
│   ├── kafkaConsumers.js     # Kafka consumers for retries and success
│   └── runDockerContaner.js  # Docker container runner
├── index.js              # Application entry point
├── package.json          # Dependencies and scripts
└── README.md             # This file
```

## Video Transcoding Workflow

The service implements an asynchronous video transcoding pipeline:

1. **Upload Completion**: When a multipart upload is completed via the API, the service automatically triggers video transcoding.
2. **Docker Container Launch**: A Docker container is launched with the video key and environment variables for S3 and Kafka access.
3. **Video Download**: The container downloads the original video from S3.
4. **HLS Conversion**: FFmpeg is used to convert the video to HLS format in multiple resolutions (360p, 720p, 1080p).
5. **Output Upload**: Transcoded files and master playlist are uploaded back to S3 under the `__outputs/{key}/` prefix.
6. **Event Notification**: Success or retry events are sent via Kafka for monitoring and error handling.
7. **Retry Mechanism**: If transcoding fails, the system automatically retries up to 5 times with exponential backoff.

## Kafka Topics

- `video-transcoding-retry`: Handles retry events for failed transcoding attempts
- `video-transcoding-success-event`: Notifies successful transcoding completions

## Docker Image

The transcoding container uses a Node.js base image with FFmpeg installed. Build the image with:

```bash
cd container
docker build -t video-transcoding .
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

ISC License

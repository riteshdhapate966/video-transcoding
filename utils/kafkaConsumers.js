import kafka from "../config/kafka.js";
import { runDockerContainer } from "./runDockerContaner.js";

const VideoTranscodingRetryConsumer = kafka.consumer({
  groupId: "video-transcoding-service-retry-group",
});

const VideoTranscodingSuccessConsumer = kafka.consumer({
  groupId: "video-transcoding-service-success-group",
});

async function startConsumingVideoTranscodingRetry() {
  try {
    await VideoTranscodingRetryConsumer.connect();
    await VideoTranscodingRetryConsumer.subscribe({
      topic: "video-transcoding-retry",
      fromBeginning: true,
    });

    await VideoTranscodingRetryConsumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const key = message.key?.toString();
        const value = message.value?.toString();
        const offset = message.offset;

        console.log(
          `📩 [${topic}] Partition: ${partition}, Offset: ${offset}, Key: ${key}, Value: ${value}`
        );

        try {
          const parsedJson = JSON.parse(value);
          const video_key = parsedJson.data.key;
          const video_retry_count = parseInt(parsedJson.data.retryCount);

          console.log(parsedJson, video_key, video_retry_count);

          if (!video_retry_count || video_retry_count > 5) {
            console.log("video transcoding failed after 5 retries", key);
            return;
          }

          runDockerContainer(video_key, video_retry_count);
        } catch (err) {
          console.error("❌ Error processing message:", err);
        }
      },
    });
  } catch (error) {
    console.log("error occurred on starting kafka consumers", error);
  }
}

async function startConsumingVideoTranscodingSuccess() {
  try {
    await VideoTranscodingSuccessConsumer.connect();
    await VideoTranscodingSuccessConsumer.subscribe({
      topic: "video-transcoding-success-event",
      fromBeginning: true,
    });

    await VideoTranscodingSuccessConsumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const key = message.key?.toString();
        const value = message.value?.toString();
        const offset = message.offset;

        console.log(
          `📩 [${topic}] Partition: ${partition}, Offset: ${offset}, Key: ${key}, Value: ${value}`
        );

        try {
          // Process the message here
          // e.g., trigger video processing, update DB, etc.
        } catch (err) {
          console.error("❌ Error processing message:", err);
        }
      },
    });
  } catch (error) {
    console.log("error occurred on starting kafka consumers", error);
  }
}

export async function startKafkaConsumers() {
  try {
    await startConsumingVideoTranscodingRetry();
    await startConsumingVideoTranscodingSuccess();
  } catch (error) {
    console.log("error occurred on starting kafka consumers", error);
  }
}

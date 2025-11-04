import { exec } from "child_process";

const S3_REGION = process.env.S3_REGION;
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID;
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY;
const S3_BUCKET= process.env.S3_BUCKET;
const KAFKA_BROKER_URL = process.env.KAFKA_BROKER_URL;


function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runDockerContainer(KEY, VIDEO_RETRY_COUNT=0) {
  await sleep(60000);
  const dockerCmd = `docker run -d --rm -e S3_REGION=${S3_REGION}  -e S3_ACCESS_KEY_ID=${S3_ACCESS_KEY_ID} -e S3_SECRET_ACCESS_KEY=${S3_SECRET_ACCESS_KEY} -e BUCKET_NAME=${S3_BUCKET}  -e KEY=${KEY} -e KAFKA_BROKER_URL=${KAFKA_BROKER_URL} -e VIDEO_RETRY_COUNT=${VIDEO_RETRY_COUNT} --name ${KEY} video-transcoding`;

  console.log("🚀 Starting Docker container for video transcoding...");
  console.log("🚀 Docker command:", dockerCmd);

  exec(dockerCmd, (error, stdout, stderr) => {
    if (error) {
      console.error("❌ Docker run failed:", stderr || error.message);
    }
    console.log("✅ Docker container started successfully:", stdout.trim());
  });
}

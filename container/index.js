import {
  GetObjectCommand,
  S3Client,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import fs from "node:fs/promises";
import path from "node:path";
import ffmpeg from "fluent-ffmpeg";

console.log("Starting up...")

const S3_REGION = process.env.S3_REGION;
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID;
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY;
const BUCKET_NAME = process.env.BUCKET_NAME;
const KEY = process.env.KEY;

console.log(S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, BUCKET_NAME, KEY);

const RESOLUTIONS = [
  { name: "360p", width: 480, height: 360 },
  { name: "480p", width: 858, height: 480 },
  { name: "720p", width: 1280, height: 720 },
];

const s3Client = new S3Client({
  region: S3_REGION,
  credentials: {
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
  },
});

async function init() {
  // ensure local directories exist
  await fs.mkdir("videos", { recursive: true });
  await fs.mkdir("transcoded", { recursive: true });
  // download the original video

  console.log("Downloading original video...");

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: KEY,
  });

  const result = await s3Client.send(command);

  const originalFilePath = `videos/original-video.mp4`;

  await fs.writeFile(originalFilePath, result.Body);

  const originalVideoPath = path.resolve(originalFilePath);

  console.log("Video downloaded successfully.");

  // start the transcoding process

  const promises = RESOLUTIONS.map((resolution) => {
    const output = `transcoded/${resolution.name}.mp4`;
    return new Promise((resolve, reject) => {
      ffmpeg(originalVideoPath)
        .output(output)
        .withVideoCodec("libx264")
        .withAudioCodec("aac")
        .withSize(`${resolution.width}x${resolution.height}`)
        .on("end", async () => {
          console.log(`Transcoding ${resolution.name} complete.`);
          // upload the transcoded videos
          const fileBuffer = await fs.readFile(output);
          const putObjectCommand = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: `${KEY}/${output}`,
            Body: fileBuffer,
            ContentType: "video/mp4",
          });
          await s3Client.send(putObjectCommand);
          console.log("video transcoded and uploaded successfully", output);
          resolve(output);
        })
        .format("mp4")
        .run();
    });
  });
  await Promise.all(promises);
}

(async() => init())()


console.log("Transcoding and uploading completed successfully")
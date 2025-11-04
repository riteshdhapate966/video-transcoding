import {
  GetObjectCommand,
  S3Client,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import fsPromis from "node:fs/promises";
import fs from "node:fs";
import path, { dirname } from "node:path";
import ffmpeg from "fluent-ffmpeg";
import getDimensions from "get-video-width-height";
import { exec } from "child_process";
import mime from "mime-types";
import { fileURLToPath } from "url";
import { getFFmpegCommand } from "./helper.js";
import {sendRetryEvent,sendSuccessEvent} from "./kafka/producer.js";

console.log("Starting up...");

const S3_REGION = process.env.S3_REGION;
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID;
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY;
const BUCKET_NAME = process.env.BUCKET_NAME;
const KEY = process.env.KEY;
const VIDEO_RETRY_COUNT = process.env.VIDEO_RETRY_COUNT;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log(
  S3_REGION,
  S3_ACCESS_KEY_ID,
  S3_SECRET_ACCESS_KEY,
  BUCKET_NAME,
  KEY
);

const VIDEO_RETRY_BODY = {
  key: KEY,
  data: {
    key: KEY,
    retryCount: parseInt(VIDEO_RETRY_COUNT,6) + 1,
  },
};

const VIDEO_SUCCESS_BODY = {
  key: KEY,
  data: {
    key: KEY,
    retryCount: VIDEO_RETRY_COUNT,
    success:true
  },
};

const s3Client = new S3Client({
  region: S3_REGION,
  credentials: {
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
  },
});

// ############################ Download the original video start ################################
async function downloadOriginalVideo() {
  try {
    console.log(BUCKET_NAME, "---->", KEY);
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: KEY,
    });
    const result = await s3Client.send(command);
    const originalFilePath = `input.mp4`;
    await fsPromis.writeFile(originalFilePath, result.Body);
    const originalVideoPath = path.resolve(originalFilePath);
    console.log("Video downloaded -->", originalVideoPath);
  } catch (e) {
    console.log("Error downloading video", e);
    // TODO: send the event to retry queue
    await sendRetryEvent(VIDEO_RETRY_BODY);
    process.exit(1);
  }
}

// ################### Download the original video end ################################

// ################### get video Dimensions start ################################
async function getVideoDimensions(url) {
  const dimensions = await getDimensions(url);

  return {
    width: dimensions.width,
    height: dimensions.height,
  };
}
// ################### get video Dimensions end ################################

// ############## Function to run an FFmpeg command start ##########################
function runFFmpegCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return reject(error);
      }
      if (stderr) {
        console.error(`FFmpeg stderr: ${stderr}`);
      }
      console.log(stdout);
      resolve();
    });
  });
}
// ################## Function to run an FFmpeg command end ##########################

//##################### Function to convert a video to HLS in multiple resolutions start #######################
async function convertToHLS(inputFile) {
  const inputFilePath = path.resolve(inputFile);
  const outputDir = path.resolve("output");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const videoDimensions = await getVideoDimensions(inputFilePath);

  const videoHeight = videoDimensions.height;
  const videoWidth = videoDimensions.width;

  //  get ffmpeg command
  const commands = getFFmpegCommand(
    inputFilePath,
    outputDir,
    videoWidth,
    videoHeight
  );

  console.log(commands);

  // Function to create the master.m3u8 file
  async function createMasterPlaylist() {
    const masterPlaylistContent = `
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360
output_360p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720
output_720p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080
output_1080p.m3u8
`;

    await fsPromis.writeFile(
      path.join(outputDir, "master.m3u8"),
      masterPlaylistContent.trim()
    );
    console.log("master.m3u8 file created.");
  }

  // Execute FFmpeg commands in sequence
  async function runNextCommand(index) {
    if (index < commands.length) {
      console.log(`Running FFmpeg command for resolution index ${index}...`);
      try {
        await runFFmpegCommand(commands[index]);
      } catch (err) {
        console.log("error occurred on converting video into", commands[index]);
      }
      await runNextCommand(index + 1);
    } else {
      console.log("All resolutions processed.");
      await createMasterPlaylist();
    }
  }

  await runNextCommand(0);
  console.log("converting done");
}
// ######################  Function to convert a video to HLS in multiple resolutions end #######################

//############################# function to upload the output in s3 start #######################
async function uploadOutput() {
  try {
    console.log("Starting");

    const outDirPath = path.join(__dirname, "output");

    const outputFolderContents = fs.readdirSync(outDirPath, {
      recursive: true,
    });

    for (const file of outputFolderContents) {
      const filePath = path.join(outDirPath, file);
      if (fs.lstatSync(filePath).isDirectory()) continue;

      console.log("uploading", filePath);

      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: `__outputs/${KEY}/${file}`,
        Body: fs.createReadStream(filePath),
        ContentType: mime.lookup(filePath),
      });

      await s3Client.send(command);
      console.log("uploaded", filePath);
    }

    console.log("uploading Done...");
  } catch (err) {
    console.log("Error occurred on uploading artifacts");
    // TODO : send event into retry queue
    await sendRetryEvent(VIDEO_RETRY_BODY);
    process.exit(1);
  }
}
// ############################### function to upload the output in s3 end #######################

// ###################### Start the converting into HLS format ###########################
async function init() {
  await downloadOriginalVideo();
  const inputFile = "input.mp4";
  await convertToHLS(inputFile);
  await uploadOutput();
  console.log("All Done");
  await sendSuccessEvent(VIDEO_SUCCESS_BODY);
  process.exit(0);
}

init();

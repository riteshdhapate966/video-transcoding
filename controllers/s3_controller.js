import {
  CreateMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  UploadPartCommand,
} from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuid } from "uuid";
import s3Client from "../config/s3Client.js";
import { runDockerContainer } from "../utils/runDockerContaner.js";

export const createMultipartUpload = async (req, res) => {
  try {
    const { contentType } = req.body;

    const id = uuid();

    const key=`${id}`;

    const command = new CreateMultipartUploadCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      ContentType: contentType,
    });

    const upload = await s3Client.send(command);

    res.json({
      uploadId: upload.UploadId,
      key: upload.Key,
      bucket: upload.Bucket,
    });
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ message: "Error creating multipart upload", error: err.message });
  }
};

export const getUploadUrl = async (req, res) => {
  try {
    const { key, uploadId, partsCount } = req.body;

    const urls = await Promise.all(
      Array.from({ length: partsCount }, async (_, index) => {
        const partNumber = index + 1;

        const url = await getSignedUrl(
          s3Client,
          new UploadPartCommand({
            Bucket: process.env.S3_BUCKET,
            Key: key,
            UploadId: uploadId,
            PartNumber: partNumber,
          }),
          { expiresIn: 3600 } // 1 hour
        );

        return { partNumber, url };
      })
    );

    res.json({ urls });
  } catch (e) {
    console.log(e);
    res
      .status(500)
      .json({ message: "Error getting upload url", error: e.message });
  }
};

export const completeUpload = async (req, res) => {
  try {
    const { key, uploadId, parts } = req.body;

    const command = new CompleteMultipartUploadCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts, // [{ ETag, PartNumber }]
      },
    });

    const result = await s3Client.send(command);

    runDockerContainer(key);

    res.json({ location: result.Location });
  } catch (e) {
    console.log(e);
    res
      .status(500)
      .json({ message: "Error completing upload", error: e.message });
  }
};

export const abortUpload = async (req, res) => {
  try {
    const { key, uploadId } = req.body;

    const command = new AbortMultipartUploadCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      UploadId: uploadId,
    });

    await s3Client.send(command);
    res.json({ message: "Multipart upload aborted successfully." });
  } catch (e) {
    console.error("Error aborting multipart upload:", err);
    res
      .status(500)
      .json({ message: "Error completing upload", error: err.message });
  }
};

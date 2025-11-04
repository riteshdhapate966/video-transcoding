import kafka from "../config/kafka.js";

const admin = kafka.admin();

export async function createKafkaTopics() {
  try {
    await admin.connect();
    try {
      await admin.createTopics({
        topics: [
          {
            topic: "video-transcoding-retry",
            numPartitions: 1,
            replicationFactor: 1,
          },
        ],
      });
      console.log("video retry topic created successfully");
    } catch (err) {
      console.log("topic already exists");
    }
    try {
      await admin.createTopics({
        topics: [
          {
            topic: "video-transcoding-success-event",
            numPartitions: 1,
            replicationFactor: 1,
          },
        ],
      });
      console.log("video transcoding success event topic created successfully");
    } catch (err) {
      console.log("topic already exists");
    }
  } catch (error) {
    console.log("error creating kafka topics", error);
  } finally {
    await admin.disconnect();
  }
}

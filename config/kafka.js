import { Kafka } from "kafkajs";
import { config as dotenvConfig } from "dotenv";

dotenvConfig();

const KAFKA_BROKER_URL = process.env.KAFKA_BROKER_URL;
console.log(KAFKA_BROKER_URL);
const kafka = new Kafka({
  clientId: "video-transcoding-service",
  brokers: [KAFKA_BROKER_URL],
});

export default kafka;

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import router from "./routes/index.js";
import {createKafkaTopics} from "./utils/createKafkaTopics.js";
import { startKafkaConsumers } from "./utils/kafkaConsumers.js";



async function initKafka() {
  await createKafkaTopics();
  await startKafkaConsumers();
}

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/v1", router);


initKafka();

app.get("/", (req, res) => {
  res.send("Server is up and running...");
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

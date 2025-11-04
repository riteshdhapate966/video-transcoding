import kafka from "./kafka.js";

export async function sendSuccessEvent(message) {
  try {
    const successProducer = kafka.producer();
    await successProducer.connect();
    const topic = "video-transcoding-success-event";

    await successProducer.send({
      topic,
      messages: [
        {
          key: message.key,
          value: JSON.stringify(message),
        },
      ],
    });

    console.log(`✅ Message sent to Kafka topic "${topic}"`);
    await successProducer.disconnect();
  } catch (err) {
    console.log("Error while sending success event to kafka", err);
  }
}


export async function sendRetryEvent(message) {
  try {
    const retryProducer = kafka.producer();
    await retryProducer.connect();
    const topic = "video-transcoding-retry";

    await retryProducer.send({
      topic,
      messages: [
        {
          key: message.key,
          value: JSON.stringify(message),
        },
      ],
    });

    console.log(`✅ Message sent to Kafka topic "${topic}"`);
    await retryProducer.disconnect();
  } catch (err) {
    console.log("Error while sending success event to kafka", err);
  }
}
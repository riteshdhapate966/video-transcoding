import Redis from "ioredis";

REDIS_HOST = process.env.REDIS_HOST;
REDIS_PORT = process.env.REDIS_PORT;

if (!REDIS_HOST || !REDIS_PORT) {
  throw new Error("Missing Redis configuration");
}

const redis = Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
});

export default redis;

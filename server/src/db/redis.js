import { createClient } from "redis";

const redis = createClient({
    url: "redis://127.0.0.1:6379"
});

redis.on("error", (err) => {
    console.error("Redis error:", err);
});

try {
    await redis.connect();
} catch (err) {
    console.error("Critical: Could not connect to Redis", err);
}

export default redis;
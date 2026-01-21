import { createClient } from 'redis';

// Upstash requires TLS - ensure URL uses rediss:// protocol
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const secureUrl = redisUrl.startsWith('redis://') && redisUrl.includes('upstash.io')
    ? redisUrl.replace('redis://', 'rediss://')
    : redisUrl;

const redisClient = createClient({
    url: secureUrl
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.on('connect', () => console.log('Redis Client Connected'));

// Connect to redis
(async () => {
    try {
        await redisClient.connect();
    } catch (err) {
        console.error('Failed to connect to Redis:', err);
    }
})();

export default redisClient;

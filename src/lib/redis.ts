import Redis from 'ioredis';

let redis: Redis | null = null;

export function getRedisClient(): Redis {
    if (!redis) {
        redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

        redis.on('connect', () => {
            console.log('Connected to Redis');
        });

        redis.on('error', (err) => {
            console.error('Redis error:', err);
        });
    }

    return redis;
}

export async function initializeRedis() {
    const client = getRedisClient();

    if (process.env.NODE_ENV === 'production') {
        await client.flushall();
        console.log('Redis initialized and cleared');
    } else {
        console.log('Redis connected (development - data preserved)');
    }
}

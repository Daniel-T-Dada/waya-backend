import redisClient from '../config/redis';

/**
 * Generic Cache Service using Redis
 */
export async function set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    try {
        const stringValue = JSON.stringify(value);
        await redisClient.set(key, stringValue, {
            EX: ttlSeconds
        });
    } catch (err) {
        console.error(`Error setting cache key ${key}:`, err);
    }
}

export async function get<T>(key: string): Promise<T | null> {
    try {
        const value = await redisClient.get(key);
        if (!value) return null;
        return JSON.parse(value) as T;
    } catch (err) {
        console.error(`Error getting cache key ${key}:`, err);
        return null;
    }
}

export async function del(key: string): Promise<void> {
    try {
        await redisClient.del(key);
    } catch (err) {
        console.error(`Error deleting cache key ${key}:`, err);
    }
}

/**
 * Clear cache by pattern (e.g., "user:123:*")
 */
export async function clearPattern(pattern: string): Promise<void> {
    try {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
            await redisClient.del(keys);
        }
    } catch (err) {
        console.error(`Error clearing cache pattern ${pattern}:`, err);
    }
}

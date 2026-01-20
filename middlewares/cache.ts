import { Request, Response, NextFunction } from 'express';
import * as cacheService from '../services/cacheService';

/**
 * Cache middleware for aggregation endpoints
 * Caches responses based on user ID and endpoint
 */
export function cacheMiddleware(ttlSeconds: number = 300) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                return next(); // Skip caching if no user
            }

            // Generate cache key based on route and user
            const cacheKey = `${req.path}:${userId}`;

            // Try to get from cache
            const cachedData = await cacheService.get(cacheKey);
            if (cachedData) {
                console.log(`Cache HIT: ${cacheKey}`);
                return res.json(cachedData);
            }

            console.log(`Cache MISS: ${cacheKey}`);

            // Store original res.json
            const originalJson = res.json.bind(res);

            // Override res.json to cache the response
            res.json = function (data: any) {
                // Cache the response
                cacheService.set(cacheKey, data, ttlSeconds).catch(err =>
                    console.error('Error caching response:', err)
                );

                // Call original json method
                return originalJson(data);
            };

            next();
        } catch (error) {
            console.error('Cache middleware error:', error);
            next(); // Continue without caching on error
        }
    };
}

/**
 * Invalidate cache for a specific user
 */
export async function invalidateUserCache(userId: string) {
    try {
        await cacheService.clearPattern(`*:${userId}`);
        console.log(`Invalidated cache for user: ${userId}`);
    } catch (error) {
        console.error('Error invalidating user cache:', error);
    }
}

/**
 * Invalidate cache for specific endpoints
 */
export async function invalidateEndpointCache(userId: string, endpoints: string[]) {
    try {
        for (const endpoint of endpoints) {
            await cacheService.del(`${endpoint}:${userId}`);
        }
        console.log(`Invalidated cache for user ${userId} endpoints:`, endpoints);
    } catch (error) {
        console.error('Error invalidating endpoint cache:', error);
    }
}

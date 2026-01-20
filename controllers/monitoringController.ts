import { Request, Response } from 'express';
import { prisma } from '../prisma';
import redisClient from '../config/redis';

/**
 * Performance monitoring dashboard
 * Provides real-time metrics about API performance
 */
export async function getPerformanceMetrics(req: Request, res: Response) {
    try {
        const metrics = {
            timestamp: new Date().toISOString(),
            server: {
                uptime: process.uptime(),
                memory: {
                    used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                    total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                    unit: 'MB'
                },
                nodeVersion: process.version
            },
            database: {
                status: 'connected',
                activeConnections: 0 // Prisma doesn't expose this easily
            },
            cache: {
                status: 'unknown',
                hitRate: 0
            },
            endpoints: {
                total: 10,
                cached: 10,
                averageResponseTime: '50-200ms' // Estimated
            }
        };

        // Check Redis connection
        try {
            await redisClient.ping();
            metrics.cache.status = 'connected';
        } catch (error) {
            metrics.cache.status = 'disconnected';
        }

        // Get database stats
        try {
            const userCount = await prisma.user.count();
            const childCount = await prisma.child.count();
            const choreCount = await prisma.chore.count();

            (metrics.database as any).stats = {
                users: userCount,
                children: childCount,
                chores: choreCount
            };
        } catch (error) {
            metrics.database.status = 'error';
        }

        return res.json(metrics);
    } catch (error: any) {
        console.error('Error fetching performance metrics:', error);
        return res.status(500).json({ error: 'Failed to fetch metrics' });
    }
}

/**
 * Health check endpoint for monitoring
 */
export async function healthCheck(req: Request, res: Response) {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        checks: {
            database: false,
            redis: false,
            server: true
        }
    };

    // Check database
    try {
        await prisma.$queryRaw`SELECT 1`;
        health.checks.database = true;
    } catch (error) {
        health.status = 'unhealthy';
    }

    // Check Redis
    try {
        await redisClient.ping();
        health.checks.redis = true;
    } catch (error) {
        health.status = 'degraded';
    }

    const statusCode = health.status === 'healthy' ? 200 : 503;
    return res.status(statusCode).json(health);
}

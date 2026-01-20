import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt';

let io: SocketServer | null = null;

export function initSocket(server: HttpServer) {
    io = new SocketServer(server, {
        cors: {
            origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000'],
            credentials: true
        }
    });

    // Authentication Middleware
    io.use((socket, next) => {
        const token = socket.handshake.auth.token || socket.handshake.headers['authorization']?.split(' ')[1];

        if (!token) {
            return next(new Error('Authentication error: Token missing'));
        }

        try {
            const payload = jwt.verify(token, jwtConfig.accessTokenSecret) as any;
            (socket as any).userId = payload.sub;
            next();
        } catch (err) {
            return next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        const userId = (socket as any).userId;
        console.log(`User ${userId} connected to socket:`, socket.id);

        // Auto-join private room
        socket.join(userId);

        socket.on('disconnect', () => {
            console.log(`User ${userId} disconnected from socket`);
        });
    });

    return io;
}

export function getIO() {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
}

export function notifyUser(userId: string, event: string, data: any) {
    if (io) {
        io.to(userId).emit(event, data);
    }
}

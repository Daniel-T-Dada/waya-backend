import 'dotenv/config';

import express from 'express';
import routes from './routes';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import hpp from 'hpp';
import { globalLimiter } from './middlewares/rateLimit';

import { createServer } from 'http';
import { initSocket } from './utils/socket';

const app = express();
// Enable trust proxy for Render deployment
app.set('trust proxy', 1);
const httpServer = createServer(app);

// Initialize Socket.io
initSocket(httpServer);

// Security Middleware
app.use(helmet()); // Set security headers
app.use(hpp()); // Prevent HTTP Parameter Pollution
app.use(express.json({ limit: '10kb' })); // Body limit
app.use(cookieParser());

app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? (process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000'])
        : true, // Allow all origins in development (reflects request origin)
    credentials: true
}));

// Rate Limiting
app.use('/api', globalLimiter);

app.use('/api', routes);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


app.get('/', (_req, res) => res.json({ ok: true, message: 'Waya backend (TypeScript) running' }));

const port = process.env.PORT ? Number(process.env.PORT) : 5000;

// In ESM, we check if this file is the entry point differently
const isMainModule = import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`;

// Always start the server when run directly (not imported as module for serverless)
httpServer.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
});

export default app;

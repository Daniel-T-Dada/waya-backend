import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Waya Backend API',
            version: '1.0.0',
            description: 'API Documentation for Waya Backend (Node.js)',
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
                cookieAuth: {
                    type: 'apiKey',
                    in: 'cookie',
                    name: 'accessToken',
                    description: 'HTTP-only cookie containing JWT access token'
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
            {
                cookieAuth: [],
            },
        ],
        servers: [
            {
                url: process.env.NODE_ENV === 'production'
                    ? 'https://api.waya.name.ng/api'
                    : 'http://localhost:5000/api',
                description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
            },
        ],
    },
    apis: ['./routes/*.ts', './controllers/*.ts'], // Look for annotations in routes and controllers
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;

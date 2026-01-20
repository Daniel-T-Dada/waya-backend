export const jwtConfig = {
    secret: process.env.JWT_SECRET || 'dev_jwt_secret', // Fallback for legacy
    accessTokenSecret: process.env.JWT_ACCESS_SECRET || 'dev_access_secret',
    refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES || '7d'
};

export const REDIS_SETTINGS = {
    HOST: process.env.REDIS_HOST,
    PORT: Number(process.env.REDIS_PORT),
    USERNAME: process.env.REDIS_USERNAME,
    PASSWORD: process.env.REDIS_PASSWORD,
    MAX_RETRIES_PER_REQUEST:
        Number(process.env.REDIS_MAX_RETRIES_PER_REQUEST) || 5,
    DATA_TTL: Number(process.env.REDIS_TTL) || 8600,
    CONNECTION_RETRY_DELAY:
        Number(process.env.REDIS_CONNECTION_RETRY_DELAY) || 2000,
}

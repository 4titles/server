import fastifyCookie from '@fastify/cookie'
import fastifyCors from '@fastify/cors'
import fastifySession from '@mgcrea/fastify-session'
import RedisStore from '@mgcrea/fastify-session-redis-store'
import { Logger, ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import {
    FastifyAdapter,
    NestFastifyApplication,
} from '@nestjs/platform-fastify'
import Redis from 'ioredis'
import MercuriusGQLUpload from 'mercurius-upload'
import { IRedisConfig } from './config/redis/redis-config.interface'
import { AppModule } from './modules/app.module'
import {
    COMPANY_DESCRIPTION,
    COMPANY_NAME,
} from './shared/constants/company.constants'
import { ms, type StringValue } from './shared/utils/ms.utils'
import { parseBoolean } from './shared/utils/parse-boolean.utils'

async function bootstrap() {
    const logger = new Logger()

    try {
        const app = await NestFactory.create<NestFastifyApplication>(
            AppModule,
            new FastifyAdapter({
                ignoreTrailingSlash: true,
            }),
        )

        const config = app.get(ConfigService)

        app.useGlobalPipes(
            new ValidationPipe({
                transform: true,
                whitelist: true,
            }),
        )

        await app.register(fastifyCors as any, {
            origin: config.getOrThrow<string>('ALLOWED_ORIGIN'),
            credentials: true,
            exposedHeaders: ['set-cookie'],
        })

        await app.register(fastifyCookie as any, {
            secret: config.getOrThrow<string>('COOKIE_SECRET'),
        })

        app.register(MercuriusGQLUpload as any, {})

        await app.register(fastifySession as any, {
            secret: config.getOrThrow<string>('SESSION_SECRET'),
            cookieName: config.get<string>('SESSION_NAME') || '4titles.sid',
            saveUninitialized: false,
            cookie: {
                domain: config.getOrThrow<string>('SESSION_DOMAIN'),
                maxAge: ms(config.getOrThrow<StringValue>('SESSION_MAX_AGE')),
                httpOnly: parseBoolean(
                    config.getOrThrow<string>('SESSION_HTTP_ONLY'),
                ),
                secure: parseBoolean(
                    config.getOrThrow<string>('SESSION_SECURE'),
                ),
                sameSite: 'lax',
            },
            store: new RedisStore({
                client: new Redis(config.getOrThrow<IRedisConfig>('redis')),
                prefix: config.getOrThrow<string>('SESSION_FOLDER'),
            }),
        })

        const fastify = app.getHttpAdapter().getInstance()

        fastify.get('/', (_, reply) => {
            reply.send('The /graphql endpoint is available.')
        })

        fastify.get('/info', (_, reply) => {
            reply.send({
                name: `${COMPANY_NAME} - ${COMPANY_DESCRIPTION}`,
                version: process.env.npm_package_version || '1.0.0',
                environment: process.env.NODE_ENV || 'development',
                timestamp: new Date().toISOString(),
            })
        })

        const port = config.getOrThrow<number>('APPLICATION_PORT')

        await app.listen(port, config.getOrThrow<string>('APPLICATION_HOST'))
        logger.log(`Server listening at ${await app.getUrl()}`)
        logger.log(`Health check available at ${await app.getUrl()}/health`)
    } catch (error) {
        logger.error('Failed to start application:', error)
        process.exit(1)
    }
}

bootstrap()

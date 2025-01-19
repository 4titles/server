import { NestFactory } from '@nestjs/core'
import {
    FastifyAdapter,
    NestFastifyApplication,
} from '@nestjs/platform-fastify'
import { AppModule } from './modules/app.module'
import { ConfigService } from '@nestjs/config'
import { ValidationPipe } from '@nestjs/common'
import fastifyCookie from '@fastify/cookie'
import fastifySession from '@fastify/session'
import fastifyCors from '@fastify/cors'
import fastifyHelmet from '@fastify/helmet'
import { ms, type StringValue } from './shared/utils/ms.utils'
import { parseBoolean } from './shared/utils/parse-boolean.utils'
import { CacheService } from './modules/cache/cache.service'
import { RedisStore } from 'connect-redis'

async function bootstrap() {
    try {
        const app = await NestFactory.create<NestFastifyApplication>(
            AppModule,
            new FastifyAdapter(),
        )

        const config = app.get(ConfigService)
        const redis = app.get(CacheService)

        app.useGlobalPipes(
            new ValidationPipe({
                transform: true,
                whitelist: true,
            }),
        )

        await app.register(fastifyHelmet, {
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: [`'self'`],
                    styleSrc: [`'self'`, `'unsafe-inline'`],
                    scriptSrc: [`'self'`, `'unsafe-inline'`, `'unsafe-eval'`],
                    imgSrc: [`'self'`, 'data:', 'https:'],
                    connectSrc: [`'self'`, 'https:'],
                },
            },
            crossOriginEmbedderPolicy: false,
        })

        await app.register(fastifyCors, {
            origin: config.getOrThrow<string>('ALLOWED_ORIGIN'),
            credentials: true,
            exposedHeaders: ['set-cookie'],
        })

        await app.register(fastifyCookie, {
            secret: config.getOrThrow<string>('COOKIE_SECRET'),
        })

        await app.register(fastifySession, {
            secret: config.getOrThrow<string>('SESSION_SECRET'),
            cookieName: config.getOrThrow<string>('COOKIE_NAME'),
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
            },
            store: new RedisStore({
                client: redis.getClient(),
                prefix: config.getOrThrow<string>('SESSION_FOLDER'),
            }),
        })

        const port = config.getOrThrow<number>('APPLICATION_PORT')

        await app.listen(port, config.getOrThrow<string>('APPLICATION_HOST'))
        console.log(`Server listening at ${await app.getUrl()}`)
    } catch (error) {
        console.error('Failed to start application:', error)
        process.exit(1)
    }
}

bootstrap()

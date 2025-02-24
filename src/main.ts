import fastifyCookie from '@fastify/cookie'
import fastifyCors from '@fastify/cors'
import fastifySession from '@mgcrea/fastify-session'
import RedisStore from '@mgcrea/fastify-session-redis-store'
import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import {
    FastifyAdapter,
    NestFastifyApplication,
} from '@nestjs/platform-fastify'
import Redis from 'ioredis'
import { IRedisConfig } from './config/redis/redis-config.interface'
import { AppModule } from './modules/app.module'
import { ms, type StringValue } from './shared/utils/ms.utils'
import { parseBoolean } from './shared/utils/parse-boolean.utils'

async function bootstrap() {
    try {
        const app = await NestFactory.create<NestFastifyApplication>(
            AppModule,
            new FastifyAdapter(),
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

        app.getHttpAdapter()
            .getInstance()
            .get('/', (_, reply) => {
                reply.send('The /graphql endpoint is available.')
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

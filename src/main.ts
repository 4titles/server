import { NestFactory } from '@nestjs/core'
import {
    FastifyAdapter,
    NestFastifyApplication,
} from '@nestjs/platform-fastify'

import { AppModule } from './app.module'

async function bootstrap() {
    const app = await NestFactory.create<NestFastifyApplication>(
        AppModule,
        new FastifyAdapter(),
    )

    const PORT = process.env.PORT || 3000
    const HOST = process.env.HOST || '0.0.0.0'
    await app.listen(PORT, HOST)
}
bootstrap()

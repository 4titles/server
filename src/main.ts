import { NestFactory } from '@nestjs/core'
import {
    FastifyAdapter,
    NestFastifyApplication,
} from '@nestjs/platform-fastify'
import { AppModule } from './modules/app.module'
import { ConfigService } from '@nestjs/config'

async function bootstrap() {
    const app = await NestFactory.create<NestFastifyApplication>(
        AppModule,
        new FastifyAdapter(),
    )
    const config = app.get(ConfigService)

    app.enableCors({
        origin: config.getOrThrow<string>('ALLOWED_ORIGIN'),
        credentials: true,
    })

    await app.listen(
        config.getOrThrow<number>('APPLICATION_PORT'),
        config.getOrThrow<string>('APPLICATION_HOST'),
        (err, address) => {
            if (err) {
                console.error(err)
                process.exit(1)
            }
            console.log(`Server listening at ${address}`)
        },
    )
}
bootstrap()

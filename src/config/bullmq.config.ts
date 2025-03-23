import { ConfigService } from '@nestjs/config'

export default async function getBullMQConfig(configService: ConfigService) {
    return {
        connection: {
            host: configService.getOrThrow('REDIS_HOST'),
            port: configService.getOrThrow('REDIS_PORT'),
            password: configService.getOrThrow('REDIS_PASSWORD'),
        },
        defaultJobOptions: {
            removeOnComplete: true,
        },
    }
}

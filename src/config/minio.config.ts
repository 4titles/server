import { ConfigService } from '@nestjs/config'
import type { ClientOptions } from 'minio'

export default async function getMinioConfig(
    configService: ConfigService,
): Promise<ClientOptions> {
    return {
        endPoint: configService.getOrThrow('MINIO_ENDPOINT'),
        port: Number(configService.getOrThrow('MINIO_PORT')),
        useSSL: false,
        accessKey: configService.getOrThrow('MINIO_ROOT_USER'),
        secretKey: configService.getOrThrow('MINIO_ROOT_PASSWORD'),
    }
}

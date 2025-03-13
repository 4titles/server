import getMinioConfig from '@/config/minio.config'
import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { MinioModule } from 'nestjs-minio-client'
import { S3Service } from './s3.service'

@Global()
@Module({
    imports: [
        MinioModule.registerAsync({
            useFactory: getMinioConfig,
            inject: [ConfigService],
        }),
    ],
    providers: [S3Service],
    exports: [S3Service],
})
export class S3Module {}

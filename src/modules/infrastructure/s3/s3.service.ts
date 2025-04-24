import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { MinioService } from 'nestjs-minio-client'
import { Readable } from 'stream'

@Injectable()
export class S3Service {
    private readonly logger: Logger = new Logger(S3Service.name)
    private readonly bucket: string

    constructor(
        private readonly configService: ConfigService,
        private readonly minio: MinioService,
    ) {
        this.bucket = this.configService.get<string>('MINIO_DEFAULT_BUCKET')
    }

    async upload(buffer: Buffer, key: string, mimetype: string): Promise<void> {
        try {
            await this.minio.client.putObject(this.bucket, key, buffer, {
                'Content-Type': mimetype,
            })
            this.logger.log(`File uploaded successfully: ${key}`)
        } catch (error) {
            this.logger.error(`Error uploading file: ${key}`, error)
            throw error
        }
    }

    async remove(key: string): Promise<void> {
        try {
            await this.minio.client.removeObject(this.bucket, key)
            this.logger.log(`File removed successfully: ${key}`)
        } catch (error) {
            this.logger.error(`Error removing file: ${key}`, error)
            throw error
        }
    }

    async fileExists(key: string): Promise<boolean> {
        try {
            await this.minio.client.statObject(this.bucket, key)
            return true
        } catch (error) {
            this.logger.error(
                `Failed to identify if file exists: ${key}`,
                error,
            )
            return false
        }
    }

    async getPublicUrl(key: string): Promise<string | null> {
        if (!key) return null

        try {
            return await this.minio.client.presignedUrl('GET', this.bucket, key)
        } catch (error) {
            this.logger.error(`Error generating URL for file: ${key}`, error)
            return null
        }
    }
}

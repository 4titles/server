import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import * as tf from '@tensorflow/tfjs-node'
import * as nsfw from 'nsfwjs'

// eslint-disable-next-line @typescript-eslint/no-require-imports
import sharp = require('sharp')

@Injectable()
export class ImageModerationService implements OnModuleInit {
    private readonly logger = new Logger(ImageModerationService.name)
    private model: nsfw.NSFWJS
    private readonly thresholds = {
        PORN: 0.7,
        SEXY: 0.75,
        HENTAI: 0.7,
    }

    async onModuleInit() {
        try {
            this.model = await nsfw.load()
            this.logger.log('NSFW model loaded successfully')
        } catch (error) {
            this.logger.error('Failed to load NSFW model', error)
            throw error
        }
    }

    async isImageSafe(imageBuffer: Buffer): Promise<boolean> {
        try {
            let imageTensor: tf.Tensor

            try {
                imageTensor = tf.node.decodeImage(imageBuffer, 3)
            } catch (error) {
                if (error.message && error.message.includes('Expected image')) {
                    this.logger.warn(
                        'Unsupported image format detected, converting to PNG...',
                    )
                    imageBuffer = await sharp(imageBuffer).png().toBuffer()
                    imageTensor = tf.node.decodeImage(imageBuffer, 3)
                } else {
                    throw error
                }
            }

            if (imageTensor.shape.length === 4) {
                imageTensor = imageTensor
                    .slice([0, 0, 0, 0], [1, -1, -1, -1])
                    .squeeze([0])
            }

            const predictions = await this.model.classify(
                imageTensor as tf.Tensor3D,
            )
            imageTensor.dispose()

            for (const prediction of predictions) {
                if (
                    (prediction.className === 'Porn' &&
                        prediction.probability > this.thresholds.PORN) ||
                    (prediction.className === 'Sexy' &&
                        prediction.probability > this.thresholds.SEXY) ||
                    (prediction.className === 'Hentai' &&
                        prediction.probability > this.thresholds.HENTAI)
                ) {
                    this.logger.warn(
                        `Inappropriate content detected: ${prediction.className} (${prediction.probability})`,
                    )
                    return false
                }
            }

            return true
        } catch (error) {
            this.logger.error('Error during image moderation', error)
            return false
        }
    }
}

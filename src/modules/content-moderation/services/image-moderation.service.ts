import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as tf from '@tensorflow/tfjs-node'
import * as nsfw from 'nsfwjs'
import { ModerationCategory } from '../enums/moderation-category.enum'
import {
    ModerationResult,
    ModerationThresholds,
} from '../interfaces/moderation.interfaces'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const sharp = require('sharp')

@Injectable()
export class ImageModerationService implements OnModuleInit {
    private readonly logger = new Logger(ImageModerationService.name)
    private model: nsfw.NSFWJS
    private isModelLoaded = false
    private modelLoadPromise: Promise<nsfw.NSFWJS>
    private readonly thresholds: ModerationThresholds
    private readonly minImageDimension: number

    constructor(private readonly configService: ConfigService) {
        this.thresholds = {
            [ModerationCategory.PORN]: configService.get(
                'MODERATION_THRESHOLD_PORN',
                0.7,
            ),
            [ModerationCategory.SEXY]: configService.get(
                'MODERATION_THRESHOLD_SEXY',
                0.75,
            ),
            [ModerationCategory.HENTAI]: configService.get(
                'MODERATION_THRESHOLD_HENTAI',
                0.7,
            ),
        }
        this.minImageDimension = configService.get('MIN_IMAGE_DIMENSION', 10)
        this.modelLoadPromise = this.loadModel()
    }

    async onModuleInit() {
        try {
            this.model = await this.modelLoadPromise
            this.isModelLoaded = true
            this.logger.log('NSFW model loaded successfully')
        } catch (error) {
            this.logger.error('Failed to load NSFW model', error)
            throw error
        }
    }

    private async loadModel(): Promise<nsfw.NSFWJS> {
        const modelUrl = this.configService.getOrThrow<string>('NSFW_MODEL_URL')

        try {
            try {
                this.logger.log(`Loading NSFW model from: ${modelUrl}`)
                return await nsfw.load(modelUrl)
            } catch (error) {
                this.logger.error('Error loading model via URL:', error)
                this.logger.log('Loading default NSFW model (MobileNetV2)')
                return await nsfw.load()
            }
        } catch (error) {
            this.logger.error('Failed to load NSFW model', error)
            throw error
        }
    }

    async isImageSafe(imageBuffer: Buffer): Promise<boolean> {
        const result = await this.moderateImage(imageBuffer)
        return result.isSafe
    }

    async getImageClassification(
        imageBuffer: Buffer,
    ): Promise<nsfw.PredictionType[]> {
        const result = await this.moderateImage(imageBuffer)
        return result.predictions
    }

    async moderateImage(imageBuffer: Buffer): Promise<ModerationResult> {
        if (!this.isModelLoaded) {
            try {
                this.logger.log('Model not loaded yet, waiting for it to load')
                this.model = await this.modelLoadPromise
                this.isModelLoaded = true
            } catch (error) {
                this.logger.error('Failed to load model on demand', error)
                return { isSafe: false, predictions: [] }
            }
        }

        try {
            const metadata = await sharp(imageBuffer).metadata()
            this.logger.debug(
                `Processing image: ${metadata.width}x${metadata.height}, format: ${metadata.format}`,
            )

            if (
                !metadata.width ||
                !metadata.height ||
                metadata.width < this.minImageDimension ||
                metadata.height < this.minImageDimension
            ) {
                this.logger.warn('Image too small for accurate moderation')
                return { isSafe: false, predictions: [] }
            }

            const predictions = await this.processAndClassifyImage(imageBuffer)
            const flaggedCategories = this.getFlaggedCategories(predictions)

            return {
                isSafe: flaggedCategories.length === 0,
                predictions,
                flaggedCategories:
                    flaggedCategories.length > 0
                        ? flaggedCategories
                        : undefined,
            }
        } catch (error) {
            this.logger.error(
                'Error during image moderation',
                error instanceof Error ? error.stack : error,
            )
            return { isSafe: false, predictions: [] }
        }
    }

    private async processAndClassifyImage(
        imageBuffer: Buffer,
    ): Promise<nsfw.PredictionType[]> {
        let imageTensor: tf.Tensor | null = null

        try {
            const processedImageBuffer = await sharp(imageBuffer)
                .resize(224, 224, { fit: 'inside' })
                .toFormat('png')
                .toBuffer()

            imageTensor = tf.node.decodeImage(processedImageBuffer, 3)

            if (imageTensor.shape.length === 4) {
                imageTensor = imageTensor
                    .slice([0, 0, 0, 0], [1, -1, -1, -1])
                    .squeeze([0])
            }

            const predictions = await this.model.classify(
                imageTensor as tf.Tensor3D,
            )
            this.logger.debug('NSFW predictions:', JSON.stringify(predictions))

            return predictions
        } catch (error) {
            this.logger.error('Error processing or classifying image', error)
            throw error
        } finally {
            if (imageTensor) {
                imageTensor.dispose()
            }
        }
    }

    private getFlaggedCategories(
        predictions: nsfw.PredictionType[],
    ): { category: string; probability: number }[] {
        return predictions
            .filter((prediction) => {
                const category = prediction.className as ModerationCategory
                const threshold = this.thresholds[category]

                return threshold && prediction.probability > threshold
            })
            .map((prediction) => ({
                category: prediction.className,
                probability: prediction.probability,
            }))
    }
}

import { DRIZZLE } from '@/modules/infrastructure/drizzle/drizzle.module'
import {
    DbTitleImage,
    titleImages,
} from '@/modules/infrastructure/drizzle/schema/title-images.schema'
import { DrizzleDB } from '@/modules/infrastructure/drizzle/types/drizzle'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { TitleSupportedLanguagesConfig } from '../../config/title-supported-languages.config'
import { TitleImageType } from '../../enums/title-image-type.enum'
import { LanguageService } from '../../modules/language/language.service'
import {
    TmdbImages,
    TmdbTitleImage,
    TmdbTitleImages,
} from '../../modules/tmdb/types/tmdb.interface'

@Injectable()
export class TitleImageService {
    private readonly logger = new Logger(TitleImageService.name)

    constructor(
        @Inject(DRIZZLE) private readonly db: DrizzleDB,
        private readonly languageService: LanguageService,
        private readonly languagesConfig: TitleSupportedLanguagesConfig,
    ) {}

    async linkTitleToImages(
        tx: DrizzleDB,
        titleId: string,
        images: TmdbImages,
    ): Promise<void> {
        if (
            !images ||
            (!images.backdrops?.length &&
                !images.posters?.length &&
                !images.logos?.length)
        ) {
            return
        }

        const supportedLanguages =
            this.languagesConfig.getPostgresLanguageISOCodes()

        if (images.backdrops?.length) {
            await this.processImagesByType(
                tx,
                titleId,
                images.backdrops,
                TitleImageType.BACKDROP,
                supportedLanguages,
            )
        }

        if (images.posters?.length) {
            await this.processImagesByType(
                tx,
                titleId,
                images.posters,
                TitleImageType.POSTER,
                supportedLanguages,
            )
        }

        if (images.logos?.length) {
            await this.processImagesByType(
                tx,
                titleId,
                images.logos,
                TitleImageType.LOGO,
                supportedLanguages,
            )
        }
    }

    private async processImagesByType(
        tx: DrizzleDB,
        titleId: string,
        images: TmdbTitleImages,
        type: TitleImageType,
        supportedLanguages: string[],
    ): Promise<void> {
        await Promise.all(
            images.map(async (image) => {
                await this.upsertSingleImage(
                    tx,
                    titleId,
                    image,
                    type,
                    supportedLanguages,
                )
            }),
        )
    }

    private async upsertSingleImage(
        tx: DrizzleDB,
        titleId: string,
        image: TmdbTitleImage,
        type: TitleImageType,
        supportedLanguages: string[],
    ): Promise<void> {
        const languageId = await this.getLanguageId(
            image.iso_639_1,
            supportedLanguages,
        )

        if (languageId === undefined) return

        const imageData = this.buildImageData(titleId, languageId, image, type)

        await tx
            .insert(titleImages)
            .values(imageData)
            .onConflictDoUpdate({
                target: [
                    titleImages.titleId,
                    titleImages.type,
                    titleImages.filePath,
                ],
                set: this.getImageUpdateData(image),
            })
    }

    private async getLanguageId(
        iso639_1: string | null | undefined,
        supportedLanguages: string[],
    ): Promise<string | null | undefined> {
        if (!iso639_1) return null

        if (!supportedLanguages.includes(iso639_1)) return undefined

        const language = await this.languageService.findByISO(iso639_1)
        return language?.id
    }

    private buildImageData(
        titleId: string,
        languageId: string | null,
        image: TmdbTitleImage,
        type: TitleImageType,
    ) {
        return {
            titleId,
            languageId,
            type,
            filePath: image.file_path,
            aspectRatio: image.aspect_ratio,
            voteAverage: image.vote_average,
            voteCount: image.vote_count,
        }
    }

    private getImageUpdateData(image: TmdbTitleImage): Partial<DbTitleImage> {
        return {
            aspectRatio: image.aspect_ratio,
            voteAverage: image.vote_average,
            voteCount: image.vote_count,
            updatedAt: new Date(),
        }
    }
}

import { DRIZZLE } from '@/modules/infrastructure/drizzle/drizzle.module'
import {
    DbTitle,
    DbTitleInsert,
    titles,
} from '@/modules/infrastructure/drizzle/schema/titles.schema'
import { DrizzleDB } from '@/modules/infrastructure/drizzle/types/drizzle'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import { TitleCategory } from '../enums/title-category.enum'
import { TitleType } from '../enums/title-type.enum'
import {
    TmdbTitleExtendedResponse,
    TmdbTitleResponse,
} from '../modules/tmdb/types/tmdb.interface'
import { TitleTransformService } from './utils/title-transform.service'

@Injectable()
export class TitleService {
    private readonly logger: Logger = new Logger(TitleService.name)

    constructor(
        @Inject(DRIZZLE) private readonly db: DrizzleDB,
        private readonly titleTransformService: TitleTransformService,
    ) {}

    async findById(titleId: string): Promise<DbTitle> {
        return await this.db.query.titles.findFirst({
            where: eq(titles.id, titleId),
        })
    }

    async findByTmdbId(tmdbId: string): Promise<DbTitle> {
        return await this.db.query.titles.findFirst({
            where: eq(titles.tmdbId, tmdbId),
        })
    }

    async findByImdbId(imdbId: string): Promise<DbTitle> {
        return await this.db.query.titles.findFirst({
            where: eq(titles.imdbId, imdbId),
        })
    }

    async findByCategory(category: TitleCategory): Promise<DbTitle[]> {
        return await this.db.query.titles.findMany({
            where: eq(titles.category, category),
        })
    }

    async createTitleFromTmdb(
        result: TmdbTitleResponse,
        detailedInfo: TmdbTitleExtendedResponse,
        type: TitleType,
        category: TitleCategory,
        imdbId: string | null,
    ): Promise<string | null> {
        try {
            const titleData = this.titleTransformService.createTitleData(
                result,
                detailedInfo,
                type,
                category,
                imdbId,
            )

            const [insertedTitle] = await this.db
                .insert(titles)
                .values(titleData as DbTitleInsert)
                .returning({ id: titles.id })

            return insertedTitle.id
        } catch (error) {
            this.logger.warn(
                `Failed to create title from TMDB ID ${result.id}: ${error.message}`,
            )
            return null
        }
    }

    async updateTitleFromTmdb(
        existingTitle: DbTitle,
        result: TmdbTitleResponse,
        detailedInfo: TmdbTitleExtendedResponse,
        type: TitleType,
        category: TitleCategory,
        imdbId: string | null,
        needsLocationUpdate?: boolean,
    ): Promise<boolean> {
        try {
            const titleUpdate =
                this.titleTransformService.createTitleUpdateData(
                    result,
                    detailedInfo,
                    type,
                    category,
                    imdbId,
                    existingTitle,
                    needsLocationUpdate,
                )

            await this.db
                .update(titles)
                .set(titleUpdate)
                .where(eq(titles.id, existingTitle.id))

            return true
        } catch (error) {
            this.logger.warn(
                `Failed to update title ${existingTitle.id}: ${error.message}`,
            )
            return false
        }
    }

    async updateNeedsLocationUpdate(
        titleId: string,
        needsLocationUpdate: boolean,
    ): Promise<boolean> {
        await this.db
            .update(titles)
            .set({
                needsLocationUpdate,
            } as Partial<DbTitle>)
            .where(eq(titles.id, titleId))

        return true
    }

    async deleteAllTitles(): Promise<void> {
        await this.db.delete(titles)
    }
}

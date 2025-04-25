import { DRIZZLE } from '@/modules/infrastructure/drizzle/drizzle.module'
import {
    DbTitle,
    DbTitleInsert,
    titles,
} from '@/modules/infrastructure/drizzle/schema/titles.schema'
import { DrizzleDB } from '@/modules/infrastructure/drizzle/types/drizzle'
import { generateSlug } from '@/shared/utils/common/slug.utils'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import { languages } from 'src/modules/infrastructure/drizzle/schema/languages.schema'
import { titleTranslations } from 'src/modules/infrastructure/drizzle/schema/title-translations.schema'
import {
    TitleRelationsConfig,
    TitleRelationsConfigService,
} from '../config/title-relations.config'
import { TitleCategory } from '../enums/title-category.enum'
import { TitleLoadRelations } from '../enums/title-load-relations.enum'
import { TitleType } from '../enums/title-type.enum'
import { TitleTransformService } from './utils/title-transform.service'

interface FindTitleOptions {
    loadRelations?: TitleLoadRelations
    customRelations?: TitleRelationsConfig
}

@Injectable()
export class TitleService {
    private readonly logger: Logger = new Logger(TitleService.name)

    constructor(
        @Inject(DRIZZLE) private readonly db: DrizzleDB,
        private readonly titleRelationsConfig: TitleRelationsConfigService,
    ) {}

    private _buildWithClause(
        loadRelations: TitleLoadRelations = TitleLoadRelations.NONE,
        customRelations?: TitleRelationsConfig,
    ) {
        if (customRelations) {
            return customRelations
        }

        switch (loadRelations) {
            case TitleLoadRelations.CORE:
                return this.titleRelationsConfig.CORE
            case TitleLoadRelations.SEARCH_PREVIEW:
                return this.titleRelationsConfig.SEARCH_PREVIEW
            case TitleLoadRelations.FULL:
                return this.titleRelationsConfig.FULL
            case TitleLoadRelations.NONE:
            default:
                return this.titleRelationsConfig.NONE
        }
    }

    async findById(
        titleId: string,
        options: FindTitleOptions = {},
    ): Promise<DbTitle | null> {
        const { loadRelations = TitleLoadRelations.NONE, customRelations } =
            options
        const withClause = this._buildWithClause(loadRelations, customRelations)

        return await this.db.query.titles.findFirst({
            where: eq(titles.id, titleId),
            with: withClause as any,
        })
    }

    async findByTmdbId(
        tmdbId: string,
        options: FindTitleOptions = {},
    ): Promise<DbTitle | null> {
        const { loadRelations = TitleLoadRelations.NONE, customRelations } =
            options
        const withClause = this._buildWithClause(loadRelations, customRelations)

        return await this.db.query.titles.findFirst({
            where: eq(titles.tmdbId, tmdbId),
            with: withClause as any,
        })
    }

    async findByImdbId(
        imdbId: string,
        options: FindTitleOptions = {},
    ): Promise<DbTitle | null> {
        const { loadRelations = TitleLoadRelations.NONE, customRelations } =
            options
        const withClause = this._buildWithClause(loadRelations, customRelations)

        return await this.db.query.titles.findFirst({
            where: eq(titles.imdbId, imdbId),
            with: withClause as any,
        })
    }

    async findManyByIds(
        titleIds: string[],
        options: FindTitleOptions = {},
    ): Promise<DbTitle[]> {
        if (!titleIds || titleIds.length === 0) return []
        const { loadRelations = TitleLoadRelations.NONE, customRelations } =
            options
        const withClause = this._buildWithClause(loadRelations, customRelations)

        return await this.db.query.titles.findMany({
            where: inArray(titles.id, titleIds),
            with: withClause as any,
        })
    }

    async findByCategory(
        category: TitleCategory,
        options: FindTitleOptions = {},
    ): Promise<DbTitle[]> {
        const { loadRelations = TitleLoadRelations.NONE, customRelations } =
            options
        const withClause = this._buildWithClause(loadRelations, customRelations)

        return await this.db.query.titles.findMany({
            where: eq(titles.category, category),
            with: withClause as any,
        })
    }

    async findByType(
        type: TitleType,
        options: FindTitleOptions = {},
    ): Promise<DbTitle[]> {
        const { loadRelations = TitleLoadRelations.NONE, customRelations } =
            options
        const withClause = this._buildWithClause(loadRelations, customRelations)

        return await this.db.query.titles.findMany({
            where: eq(titles.type, type),
            with: withClause as any,
        })
    }

    async findBySlug(
        slug: string,
        options: FindTitleOptions = {},
    ): Promise<DbTitle> {
        const { loadRelations = TitleLoadRelations.NONE, customRelations } =
            options
        const withClause = this._buildWithClause(loadRelations, customRelations)

        return await this.db.query.titles.findFirst({
            where: eq(titles.slug, slug),
            with: withClause as any,
        })
    }

    async findAll(
        filters: Partial<DbTitle> = {},
        options: FindTitleOptions = {},
    ): Promise<DbTitle[]> {
        const { loadRelations = TitleLoadRelations.NONE, customRelations } =
            options
        const withClause = this._buildWithClause(loadRelations, customRelations)
        const orderBy = [desc(titles.popularity)]

        const conditions = []
        if (filters.category) {
            conditions.push(eq(titles.category, filters.category))
        }
        if (filters.type) {
            conditions.push(eq(titles.type, filters.type))
        }
        if (filters.status) {
            conditions.push(eq(titles.status, filters.status))
        }
        if (filters.hasLocations) {
            conditions.push(eq(titles.hasLocations, filters.hasLocations))
        }

        return await this.db.query.titles.findMany({
            where: conditions.length > 0 ? and(...conditions) : undefined,
            orderBy,
            with: withClause as any,
        })
    }

    async createFromTmdb(titleData: Partial<DbTitle>): Promise<DbTitle> {
        const [createdTitle] = await this.db
            .insert(titles)
            .values(titleData as DbTitleInsert)
            .returning()

        return createdTitle
    }

    async updateFromTmdb(titleData: Partial<DbTitle>): Promise<DbTitle> {
        const [updatedTitle] = await this.db
            .update(titles)
            .set(titleData)
            .where(eq(titles.tmdbId, titleData.tmdbId))
            .returning()

        return updatedTitle
    }

    async upsertFromTmdb(titleData: Partial<DbTitle>): Promise<DbTitle> {
        const existingTitle = await this.findByTmdbId(titleData.tmdbId)

        if (existingTitle) {
            return await this.updateFromTmdb(titleData)
        } else {
            return await this.createFromTmdb(titleData)
        }
    }

    async updateHasLocations(
        titleId: string,
        hasLocations: boolean = false,
    ): Promise<boolean> {
        try {
            await this.db
                .update(titles)
                .set({
                    hasLocations,
                    updatedAt: new Date(),
                } as Partial<DbTitleInsert>)
                .where(eq(titles.id, titleId))

            return true
        } catch (error) {
            this.logger.error(
                `Failed to update hasLocations for title ${titleId}:`,
                error,
            )
            return false
        }
    }

    async updateSlugsForAllTitles(
        forceUpdate: boolean = false,
    ): Promise<number> {
        try {
            const condition = forceUpdate ? undefined : sql`slug IS NULL`
            const titlesData = await this.db
                .select({
                    id: titles.id,
                    originalName: titles.originalName,
                    translationTitle: titleTranslations.title,
                    languageIso: languages.iso,
                })
                .from(titles)
                .where(condition)
                .leftJoin(
                    titleTranslations,
                    eq(titles.id, titleTranslations.titleId),
                )
                .leftJoin(
                    languages,
                    eq(titleTranslations.languageId, languages.id),
                )

            const titlesWithTranslations = new Map<
                string,
                {
                    id: string
                    originalName: string
                    translations: any[]
                }
            >()

            titlesData.forEach((row) => {
                if (!titlesWithTranslations.has(row.id)) {
                    titlesWithTranslations.set(row.id, {
                        id: row.id,
                        originalName: row.originalName,
                        translations: [],
                    })
                }

                if (row.translationTitle && row.languageIso) {
                    const titleData = titlesWithTranslations.get(row.id)
                    titleData.translations.push({
                        title: row.translationTitle,
                        language: { iso: row.languageIso },
                    })
                }
            })

            let updatedCount = 0
            const titleTransformService = new TitleTransformService()

            for (const titleData of titlesWithTranslations.values()) {
                if (!titleData.originalName) continue

                const englishTitle =
                    titleTransformService.getEnglishTitleForSlug(
                        titleData.originalName,
                        titleData.translations,
                    )

                const slug = generateSlug(englishTitle)
                if (!slug) continue

                await this.db
                    .update(titles)
                    .set({
                        slug,
                        updatedAt: new Date(),
                    } as Partial<DbTitleInsert>)
                    .where(eq(titles.id, titleData.id))

                updatedCount++
            }

            this.logger.log(`Updated slugs for ${updatedCount} titles`)
            return updatedCount
        } catch (error) {
            this.logger.error('Failed to update slugs for titles:', error)
            return 0
        }
    }

    async updateCategoryForTitles(
        titleIds: string[],
        newCategory: TitleCategory,
    ): Promise<number> {
        if (!titleIds || titleIds.length === 0) {
            this.logger.debug('No title IDs provided for category update.')
            return 0
        }

        try {
            this.logger.log(
                `Updating category to ${newCategory} for ${titleIds.length} titles.`,
            )
            const result = await this.db
                .update(titles)
                .set({ category: newCategory })
                .where(inArray(titles.id, titleIds))

            const updatedCount = result.rowCount ?? titleIds.length
            this.logger.log(
                `Successfully updated category for ${updatedCount} titles.`,
            )
            return updatedCount
        } catch (error) {
            this.logger.error(
                `Failed to bulk update category to ${newCategory} for title IDs: ${titleIds.join(', ')}`,
                error.stack,
            )
            throw error
        }
    }

    async deleteAllTitles(): Promise<void> {
        await this.db.delete(titles)
    }
}

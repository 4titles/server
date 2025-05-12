import { DRIZZLE } from '@/modules/infrastructure/drizzle/drizzle.module'
import { genres } from '@/modules/infrastructure/drizzle/schema/genres.schema'
import {
    DbTitle,
    DbTitleInsert,
    titles,
} from '@/modules/infrastructure/drizzle/schema/titles.schema'
import { DrizzleDB } from '@/modules/infrastructure/drizzle/types/drizzle'
import { generateSlug } from '@/shared/utils/common/slug.utils'
import { Inject, Injectable, Logger } from '@nestjs/common'
import {
    and,
    asc,
    desc,
    eq,
    exists,
    gte,
    ilike,
    inArray,
    lte,
    or,
    SQL,
    sql,
} from 'drizzle-orm'
import { countries } from 'src/modules/infrastructure/drizzle/schema/countries.schema'
import { languages } from 'src/modules/infrastructure/drizzle/schema/languages.schema'
import { titleCountries } from 'src/modules/infrastructure/drizzle/schema/title-countries.schema'
import { titleFilmingLocations } from 'src/modules/infrastructure/drizzle/schema/title-filming-locations.schema'
import { titleGenres } from 'src/modules/infrastructure/drizzle/schema/title-genres.schema'
import { titleLanguages } from 'src/modules/infrastructure/drizzle/schema/title-languages.schema'
import { titleTranslations } from 'src/modules/infrastructure/drizzle/schema/title-translations.schema'
import {
    TitleRelationsConfig,
    TitleRelationsConfigService,
} from '../config/title-relations.config'
import { TitleCategory } from '../enums/title-category.enum'
import { TitleLanguageType } from '../enums/title-language-type.enum'
import { TitleLoadRelations } from '../enums/title-load-relations.enum'
import { TitleSortOption } from '../enums/title-sort-option.enum'
import { TitleStatus } from '../enums/title-status.enum'
import { TitleType } from '../enums/title-type.enum'
import { TitleFilterInput } from '../inputs/title-filter.input'
import { CountryRelation } from '../modules/country/enums/country-relation.enum'
import {
    convertFilterToAdvanced,
    TitleAdvancedFilters,
} from './utils/title-filter.utils'
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
        filterInput: Partial<DbTitle> | TitleFilterInput = {},
        options: FindTitleOptions = {},
    ): Promise<DbTitle[]> {
        const { loadRelations = TitleLoadRelations.NONE, customRelations } =
            options
        const withClause = this._buildWithClause(loadRelations, customRelations)

        const conditions: SQL[] = []
        if ('type' in filterInput && filterInput.type) {
            conditions.push(eq(titles.type, filterInput.type))
        }
        if ('category' in filterInput && filterInput.category) {
            conditions.push(eq(titles.category, filterInput.category))
        }
        if ('status' in filterInput && filterInput.status) {
            conditions.push(eq(titles.status, filterInput.status))
        }
        if (
            'hasLocations' in filterInput &&
            filterInput.hasLocations !== undefined
        ) {
            conditions.push(eq(titles.hasLocations, filterInput.hasLocations))
        } else if (
            'withFilmingLocations' in filterInput &&
            filterInput.withFilmingLocations !== undefined
        ) {
            console.log('yea')
            conditions.push(
                eq(titles.hasLocations, filterInput.withFilmingLocations),
            )
        }
        if ('imdbId' in filterInput && filterInput.imdbId) {
            conditions.push(eq(titles.imdbId, filterInput.imdbId))
        }

        const advancedFilters: TitleAdvancedFilters =
            convertFilterToAdvanced(filterInput)
        if (advancedFilters.releaseDateFrom) {
            conditions.push(
                gte(titles.releaseDate, advancedFilters.releaseDateFrom),
            )
        }
        if (advancedFilters.releaseDateTo) {
            conditions.push(
                lte(titles.releaseDate, advancedFilters.releaseDateTo),
            )
        }
        if (advancedFilters.runtimeFrom !== undefined) {
            conditions.push(gte(titles.runtime, advancedFilters.runtimeFrom))
        }
        if (advancedFilters.runtimeTo !== undefined) {
            conditions.push(lte(titles.runtime, advancedFilters.runtimeTo))
        }
        if (advancedFilters.voteAverageFrom !== undefined) {
            conditions.push(
                gte(titles.voteAverage, advancedFilters.voteAverageFrom),
            )
        }
        if (advancedFilters.voteAverageTo !== undefined) {
            conditions.push(
                lte(titles.voteAverage, advancedFilters.voteAverageTo),
            )
        }
        if (advancedFilters.statuses && advancedFilters.statuses.length > 0) {
            const statusEnums = advancedFilters.statuses.map(
                (status) => status as TitleStatus,
            )
            conditions.push(inArray(titles.status, statusEnums))
        }

        let nameConditions: SQL[] = []
        if (advancedFilters.name) {
            nameConditions.push(
                ilike(titles.originalName, `%${advancedFilters.name}%`),
            )

            const nameSubquery = this.db
                .select({ titleId: titleTranslations.titleId })
                .from(titleTranslations)
                .where(
                    ilike(titleTranslations.title, `%${advancedFilters.name}%`),
                )
                .as('name_translations')

            conditions.push(
                or(
                    ...nameConditions,
                    exists(
                        this.db
                            .select()
                            .from(nameSubquery)
                            .where(eq(nameSubquery.titleId, titles.id)),
                    ),
                ),
            )
        }

        let orderBy: SQL[] = [desc(titles.popularity)]

        if (advancedFilters.sortBy) {
            switch (advancedFilters.sortBy) {
                case TitleSortOption.POPULARITY_DESC:
                    orderBy = [desc(titles.popularity)]
                    break
                case TitleSortOption.POPULARITY_ASC:
                    orderBy = [asc(titles.popularity)]
                    break
                case TitleSortOption.VOTE_AVERAGE_DESC:
                    orderBy = [desc(titles.voteAverage)]
                    break
                case TitleSortOption.VOTE_AVERAGE_ASC:
                    orderBy = [asc(titles.voteAverage)]
                    break
                case TitleSortOption.RELEASE_DATE_DESC:
                    orderBy = [desc(titles.releaseDate)]
                    break
                case TitleSortOption.RELEASE_DATE_ASC:
                    orderBy = [asc(titles.releaseDate)]
                    break
                case TitleSortOption.LAST_SYNCED_DESC:
                    orderBy = [desc(titles.lastSyncedAt)]
                    break
                case TitleSortOption.LAST_SYNCED_ASC:
                    orderBy = [asc(titles.lastSyncedAt)]
                    break
                case TitleSortOption.NAME_ASC:
                    orderBy = [asc(titles.originalName)]
                    break
                case TitleSortOption.NAME_DESC:
                    orderBy = [desc(titles.originalName)]
                    break
                default:
                    orderBy = [desc(titles.popularity)]
            }
        }

        let query = this.db.query.titles.findMany({
            where: conditions.length > 0 ? and(...conditions) : undefined,
            orderBy,
            with: withClause as any,
        })

        let results = await query

        if (advancedFilters.genreIds && advancedFilters.genreIds.length > 0) {
            const titlesWithGenres = await this.db
                .select({
                    titleId: titleGenres.titleId,
                })
                .from(titleGenres)
                .innerJoin(
                    genres,
                    and(
                        eq(genres.id, titleGenres.genreId),
                        inArray(genres.tmdbId, advancedFilters.genreIds),
                    ),
                )
                .groupBy(titleGenres.titleId)
                .having(
                    sql`count(${titleGenres.genreId}) >= ${advancedFilters.genreIds.length}`,
                )

            const titleIdsWithGenres = new Set(
                titlesWithGenres.map((t) => t.titleId),
            )
            results = results.filter((title) =>
                titleIdsWithGenres.has(title.id),
            )
        }
        if (
            advancedFilters.countryIsos &&
            advancedFilters.countryIsos.length > 0
        ) {
            const titlesWithCountries = await this.db
                .select({
                    titleId: titleCountries.titleId,
                })
                .from(titleCountries)
                .innerJoin(
                    countries,
                    and(
                        eq(countries.id, titleCountries.countryId),
                        inArray(countries.iso, advancedFilters.countryIsos),
                        eq(titleCountries.type, CountryRelation.PRODUCTION),
                    ),
                )
                .groupBy(titleCountries.titleId)

            const titleIdsWithCountries = new Set(
                titlesWithCountries.map((t) => t.titleId),
            )
            results = results.filter((title) =>
                titleIdsWithCountries.has(title.id),
            )
        }
        if (
            advancedFilters.originalLanguageIsos &&
            advancedFilters.originalLanguageIsos.length > 0
        ) {
            const titlesWithOriginalLanguages = await this.db
                .select({
                    titleId: titleLanguages.titleId,
                })
                .from(titleLanguages)
                .innerJoin(
                    languages,
                    and(
                        eq(languages.id, titleLanguages.languageId),
                        inArray(
                            languages.iso,
                            advancedFilters.originalLanguageIsos,
                        ),
                        eq(titleLanguages.type, TitleLanguageType.ORIGINAL),
                    ),
                )
                .groupBy(titleLanguages.titleId)

            const titleIdsWithOriginalLanguages = new Set(
                titlesWithOriginalLanguages.map((t) => t.titleId),
            )
            results = results.filter((title) =>
                titleIdsWithOriginalLanguages.has(title.id),
            )
        }
        if (
            advancedFilters.sortBy === TitleSortOption.LOCATIONS_COUNT_DESC ||
            advancedFilters.sortBy === TitleSortOption.LOCATIONS_COUNT_ASC
        ) {
            const locationsCountByTitle = await this.db
                .select({
                    titleId: titleFilmingLocations.titleId,
                    count: sql<number>`count(${titleFilmingLocations.id})`,
                })
                .from(titleFilmingLocations)
                .groupBy(titleFilmingLocations.titleId)

            const locationsCountMap = new Map<string, number>()
            locationsCountByTitle.forEach((item) => {
                locationsCountMap.set(item.titleId, item.count)
            })

            results.sort((a, b) => {
                const countA = locationsCountMap.get(a.id) || 0
                const countB = locationsCountMap.get(b.id) || 0

                if (
                    advancedFilters.sortBy ===
                    TitleSortOption.LOCATIONS_COUNT_DESC
                ) {
                    return countB - countA
                } else {
                    return countA - countB
                }
            })
        }

        return results
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
                    tmdbId: titles.tmdbId,
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
                    tmdbId: string
                    originalName: string
                    translations: any[]
                }
            >()

            titlesData.forEach((row) => {
                if (!titlesWithTranslations.has(row.id)) {
                    titlesWithTranslations.set(row.id, {
                        id: row.id,
                        tmdbId: row.tmdbId,
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

                const slug = generateSlug(englishTitle, titleData.tmdbId)

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

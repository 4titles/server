import { Injectable, Inject } from '@nestjs/common'
import { DRIZZLE } from 'src/drizzle/drizzle.module'
import { DatabaseException } from '../../exceptions/database.exception'
import { DrizzleDB } from 'src/drizzle/types/drizzle'
import { eq } from 'drizzle-orm'
import { TitleCategory } from '../../enums/title-category.enum'
import {
    DEFAULT_FETCH_LIMIT,
    TITLE_WITH_RELATIONS,
} from '../constants/query.constants'
import { DbTitle, DbTitleTable } from '../../types/title.type'

export interface QueryOptions {
    includeRelations?: boolean
}

@Injectable()
export abstract class BaseTitleEntityService<T extends DbTitle> {
    constructor(
        @Inject(DRIZZLE) protected db: DrizzleDB,
        private table: DbTitleTable,
        private tableName: string,
    ) {}

    private getQueryOptions(
        options: QueryOptions = { includeRelations: true },
    ) {
        return options?.includeRelations ? TITLE_WITH_RELATIONS : {}
    }

    async createOrUpdate(entity: T): Promise<void> {
        try {
            await this.db.insert(this.table).values(entity).onConflictDoUpdate({
                target: this.table.tmdbId,
                set: entity,
            })
        } catch (error) {
            throw new DatabaseException(
                `Failed to create/update: ${error.message}`,
            )
        }
    }

    async getAll(
        limit: number = DEFAULT_FETCH_LIMIT,
        options?: QueryOptions,
    ): Promise<T[]> {
        try {
            return await this.db.query[this.tableName].findMany({
                limit,
                ...this.getQueryOptions(options),
            })
        } catch (error) {
            throw new DatabaseException(
                `Failed to get all titles: ${error.message}`,
            )
        }
    }

    async getByTmdbId(
        tmdbId: number,
        options?: QueryOptions,
    ): Promise<T | undefined> {
        try {
            return await this.db.query[this.tableName].findFirst({
                where: eq(this.table.tmdbId, tmdbId),
                ...this.getQueryOptions(options),
            })
        } catch (error) {
            throw new DatabaseException(
                `Failed to get by TMDB ID: ${error.message}`,
            )
        }
    }

    async getByImdbId(
        imdbId: string,
        options?: QueryOptions,
    ): Promise<T | undefined> {
        try {
            return await this.db.query[this.tableName].findFirst({
                where: eq(this.table.imdbId, imdbId),
                ...this.getQueryOptions(options),
            })
        } catch (error) {
            throw new DatabaseException(
                `Failed to get by IMDB ID: ${error.message}`,
            )
        }
    }

    async getPopular(
        limit: number = DEFAULT_FETCH_LIMIT,
        options?: QueryOptions,
    ): Promise<T[]> {
        return this.getByCategory(TitleCategory.POPULAR, limit, options)
    }

    async getTopRated(
        limit: number = DEFAULT_FETCH_LIMIT,
        options?: QueryOptions,
    ): Promise<T[]> {
        return this.getByCategory(TitleCategory.TOP_RATED, limit, options)
    }

    async getTrending(
        limit: number = DEFAULT_FETCH_LIMIT,
        options?: QueryOptions,
    ): Promise<T[]> {
        return this.getByCategory(TitleCategory.TRENDING, limit, options)
    }

    async getSearched(
        limit: number = DEFAULT_FETCH_LIMIT,
        options?: QueryOptions,
    ): Promise<T[]> {
        return this.getByCategory(TitleCategory.SEARCH, limit, options)
    }

    async getByCategory(
        category: TitleCategory,
        limit: number,
        options?: QueryOptions,
    ): Promise<T[]> {
        try {
            return await this.db.query[this.tableName].findMany({
                where: eq(this.table.category, category),
                orderBy: (entity, { desc }) => [desc(entity.popularity)],
                limit,
                ...this.getQueryOptions(options),
            })
        } catch (error) {
            throw new DatabaseException(
                `Failed to get ${category} titles: ${error.message}`,
            )
        }
    }

    async search(
        query: string,
        limit: number = DEFAULT_FETCH_LIMIT,
        options?: QueryOptions,
    ): Promise<T[]> {
        try {
            return await this.db.query[this.tableName].findMany({
                where: (entity, { ilike, or }) =>
                    or(
                        ilike(entity.title, `%${query}%`),
                        ilike(entity.originalTitle, `%${query}%`),
                    ),
                orderBy: (entity, { desc }) => [desc(entity.popularity)],
                limit,
                ...this.getQueryOptions(options),
            })
        } catch (error) {
            throw new DatabaseException(`Failed to search: ${error.message}`)
        }
    }

    async deleteByTmdbId(tmdbId: number): Promise<void> {
        try {
            await this.db
                .delete(this.table)
                .where(eq(this.table.tmdbId, tmdbId))
        } catch (error) {
            throw new DatabaseException(
                `Failed to delete by TMDB ID: ${error.message}`,
            )
        }
    }
}

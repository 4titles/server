import { DRIZZLE } from '@/modules/infrastructure/drizzle/drizzle.module'
import {
    DbTitle,
    DbTitleInsert,
    titles,
} from '@/modules/infrastructure/drizzle/schema/titles.schema'
import { DrizzleDB } from '@/modules/infrastructure/drizzle/types/drizzle'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { and, desc, eq } from 'drizzle-orm'
import { TitleCategory } from '../enums/title-category.enum'
import { TitleType } from '../enums/title-type.enum'
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

    async findByType(type: TitleType): Promise<DbTitle[]> {
        return await this.db.query.titles.findMany({
            where: eq(titles.type, type),
        })
    }

    async findWithLocations(titleId: string): Promise<DbTitle> {
        return await this.db.query.titles.findFirst({
            where: eq(titles.id, titleId),
            with: { filmingLocations: true },
        })
    }

    async findByByImdbIdWithRelations(imdbId: string): Promise<DbTitle> {
        return await this.db.query.titles.findFirst({
            where: eq(titles.imdbId, imdbId),
            with: {
                filmingLocations: true,
                genres: true,
                countries: true,
                languages: true,
            },
        })
    }

    async findAll(filters: Partial<DbTitle> = {}): Promise<DbTitle[]> {
        const orderBy = [desc(titles.popularity)]
        let query = this.db.query.titles.findMany({
            orderBy,
        })

        if (filters) {
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

            if (conditions.length > 0) {
                query = this.db.query.titles.findMany({
                    where: and(...conditions),
                    orderBy,
                })
            }
        }

        return await query
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
        await this.db
            .update(titles)
            .set({
                hasLocations,
            } as Partial<DbTitle>)
            .where(eq(titles.id, titleId))

        return true
    }

    async deleteAllTitles(): Promise<void> {
        await this.db.delete(titles)
    }
}

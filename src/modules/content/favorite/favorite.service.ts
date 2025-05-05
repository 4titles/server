import { DRIZZLE } from '@/modules/infrastructure/drizzle/drizzle.module'
import {
    DbFavoriteSelect,
    favorites,
} from '@/modules/infrastructure/drizzle/schema/favorites.schema'
import { DrizzleDB } from '@/modules/infrastructure/drizzle/types/drizzle'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { and, desc, eq, sql } from 'drizzle-orm'
import { FavoriteType } from './enums/favorite-type.enum'

@Injectable()
export class FavoriteService {
    private readonly logger = new Logger(FavoriteService.name)

    constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

    async addToFavorites(
        userId: string,
        type: FavoriteType,
        entityId: string,
    ): Promise<DbFavoriteSelect | null> {
        const existingFavorite = await this.findFavorite(userId, type, entityId)
        if (existingFavorite) {
            this.logger.debug(
                `Item already in favorites: userId=${userId}, type=${type}, entityId=${entityId}`,
            )
            return existingFavorite
        }

        const favoriteToInsert = {
            userId,
            type,
            titleId: type === FavoriteType.TITLE ? entityId : null,
            filmingLocationId: type === FavoriteType.LOCATION ? entityId : null,
        }

        try {
            const [newFavorite] = await this.db
                .insert(favorites)
                .values(favoriteToInsert)
                .returning()
            this.logger.log(
                `Added to favorites: userId=${userId}, type=${type}, entityId=${entityId}`,
            )
            return newFavorite
        } catch (error) {
            this.logger.error(
                `Failed to add to favorites: userId=${userId}, type=${type}, entityId=${entityId}`,
                error.stack,
            )
            if (error.code === '23505') {
                return this.findFavorite(userId, type, entityId)
            }
            return null
        }
    }

    async removeFromFavorites(
        userId: string,
        type: FavoriteType,
        entityId: string,
    ): Promise<boolean> {
        const conditions = [
            eq(favorites.userId, userId),
            eq(favorites.type, type),
        ]

        if (type === FavoriteType.TITLE) {
            conditions.push(eq(favorites.titleId, entityId))
        } else if (type === FavoriteType.LOCATION) {
            conditions.push(eq(favorites.filmingLocationId, entityId))
        }

        try {
            const result = await this.db
                .delete(favorites)
                .where(and(...conditions))

            const success = result.rowCount > 0
            if (success) {
                this.logger.log(
                    `Removed from favorites: userId=${userId}, type=${type}, entityId=${entityId}`,
                )
            } else {
                this.logger.warn(
                    `Favorite not found for removal: userId=${userId}, type=${type}, entityId=${entityId}`,
                )
            }
            return success
        } catch (error) {
            this.logger.error(
                `Failed to remove from favorites: userId=${userId}, type=${type}, entityId=${entityId}`,
                error.stack,
            )
            return false
        }
    }

    async findFavorite(
        userId: string,
        type: FavoriteType,
        entityId: string,
    ): Promise<DbFavoriteSelect | null> {
        const conditions = [
            eq(favorites.userId, userId),
            eq(favorites.type, type),
        ]

        if (type === FavoriteType.TITLE) {
            conditions.push(eq(favorites.titleId, entityId))
        } else if (type === FavoriteType.LOCATION) {
            conditions.push(eq(favorites.filmingLocationId, entityId))
        }

        return await this.db.query.favorites.findFirst({
            where: and(...conditions),
        })
    }

    async isFavorite(
        userId: string,
        type: FavoriteType,
        entityId: string,
    ): Promise<boolean> {
        const result = await this.db
            .select({ count: sql<number>`count(*)::int` })
            .from(favorites)
            .where(
                and(
                    eq(favorites.userId, userId),
                    eq(favorites.type, type),
                    type === FavoriteType.TITLE
                        ? eq(favorites.titleId, entityId)
                        : eq(favorites.filmingLocationId, entityId),
                ),
            )

        return result[0]?.count > 0
    }

    async getUserFavorites(
        userId: string,
        type?: FavoriteType,
    ): Promise<DbFavoriteSelect[]> {
        return this.db.query.favorites.findMany({
            where: and(
                eq(favorites.userId, userId),
                type ? eq(favorites.type, type) : undefined,
            ),
            with: {
                title: {
                    with: {
                        images: true,
                        translations: {
                            with: {
                                language: true,
                            },
                        },
                    },
                },
                filmingLocation: {
                    with: {
                        descriptions: {
                            with: {
                                language: true,
                            },
                        },
                        country: true,
                    },
                },
            },
            orderBy: desc(favorites.createdAt),
        })
    }
}

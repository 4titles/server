import { DRIZZLE } from '@/modules/infrastructure/drizzle/drizzle.module'
import {
    DbFavoriteSelect,
    favorites,
} from '@/modules/infrastructure/drizzle/schema/favorites.schema'
import { DrizzleDB } from '@/modules/infrastructure/drizzle/types/drizzle'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { and, desc, eq, sql } from 'drizzle-orm'
import { Title } from '../title/models/title.model'
import { TitleQueryService } from '../title/services/title-query.service'
import { FavoriteType } from './enums/favorite-type.enum'
import { AddToFavoritesInput } from './inputs/add-to-favorites.input'
import { FindFavoriteInput } from './inputs/find-favorite.input'
import { FindFavoritesInput } from './inputs/find-favorites.input'
import { IsEntityFavoriteInput } from './inputs/is-entity-favorite.input'
import { RemoveFromFavoritesInput } from './inputs/remove-from-favorites.input'

@Injectable()
export class FavoriteService {
    private readonly logger = new Logger(FavoriteService.name)

    constructor(
        @Inject(DRIZZLE) private readonly db: DrizzleDB,
        private readonly titleQueryService: TitleQueryService,
    ) {}

    async addToFavorites(
        userId: string,
        input: AddToFavoritesInput,
    ): Promise<DbFavoriteSelect | null> {
        const { type, entityId, locationTitleId } = input

        const existingFavorite = await this.findFavorite(userId, input)
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
            filmingLocationTitleId:
                type === FavoriteType.LOCATION ? locationTitleId : null,
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
                return this.findFavorite(userId, {
                    type,
                    entityId,
                    locationTitleId,
                })
            }
            return null
        }
    }

    async removeFromFavorites(
        userId: string,
        input: RemoveFromFavoritesInput,
    ): Promise<boolean> {
        const { type, entityId, locationTitleId } = input

        const conditions = [
            eq(favorites.userId, userId),
            eq(favorites.type, type),
        ]

        if (type === FavoriteType.TITLE) {
            conditions.push(eq(favorites.titleId, entityId))
        } else if (type === FavoriteType.LOCATION) {
            conditions.push(eq(favorites.filmingLocationId, entityId))
            conditions.push(
                eq(favorites.filmingLocationTitleId, locationTitleId),
            )
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
        input: FindFavoriteInput,
    ): Promise<DbFavoriteSelect | null> {
        const { type, entityId, locationTitleId } = input

        const conditions = [
            eq(favorites.userId, userId),
            eq(favorites.type, type),
        ]

        if (type === FavoriteType.TITLE) {
            conditions.push(eq(favorites.titleId, entityId))
        } else if (type === FavoriteType.LOCATION) {
            conditions.push(eq(favorites.filmingLocationId, entityId))
            conditions.push(
                eq(favorites.filmingLocationTitleId, locationTitleId),
            )
        }

        return await this.db.query.favorites.findFirst({
            where: and(...conditions),
        })
    }

    async findUserFavorites(
        userId: string,
        input: FindFavoritesInput,
    ): Promise<DbFavoriteSelect[]> {
        const { type, take, skip } = input

        const userFavorites = await this.db.query.favorites.findMany({
            where: and(
                eq(favorites.userId, userId),
                type ? eq(favorites.type, type) : undefined,
            ),
            with: {
                filmingLocation: {
                    with: {
                        descriptions: {
                            with: {
                                language: true,
                            },
                        },
                        country: true,
                        titleFilmingLocations: {
                            columns: {
                                titleId: true,
                            },
                        },
                    },
                },
            },
            orderBy: desc(favorites.createdAt),
            limit: take,
            offset: skip || 0,
        })

        const titleIds = new Set<string>()
        userFavorites.forEach((favorite) => {
            if (favorite.titleId) {
                titleIds.add(favorite.titleId)
            }
            if (favorite.filmingLocationTitleId) {
                titleIds.add(favorite.filmingLocationTitleId)
            }
            if (favorite.filmingLocation?.titleFilmingLocations) {
                favorite.filmingLocation.titleFilmingLocations.forEach(
                    (tfl) => {
                        if (tfl.titleId) {
                            titleIds.add(tfl.titleId)
                        }
                    },
                )
            }
        })

        const titlePromises = Array.from(titleIds).map(async (titleId) => {
            try {
                const title = await this.titleQueryService.getTitleById(titleId)
                return { titleId, title }
            } catch (error) {
                this.logger.warn(
                    `Failed to get title data for titleId: ${titleId}`,
                    error,
                )
                return { titleId, title: undefined }
            }
        })
        const titleResults = await Promise.all(titlePromises)

        const titleMap = new Map<string, Title | undefined>()
        titleResults.forEach(({ titleId, title }) => {
            titleMap.set(titleId, title)
        })

        return userFavorites.map((favorite) => {
            const enrichedFilmingLocation = favorite.filmingLocation
                ? {
                      ...favorite.filmingLocation,
                      titleFilmingLocations:
                          favorite.filmingLocation.titleFilmingLocations?.map(
                              (tfl) => ({
                                  ...tfl,
                                  title: tfl.titleId
                                      ? titleMap.get(tfl.titleId)
                                      : undefined,
                              }),
                          ),
                  }
                : undefined

            return {
                ...favorite,
                title: favorite.titleId
                    ? titleMap.get(favorite.titleId)
                    : undefined,
                filmingLocationTitle: favorite.filmingLocationTitleId
                    ? titleMap.get(favorite.filmingLocationTitleId)
                    : undefined,
                filmingLocation: enrichedFilmingLocation,
            }
        })
    }

    async isFavorite(
        userId: string,
        input: IsEntityFavoriteInput,
    ): Promise<boolean> {
        const { type, entityId, locationTitleId } = input

        const result = await this.db
            .select({ count: sql<number>`count(*)::int` })
            .from(favorites)
            .where(
                and(
                    eq(favorites.userId, userId),
                    eq(favorites.type, type),
                    type === FavoriteType.TITLE
                        ? eq(favorites.titleId, entityId)
                        : and(
                              eq(favorites.filmingLocationId, entityId),
                              eq(
                                  favorites.filmingLocationTitleId,
                                  locationTitleId,
                              ),
                          ),
                ),
            )

        return result[0]?.count > 0
    }
}

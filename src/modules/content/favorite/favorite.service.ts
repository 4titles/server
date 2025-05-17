import { DRIZZLE } from '@/modules/infrastructure/drizzle/drizzle.module'
import { favorites } from '@/modules/infrastructure/drizzle/schema/favorites.schema'
import { DrizzleDB } from '@/modules/infrastructure/drizzle/types/drizzle'
import {
    Inject,
    Injectable,
    Logger,
    NotFoundException,
    forwardRef,
} from '@nestjs/common'
import { and, count, desc, eq, isNull, sql } from 'drizzle-orm'
import { CollectionService } from '../collection/collection.service'
import { Title } from '../title/models/title.model'
import { FilmingLocationService } from '../title/modules/filming-location/services/filming-location.service'
import { TitleQueryService } from '../title/services/title-query.service'
import { FavorableType } from './enums/favorable-type.enum'
import { AddToFavoritesInput } from './inputs/add-to-favorites.input'
import { FindFavoriteInput } from './inputs/find-favorite.input'
import { FindFavoritesInput } from './inputs/find-favorites.input'
import { IsEntityFavoriteInput } from './inputs/is-entity-favorite.input'
import { RemoveFromFavoritesInput } from './inputs/remove-from-favorites.input'
import { Favorite } from './models/favorite.model'

@Injectable()
export class FavoriteService {
    private readonly logger = new Logger(FavoriteService.name)

    constructor(
        @Inject(DRIZZLE) private readonly db: DrizzleDB,
        private readonly titleQueryService: TitleQueryService,
        private readonly filmingLocationService: FilmingLocationService,
        @Inject(forwardRef(() => CollectionService))
        private readonly collectionService: CollectionService,
    ) {}

    async findFavorite(
        userId: string,
        input: FindFavoriteInput,
    ): Promise<Favorite> {
        const { favorableType, favorableId, contextId } = input

        const conditions = [
            eq(favorites.userId, userId),
            eq(favorites.favorableType, favorableType),
            eq(favorites.favorableId, favorableId),
        ]

        if (contextId) {
            conditions.push(eq(favorites.contextId, contextId))
        } else {
            conditions.push(isNull(favorites.contextId))
        }

        return await this.db.query.favorites.findFirst({
            where: and(...conditions),
        })
    }

    async findUserFavorites(
        userId: string,
        input: FindFavoritesInput,
    ): Promise<Favorite[]> {
        const { favorableType, take, skip } = input

        const userFavorites = await this.db.query.favorites.findMany({
            where: and(
                eq(favorites.userId, userId),
                favorableType
                    ? eq(favorites.favorableType, favorableType)
                    : undefined,
            ),
            orderBy: desc(favorites.createdAt),
            limit: take,
            offset: skip || 0,
        })

        const titleIds = new Set<string>()
        const locationIds = new Set<string>()
        const contextTitleIds = new Set<string>()

        userFavorites.forEach((favorite) => {
            if (favorite.favorableType === FavorableType.TITLE) {
                titleIds.add(favorite.favorableId)
            } else if (favorite.favorableType === FavorableType.LOCATION) {
                locationIds.add(favorite.favorableId)
                if (favorite.contextId) {
                    contextTitleIds.add(favorite.contextId)
                }
            }
        })

        const titleMap = await this.loadTitles([
            ...titleIds,
            ...contextTitleIds,
        ])
        const locationMap = await this.loadLocations([...locationIds])

        return userFavorites.map((favorite) => {
            const enrichedFavorite: Favorite = {
                ...favorite,
            }

            if (favorite.favorableType === FavorableType.TITLE) {
                enrichedFavorite.title = titleMap.get(favorite.favorableId)
            } else if (favorite.favorableType === FavorableType.LOCATION) {
                enrichedFavorite.filmingLocation = locationMap.get(
                    favorite.favorableId,
                )
                if (favorite.contextId) {
                    enrichedFavorite.contextTitle = titleMap.get(
                        favorite.contextId,
                    )
                }
            }

            return enrichedFavorite
        })
    }

    async isFavorite(
        userId: string,
        input: IsEntityFavoriteInput,
    ): Promise<boolean> {
        const { favorableType, favorableId, contextId } = input

        const conditions = [
            eq(favorites.userId, userId),
            eq(favorites.favorableType, favorableType),
            eq(favorites.favorableId, favorableId),
        ]

        if (contextId) {
            conditions.push(eq(favorites.contextId, contextId))
        } else {
            conditions.push(isNull(favorites.contextId))
        }

        const result = await this.db
            .select({ count: sql<number>`count(*)::int` })
            .from(favorites)
            .where(and(...conditions))

        return result[0]?.count > 0
    }

    async getFavoritesCount(
        favorableId: string,
        favorableType: FavorableType,
    ): Promise<number> {
        try {
            const result = await this.db
                .select({ count: count() })
                .from(favorites)
                .where(
                    and(
                        eq(favorites.favorableId, favorableId),
                        eq(favorites.favorableType, favorableType),
                    ),
                )

            return result[0]?.count || 0
        } catch (error) {
            this.logger.error(
                `Failed to get favorites count for ${favorableType} ${favorableId}`,
                error.stack,
            )
            return 0
        }
    }

    async addToFavorites(
        userId: string,
        input: AddToFavoritesInput,
    ): Promise<boolean> {
        const { favorableType, favorableId, contextId } = input

        const existingFavorite = await this.findFavorite(userId, input)
        if (existingFavorite) {
            this.logger.debug(
                `Item already in favorites: userId=${userId}, type=${favorableType}, entityId=${favorableId}`,
            )
            return true
        }

        await this.verifyEntityExists(favorableType, favorableId, contextId)

        const favoriteToInsert = {
            userId,
            favorableType,
            favorableId,
            contextId,
        }

        try {
            await this.db.insert(favorites).values(favoriteToInsert)
            this.logger.log(
                `Added to favorites: userId=${userId}, type=${favorableType}, entityId=${favorableId}`,
            )
            return true
        } catch (error) {
            this.logger.error(
                `Failed to add to favorites: userId=${userId}, type=${favorableType}, entityId=${favorableId}`,
                error.stack,
            )
            return false
        }
    }

    async removeFromFavorites(
        userId: string,
        input: RemoveFromFavoritesInput,
    ): Promise<boolean> {
        const { favorableType, favorableId, contextId } = input

        const conditions = [
            eq(favorites.userId, userId),
            eq(favorites.favorableType, favorableType),
            eq(favorites.favorableId, favorableId),
        ]

        if (contextId) {
            conditions.push(eq(favorites.contextId, contextId))
        } else {
            conditions.push(isNull(favorites.contextId))
        }

        try {
            const result = await this.db
                .delete(favorites)
                .where(and(...conditions))

            const success = result.rowCount > 0
            if (success) {
                this.logger.log(
                    `Removed from favorites: userId=${userId}, type=${favorableType}, entityId=${favorableId}`,
                )
            } else {
                this.logger.warn(
                    `Favorite not found for removal: userId=${userId}, type=${favorableType}, entityId=${favorableId}`,
                )
            }
            return success
        } catch (error) {
            this.logger.error(
                `Failed to remove from favorites: userId=${userId}, type=${favorableType}, entityId=${favorableId}`,
                error.stack,
            )
            return false
        }
    }

    private async verifyEntityExists(
        favorableType: FavorableType,
        favorableId: string,
        contextId?: string,
    ): Promise<void> {
        switch (favorableType) {
            case FavorableType.TITLE:
                const title =
                    await this.titleQueryService.getTitleById(favorableId)
                if (!title) {
                    throw new NotFoundException(
                        `Title with ID ${favorableId} not found`,
                    )
                }
                break
            case FavorableType.LOCATION:
                const location =
                    await this.filmingLocationService.findById(favorableId)
                if (!location) {
                    throw new NotFoundException(
                        `Location with ID ${favorableId} not found`,
                    )
                }

                if (contextId) {
                    const contextTitle =
                        await this.titleQueryService.getTitleById(contextId)
                    if (!contextTitle) {
                        throw new NotFoundException(
                            `Context title with ID ${contextId} not found`,
                        )
                    }

                    const isAssociated = contextTitle.filmingLocations.map(
                        (fl) => fl.id === location.id,
                    )

                    if (!isAssociated) {
                        throw new NotFoundException(
                            `The title with ID ${contextId} is not associated with location ${favorableId}`,
                        )
                    }
                }
                break
            case FavorableType.COLLECTION:
                const collection =
                    await this.collectionService.findById(favorableId)
                if (!collection) {
                    throw new NotFoundException(
                        `Collection with ID ${favorableId} not found`,
                    )
                }
                break
            default:
                throw new Error(`Unsupported favorable type: ${favorableType}`)
        }
    }

    private async loadTitles(titleIds: string[]): Promise<Map<string, Title>> {
        if (!titleIds.length) return new Map()

        const titleMap = new Map<string, Title>()
        await Promise.all(
            titleIds.map(async (titleId) => {
                try {
                    const title =
                        await this.titleQueryService.getTitleById(titleId)
                    if (title) {
                        titleMap.set(titleId, title)
                    }
                } catch (error) {
                    this.logger.warn(`Failed to load title ${titleId}`, error)
                }
            }),
        )
        return titleMap
    }

    private async loadLocations(
        locationIds: string[],
    ): Promise<Map<string, any>> {
        if (!locationIds.length) return new Map()

        const locationMap = new Map<string, any>()
        await Promise.all(
            locationIds.map(async (locationId) => {
                try {
                    const location =
                        await this.filmingLocationService.findById(locationId)
                    if (location) {
                        locationMap.set(locationId, location)
                    }
                } catch (error) {
                    this.logger.warn(
                        `Failed to load location ${locationId}`,
                        error,
                    )
                }
            }),
        )
        return locationMap
    }
}

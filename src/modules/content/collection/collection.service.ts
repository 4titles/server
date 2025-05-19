import { User } from '@/modules/auth/account/models/user.model'
import { DRIZZLE } from '@/modules/infrastructure/drizzle/drizzle.module'
import {
    collections,
    DbCollection,
} from '@/modules/infrastructure/drizzle/schema/collections.schema'
import { filmingLocations } from '@/modules/infrastructure/drizzle/schema/filming-locations.schema'
import {
    DbLocationCollectionItem,
    locationCollectionItems,
} from '@/modules/infrastructure/drizzle/schema/location-collection-items.schema'
import {
    DbTitleCollectionItem,
    titleCollectionItems,
} from '@/modules/infrastructure/drizzle/schema/title-collection-items.schema'
import { DrizzleDB } from '@/modules/infrastructure/drizzle/types/drizzle'
import { S3Service } from '@/modules/infrastructure/s3/s3.service'
import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    forwardRef,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common'
import { and, count, desc, eq, ilike, or, SQL, sql } from 'drizzle-orm'
import * as Upload from 'graphql-upload/Upload.js'
import slug from 'slug'
import { CommentableType } from '../comment/enums/commentable-type.enum'
import { CommentService } from '../comment/services/comment.service'
import { ContentModerationService } from '../content-moderation/services/content-moderation.service'
import { FavorableType } from '../favorite/enums/favorable-type.enum'
import { FavoriteService } from '../favorite/favorite.service'
import { FilmingLocationService } from '../title/modules/filming-location/services/filming-location.service'
import { TitleQueryService } from '../title/services/title-query.service'
import { CollectionSortType } from './enums/collection-sort.enum'
import { CollectionType } from './enums/collection-type.enum'
import { AddCollectionItemInput } from './inputs/add-collection-item.input'
import { CollectionItemOrderInput } from './inputs/collection-item-order.input'
import { CreateCollectionInput } from './inputs/create-collection.input'
import { FindCollectionsInput } from './inputs/find-collections.input'
import { LocationCollectionItemInput } from './inputs/location-collection-item.input'
import { RemoveCollectionItemInput } from './inputs/remove-collection-item.input'
import { TitleCollectionItemInput } from './inputs/title-collection-item.input'
import { UpdateCollectionInput } from './inputs/update-collection.input'
import { Collection } from './models/collection.model'
import { LocationCollectionItem } from './models/location-collection-item.model'
import { TitleCollectionItem } from './models/title-collection-item.model'
import { CollectionMetadata } from './types/collection-metadata.interface'

@Injectable()
export class CollectionService {
    constructor(
        @Inject(DRIZZLE) private readonly db: DrizzleDB,
        private readonly s3Service: S3Service,
        private readonly contentModerationService: ContentModerationService,
        @Inject(forwardRef(() => FavoriteService))
        private readonly favoriteService: FavoriteService,
        private readonly titleQueryService: TitleQueryService,
        private readonly filmingLocationService: FilmingLocationService,
        private readonly commentService: CommentService,
    ) {}

    async findById(
        id: string,
    ): Promise<(DbCollection & { user: User }) | null> {
        return await this.db.query.collections.findFirst({
            where: eq(collections.id, id),
            with: {
                user: true,
            },
        })
    }

    async findByTitleAndUserId(
        title: string,
        userId: string,
    ): Promise<DbCollection | null> {
        return await this.db.query.collections.findFirst({
            where: and(
                eq(collections.title, title),
                eq(collections.userId, userId),
            ),
        })
    }

    async findCollectionBySlug(slug: string): Promise<Collection> {
        const collection = await this.db.query.collections.findFirst({
            where: eq(collections.slug, slug),
            with: {
                user: true,
            },
        })

        if (!collection) {
            throw new NotFoundException('Collection not found')
        }

        const metadata = await this.getCollectionMetadata(collection, undefined)

        return this.mapCollectionToModel(collection, metadata)
    }

    async findUserCollectionById(user: User, id: string): Promise<Collection> {
        const collection = await this.findById(id)

        if (!collection) {
            throw new NotFoundException('Collection not found')
        }

        this.verifyCollectionAccess(collection, user.id)

        const metadata = await this.getCollectionMetadata(collection, user.id)

        return this.mapCollectionToModel(collection, metadata)
    }

    async findCollections(
        input: FindCollectionsInput,
        user?: User,
    ): Promise<Collection[]> {
        const { take = 10, skip = 0, type, mine = false, sort, search } = input

        const conditions: SQL[] = []

        if (type) {
            conditions.push(eq(collections.type, type))
        }
        if (user) {
            if (mine) {
                conditions.push(eq(collections.userId, user.id))
            } else {
                conditions.push(
                    or(
                        eq(collections.isPrivate, false),
                        eq(collections.userId, user.id),
                    ),
                )
            }
        }
        if (search) {
            conditions.push(
                or(
                    ilike(collections.title, `%${search}%`),
                    ilike(collections.description, `%${search}%`),
                ),
            )
        }

        const orderBy = this.getCollectionSortOrder(sort)

        const results = await this.db.query.collections.findMany({
            where: conditions.length > 0 ? and(...conditions) : undefined,
            orderBy,
            with: {
                user: true,
            },
            limit: take,
            offset: skip,
        })

        return await Promise.all(
            results.map(async (collection) => {
                const metadata = await this.getCollectionMetadata(
                    collection,
                    user.id,
                )
                return this.mapCollectionToModel(collection, metadata)
            }),
        )
    }

    async getCollectionsCountByUserId(userId: string): Promise<number> {
        return await this.db
            .select({ count: count() })
            .from(collections)
            .where(eq(collections.userId, userId))
            .then((res) => res[0]?.count ?? 0)
    }

    async create(
        user: User,
        input: CreateCollectionInput,
        coverImage: Upload,
    ): Promise<Collection> {
        const {
            title,
            description,
            isPrivate,
            type,
            titleItems,
            locationItems,
        } = input

        if (type === CollectionType.TITLE && locationItems?.length) {
            throw new BadRequestException(
                'Cannot add location items to a title collection',
            )
        }
        if (type === CollectionType.LOCATION && titleItems?.length) {
            throw new BadRequestException(
                'Cannot add title items to a location collection',
            )
        }

        const existingCollection = await this.findByTitleAndUserId(
            title,
            user.id,
        )
        if (existingCollection) {
            throw new ConflictException(
                'Collection with this title already exists',
            )
        }

        await this.validateCollectionContent(title, description)

        const collectionSlug = slug(`${title + '-' + user.username}`, {
            fallback: true,
        })

        let coverImagePath = null
        if (coverImage) {
            const fileUpload = await coverImage
            coverImagePath = await this.uploadCoverImage(
                collectionSlug,
                fileUpload,
            )
        }

        const collectionToInsert = {
            title,
            description,
            isPrivate: isPrivate || false,
            type,
            userId: user.id,
            coverImage: coverImagePath,
            slug: collectionSlug,
        }

        const newCollection = await this.db
            .insert(collections)
            .values(collectionToInsert)
            .returning()

        const createdCollection = newCollection[0]

        if (type === CollectionType.TITLE && titleItems?.length) {
            await this.addTitlesToCollection(createdCollection.id, titleItems)
        } else if (type === CollectionType.LOCATION && locationItems?.length) {
            await this.addLocationsToCollection(
                createdCollection.id,
                locationItems,
            )
        }

        const metadata = await this.getEmptyCollectionMetadata(
            createdCollection,
            user,
            coverImagePath,
        )

        return this.mapCollectionToModel(createdCollection, metadata)
    }

    async update(
        user: User,
        input: UpdateCollectionInput,
        coverImage?: Upload,
    ): Promise<Collection> {
        const { id, title, description, isPrivate, titleItems, locationItems } =
            input

        const existingCollection = await this.db.query.collections.findFirst({
            where: or(
                eq(collections.id, id),
                and(
                    eq(collections.title, title),
                    eq(collections.userId, user.id),
                ),
            ),
        })

        if (!existingCollection) {
            throw new NotFoundException('Collection not found')
        }

        if (existingCollection.userId !== user.id) {
            throw new ForbiddenException(
                'You do not have permission to edit this collection',
            )
        }
        if (
            existingCollection.type === CollectionType.TITLE &&
            locationItems?.length
        ) {
            throw new BadRequestException(
                'Cannot add location items to a title collection',
            )
        }
        if (
            existingCollection.type === CollectionType.LOCATION &&
            titleItems?.length
        ) {
            throw new BadRequestException(
                'Cannot add title items to a location collection',
            )
        }

        const updateData: Partial<DbCollection> = {}

        if (title) {
            await this.validateCollectionContent(title)
            updateData.title = title
        }

        if (description !== undefined) {
            if (description) {
                await this.validateCollectionContent(null, description)
                updateData.description =
                    await this.contentModerationService.moderateTextField(
                        description,
                    )
            } else {
                updateData.description = null
            }
        }

        if (isPrivate !== undefined) updateData.isPrivate = isPrivate

        if (coverImage) {
            const fileUpload = await coverImage
            const coverImagePath = await this.uploadCoverImage(
                existingCollection.slug,
                fileUpload,
                existingCollection.coverImage,
            )
            updateData.coverImage = coverImagePath
        }

        updateData.updatedAt = new Date()
        await this.db
            .update(collections)
            .set(updateData)
            .where(eq(collections.id, id))

        if (
            existingCollection.type === CollectionType.TITLE &&
            titleItems?.length
        ) {
            await this.updateTitleItemsInCollection(id, titleItems)
        } else if (
            existingCollection.type === CollectionType.LOCATION &&
            locationItems?.length
        ) {
            await this.updateLocationItemsInCollection(id, locationItems)
        }

        const updatedCollection = await this.findById(id)

        const metadata = await this.getCollectionMetadata(
            updatedCollection,
            user.id,
        )

        return this.mapCollectionToModel(updatedCollection, metadata)
    }

    async delete(user: User, id: string): Promise<boolean> {
        const existingCollection = await this.findById(id)

        if (!existingCollection) {
            throw new NotFoundException('Collection not found')
        }

        if (existingCollection.userId !== user.id) {
            throw new ForbiddenException(
                'You do not have permission to delete this collection',
            )
        }

        if (existingCollection.coverImage) {
            await this.removeCoverImage(existingCollection.id, user)
        }

        await this.db.delete(collections).where(eq(collections.id, id))

        return true
    }

    async addCollectionItem(
        user: User,
        input: AddCollectionItemInput,
    ): Promise<boolean> {
        const { collectionId, itemId, type } = input

        const collection = await this.findById(collectionId)

        if (!collection) {
            throw new NotFoundException('Collection not found')
        }

        if (collection.userId !== user.id) {
            throw new ForbiddenException(
                'You do not have permission to edit this collection',
            )
        }

        if (collection.type !== type) {
            throw new BadRequestException(
                `This collection is intended for elements of type ${collection.type}`,
            )
        }

        const itemsCount = await this.getCollectionItemsCount(
            collectionId,
            type,
        )
        if (itemsCount >= 100) {
            throw new BadRequestException(
                'Maximum number of elements in the collection (100) reached',
            )
        }

        if (type === CollectionType.TITLE) {
            await this.addTitleToCollection(collectionId, itemId)
        } else {
            await this.addLocationToCollection(collectionId, itemId)
        }

        return true
    }

    async removeCollectionItem(
        user: User,
        input: RemoveCollectionItemInput,
    ): Promise<boolean> {
        const { collectionId, itemId, type } = input

        const collection = await this.findById(collectionId)

        if (!collection) {
            throw new NotFoundException('Collection not found')
        }

        if (collection.userId !== user.id) {
            throw new ForbiddenException(
                'You do not have permission to edit this collection',
            )
        }

        if (type === CollectionType.TITLE) {
            await this.db
                .delete(titleCollectionItems)
                .where(
                    and(
                        eq(titleCollectionItems.collectionId, collectionId),
                        eq(titleCollectionItems.titleId, itemId),
                    ),
                )
        } else {
            await this.db
                .delete(locationCollectionItems)
                .where(
                    and(
                        eq(locationCollectionItems.collectionId, collectionId),
                        eq(locationCollectionItems.locationId, itemId),
                    ),
                )
        }

        return true
    }

    async reorderCollectionItems(
        list: CollectionItemOrderInput[],
    ): Promise<boolean> {
        if (!list.length) return true

        try {
            const collectionItemsUpdatePromises = list.map(async (item) => {
                if (item.type === CollectionType.TITLE) {
                    await this.db
                        .update(titleCollectionItems)
                        .set({
                            position: item.position,
                        } as Partial<DbTitleCollectionItem>)
                        .where(eq(titleCollectionItems.id, item.id))
                } else if (item.type === CollectionType.LOCATION) {
                    await this.db
                        .update(locationCollectionItems)
                        .set({
                            position: item.position,
                        } as Partial<DbLocationCollectionItem>)
                        .where(eq(locationCollectionItems.id, item.id))
                }
            })

            await Promise.all(collectionItemsUpdatePromises)
        } catch (error) {
            throw new BadRequestException('Failed to reorder collection items')
        }

        return true
    }

    async getCollectionCoverUrl(
        collection: DbCollection,
    ): Promise<string | null> {
        if (!collection || !collection?.coverImage) return null
        return await this.s3Service.getPublicUrl(collection.coverImage)
    }

    async uploadCoverImage(
        slug: string,
        file: Upload,
        existingCoverImage?: string | null,
    ): Promise<string> {
        if (existingCoverImage) {
            await this.s3Service.remove(existingCoverImage)
        }

        const buffer = file.buffer
        const fileName = `/collections/${slug}-${Date.now()}.webp`

        await this.s3Service.upload(buffer, fileName, 'image/webp')

        return fileName
    }

    async removeCoverImage(collectionId: string, user: User): Promise<boolean> {
        const collection = await this.findById(collectionId)

        if (!collection) return false

        if (collection.userId !== user.id) {
            throw new ForbiddenException(
                'You do not have permission to delete this collection',
            )
        }

        try {
            await this.s3Service.remove(collection.coverImage)

            await this.db
                .update(collections)
                .set({ coverImage: null } as Partial<DbCollection>)
                .where(eq(collections.id, collection.id))

            return true
        } catch {
            return false
        }
    }

    async getCollectionItemsCount(
        collectionId: string,
        type: CollectionType,
    ): Promise<number> {
        const table =
            type === CollectionType.TITLE
                ? titleCollectionItems
                : locationCollectionItems
        const column =
            type === CollectionType.TITLE
                ? titleCollectionItems.collectionId
                : locationCollectionItems.collectionId

        const result = await this.db
            .select({ count: count() })
            .from(table)
            .where(eq(column, collectionId))

        return result[0].count
    }

    private async validateCollectionContent(
        title?: string | null,
        description?: string | null,
    ): Promise<void> {
        if (title) {
            const isTitleSafe =
                await this.contentModerationService.validateContent({
                    text: title,
                })
            if (!isTitleSafe) {
                throw new ConflictException(
                    'Collection title contains prohibited content',
                )
            }
        }

        if (description) {
            const isDescriptionSafe =
                await this.contentModerationService.validateContent({
                    text: description,
                })
            if (!isDescriptionSafe) {
                throw new ConflictException(
                    'Collection description contains prohibited content',
                )
            }
        }
    }

    private getCollectionSortOrder(sort?: CollectionSortType): SQL[] {
        switch (sort) {
            case CollectionSortType.MOST_POPULAR_YEAR:
                return [
                    desc(
                        sql`(SELECT COUNT(*) FROM favorites WHERE favorites.favorable_id = ${collections.id} AND favorites.created_at > NOW() - INTERVAL '1 year')`,
                    ),
                ]
            case CollectionSortType.MOST_POPULAR_SEASON:
                return [
                    desc(
                        sql`(SELECT COUNT(*) FROM favorites WHERE favorites.favorable_id = ${collections.id} AND favorites.created_at > NOW() - INTERVAL '3 months')`,
                    ),
                ]
            case CollectionSortType.MOST_POPULAR_WEEK:
                return [
                    desc(
                        sql`(SELECT COUNT(*) FROM favorites WHERE favorites.favorable_id = ${collections.id} AND favorites.created_at > NOW() - INTERVAL '7 days')`,
                    ),
                ]
            case CollectionSortType.TOP_RATED:
                return [
                    desc(
                        sql`(SELECT COUNT(*) FROM favorites WHERE favorites.favorable_id = ${collections.id})`,
                    ),
                ]
            case CollectionSortType.RANDOM:
                return [sql`RANDOM()`]
            case CollectionSortType.RECENTLY_ADDED:
            default:
                return [desc(collections.createdAt)]
        }
    }

    private verifyCollectionAccess(
        collection: DbCollection,
        userId: string,
    ): void {
        if (collection.isPrivate && collection.userId !== userId) {
            throw new ForbiddenException(
                'You do not have access to this private collection',
            )
        }
    }

    private async addTitleToCollection(
        collectionId: string,
        titleId: string,
    ): Promise<void> {
        const existingItem = await this.db.query.titleCollectionItems.findFirst(
            {
                where: and(
                    eq(titleCollectionItems.collectionId, collectionId),
                    eq(titleCollectionItems.titleId, titleId),
                ),
            },
        )

        if (existingItem) {
            throw new ConflictException(
                'This title is already in the collection',
            )
        }

        const lastItem = await this.db.query.titleCollectionItems.findFirst({
            where: eq(titleCollectionItems.collectionId, collectionId),
            orderBy: desc(titleCollectionItems.position),
        })

        const newItemPosition = lastItem ? lastItem.position + 1 : 1

        const itemToInsert = {
            collectionId,
            titleId,
            position: newItemPosition,
        }

        await this.db.insert(titleCollectionItems).values(itemToInsert)
    }

    private async addLocationToCollection(
        collectionId: string,
        locationId: string,
    ): Promise<void> {
        const existingItem =
            await this.db.query.locationCollectionItems.findFirst({
                where: and(
                    eq(locationCollectionItems.collectionId, collectionId),
                    eq(locationCollectionItems.locationId, locationId),
                ),
            })

        if (existingItem) {
            throw new ConflictException(
                'This location is already in the collection',
            )
        }

        const lastItem = await this.db.query.locationCollectionItems.findFirst({
            where: eq(locationCollectionItems.collectionId, collectionId),
            orderBy: desc(locationCollectionItems.position),
        })

        const newItemPosition = lastItem ? lastItem.position + 1 : 1

        const itemToInsert = {
            collectionId,
            locationId,
            position: newItemPosition,
        }

        await this.db.insert(locationCollectionItems).values(itemToInsert)
    }

    private async addTitlesToCollection(
        collectionId: string,
        titleItems: TitleCollectionItemInput[],
    ): Promise<void> {
        const itemsToInsert = titleItems.map((item, index) => ({
            collectionId,
            titleId: item.titleId,
            position: item.position || index + 1,
        }))

        await this.db.insert(titleCollectionItems).values(itemsToInsert)
    }

    private async addLocationsToCollection(
        collectionId: string,
        locationItems: LocationCollectionItemInput[],
    ): Promise<void> {
        const itemsToInsert = locationItems.map((item, index) => ({
            collectionId,
            locationId: item.locationId,
            position: item.position || index + 1,
        }))

        await this.db.insert(locationCollectionItems).values(itemsToInsert)
    }

    private async updateTitleItemsInCollection(
        collectionId: string,
        titleItems: TitleCollectionItemInput[],
    ): Promise<void> {
        await this.db
            .delete(titleCollectionItems)
            .where(eq(titleCollectionItems.collectionId, collectionId))

        const itemsToInsert = titleItems.map((item, index) => ({
            collectionId,
            titleId: item.titleId,
            position: item.position || index + 1,
        }))

        await this.db.insert(titleCollectionItems).values(itemsToInsert)
    }

    private async updateLocationItemsInCollection(
        collectionId: string,
        locationItems: LocationCollectionItemInput[],
    ): Promise<void> {
        await this.db
            .delete(locationCollectionItems)
            .where(eq(locationCollectionItems.collectionId, collectionId))

        const itemsToInsert = locationItems.map((item, index) => ({
            collectionId,
            locationId: item.locationId,
            position: item.position || index + 1,
        }))

        await this.db.insert(locationCollectionItems).values(itemsToInsert)
    }

    private async getCollectionTitleItems(
        collection: DbCollection & { user: User },
    ): Promise<TitleCollectionItem[]> {
        if (collection.type !== CollectionType.TITLE) {
            return []
        }

        const rawTitleItems = await this.db.query.titleCollectionItems.findMany(
            {
                where: eq(titleCollectionItems.collectionId, collection.id),
            },
        )

        return await Promise.all(
            rawTitleItems.map(async (item) => {
                return {
                    ...item,
                    title: await this.titleQueryService.getTitleById(
                        item.titleId,
                    ),
                    collection: {
                        ...collection,
                        user: collection.user,
                        itemsCount: 0,
                        favoritesCount: 0,
                        commentsCount: 0,
                        isFavorite: false,
                        coverImageUrl: null,
                        favorites: [],
                        comments: [],
                        titleItems: [],
                        locationItems: [],
                    },
                } as TitleCollectionItem
            }),
        )
    }

    private async getCollectionLocationItems(
        collection: DbCollection & { user: User },
    ): Promise<LocationCollectionItem[]> {
        if (collection.type !== CollectionType.LOCATION) {
            return []
        }

        const rawLocationItems =
            await this.db.query.locationCollectionItems.findMany({
                where: eq(locationCollectionItems.collectionId, collection.id),
            })

        return (await Promise.all(
            rawLocationItems.map(async (item) => {
                const location = await this.db.query.filmingLocations.findFirst(
                    {
                        where: eq(filmingLocations.id, item.locationId),
                        with: {
                            country: true,
                            descriptions: {
                                with: {
                                    language: true,
                                },
                            },
                            titleFilmingLocations: {
                                with: {
                                    title: {
                                        with: {
                                            translations: {
                                                with: {
                                                    language: true,
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                )

                return {
                    ...item,
                    location,
                    collection: {
                        ...collection,
                        user: collection.user,
                        itemsCount: 0,
                        favoritesCount: 0,
                        commentsCount: 0,
                        isFavorite: false,
                        coverImageUrl: null,
                        favorites: [],
                        comments: [],
                        titleItems: [],
                        locationItems: [],
                    },
                }
            }),
        )) as unknown as LocationCollectionItem[]
    }

    private async getCollectionMetadata(
        collection: DbCollection & { user: User },
        userId?: string,
    ): Promise<CollectionMetadata> {
        const itemsCount = await this.getCollectionItemsCount(
            collection.id,
            collection.type,
        )

        const favoritesCount = await this.favoriteService.getFavoritesCount(
            collection.id,
            FavorableType.COLLECTION,
        )

        const commentsCount = await this.commentService.getCommentCount({
            commentableId: collection.id,
            commentableType: CommentableType.COLLECTION,
        })

        const isFavorite = await this.favoriteService.isFavorite(userId, {
            favorableId: collection.id,
            favorableType: FavorableType.COLLECTION,
        })

        const comments = await this.commentService.findComments(
            {
                commentableId: collection.id,
                commentableType: CommentableType.COLLECTION,
            },
            userId || undefined,
        )

        let titleItems: TitleCollectionItem[] = []
        let locationItems: LocationCollectionItem[] = []

        if (collection.type === CollectionType.TITLE) {
            titleItems = await this.getCollectionTitleItems(collection)
        } else if (collection.type === CollectionType.LOCATION) {
            locationItems = await this.getCollectionLocationItems(collection)
        }

        return {
            itemsCount,
            favoritesCount,
            commentsCount,
            isFavorite,
            coverImageUrl: collection.coverImage
                ? await this.getCollectionCoverUrl(collection)
                : null,
            user: collection.user,
            favorites: [],
            comments,
            titleItems,
            locationItems,
        }
    }

    private async getEmptyCollectionMetadata(
        collection: DbCollection,
        user: User,
        coverImagePath: string | null,
    ): Promise<CollectionMetadata> {
        return {
            itemsCount: 0,
            favoritesCount: 0,
            commentsCount: 0,
            isFavorite: false,
            coverImageUrl: coverImagePath
                ? await this.getCollectionCoverUrl(collection)
                : null,
            user,
            favorites: [],
            comments: [],
            titleItems: [],
            locationItems: [],
        }
    }

    private mapCollectionToModel(
        collection: DbCollection,
        metadata: CollectionMetadata,
    ): Collection {
        const {
            itemsCount,
            favoritesCount,
            commentsCount,
            isFavorite,
            coverImageUrl,
            user,
            favorites,
            comments,
            titleItems,
            locationItems,
        } = metadata

        return {
            id: collection.id,
            title: collection.title,
            description: collection.description,
            slug: collection.slug,
            coverImageUrl: coverImageUrl,
            isPrivate: collection.isPrivate,
            type: collection.type,
            userId: collection.userId,
            createdAt: collection.createdAt,
            updatedAt: collection.updatedAt,
            itemsCount,
            favoritesCount,
            commentsCount,
            isFavorite,
            user,
            coverImage: collection.coverImage,
            favorites,
            comments,
            titleItems,
            locationItems,
        }
    }
}

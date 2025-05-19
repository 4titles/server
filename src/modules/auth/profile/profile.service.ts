import { CollectionService } from '@/modules/content/collection/collection.service'
import { Collection } from '@/modules/content/collection/models/collection.model'
import { CommentService } from '@/modules/content/comment/services/comment.service'
import { ContentModerationService } from '@/modules/content/content-moderation/services/content-moderation.service'
import { FilmingLocationService } from '@/modules/content/title/modules/filming-location/services/filming-location.service'
import { DRIZZLE } from '@/modules/infrastructure/drizzle/drizzle.module'
import { collections } from '@/modules/infrastructure/drizzle/schema/collections.schema'
import { filmingLocations } from '@/modules/infrastructure/drizzle/schema/filming-locations.schema'
import {
    DbSocialLink,
    socialLinks,
} from '@/modules/infrastructure/drizzle/schema/social-links.schema'
import {
    DbUser,
    users,
} from '@/modules/infrastructure/drizzle/schema/users.schema'
import { DrizzleDB } from '@/modules/infrastructure/drizzle/types/drizzle'
import { S3Service } from '@/modules/infrastructure/s3/s3.service'
import { getSevenDaysAgo } from '@/shared/utils/time/seven-days-ago.util'
import { ConflictException, Inject, Injectable } from '@nestjs/common'
import { and, asc, count, desc, eq, gte, or } from 'drizzle-orm'
import * as Upload from 'graphql-upload/Upload.js'
import sharp from 'sharp'
import { User } from '../account/models/user.model'
import { ChangeProfileInfoInput } from './inputs/change-profile-info.input'
import {
    SocialLinkInput,
    SocialLinkOrderInput,
} from './inputs/social-link.input'
import { SocialLink } from './models/social-link.model'
import { UserActivity } from './models/user-activity.model'

@Injectable()
export class ProfileService {
    constructor(
        @Inject(DRIZZLE) private readonly db: DrizzleDB,
        private readonly s3Service: S3Service,
        private readonly contentModerationService: ContentModerationService,
        private readonly filmingLocationService: FilmingLocationService,
        private readonly collectionService: CollectionService,
        private readonly commentService: CommentService,
    ) {}

    async findById(id: string): Promise<User | null> {
        return await this.db.query.users.findFirst({
            where: eq(users.id, id),
        })
    }

    async findByUsername(username: string): Promise<Partial<User> | null> {
        const profile = await this.db.query.users.findFirst({
            where: eq(users.username, username),
            with: {
                socialLinks: true,
                followers: {
                    with: {
                        follower: true,
                    },
                },
                followings: {
                    with: {
                        following: true,
                    },
                },
            },
        })

        if (!profile) return null

        const [locationsAdded, collectionsAdded, commentsCreated, activity] =
            await Promise.all([
                this.filmingLocationService.getFilmingLocationsCountByUserId(
                    profile.id,
                ),
                this.collectionService.getCollectionsCountByUserId(profile.id),
                this.commentService.getCommentsCountByUserId(profile.id),
                this.getUserActivityForLastWeek(profile.id),
            ])

        return {
            id: profile.id,
            email: profile.email,
            displayName: profile.displayName,
            avatar: profile.avatar,
            bio: profile.bio,
            username: profile.username,
            createdAt: profile.createdAt,
            socialLinks: profile.socialLinks,
            followers: profile.followers,
            followings: profile.followings,
            locationsAdded,
            collectionsAdded,
            commentsCreated,
            activity,
        }
    }

    async changeAvatar(user: User, file: Upload): Promise<boolean> {
        if (user.avatar) {
            await this.s3Service.remove(user.avatar)
        }

        const buffer = file.buffer

        const fileName = `/avatars/${user.username}-${Date.now()}.webp`

        if (file.filename && file.filename.endsWith('.gif')) {
            const processedBuffer = await sharp(buffer, { animated: true })
                .resize(512, 512)
                .webp()
                .toBuffer()

            await this.s3Service.upload(processedBuffer, fileName, 'image/webp')
        } else {
            const processedBuffer = await sharp(buffer)
                .resize(512, 512)
                .webp()
                .toBuffer()

            await this.s3Service.upload(processedBuffer, fileName, 'image/webp')
        }

        const userAvatarUpdate: Partial<DbUser> = {
            avatar: fileName,
        }

        await this.db
            .update(users)
            .set(userAvatarUpdate)
            .where(eq(users.id, user.id))

        return true
    }

    async getAvatarUrl(user: User): Promise<string | null> {
        if (!user || !user?.avatar) return null
        return await this.s3Service.getPublicUrl(user.avatar)
    }

    async removeAvatar(user: User) {
        if (!user.avatar) {
            return
        }

        await this.s3Service.remove(user.avatar)

        const userAvatarUpdate: Partial<DbUser> = {
            avatar: null,
        }

        await this.db
            .update(users)
            .set(userAvatarUpdate)
            .where(eq(users.id, user.id))

        return true
    }

    async changeInfo(
        user: User,
        input: ChangeProfileInfoInput,
    ): Promise<boolean> {
        const { username, displayName, bio } = input

        const isUsernameSafe =
            await this.contentModerationService.validateContent({
                text: username,
            })
        const isDisplayNameSafe =
            await this.contentModerationService.validateContent({
                text: displayName,
            })
        const isBioSafe = await this.contentModerationService.validateContent({
            text: bio,
        })

        if (!isUsernameSafe) {
            throw new ConflictException(
                'Username contains inappropriate content',
            )
        }
        if (!isDisplayNameSafe) {
            throw new ConflictException(
                'Display name contains inappropriate content',
            )
        }
        if (!isBioSafe) {
            throw new ConflictException('Bio contains inappropriate content')
        }

        const existingUser: DbUser = await this.db.query.users.findFirst({
            where: (users, { eq }) => eq(users.username, username),
        })

        if (existingUser && username !== user.username) {
            throw new ConflictException('The username is already taken')
        }

        const cleanedBio = bio
            ? await this.contentModerationService.moderateTextField(bio)
            : bio

        const userUpdate: Partial<DbUser> = {
            username,
            displayName,
            bio: cleanedBio,
        }

        await this.db.update(users).set(userUpdate).where(eq(users.id, user.id))

        return true
    }

    async findSocialLinks(user: User): Promise<SocialLink[]> {
        return await this.db.query.socialLinks.findMany({
            where: eq(socialLinks.userId, user.id),
            orderBy: asc(socialLinks.position),
        })
    }

    async createSocialLink(
        user: User,
        input: SocialLinkInput,
    ): Promise<boolean> {
        const { title, url } = input

        const lastSocialLink = await this.db.query.socialLinks.findFirst({
            where: eq(socialLinks.userId, user.id),
            orderBy: desc(socialLinks.createdAt),
        })

        const newSocialLinkPosition = lastSocialLink
            ? lastSocialLink.position + 1
            : 1

        const socialLinkCreate = {
            title,
            url,
            position: newSocialLinkPosition,
            userId: user.id,
        }

        await this.db.insert(socialLinks).values(socialLinkCreate)

        return true
    }

    async reorderSocialLinks(list: SocialLinkOrderInput[]): Promise<boolean> {
        if (!list.length) return

        const socialLinksUpdatePromises = list.map((socialLink) => {
            return this.db
                .update(socialLinks)
                .set({ position: socialLink.position } as Partial<DbSocialLink>)
                .where(eq(socialLinks.id, socialLink.id))
        })

        await Promise.all(socialLinksUpdatePromises)

        return true
    }

    async updateSocialLink(
        id: string,
        input: SocialLinkInput,
    ): Promise<boolean> {
        const { title, url } = input

        const socialLinkUpdate: Partial<DbSocialLink> = {
            title,
            url,
        }

        await this.db
            .update(socialLinks)
            .set(socialLinkUpdate)
            .where(eq(socialLinks.id, id))

        return true
    }

    async removeSocialLink(id: string): Promise<boolean> {
        await this.db.delete(socialLinks).where(eq(socialLinks.id, id))
        return true
    }

    async getUserActivityForLastWeek(userId: string): Promise<UserActivity> {
        const cutoffDate = getSevenDaysAgo()

        const user = await this.findById(userId)

        const userFilmingLocations = await this.getRecentFilmingLocations(
            userId,
            cutoffDate,
        )

        const userCollections = await this.getRecentCollections(
            userId,
            cutoffDate,
        )

        return {
            filmingLocations: userFilmingLocations,
            collections: userCollections,
            user,
            periodStart: cutoffDate,
            periodEnd: new Date(),
        }
    }

    private async getRecentFilmingLocations(userId: string, cutoffDate: Date) {
        return await this.db.query.filmingLocations.findMany({
            where: and(
                eq(filmingLocations.userId, userId),
                gte(filmingLocations.createdAt, cutoffDate),
            ),
            orderBy: desc(filmingLocations.createdAt),
            with: {
                country: true,
                descriptions: {
                    with: {
                        language: true,
                    },
                },
            },
        })
    }

    private async getRecentCollections(
        userId: string,
        cutoffDate: Date,
    ): Promise<Collection[]> {
        const recentCollections = await this.db.query.collections.findMany({
            where: and(
                eq(collections.userId, userId),
                or(
                    gte(collections.createdAt, cutoffDate),
                    gte(collections.updatedAt, cutoffDate),
                ),
            ),
            orderBy: desc(collections.updatedAt),
        })

        return await Promise.all(
            recentCollections.map(async (collection) => {
                return await this.collectionService.findCollectionBySlug(
                    collection.slug,
                )
            }),
        )
    }

    async getUserActivitySummary(user: User): Promise<{
        recentLocationsCount: number
        recentCollectionsCount: number
    }> {
        const cutoffDate = getSevenDaysAgo()

        const recentLocationsCount = await this.db
            .select({ count: count() })
            .from(filmingLocations)
            .where(
                and(
                    eq(filmingLocations.userId, user.id),
                    gte(filmingLocations.createdAt, cutoffDate),
                ),
            )
            .then((result) => Number(result[0]?.count || 0))

        const recentCollectionsCount = await this.db
            .select({ count: count() })
            .from(collections)
            .where(
                and(
                    eq(collections.userId, user.id),
                    or(
                        gte(collections.createdAt, cutoffDate),
                        gte(collections.updatedAt, cutoffDate),
                    ),
                ),
            )
            .then((result) => Number(result[0]?.count || 0))

        return {
            recentLocationsCount,
            recentCollectionsCount,
        }
    }
}

import { ContentModerationService } from '@/modules/content/content-moderation/services/content-moderation.service'
import { DRIZZLE } from '@/modules/infrastructure/drizzle/drizzle.module'
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
import { ConflictException, Inject, Injectable } from '@nestjs/common'
import { asc, desc, eq } from 'drizzle-orm'
import * as Upload from 'graphql-upload/Upload.js'
import sharp from 'sharp'
import { User } from '../account/models/user.model'
import { ChangeProfileInfoInput } from './inputs/change-profile-info.input'
import {
    SocialLinkInput,
    SocialLinkOrderInput,
} from './inputs/social-link.input'
import { SocialLink } from './models/social-link.model'

@Injectable()
export class ProfileService {
    constructor(
        @Inject(DRIZZLE) private readonly db: DrizzleDB,
        private readonly s3Service: S3Service,
        private readonly contentModerationService: ContentModerationService,
    ) {}

    async changeAvatar(user: User, file: Upload): Promise<boolean> {
        if (user.avatar) {
            await this.s3Service.remove(user.avatar)
        }

        const buffer = file.buffer

        const fileName = `/avatars/${user.username}.webp`

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
}

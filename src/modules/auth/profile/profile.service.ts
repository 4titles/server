import { DRIZZLE } from '@/modules/drizzle/drizzle.module'
import { DbUser, users } from '@/modules/drizzle/schema/users.schema'
import { DrizzleDB } from '@/modules/drizzle/types/drizzle'
import { S3Service } from '@/modules/libs/s3/s3.service'
import { ConflictException, Inject, Injectable } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import * as Upload from 'graphql-upload/Upload.js'
import { User } from '../account/models/user.model'
import { ChangeProfileInfoInput } from './inputs/change-profile-info.input'

// eslint-disable-next-line @typescript-eslint/no-require-imports
import sharp = require('sharp')

@Injectable()
export class ProfileService {
    constructor(
        @Inject(DRIZZLE) private readonly db: DrizzleDB,
        private readonly s3Service: S3Service,
    ) {}

    async changeAvatar(user: User, file: Upload) {
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

    async changeInfo(user: User, input: ChangeProfileInfoInput) {
        const { username, displayName, bio } = input

        const existingUser: DbUser = await this.db.query.users.findFirst({
            where: (users, { eq }) => eq(users.username, username),
        })

        if (existingUser && username !== user.username) {
            throw new ConflictException('The username is already taken')
        }

        const userUpdate: Partial<DbUser> = {
            username,
            displayName,
            bio,
        }

        await this.db.update(users).set(userUpdate).where(eq(users.id, user.id))

        return true
    }
}

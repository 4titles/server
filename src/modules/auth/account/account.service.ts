import { ContentModerationService } from '@/modules/content-moderation/services/content-moderation.service'
import { DRIZZLE } from '@/modules/drizzle/drizzle.module'
import { DbUser, users } from '@/modules/drizzle/schema/users.schema'
import { DrizzleDB } from '@/modules/drizzle/types/drizzle'
import { DatabaseException } from '@/modules/titles/exceptions/database.exception'
import {
    ConflictException,
    Inject,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common'
import { hash, verify } from 'argon2'
import { asc, eq } from 'drizzle-orm'
import { EnableTotpInput } from '../totp/inputs/enable-totp.input'
import { VerificationService } from '../verification/verification.service'
import { ChangeEmailInput } from './inputs/change-email.input'
import { ChangePasswordInput } from './inputs/change-password.input'
import { CreateUserInput } from './inputs/create-user.input'
import { UserMapper } from './mappers/user.mapper'
import { User } from './models/user.model'

@Injectable()
export class AccountService {
    constructor(
        @Inject(DRIZZLE) private readonly db: DrizzleDB,
        private readonly verificationService: VerificationService,
        private readonly contentModerationService: ContentModerationService,
    ) {}

    async findById(id: string): Promise<User | null> {
        try {
            return await this.db.query.users.findFirst({
                where: (users, { eq }) => eq(users.id, id),
                with: { socialLinks: true },
            })
        } catch (error) {
            throw new DatabaseException(error)
        }
    }

    async findByLogin(login: string): Promise<User | null> {
        try {
            return await this.db.query.users.findFirst({
                where: (users, { or, eq }) =>
                    or(eq(users.username, login), eq(users.email, login)),
                with: { socialLinks: true },
            })
        } catch (error) {
            throw new DatabaseException(error)
        }
    }

    async findByTelegramId(telegramId: string): Promise<User | null> {
        return await this.db.query.users.findFirst({
            where: eq(users.telegramId, telegramId),
            with: { followers: true, followings: true },
        })
    }

    async findAll(): Promise<User[]> {
        try {
            const dbUsers: DbUser[] = await this.db.query.users.findMany({
                orderBy: [asc(users.createdAt)],
            })
            return UserMapper.toGraphQLList(dbUsers)
        } catch (error) {
            throw new DatabaseException(error)
        }
    }

    async create(input: CreateUserInput): Promise<boolean> {
        try {
            const { email, username, password } = input

            const isEmailExists = await this.isEmailExists(email)
            const isUsernameExists = await this.isUsernameExists(username)

            if (isEmailExists) {
                throw new ConflictException('Email already exists')
            }

            if (isUsernameExists) {
                throw new ConflictException('Username already exists')
            }

            const isUsernameSafe =
                await this.contentModerationService.validateContent({
                    text: username,
                })

            if (!isUsernameSafe) {
                throw new ConflictException(
                    'Username contains inappropriate content',
                )
            }

            const newUser = {
                email,
                password: await hash(password),
                username,
                displayName: username,
            }

            const user: User[] = await this.db
                .insert(users)
                .values(newUser)
                .returning()

            await this.verificationService.sendVerificationToken(user[0])

            return true
        } catch (error) {
            if (error instanceof ConflictException) {
                throw error
            }
            throw new DatabaseException(error)
        }
    }

    async enableTotp(user: User, input: EnableTotpInput): Promise<boolean> {
        const { secret } = input

        try {
            const userUpdate: Partial<DbUser> = {
                isTotpEnabled: true,
                totpSecret: secret,
            }

            await this.db
                .update(users)
                .set(userUpdate)
                .where(eq(users.id, user.id))

            return true
        } catch (error) {
            throw new DatabaseException(error)
        }
    }

    async disableTotp(user: User): Promise<boolean> {
        try {
            const userUpdate: Partial<DbUser> = {
                isTotpEnabled: false,
                totpSecret: null,
            }

            await this.db
                .update(users)
                .set(userUpdate)
                .where(eq(users.id, user.id))

            return true
        } catch (error) {
            throw new DatabaseException(error)
        }
    }

    async changeEmail(user: User, input: ChangeEmailInput): Promise<boolean> {
        try {
            const { email } = input

            const userEmailUpdate: Partial<DbUser> = {
                email,
            }

            await this.db
                .update(users)
                .set(userEmailUpdate)
                .where(eq(users.id, user.id))

            return true
        } catch (error) {
            throw new DatabaseException(error)
        }
    }

    async changePassword(
        user: User,
        input: ChangePasswordInput,
    ): Promise<boolean> {
        try {
            const { oldPassword, newPassword } = input

            const isOldPasswordValid = await verify(user.password, oldPassword)

            if (!isOldPasswordValid) {
                throw new UnauthorizedException('The old password is invalid')
            }

            const userPasswordUpdate: Partial<DbUser> = {
                password: await hash(newPassword),
            }

            await this.db
                .update(users)
                .set(userPasswordUpdate)
                .where(eq(users.id, user.id))

            return true
        } catch (error) {
            throw new DatabaseException(error)
        }
    }

    async connectTelegram(userId: string, chatId: string): Promise<boolean> {
        try {
            await this.db
                .update(users)
                .set({ telegramId: chatId } as Partial<DbUser>)
                .where(eq(users.id, userId))

            return true
        } catch (error) {
            throw new DatabaseException(error)
        }
    }

    private async isUsernameExists(username: string): Promise<boolean> {
        const user = await this.db.query.users.findFirst({
            where: (users, { eq }) => eq(users.username, username),
        })
        return !!user
    }

    private async isEmailExists(email: string): Promise<boolean> {
        const user = await this.db.query.users.findFirst({
            where: (users, { eq }) => eq(users.email, email),
        })
        return !!user
    }
}

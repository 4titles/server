import { ContentModerationService } from '@/modules/content/content-moderation/services/content-moderation.service'
import { DRIZZLE } from '@/modules/infrastructure/drizzle/drizzle.module'
import {
    DbUser,
    users,
} from '@/modules/infrastructure/drizzle/schema/users.schema'
import { DrizzleDB } from '@/modules/infrastructure/drizzle/types/drizzle'
import { NotificationService } from '@/modules/infrastructure/notification/notification.service'
import { destroySession } from '@/shared/utils/session/session.utils'
import {
    ConflictException,
    forwardRef,
    Inject,
    Injectable,
    Logger,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common'
import { hash, verify } from 'argon2'
import { asc, eq, or, SQL } from 'drizzle-orm'
import { FastifyRequest } from 'fastify'
import { Role } from '../rbac/enums/roles.enum'
import { Role as RoleModel } from '../rbac/models/role.model'
import { RbacService } from '../rbac/rbac.service'
import { EnableTotpInput } from '../totp/inputs/enable-totp.input'
import { VerificationService } from '../verification/verification.service'
import { AccountDeletionService } from './account-deletion.service'
import { ChangeEmailInput } from './inputs/change-email.input'
import { ChangePasswordInput } from './inputs/change-password.input'
import { CreateUserWithRoleInput } from './inputs/create-user-with-role.input'
import { CreateUserInput } from './inputs/create-user.input'
import { User } from './models/user.model'

@Injectable()
export class AccountService {
    private readonly logger: Logger = new Logger(AccountService.name)

    constructor(
        @Inject(DRIZZLE) private readonly db: DrizzleDB,
        private readonly verificationService: VerificationService,
        private readonly contentModerationService: ContentModerationService,
        private readonly rbacService: RbacService,
        @Inject(forwardRef(() => AccountDeletionService))
        private readonly accountDeletionService: AccountDeletionService,
        private readonly notificationService: NotificationService,
    ) {}

    private async findUser(
        whereFn: (
            table: typeof users,
            operators: { eq: typeof eq; or: typeof or },
        ) => SQL,
    ): Promise<User | null> {
        try {
            const user = await this.db.query.users.findFirst({
                where: whereFn,
                with: {
                    socialLinks: true,
                    roles: {
                        with: {
                            role: {
                                with: {
                                    rolePermissions: {
                                        with: {
                                            permission: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            })

            if (!user) return null

            return {
                ...user,
                roles: user.roles.map((userRole) => ({
                    ...userRole.role,
                    permissions: userRole.role.rolePermissions.map(
                        (rp) => rp.permission,
                    ),
                })),
            }
        } catch (error) {
            throw error
        }
    }

    async findById(id: string): Promise<User | null> {
        return await this.findUser((users, { eq }) => eq(users.id, id))
    }

    async findByLogin(login: string): Promise<User | null> {
        return await this.findUser((users, { or, eq }) =>
            or(eq(users.username, login), eq(users.email, login)),
        )
    }

    async findByTelegramId(telegramId: string): Promise<User | null> {
        return await this.db.query.users.findFirst({
            where: eq(users.telegramId, telegramId),
            with: { followers: true, followings: true },
        })
    }

    async findAll(): Promise<User[]> {
        return await this.db.query.users.findMany({
            orderBy: [asc(users.createdAt)],
        })
    }

    async create(
        input: CreateUserInput | CreateUserWithRoleInput,
    ): Promise<boolean> {
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

            const role: RoleModel =
                input instanceof CreateUserWithRoleInput
                    ? await this.rbacService.getRoleByName(input.role)
                    : await this.rbacService.getRoleByName(Role.USER)

            await this.rbacService.assignRole({
                userId: user[0].id,
                roleId: role.id,
            })

            await this.notificationService.createNotificationSettingsForUserIfNotExists(
                user[0],
            )

            await this.verificationService.sendVerificationToken(user[0])

            return true
        } catch (error) {
            this.logger.error('Error creating user', error.stack)
            throw error
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
            this.logger.error(
                `Error enabling TOTP for user: ${user.id}`,
                error.stack,
            )
            throw error
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
            this.logger.error(
                `Error disabling TOTP for user: ${user.id}`,
                error.stack,
            )
            throw error
        }
    }

    async changeEmail(user: User, input: ChangeEmailInput): Promise<boolean> {
        try {
            const { email } = input

            const isEmailExists = await this.isEmailExists(email)
            if (isEmailExists) {
                throw new ConflictException('Email already exists')
            }

            const userEmailUpdate: Partial<DbUser> = {
                email,
                isVerified: false,
                emailVerifiedAt: null,
            }

            const [updatedUser] = await this.db
                .update(users)
                .set(userEmailUpdate)
                .where(eq(users.id, user.id))
                .returning()

            await this.verificationService.sendVerificationToken(updatedUser)

            return true
        } catch (error) {
            this.logger.error(
                `Error changing email for user: ${user.id}`,
                error.stack,
            )
            throw error
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

            if (oldPassword === newPassword) {
                throw new ConflictException(
                    'New password must be different from old password',
                )
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
            this.logger.error(
                `Error changing password for user: ${user.id}`,
                error.stack,
            )
            throw error
        }
    }

    async connectTelegram(userId: string, chatId: string): Promise<boolean> {
        try {
            const existingUser = await this.findByTelegramId(chatId)
            if (existingUser && existingUser.id !== userId) {
                throw new ConflictException(
                    'This Telegram account is already connected to another user',
                )
            }

            await this.db
                .update(users)
                .set({ telegramId: chatId } as Partial<DbUser>)
                .where(eq(users.id, userId))

            return true
        } catch (error) {
            this.logger.error(
                `Error connecting Telegram for user: ${userId}`,
                error.stack,
            )
            throw error
        }
    }

    async delete(req: FastifyRequest, userId: string): Promise<boolean> {
        try {
            const user = await this.findById(userId)

            if (!user) {
                throw new NotFoundException('User not found')
            }

            if (req.session.get('userId') === user.id) {
                throw new ConflictException('Cannot delete your own account')
            }

            req.session.set('userId', user.id)
            destroySession(req)

            return await this.accountDeletionService.deleteSingle(user)
        } catch (error) {
            this.logger.error(`Error deleting user: ${userId}`, error.stack)
            throw error
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

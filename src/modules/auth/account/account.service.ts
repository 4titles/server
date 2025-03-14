import { ContentModerationService } from '@/modules/content/content-moderation/services/content-moderation.service'
import { DatabaseException } from '@/modules/content/titles/exceptions/database.exception'
import { DRIZZLE } from '@/modules/infrastructure/drizzle/drizzle.module'
import {
    DbUser,
    users,
} from '@/modules/infrastructure/drizzle/schema/users.schema'
import { DrizzleDB } from '@/modules/infrastructure/drizzle/types/drizzle'
import { destroySession } from '@/shared/utils/seesion/session.utils'
import {
    ConflictException,
    forwardRef,
    Inject,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common'
import { hash, verify } from 'argon2'
import { asc, eq } from 'drizzle-orm'
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
import { UserMapper } from './mappers/user.mapper'
import { User } from './models/user.model'

@Injectable()
export class AccountService {
    constructor(
        @Inject(DRIZZLE) private readonly db: DrizzleDB,
        private readonly verificationService: VerificationService,
        private readonly contentModerationService: ContentModerationService,
        private readonly rbacService: RbacService,
        @Inject(forwardRef(() => AccountDeletionService))
        private readonly accountDeletionService: AccountDeletionService,
    ) {}

    async findById(id: string): Promise<User | null> {
        try {
            const user = await this.db.query.users.findFirst({
                where: (users, { eq }) => eq(users.id, id),
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

    async delete(req: FastifyRequest, userId: string): Promise<boolean> {
        const user = await this.findById(userId)

        if (!user) {
            throw new ConflictException('User not found')
        }

        if (req.session.get('userId') === user.id) {
            throw new ConflictException('Cannot delete your own account')
        }

        req.session.set('userId', user.id)
        destroySession(req)

        return await this.accountDeletionService.deleteSingle(user)
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

import { DRIZZLE } from '@/modules/drizzle/drizzle.module'
import { DbUser, users } from '@/modules/drizzle/schema/users.schema'
import { DrizzleDB } from '@/modules/drizzle/types/drizzle'
import { DatabaseException } from '@/modules/titles/exceptions/database.exception'
import { DEFAULT_FETCH_LIMIT } from '@/modules/titles/services/constants/query.constants'
import { ConflictException, Inject, Injectable } from '@nestjs/common'
import { hash } from 'argon2'
import { VerificationService } from '../verification/verification.service'
import { CreateUserInput } from './inputs/create-user.input'
import { UserMapper } from './mappers/user.mapper'
import { User } from './models/user.model'

@Injectable()
export class AccountService {
    constructor(
        @Inject(DRIZZLE) private readonly db: DrizzleDB,
        private readonly verificationService: VerificationService,
    ) {}

    async findById(id: string): Promise<User | null> {
        try {
            return await this.db.query.users.findFirst({
                where: (users, { eq }) => eq(users.id, id),
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
            })
        } catch (error) {
            throw new DatabaseException(error)
        }
    }

    async findAll(): Promise<User[]> {
        try {
            const dbUsers: DbUser[] = await this.db.query.users.findMany({
                limit: DEFAULT_FETCH_LIMIT,
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

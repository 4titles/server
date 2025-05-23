import { DRIZZLE } from '@/modules/infrastructure/drizzle/drizzle.module'
import {
    DbToken,
    tokens,
} from '@/modules/infrastructure/drizzle/schema/tokens.schema'
import {
    DbUser,
    users,
} from '@/modules/infrastructure/drizzle/schema/users.schema'
import { DrizzleDB } from '@/modules/infrastructure/drizzle/types/drizzle'
import { MailService } from '@/modules/infrastructure/mail/mail.service'
import { generateToken } from '@/shared/utils/common/generate-token.util'
import { getSessionMetadata } from '@/shared/utils/session/session-metadata.util'
import { saveSession } from '@/shared/utils/session/session.utils'
import {
    BadRequestException,
    Inject,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common'
import { and, eq } from 'drizzle-orm'
import type { FastifyRequest } from 'fastify'
import { TokenType } from '../account/enums/token-type.enum'
import { AuthModel } from '../account/models/auth.model'
import { User } from '../account/models/user.model'
import { VerificationInput } from './inputs/verification.input'

@Injectable()
export class VerificationService {
    private readonly logger: Logger = new Logger(VerificationService.name)

    constructor(
        private readonly mailService: MailService,
        @Inject(DRIZZLE) private readonly db: DrizzleDB,
    ) {}

    async verify(
        req: FastifyRequest,
        input: VerificationInput,
        userAgent: string,
    ): Promise<AuthModel> {
        const { token } = input

        const existingToken: DbToken = await this.db.query.tokens.findFirst({
            where: (t, { and, eq }) =>
                and(eq(t.token, token), eq(t.type, TokenType.EMAIL_VERIFY)),
        })

        if (!existingToken) {
            throw new NotFoundException('The token was not found')
        }

        const hasExpired: boolean =
            new Date(existingToken.expiresAt) < new Date()

        if (hasExpired) {
            throw new BadRequestException('The token is expired')
        }

        const userUpdate: Partial<DbUser> = {
            isVerified: true,
            emailVerifiedAt: new Date(),
        }

        const updatedUsers: User[] = await this.db
            .update(users)
            .set(userUpdate)
            .where(eq(users.id, existingToken.userId))
            .returning()

        const updatedUser = updatedUsers[0]
        if (!updatedUser) {
            throw new Error('Unexpected error: No user was updated')
        }

        await this.db
            .delete(tokens)
            .where(
                and(
                    eq(tokens.id, existingToken.id),
                    eq(tokens.type, TokenType.EMAIL_VERIFY),
                ),
            )

        const metadata = getSessionMetadata(req, userAgent)

        return saveSession(req, updatedUser, metadata)
    }

    async sendVerificationToken(user: User): Promise<boolean> {
        try {
            const generatedToken = await generateToken(
                this.db,
                user,
                TokenType.EMAIL_VERIFY,
            )

            await this.mailService.sendVerification(
                user.email,
                generatedToken.token,
            )

            return true
        } catch (error) {
            this.logger.error(
                `Failed to send verification token: ${error.message}`,
            )
            return false
        }
    }
}

import { TokenType } from '@/modules/auth/account/enums/token-type.enum'
import { User } from '@/modules/auth/account/models/user.model'
import {
    DbToken,
    tokens,
} from '@/modules/infrastructure/drizzle/schema/tokens.schema'
import { DrizzleDB } from '@/modules/infrastructure/drizzle/types/drizzle'
import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

export async function generateToken(
    db: DrizzleDB,
    user: User,
    type: TokenType,
    isUUID: boolean = true,
): Promise<DbToken> {
    const token: string = isUUID
        ? uuidv4()
        : Math.floor(Math.random() * (1000000 - 100000) + 100000).toString()

    const expiresAt = new Date(new Date().getTime() + 300000) // 5 min

    const existingToken: DbToken = await db.query.tokens.findFirst({
        where: (t, { and, eq }) => and(eq(t.type, type), eq(t.userId, user.id)),
    })

    if (existingToken) {
        await db.delete(tokens).where(eq(tokens.id, existingToken.id))
    }

    const newTokenData = {
        token,
        expiresAt,
        type,
        userId: user.id,
    }

    const [newToken] = await db.insert(tokens).values(newTokenData).returning()

    return newToken
}

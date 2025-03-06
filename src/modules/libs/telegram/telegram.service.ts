import { TokenType } from '@/modules/auth/account/enums/token-type.enum'
import { DRIZZLE } from '@/modules/drizzle/drizzle.module'
import { tokens } from '@/modules/drizzle/schema/tokens.schema'
import { DrizzleDB } from '@/modules/drizzle/types/drizzle'
import { FollowService } from '@/modules/follow/follow.service'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { eq } from 'drizzle-orm'
import { Command, Ctx, Start, Update } from 'nestjs-telegraf'
import { Context, Telegraf } from 'telegraf'
import { AccountService } from '../../auth/account/account.service'
import { BOT_BUTTONS } from './constants/bot-buttons.constant'
import { BOT_MESSAGES } from './constants/bot-messages.constant'

@Update()
@Injectable()
export class TelegramService extends Telegraf {
    private readonly logger: Logger = new Logger(TelegramService.name)
    private readonly _token: string

    constructor(
        private readonly configService: ConfigService,
        private readonly accountService: AccountService,
        private readonly followService: FollowService,
        @Inject(DRIZZLE) private readonly db: DrizzleDB,
    ) {
        super(configService.getOrThrow<string>('telegraf.token'))
        this._token = configService.getOrThrow<string>('telegraf.token')
    }

    @Start()
    async onStart(@Ctx() ctx: any) {
        const chatId = ctx.chat.id.toString()
        const token = ctx.message.text.split(' ')[1]

        if (!token) {
            const user = await this.accountService.findByTelegramId(chatId)

            if (user) {
                return await this.onMe(ctx)
            }

            return await ctx.replyWithHTML(
                BOT_MESSAGES.welcome,
                BOT_BUTTONS.profile,
            )
        }

        const authToken = await this.db.query.tokens.findFirst({
            where: (t, { and, eq }) =>
                and(eq(t.token, token), eq(t.type, TokenType.TELEGRAM_AUTH)),
        })

        if (!authToken) {
            return ctx.reply(BOT_MESSAGES.invalidToken)
        }

        const hasExpired: boolean = new Date(authToken.expiresAt) < new Date()

        if (hasExpired) {
            return ctx.reply(BOT_MESSAGES.invalidToken)
        }

        await this.accountService.connectTelegram(authToken.userId, chatId)

        await this.db.delete(tokens).where(eq(tokens.id, authToken.id))

        await ctx.replyWithHTML(
            BOT_MESSAGES.authSuccess,
            BOT_BUTTONS.authSuccess,
        )
    }

    @Command('me')
    async onMe(@Ctx() ctx: Context) {
        const chatId = ctx.chat.id.toString()
        const user = await this.accountService.findByTelegramId(chatId)
        const followersCount =
            await this.followService.findFollowersCountByUser(user.id)

        await ctx.replyWithHTML(
            BOT_MESSAGES.profile(user, followersCount),
            BOT_BUTTONS.profile,
        )
    }
}

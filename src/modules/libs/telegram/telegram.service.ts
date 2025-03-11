import { TokenType } from '@/modules/auth/account/enums/token-type.enum'
import { User } from '@/modules/auth/account/models/user.model'
import { DRIZZLE } from '@/modules/drizzle/drizzle.module'
import { tokens } from '@/modules/drizzle/schema/tokens.schema'
import { DrizzleDB } from '@/modules/drizzle/types/drizzle'
import { FollowService } from '@/modules/follow/follow.service'
import { SessionMetadata } from '@/shared/types/session-metadata.types'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { eq } from 'drizzle-orm'
import { Action, Command, Ctx, Start, Update } from 'nestjs-telegraf'
import { Context, Telegraf } from 'telegraf'
import { AccountService } from '../../auth/account/account.service'
import { BOT_BUTTONS } from './constants/bot-buttons.constant'
import { BOT_MESSAGES } from './constants/bot-messages.constant'

@Update()
@Injectable()
export class TelegramService extends Telegraf {
    private readonly logger: Logger = new Logger(TelegramService.name)

    constructor(
        private readonly configService: ConfigService,
        private readonly accountService: AccountService,
        private readonly followService: FollowService,
        @Inject(DRIZZLE) private readonly db: DrizzleDB,
    ) {
        super(configService.getOrThrow<string>('telegraf.token'))
    }

    @Start()
    async onStart(@Ctx() ctx: Context): Promise<void> {
        try {
            const chatId = ctx.chat.id.toString()
            const message = ctx.message as any
            const token = message?.text?.split(' ')[1]

            if (token) {
                await this.handleTokenAuthentication(ctx, token, chatId)
            } else {
                await this.handleInitialGreeting(ctx, chatId)
            }
        } catch (error) {
            this.logger.error(`Error in onStart: ${error.message}`, error.stack)
            await ctx.reply(BOT_MESSAGES.errorOccurred)
        }
    }

    private async handleTokenAuthentication(
        ctx: Context,
        token: string,
        chatId: string,
    ): Promise<void> {
        const authToken = await this.db.query.tokens.findFirst({
            where: (t, { and, eq }) =>
                and(eq(t.token, token), eq(t.type, TokenType.TELEGRAM_AUTH)),
        })

        if (!authToken || new Date(authToken.expiresAt) < new Date()) {
            await ctx.reply(BOT_MESSAGES.invalidToken)
            return
        }

        await this.accountService.connectTelegram(authToken.userId, chatId)
        await this.db.delete(tokens).where(eq(tokens.id, authToken.id))
        await ctx.replyWithHTML(
            BOT_MESSAGES.authSuccess,
            BOT_BUTTONS.authSuccess,
        )
    }

    private async handleInitialGreeting(
        ctx: Context,
        chatId: string,
    ): Promise<void> {
        const user = await this.accountService.findByTelegramId(chatId)

        if (user) {
            await this.onMe(ctx)
        } else {
            await ctx.replyWithHTML(BOT_MESSAGES.welcome, BOT_BUTTONS.profile)
        }
    }

    @Command('me')
    @Action('me')
    async onMe(@Ctx() ctx: Context): Promise<void> {
        try {
            const chatId = ctx.chat.id.toString()
            const user = await this.accountService.findByTelegramId(chatId)

            if (!user) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.userNotFound,
                    BOT_BUTTONS.profile,
                )
                return
            }

            const followersCount =
                await this.followService.findFollowersCountByUser(user.id)

            await ctx.replyWithHTML(
                BOT_MESSAGES.profile(user, followersCount),
                BOT_BUTTONS.profile,
            )
        } catch (error) {
            this.logger.error(`Error in onMe: ${error.message}`, error.stack)
            await ctx.replyWithHTML(BOT_MESSAGES.errorOccurred)
        }
    }

    @Command('follows')
    @Action('follows')
    async onFollows(@Ctx() ctx: Context) {
        try {
            const chatId = ctx.chat.id.toString()
            const user = await this.accountService.findByTelegramId(chatId)
            const userFollowings =
                await this.followService.findUserFollowings(user)

            if (userFollowings.length) {
                const userFollowingsList = userFollowings
                    .map((f) => BOT_MESSAGES.follows(f.following))
                    .join('\n')

                await ctx.replyWithHTML(
                    BOT_MESSAGES.followingsList(userFollowingsList),
                )
            } else {
                await ctx.replyWithHTML('<b>❌ Подписки отсутствуют.</b>')
            }
        } catch (error) {
            this.logger.error(
                `Error in onFollows: ${error.message}`,
                error.stack,
            )
        }
    }

    async sendPasswordResetToken(
        chatId: string,
        token: string,
        metadata: SessionMetadata,
    ): Promise<void> {
        await this.telegram.sendMessage(
            chatId,
            BOT_MESSAGES.resetPassword(token, metadata),
            { parse_mode: 'HTML' },
        )
    }

    async sendDeactivationToken(
        chatId: string,
        token: string,
        metadata: SessionMetadata,
    ): Promise<void> {
        await this.telegram.sendMessage(
            chatId,
            BOT_MESSAGES.accountDeactivation(token, metadata),
            { parse_mode: 'HTML' },
        )
    }

    async sendAccountDeletion(chatId: string): Promise<void> {
        await this.telegram.sendMessage(chatId, BOT_MESSAGES.accountDeleted, {
            parse_mode: 'HTML',
        })
    }

    async sendNewFollowing(chatId: string, follower: User): Promise<void> {
        const user = await this.accountService.findByTelegramId(chatId)

        await this.telegram.sendMessage(
            chatId,
            BOT_MESSAGES.newFollowing(follower, user.followers.length),
            {
                parse_mode: 'HTML',
            },
        )
    }

    async sendInfoNotification(chatId: string, message: string): Promise<void> {
        try {
            await this.telegram.sendMessage(chatId, message, {
                parse_mode: 'HTML',
            })
        } catch (error) {
            this.logger.error(
                `Failed to send info notification to ${chatId}: ${error.message}`,
                error.stack,
            )
        }
    }
}

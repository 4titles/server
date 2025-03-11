import { TokenType } from '@/modules/auth/account/enums/token-type.enum'
import { User } from '@/modules/auth/account/models/user.model'
import { ContentModerationService } from '@/modules/content-moderation/services/content-moderation.service'
import { DRIZZLE } from '@/modules/drizzle/drizzle.module'
import { tokens } from '@/modules/drizzle/schema/tokens.schema'
import { DrizzleDB } from '@/modules/drizzle/types/drizzle'
import { FeedbackType } from '@/modules/feedback/enums/feedback-type.enum'
import { FeedbackService } from '@/modules/feedback/feedback.service'
import { FollowService } from '@/modules/follow/follow.service'
import { SessionMetadata } from '@/shared/types/session-metadata.types'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { eq } from 'drizzle-orm'
import { Action, Command, Ctx, On, Start, Update } from 'nestjs-telegraf'
import { Context, Telegraf } from 'telegraf'
import { AccountService } from '../../auth/account/account.service'
import { BOT_BUTTONS } from './constants/bot-buttons.constant'
import { BOT_MESSAGES } from './constants/bot-messages.constant'

@Update()
@Injectable()
export class TelegramService extends Telegraf {
    private readonly logger: Logger = new Logger(TelegramService.name)

    private readonly feedbackStates: Map<
        string,
        {
            type: FeedbackType
            step: 'message' | 'rating'
            message?: string
            attempts: number
        }
    > = new Map()

    constructor(
        private readonly configService: ConfigService,
        private readonly accountService: AccountService,
        private readonly followService: FollowService,
        private readonly feedbackService: FeedbackService,
        private readonly contentModerationService: ContentModerationService,
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

            if (!user) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.userNotFound,
                    BOT_BUTTONS.profile,
                )
                return
            }

            const userFollowings =
                await this.followService.findUserFollowings(user)

            if (userFollowings.length) {
                const userFollowingsList = userFollowings
                    .map((f) => BOT_MESSAGES.follows(f.following))
                    .join('\n')

                await ctx.replyWithHTML(
                    BOT_MESSAGES.followingsList(userFollowingsList),
                    BOT_BUTTONS.profile,
                )
            } else {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.followingsNotFound,
                    BOT_BUTTONS.profile,
                )
            }
        } catch (error) {
            this.logger.error(
                `Error in onFollows: ${error.message}`,
                error.stack,
            )

            await ctx.replyWithHTML(BOT_MESSAGES.errorOccurred)
        }
    }

    @Command('feedback')
    @Action('feedback')
    async onFeedback(@Ctx() ctx: Context): Promise<void> {
        try {
            await ctx.replyWithHTML(
                BOT_MESSAGES.feedbackIntro,
                BOT_BUTTONS.feedback,
            )
        } catch (error) {
            this.logger.error(
                `Error in feedback command: ${error.message}`,
                error.stack,
            )
            await ctx.reply(BOT_MESSAGES.errorOccurred)
        } finally {
            if (ctx.callbackQuery) {
                await ctx.answerCbQuery()
            }
        }
    }

    @Action(/feedback_(general|bug|feature|cancel)/)
    async onFeedbackType(@Ctx() ctx: any): Promise<void> {
        try {
            const chatId = ctx.chat.id.toString()
            const match = ctx.match[1]

            if (match === 'cancel') {
                await ctx.answerCbQuery('Отменено')
                try {
                    await ctx.deleteMessage()
                } catch (error) {
                    this.logger.error(
                        `Failed to delete message: ${error.message}`,
                    )
                }
                this.feedbackStates.delete(chatId)
                return
            }

            let type: FeedbackType
            let message: string

            switch (match) {
                case 'general':
                    type = FeedbackType.GENERAL
                    message = 'Пожалуйста, напишите ваш отзыв о сервисе:'
                    break
                case 'bug':
                    type = FeedbackType.BUG_REPORT
                    message = 'Опишите проблему как можно подробнее:'
                    break
                case 'feature':
                    type = FeedbackType.FEATURE_REQUEST
                    message = 'Опишите ваше предложение по улучшению сервиса:'
                    break
            }

            await ctx.answerCbQuery()

            try {
                await ctx.deleteMessage()
            } catch {}

            this.feedbackStates.set(chatId, {
                type,
                step: 'message',
                attempts: 0,
            })
            await ctx.reply(message)
        } catch (error) {
            this.logger.error(
                `Error in feedback type selection: ${error.message}`,
                error.stack,
            )
            await ctx.replyWithHTML(BOT_MESSAGES.errorOccurred)
        }
    }

    @On('text')
    async onText(@Ctx() ctx: any): Promise<void> {
        try {
            const chatId = ctx.chat.id.toString()
            const feedbackState = this.feedbackStates.get(chatId)

            if (!feedbackState) {
                return
            }

            if (feedbackState.step === 'message') {
                const message = ctx.message.text

                if (message.trim().length < 5) {
                    await ctx.replyWithHTML(BOT_MESSAGES.shortFeedbackReply)
                    return
                }

                const isMessageValid =
                    await this.contentModerationService.validateContent({
                        text: message,
                    })

                if (!isMessageValid) {
                    feedbackState.attempts++
                    if (feedbackState.attempts >= 3) {
                        await ctx.replyWithHTML(
                            'Вы превысили максимально допустимое количество попыток ввода корректного сообщения. Попробуйте позже.',
                            BOT_BUTTONS.profile,
                        )
                        this.feedbackStates.delete(chatId)
                        return
                    }
                    await ctx.replyWithHTML(BOT_MESSAGES.invalidContent)
                    return
                }

                this.feedbackStates.set(chatId, {
                    type: feedbackState.type,
                    step: 'rating',
                    message,
                    attempts: feedbackState.attempts,
                })

                await ctx.replyWithHTML(
                    BOT_MESSAGES.feedbackSentReply,
                    BOT_BUTTONS.rating,
                )
            }
        } catch (error) {
            this.logger.error(
                `Error processing text message: ${error.message}`,
                error.stack,
            )
            await ctx.replyWithHTML(BOT_MESSAGES.errorOccurred)
        }
    }

    @Action(/rating_([1-5]|skip)/)
    async onRating(@Ctx() ctx: any): Promise<void> {
        try {
            const chatId = ctx.chat.id.toString()
            const feedbackState = this.feedbackStates.get(chatId)

            if (!feedbackState || feedbackState.step !== 'rating') {
                await ctx.answerCbQuery('Ошибка: рейтинг не ожидается')
                return
            }

            const match = ctx.match[1]
            let rating: number | undefined

            if (match !== 'skip') {
                rating = parseInt(match, 10)
            }

            const message = feedbackState.message

            this.feedbackStates.delete(chatId)

            await ctx.answerCbQuery(
                rating ? `Ваша оценка: ${rating}` : 'Оценка пропущена',
            )

            try {
                const user = await this.accountService.findByTelegramId(chatId)

                await this.feedbackService.createFromTelegram(
                    user,
                    message,
                    feedbackState.type,
                    rating,
                )

                try {
                    await ctx.deleteMessage()
                } catch {}

                await ctx.replyWithHTML(
                    BOT_MESSAGES.feedbackAndRatingSentReply(rating),
                    BOT_BUTTONS.profile,
                )
            } catch (error) {
                this.logger.error(
                    `Error creating feedback from telegram: ${error.message}`,
                    error.stack,
                )

                await ctx.replyWithHTML(
                    BOT_MESSAGES.feedbackSaveFailed,
                    BOT_BUTTONS.profile,
                )
            }
        } catch (error) {
            this.logger.error(
                `Error processing rating: ${error.message}`,
                error.stack,
            )
            await ctx.replyWithHTML(BOT_MESSAGES.errorOccurred)
        }
    }

    async sendPasswordResetToken(
        chatId: string,
        token: string,
        metadata: SessionMetadata,
    ): Promise<void> {
        try {
            await this.telegram.sendMessage(
                chatId,
                BOT_MESSAGES.resetPassword(token, metadata),
                { parse_mode: 'HTML' },
            )
        } catch (error) {
            this.logger.error(
                `Failed to send password reset token to ${chatId}: ${error.message}`,
                error.stack,
            )
        }
    }

    async sendDeactivationToken(
        chatId: string,
        token: string,
        metadata: SessionMetadata,
    ): Promise<void> {
        try {
            await this.telegram.sendMessage(
                chatId,
                BOT_MESSAGES.accountDeactivation(token, metadata),
                { parse_mode: 'HTML' },
            )
        } catch (error) {
            this.logger.error(
                `Failed to send deactivation token to ${chatId}: ${error.message}`,
                error.stack,
            )
        }
    }

    async sendAccountDeletion(chatId: string): Promise<void> {
        try {
            await this.telegram.sendMessage(
                chatId,
                BOT_MESSAGES.accountDeleted,
                {
                    parse_mode: 'HTML',
                },
            )
        } catch (error) {
            this.logger.error(
                `Failed to send account deletion notification to ${chatId}: ${error.message}`,
                error.stack,
            )
        }
    }

    async sendNewFollowing(chatId: string, follower: User): Promise<void> {
        try {
            const user = await this.accountService.findByTelegramId(chatId)

            if (!user) {
                this.logger.warn(`User not found for Telegram ID: ${chatId}`)
                return
            }

            await this.telegram.sendMessage(
                chatId,
                BOT_MESSAGES.newFollowing(follower, user.followers.length),
                {
                    parse_mode: 'HTML',
                },
            )
        } catch (error) {
            this.logger.error(
                `Failed to send new following notification to ${chatId}: ${error.message}`,
                error.stack,
            )
        }
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

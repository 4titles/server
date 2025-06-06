import { TokenType } from '@/modules/auth/account/enums/token-type.enum'
import { User } from '@/modules/auth/account/models/user.model'
import { ProfileService } from '@/modules/auth/profile/profile.service'
import { FeedbackType } from '@/modules/content/feedback/enums/feedback-type.enum'
import { FeedbacksLimitExceededException } from '@/modules/content/feedback/exceptions/feedbacks-limit-exceeded.exception'
import { FeedbackService } from '@/modules/content/feedback/feedback.service'
import { FollowService } from '@/modules/content/follow/follow.service'
import { DRIZZLE } from '@/modules/infrastructure/drizzle/drizzle.module'
import { tokens } from '@/modules/infrastructure/drizzle/schema/tokens.schema'
import { DrizzleDB } from '@/modules/infrastructure/drizzle/types/drizzle'
import { TelegramUserContextService } from '@/modules/infrastructure/telegram/telegram-user-context.service'
import { SessionMetadata } from '@/shared/types/session-metadata.types'
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { eq } from 'drizzle-orm'
import {
    Action,
    Command,
    Ctx,
    InjectBot,
    On,
    Start,
    Update,
} from 'nestjs-telegraf'
import { Context, Telegraf } from 'telegraf'
import { AccountService } from '../../auth/account/account.service'
import { BOT_BUTTONS } from './constants/bot-buttons.constant'
import { BOT_COMMANDS } from './constants/bot-commands.constant'
import { BOT_MESSAGES } from './constants/bot-messages.constant'
import { FeedbackState } from './interfaces/feedback-state.interface'

@Update()
@Injectable()
export class TelegramService {
    private readonly logger: Logger = new Logger(TelegramService.name)
    private readonly feedbackStates: Map<string, FeedbackState> = new Map()

    constructor(
        @InjectBot() private readonly bot: Telegraf,
        private readonly configService: ConfigService,
        @Inject(forwardRef(() => AccountService))
        private readonly accountService: AccountService,
        private readonly profileService: ProfileService,
        private readonly followService: FollowService,
        private readonly feedbackService: FeedbackService,
        private readonly userContextService: TelegramUserContextService,
        @Inject(DRIZZLE) private readonly db: DrizzleDB,
    ) {}

    async onModuleInit() {
        try {
            this.logger.log('Setting bot commands on module init...')
            await this.bot.telegram.setMyCommands(BOT_COMMANDS)
        } catch (error) {
            this.logger.error(
                `Error setting commands: ${error.message}`,
                error.stack,
            )
        }
    }

    @Start()
    async onStart(@Ctx() ctx: Context): Promise<void> {
        try {
            this.logger.log('Handling /start command')
            const chatId = ctx.chat.id.toString()
            const message = ctx.message as any
            const token = message?.text?.split(' ')[1]
            this.logger.log(`Token: ${token}`)

            if (token) {
                this.logger.log('Handling token authentication...')
                await this.handleTokenAuthentication(ctx, token, chatId)
            } else {
                this.logger.log('Handling initial greeting...')
                await this.handleInitialGreeting(ctx, chatId)
            }
        } catch (error) {
            this.logger.error(`Error in onStart: ${error.message}`, error.stack)
            await ctx.replyWithHTML(BOT_MESSAGES.errorOccurred)
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
            await ctx.replyWithHTML(BOT_MESSAGES.invalidToken)
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
        const user = await this.userContextService.getUserByChatId(chatId)

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
            const user = await this.userContextService.getUserByChatId(chatId)
            this.userContextService.clearUserCache(user.id, chatId)

            if (!user) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.userNotFound,
                    BOT_BUTTONS.profile,
                )
                return
            }

            const [followersCount, avatarUrl] = await Promise.all([
                this.followService.findFollowersCountByUser(user.id),
                user.avatar ? this.profileService.getAvatarUrl(user) : null,
            ])

            const profileMessage = BOT_MESSAGES.profile(user, followersCount)
            const messageOptions = {
                parse_mode: 'HTML' as const,
                ...BOT_BUTTONS.profile,
            }

            if (avatarUrl) {
                try {
                    await ctx.replyWithPhoto(
                        { url: avatarUrl },
                        {
                            caption: profileMessage,
                            ...messageOptions,
                        },
                    )
                    return
                } catch (photoError) {
                    this.logger.warn(
                        `Failed to send photo for user ${user.id}, falling back to text: ${photoError.message}`,
                        { stack: photoError.stack, avatarUrl },
                    )
                }
            }

            await ctx.replyWithHTML(profileMessage, messageOptions)
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
            const user = await this.userContextService.getUserByChatId(chatId)

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
            const chatId = ctx.chat.id.toString()
            const user = await this.userContextService.getUserByChatId(chatId)

            if (!user) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.userNotFound,
                    BOT_BUTTONS.profile,
                )
                return
            }

            const wouldExceedLimit =
                await this.feedbackService.wouldExceedFeedbackLimit(user.id)

            if (wouldExceedLimit) {
                await ctx.replyWithHTML(BOT_MESSAGES.feedbackRateLimitExceeded)
                return
            }

            await ctx.replyWithHTML(
                BOT_MESSAGES.feedbackIntro,
                BOT_BUTTONS.feedback,
            )
        } catch (error) {
            this.logger.error(
                `Error in feedback command: ${error.message}`,
                error.stack,
            )
            await ctx.replyWithHTML(BOT_MESSAGES.errorOccurred)
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
                await this.safeDeleteMessage(ctx)
                this.feedbackStates.delete(chatId)
                return
            }

            const user = await this.userContextService.getUserByChatId(chatId)
            if (!user) {
                await ctx.answerCbQuery('Пользователь не найден')
                return
            }
            await ctx.replyWithHTML(BOT_MESSAGES.errorOccurred)

            const wouldExceedLimit =
                await this.feedbackService.wouldExceedFeedbackLimit(user.id)

            if (wouldExceedLimit) {
                await ctx.answerCbQuery('Лимит отзывов превышен')
                await this.safeDeleteMessage(ctx)
                await ctx.replyWithHTML(BOT_MESSAGES.feedbackRateLimitExceeded)
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
            await this.safeDeleteMessage(ctx)

            this.feedbackStates.set(chatId, {
                type,
                userId: user.id,
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
                await this.handleFeedbackMessage(ctx, chatId, feedbackState)
            }
        } catch (error) {
            this.logger.error(
                `Error processing text message: ${error.message}`,
                error.stack,
            )
            await ctx.replyWithHTML(BOT_MESSAGES.errorOccurred)
        }
    }

    private async handleFeedbackMessage(
        ctx: any,
        chatId: string,
        feedbackState: FeedbackState,
    ): Promise<void> {
        const message = ctx.message.text

        if (message.trim().length < 5) {
            await ctx.replyWithHTML(BOT_MESSAGES.shortFeedbackReply)
            return
        }

        const wouldExceedLimit =
            await this.feedbackService.wouldExceedFeedbackLimit(
                feedbackState.userId,
            )

        if (wouldExceedLimit) {
            await ctx.replyWithHTML(BOT_MESSAGES.feedbackRateLimitExceeded)
            this.feedbackStates.delete(chatId)
            return
        }

        const validation =
            await this.feedbackService.validateFeedbackMessage(message)

        if (!validation.isValid) {
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
            ...feedbackState,
            step: 'rating',
            message,
        })

        await ctx.replyWithHTML(
            BOT_MESSAGES.feedbackSentReply,
            BOT_BUTTONS.rating,
        )
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

            try {
                const user = await this.userContextService.getUserById(
                    feedbackState.userId,
                )

                if (!user) {
                    await ctx.answerCbQuery('Пользователь не найден')
                    return
                }

                await this.feedbackService.createFromTelegram(
                    user,
                    feedbackState.message,
                    feedbackState.type,
                    rating,
                )

                await ctx.answerCbQuery(
                    rating ? `Ваша оценка: ${rating}` : 'Оценка пропущена',
                )

                await this.safeDeleteMessage(ctx)

                await ctx.replyWithHTML(
                    BOT_MESSAGES.feedbackAndRatingSentReply(rating),
                    BOT_BUTTONS.profile,
                )
            } catch (error) {
                if (error instanceof FeedbacksLimitExceededException) {
                    await ctx.replyWithHTML(
                        BOT_MESSAGES.feedbackRateLimitExceeded,
                    )
                } else {
                    this.logger.error(
                        `Error creating feedback from telegram: ${error.message}`,
                        error.stack,
                    )
                    await ctx.replyWithHTML(
                        BOT_MESSAGES.feedbackSaveFailed,
                        BOT_BUTTONS.profile,
                    )
                }
            } finally {
                this.feedbackStates.delete(chatId)
            }
        } catch (error) {
            this.logger.error(
                `Error processing rating: ${error.message}`,
                error.stack,
            )
            await ctx.replyWithHTML(BOT_MESSAGES.errorOccurred)
        }
    }

    private async safeDeleteMessage(ctx: any): Promise<void> {
        try {
            await ctx.deleteMessage()
        } catch (error) {
            this.logger.debug(`Failed to delete message: ${error.message}`)
        }
    }

    async sendPasswordResetToken(
        chatId: string,
        token: string,
        metadata: SessionMetadata,
    ): Promise<void> {
        try {
            await this.bot.telegram.sendMessage(
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
            await this.bot.telegram.sendMessage(
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
            await this.bot.telegram.sendMessage(
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
            const user = await this.userContextService.getUserByChatId(chatId)

            if (!user) {
                this.logger.warn(`User not found for Telegram ID: ${chatId}`)
                return
            }

            await this.bot.telegram.sendMessage(
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
            await this.bot.telegram.sendMessage(chatId, message, {
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

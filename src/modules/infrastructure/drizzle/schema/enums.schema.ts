import { TokenType } from '@/modules/auth/account/enums/token-type.enum'
import { Role } from '@/modules/auth/rbac/enums/roles.enum'
import { FeedbackSource } from '@/modules/content/feedback/enums/feedback-source.enum'
import { FeedbackStatus } from '@/modules/content/feedback/enums/feedback-status.enum'
import { FeedbackType } from '@/modules/content/feedback/enums/feedback-type.enum'
import { CommentableType } from '@/modules/content/title/enums/commentable-type.enum'
import { TitleCategory } from '@/modules/content/title/enums/title-category.enum'
import { TitleLanguageType } from '@/modules/content/title/enums/title-language-type.enum'
import { TitleStatus } from '@/modules/content/title/enums/title-status.enum'
import { TitleType } from '@/modules/content/title/enums/title-type.enum'
import { CountryRelation } from '@/modules/content/title/modules/country/enums/country-relation.enum'
import { pgEnum } from 'drizzle-orm/pg-core'
import { NotificationType } from '../../notification/enums/notification-type.enum'

export const titleCategoryEnum = pgEnum('title_category', [
    TitleCategory.POPULAR,
    TitleCategory.TOP_RATED,
    TitleCategory.TRENDING,
    TitleCategory.UPCOMING,
    TitleCategory.AIRING,
    TitleCategory.REGULAR,
])

export const titleTypeEnum = pgEnum('title_type', [
    TitleType.MOVIE,
    TitleType.TV,
])

export const titleStatusEnum = pgEnum('title_status', [
    TitleStatus.RUMORED,
    TitleStatus.PLANNED,
    TitleStatus.IN_PRODUCTION,
    TitleStatus.POST_PRODUCTION,
    TitleStatus.RELEASED,
    TitleStatus.CANCELED,
    TitleStatus.AIRING,
])

export const titleLanguageTypeEnum = pgEnum('title_language_type', [
    TitleLanguageType.ORIGINAL,
    TitleLanguageType.SPOKEN,
    TitleLanguageType.AVAILABLE,
])

export const commentableTypeEnum = pgEnum('commentable_type', [
    CommentableType.TITLE,
    CommentableType.LOCATION,
])

export const tokenTypeEnum = pgEnum('token_type_enum', [
    TokenType.EMAIL_VERIFY,
    TokenType.PASSWORD_RESET,
    TokenType.DEACTIVATE_ACCOUNT,
    TokenType.TELEGRAM_AUTH,
])

export const userRoleEnum = pgEnum('user_role', [
    Role.USER,
    Role.MODERATOR,
    Role.ADMIN,
])

export const notificationTypeEnum = pgEnum('notification_type_enum', [
    NotificationType.ENABLE_TWO_FACTOR,
    NotificationType.NEW_FOLLOWER,
    NotificationType.NEW_FAVORITE_TITLE_LOCATION,
    NotificationType.INFO,
])

export const feedbackTypeEnum = pgEnum('feedback_type_enum', [
    FeedbackType.GENERAL,
    FeedbackType.BUG_REPORT,
    FeedbackType.FEATURE_REQUEST,
    FeedbackType.CONTENT_ISSUE,
    FeedbackType.OTHER,
])

export const feedbackSourceEnum = pgEnum('feedback_source_enum', [
    FeedbackSource.WEBSITE,
    FeedbackSource.TELEGRAM,
    FeedbackSource.EMAIL,
    FeedbackSource.OTHER,
])

export const feedbackStatusEnum = pgEnum('feedback_status_enum', [
    FeedbackStatus.NEW,
    FeedbackStatus.IN_PROGRESS,
    FeedbackStatus.RESOLVED,
    FeedbackStatus.CLOSED,
    FeedbackStatus.REJECTED,
])

export const countryRelationTypeEnum = pgEnum('country_relation_type', [
    CountryRelation.PRODUCTION,
    CountryRelation.ORIGIN,
])

import { User } from '@/modules/auth/account/models/user.model'
import { SessionMetadata } from '@/shared/types/session-metadata.types'
import {
    getFollowerMilestoneMessage,
    getFollowersEmoji,
} from '../utils/bot.utils'

export interface BotMessages {
    welcome: string
    authSuccess: string
    invalidToken: string
    profile: (user: User, followersCount: number) => string
    follows: (user: User) => string
    resetPassword: (token: string, metadata: SessionMetadata) => string
    deactivate: (token: string, metadata: SessionMetadata) => string
    accountDeleted: string
    newFollowing: (follower: User, followersCount: number) => string
    followingsList: (followingsList: string) => string
    enableTwoFactor: string
    errorOccurred: string
    userNotFound: string
}

export const BOT_MESSAGES: BotMessages = {
    welcome:
        `<b>🎬 Добро пожаловать в 4Titles Bot — бот гида по миру киносъёмок! 🎥</b>\n\n` +
        `На платформе Вы сможете сохранять любимые кинолокации, участвовать в обсуждениях и первым узнавать о новых точках съёмок. Для получения уведомлений о новых локациях от авторов, на которых вы подписаны, завершите подключение Telegram в разделе <b>Уведомления</b>.`,

    authSuccess:
        `<b>✅ Ваш Telegram успешно подключён к 4Titles!</b>\n\n` +
        `Теперь вы будете получать уведомления о:\n` +
        `• Новых локациях от авторов, на которых подписаны\n` +
        `• Комментариях к вашим сохранённым точкам\n` +
        `• Статусе ваших заявок на добавление локаций`,

    invalidToken:
        `<b>⚠️ Ошибка подключения</b>\n\n` +
        `Ссылка для авторизации устарела или недействительна. Пожалуйста, запросите новую ссылку в настройках профиля на сайте.`,

    profile: (user: User, followersCount: number) =>
        `<b>📽 Профиль исследователя кинолокаций</b>\n\n` +
        `👤 Имя пользователя: <b>${user.username}</b>\n` +
        `📧 Email: <b>${user.email}</b>\n` +
        `👥 Количество подписчиков: ${followersCount} ${getFollowersEmoji(followersCount)}\n` +
        `📝 О себе: ${user.bio || 'Расскажите о вашем интересе к киносъёмкам!'}\n\n` +
        `🔧 Нажмите на кнопку ниже, чтобы перейти к настройкам профиля.`,

    follows: (user: User) =>
        `🔔 Новый подписчик: <a href="https://4titles.ru/${user.username}">${user.username}</a>\n` +
        `Теперь они будут получать уведомления о новых локациях, которые вы добавляете.`,

    resetPassword: (token: string, metadata: SessionMetadata) =>
        `<b>🔐 Запрос сброса пароля</b>\n\n` +
        `Для вашего аккаунта на сервисе кинолокаций 4Titles был запрошен сброс пароля:\n\n` +
        `<b><a href="https://4titles.ru/account/recovery/${token}">Установить новый пароль</a></b>\n\n` +
        `📅 Дата запроса: ${new Date().toLocaleDateString()} в ${new Date().toLocaleTimeString()}\n` +
        `📍 Место: ${metadata.location.city}, ${metadata.location.country}\n` +
        `📱 Устройство: ${metadata.device.browser} (${metadata.device.os})\n\n` +
        `Если это были не вы, немедленно свяжитесь с нашей поддержкой.`,

    deactivate: (token: string, metadata: SessionMetadata) =>
        `<b>⚠️ Подтверждение удаления аккаунта</b>\n\n` +
        `Код подтверждения: ${token}\n\n` +
        `После удаления аккаунта:\n` +
        `• Все ваши сохранённые локации останутся в базе\n` +
        `• Ваши комментарии будут анонимизированы\n` +
        `• У вас есть 7 дней на отмену операции\n\n` +
        `Запрос выполнен с устройства ${metadata.device.browser} (${metadata.device.os}) в ${metadata.location.country}`,

    accountDeleted:
        `<b>🗑 Аккаунт успешно удалён</b>\n\n` +
        `Благодарим за участие в сообществе исследователей кинолокаций! Ваш вклад в развитие базы локаций останется доступным для всех пользователей.\n\n` +
        `Всегда рады видеть вас снова → <a href="https://4titles.ru/account/create">Создать аккаунт</a>`,

    newFollowing: (follower: User, followersCount: number) =>
        `<b>🌟 Новый подписчик!</b>\n\n` +
        `<a href="https://4titles.ru/${follower.username}">${follower.displayName}</a> будет получать уведомления о ваших новых локациях.\n\n` +
        `${getFollowerMilestoneMessage(followersCount)}\n` +
        `Всего подписчиков: ${followersCount} ${getFollowersEmoji(followersCount)}`,

    followingsList: (followingsList: string) =>
        `<b>🌟 Каналы на который вы подписаны:</b>\n\n${followingsList}`,

    enableTwoFactor:
        `<b>🔒 Защитите свой аккаунт</b>\n\n` +
        `Включите двухфакторную аутентификацию для защиты вашей коллекции локаций и персональных данных → <a href="https://4titles.ru/dashboard/settings">Настройки безопасности</a>`,

    errorOccurred:
        `<b>⚠️ Произошла ошибка</b>\n\n` +
        `К сожалению, при обработке вашего запроса произошла ошибка. Пожалуйста, повторите попытку позже или свяжитесь с нашей поддержкой, если проблема сохраняется.`,

    userNotFound:
        `<b>❌ Профиль не найден</b>\n\n` +
        `Ваш аккаунт не подключен к Telegram или был удален. Пожалуйста, войдите в свой аккаунт на сайте и подключите Telegram в настройках профиля.`,
}

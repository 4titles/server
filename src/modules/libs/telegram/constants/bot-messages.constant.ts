import { User } from '@/modules/auth/account/models/user.model'
import { SessionMetadata } from '@/shared/types/session-metadata.types'
import { getFollowersEmoji } from '../utils/bot.utils'

export interface BotMessages {
    welcome: string
    authSuccess: string
    invalidToken: string
    profile: (user: User, followersCount: number) => string
    follows: (user: User) => string
    resetPassword: (token: string, metadata: SessionMetadata) => string
    accountDeactivation: (token: string, metadata: SessionMetadata) => string
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
        `На платформе Вы сможете сохранять любимые кинолокации, участвовать в обсуждениях и первым узнавать о новых точках съёмок. Для получения уведомлений о новых локациях от авторов, на которых Вы подписаны, завершите подключение Telegram в разделе <b>Уведомления</b>.`,

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
        `<b>🔐 Cброс пароля</b>\n\n` +
        `Для вашего аккаунта был запрошен сброс пароля.\n\n` +
        `Чтобы создать новый пароль, пожалуйста, перейдите по следующей ссылке:\n\n` +
        `<b><a href="https://4titles.ru/account/recovery/${token}">Сбросить пароль</a></b>\n\n` +
        `<b>Информация о запросе:</b>\n\n` +
        `📅 Дата запроса: ${new Date().toLocaleDateString()} в ${new Date().toLocaleTimeString()}\n` +
        `📍 Место: ${metadata.location.city}, ${metadata.location.country.ru}\n` +
        `📱 Устройство: ${metadata.device.browser} (${metadata.device.os})\n` +
        `💻 <b>IP-адрес:</b> ${metadata.ip}\n\n` +
        `Если Вы не инициировали данный запрос, то, пожалуйста, проигорируйте данное сообщение.\n\n` +
        `Благодарим за использование <b>4Titles</b>! 🚀`,

    accountDeactivation: (token: string, metadata: SessionMetadata) =>
        `<b>⚠️ Подтверждение удаления аккаунта</b>\n\n` +
        `Вы инициировали процесс деактивации вашего аккаунта на платформе <b>4Titles</b>.\n\n` +
        `Для завершения операции, пожалуйста, подтвердите свой запрос, введя следующий код подтверждения:\n\n` +
        `<b>Код подтверждения: ${token}</b>\n\n` +
        `<b>Информация о запросе:</b>\n\n` +
        `📅 Дата запроса: ${new Date().toLocaleDateString()} в ${new Date().toLocaleTimeString()}\n` +
        `📍 Место: ${metadata.location.city}, ${metadata.location.country.ru}\n` +
        `📱 Устройство: ${metadata.device.browser} (${metadata.device.os})\n` +
        `💻 <b>IP-адрес:</b> ${metadata.ip}\n\n` +
        `<b>Что произойдет после деактивации?</b>\n\n` +
        `• Будет осуществлён автоматический выход из системы и Вы потеряете доступ к аккаунту.\n` +
        `• Все добавленные Вами локации останутся в базе и будут анонимизированы\n` +
        `Если Вы не отмените деактивацию в течение 7 дней, ваш аккаунт будет <b>безвозвратно удален</b> со всей вашей информацией, данными и подписками.\n\n` +
        `<b>⏳ Обратите внимание:</b> Если в течение 7 дней Вы передумаете, Вы можете обратиться в нашу поддержку для восстановления доступа к вашему аккаунту до момента его полного удаления.\n\n` +
        `После удаления аккаунта восстановить его будет невозможно, и все данные будут потеряны без возможности восстановления.\n\n` +
        `Если Вы передумали, просто проигнорируйте это сообщение. Ваш аккаунт останется активным.\n\n` +
        `Спасибо, что пользуетесь <b>4Titles</b>! Мы всегда рады видеть Вас на нашей платформе и надеемся, что Вы останетесь с нами. 🚀\n\n` +
        `С уважением,\n` +
        `Команда 4Titles`,

    accountDeleted:
        `<b>🗑 Ваш Аккаунт был полностью удалён</b>\n\n` +
        `🔒 Вы больше не будете получать уведомления в Telegram и на почту.\n\n` +
        `Благодарим за участие в сообществе исследователей кинолокаций! Ваш вклад в развитие базы локаций останется доступным для всех пользователей.\n\n` +
        `Если вы захотите вернуться на платформу, вы можете зарегистрироваться по следующей ссылке:\n` +
        `<b><a href="https://4titles.ru/account/create">Зарегистрироваться на 4Titles</a></b>\n\n` +
        `Спасибо, что были с нами! Мы всегда будем рады видеть вас на платформе. 🚀\n\n` +
        `С уважением,\n` +
        `Команда 4Titles`,

    newFollowing: (follower: User, followersCount: number) =>
        `<b>🌟 Новый подписчик!</b>\n\n` +
        `<a href="https://4titles.ru/${follower.username}">${follower.displayName}</a> подписался на Ваши обновления.\n\n` +
        `Всего подписчиков: ${followersCount} ${getFollowersEmoji(followersCount)}`,

    followingsList: (followingsList: string) =>
        `<b>🌟 Каналы на который Вы подписаны:</b>\n\n${followingsList}`,

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

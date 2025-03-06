import { User } from '@/modules/auth/account/models/user.model'
import { SessionMetadata } from '@/shared/types/session-metadata.types'

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
    enableTwoFactor: string
}

export const BOT_MESSAGES: BotMessages = {
    welcome:
        `<b>✨ Добро пожаловать в мир 4Titles! ✨</b>\n\n` +
        `Ваше путешествие в мире контента только начинается! Чтобы получать мгновенные уведомления и раскрыть полный потенциал платформы, давайте свяжем ваш Telegram с 4Titles.\n\n` +
        `🔮 Нажмите кнопку ниже и перейдите в раздел <b>Уведомления</b>, чтобы завершить настройку и открыть для себя новые возможности.`,

    authSuccess:
        `<b>🎉 Потрясающе! Ваш Telegram аккаунт успешно связан с 4Titles! 🎉</b>\n\n` +
        `Теперь вы будете получать мгновенные уведомления и сможете управлять своим аккаунтом прямо из Telegram. Добро пожаловать в семью 4Titles!`,

    invalidToken:
        `<b>❌ Упс! Что-то пошло не так...</b>\n\n` +
        `Токен, который вы использовали, недействителен или истёк срок его действия. Пожалуйста, повторите процесс авторизации или обратитесь в нашу службу поддержки для получения помощи.`,

    profile: (user: User, followersCount: number) =>
        `<b>👑 Ваш эксклюзивный профиль 4Titles</b>\n\n` +
        `<b>${user.username}</b> — вы уникальны в мире контента!\n\n` +
        `📧 <b>Email:</b> ${user.email}\n` +
        `🌟 <b>Подписчиков:</b> ${followersCount} ${getFollowersEmoji(followersCount)}\n` +
        `📝 <b>О себе:</b> ${user.bio || 'Расскажите миру о себе!'}\n\n` +
        `🛠️ Хотите персонализировать свой профиль дальше? Нажмите кнопку ниже, чтобы перейти к настройкам и сделать ваш профиль ещё ярче!`,

    follows: (user: User) =>
        `🔔 <a href="https://4titles.ru/${user.username}">${user.username}</a> — новый голос в вашей творческой вселенной!`,

    resetPassword: (token: string, metadata: SessionMetadata) =>
        `<b>🔐 Перезагрузка безопасности вашего аккаунта</b>\n\n` +
        `Мы получили запрос на сброс пароля для вашей учетной записи на платформе <b>4Titles</b>.\n\n` +
        `⚡️ Для создания нового пароля, просто нажмите на кнопку ниже:\n\n` +
        `<b><a href="https://4titles.ru/account/recovery/${token}">Создать новый пароль</a></b>\n\n` +
        `📊 <b>Детали запроса:</b>\n` +
        `• 🗓️ <b>Дата:</b> ${formatDate(new Date())}\n` +
        `• 🌎 <b>Место:</b> ${metadata.location.city}, ${metadata.location.country}\n` +
        `• 💻 <b>Устройство:</b> ${metadata.device.os}, ${metadata.device.browser}\n` +
        `• 🔍 <b>IP-адрес:</b> ${metadata.ip}\n\n` +
        `⚠️ Если вы не запрашивали изменение пароля, пожалуйста, проигнорируйте это сообщение и примите дополнительные меры для защиты вашего аккаунта.\n\n` +
        `С заботой о вашей безопасности,\n` +
        `<b>Команда 4Titles</b> 🛡️`,

    deactivate: (token: string, metadata: SessionMetadata) =>
        `<b>⚠️ Подтверждение деактивации аккаунта</b>\n\n` +
        `Мы получили запрос на деактивацию вашего аккаунта на платформе <b>4Titles</b>.\n\n` +
        `🔑 <b>Ваш код подтверждения:</b> ${token}\n\n` +
        `📊 <b>Информация о запросе:</b>\n` +
        `• 🗓️ <b>Дата:</b> ${formatDate(new Date())}\n` +
        `• 🌎 <b>Место:</b> ${metadata.location.city}, ${metadata.location.country}\n` +
        `• 💻 <b>Устройство:</b> ${metadata.device.os}, ${metadata.device.browser}\n` +
        `• 🔍 <b>IP-адрес:</b> ${metadata.ip}\n\n` +
        `<b>⏳ Что произойдет дальше:</b>\n\n` +
        `1️⃣ После подтверждения вы потеряете доступ к своему аккаунту\n` +
        `2️⃣ У вас будет 7 дней на восстановление доступа через службу поддержки\n` +
        `3️⃣ После 7 дней ваш аккаунт и все данные будут <b>безвозвратно удалены</b>\n\n` +
        `💡 <b>Передумали?</b> Просто проигнорируйте это сообщение, и ваш аккаунт останется активным.\n\n` +
        `🙏 Нам будет вас не хватать! Если у вас есть пожелания или предложения по улучшению нашего сервиса, пожалуйста, свяжитесь с нами перед уходом.\n\n` +
        `С уважением и надеждой на ваше возвращение,\n` +
        `<b>Команда 4Titles</b> 💫`,

    accountDeleted:
        `<b>🚫 Ваш аккаунт окончательно удалён</b>\n\n` +
        `Все данные, связанные с вашим профилем на 4Titles, были полностью стёрты из наших систем. Этот процесс необратим.\n\n` +
        `🔕 Уведомления в Telegram и на почту больше поступать не будут.\n\n` +
        `✨ <b>Хотите начать заново?</b> Мы всегда открыты для вашего возвращения:\n` +
        `<b><a href="https://4titles.ru/account/create">Создать новый аккаунт</a></b>\n\n` +
        `Благодарим вас за время, проведённое с нами! Двери 4Titles всегда открыты для вас.\n\n` +
        `С наилучшими пожеланиями в ваших будущих проектах,\n` +
        `<b>Команда 4Titles</b> 🌟`,

    newFollowing: (follower: User, followersCount: number) =>
        `<b>🎯 У вас новый подписчик!</b>\n\n` +
        `<a href="https://4titles.ru/${follower.username}">${follower.displayName}</a> теперь следит за вашим творчеством.\n\n` +
        `${getFollowerMilestoneMessage(followersCount)}\n\n` +
        `<b>Всего подписчиков:</b> ${followersCount} ${getFollowersEmoji(followersCount)}`,

    enableTwoFactor:
        `<b>🛡️ Усильте защиту вашего творчества!</b>\n\n` +
        `В мире цифровых возможностей безопасность — ключевой приоритет. Активируйте двухфакторную аутентификацию прямо сейчас в <a href="https://4titles.ru/dashboard/settings">настройках безопасности</a> и защитите свой контент на высшем уровне!`,
}

function formatDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }
    return date.toLocaleDateString('ru-RU', options)
}

function getFollowersEmoji(count: number): string {
    if (count === 0) return '😊'
    if (count < 10) return '🌱'
    if (count < 50) return '🌿'
    if (count < 100) return '🌲'
    if (count < 500) return '🔥'
    if (count < 1000) return '⭐'
    if (count < 5000) return '🌟'
    if (count < 10000) return '💫'
    if (count < 50000) return '🚀'
    return '🌠'
}

function getFollowerMilestoneMessage(count: number): string {
    if (count === 1)
        return '<b>Поздравляем с первым подписчиком!</b> Это особенный момент.'
    if (count === 10)
        return '<b>Первые 10 подписчиков!</b> Ваша аудитория растёт.'
    if (count === 50)
        return '<b>50 подписчиков!</b> Ваше сообщество набирает обороты.'
    if (count === 100)
        return '<b>Поздравляем с первой сотней подписчиков!</b> Вы на правильном пути.'
    if (count === 500)
        return '<b>500 подписчиков!</b> Вы становитесь популярны.'
    if (count === 1000)
        return '<b>1000 подписчиков!</b> Потрясающее достижение! Ваш контент ценят.'
    if (count === 5000)
        return '<b>5000 подписчиков!</b> Вы настоящая звезда 4Titles!'
    if (count === 10000)
        return '<b>10 000 подписчиков!</b> Вы в элитном клубе контент-мейкеров!'
    return 'Ваша аудитория растёт! Продолжайте создавать отличный контент.'
}

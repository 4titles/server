import { Markup } from 'telegraf'

export enum BotButtonKeys {
    AUTH_SUCCESS = 'authSuccess',
    PROFILE = 'profile',
    FEEDBACK = 'feedback',
    RATING = 'rating',
}
export interface BotButtons {
    [BotButtonKeys.AUTH_SUCCESS]: ReturnType<typeof Markup.inlineKeyboard>
    [BotButtonKeys.PROFILE]: ReturnType<typeof Markup.inlineKeyboard>
    [BotButtonKeys.FEEDBACK]: ReturnType<typeof Markup.inlineKeyboard>
    [BotButtonKeys.RATING]: ReturnType<typeof Markup.inlineKeyboard> // New property
}

export const BOT_BUTTONS: BotButtons = {
    [BotButtonKeys.AUTH_SUCCESS]: Markup.inlineKeyboard([
        [
            Markup.button.callback('📜 Мои подписки', 'follows'),
            Markup.button.callback('👤 Просмотреть профиль', 'me'),
        ],
        [Markup.button.url('🌐 На сайт', 'https://4titles.ru')],
        [Markup.button.callback('💬 Оставить отзыв', 'feedback')],
    ]),
    [BotButtonKeys.PROFILE]: Markup.inlineKeyboard([
        Markup.button.url(
            '⚙️ Настройки аккаунта',
            'https://4titles.ru/dashboard/settings',
        ),
        Markup.button.callback('💬 Оставить отзыв', 'feedback'),
    ]),
    [BotButtonKeys.FEEDBACK]: Markup.inlineKeyboard([
        [Markup.button.callback('Общий отзыв о платформе', 'feedback_general')],
        [Markup.button.callback('Сообщить о проблеме', 'feedback_bug')],
        [Markup.button.callback('Предложить улучшение', 'feedback_feature')],
        [Markup.button.callback('Отмена', 'feedback_cancel')],
    ]),
    [BotButtonKeys.RATING]: Markup.inlineKeyboard([
        [
            Markup.button.callback('1️⃣', 'rating_1'),
            Markup.button.callback('2️⃣', 'rating_2'),
            Markup.button.callback('3️⃣', 'rating_3'),
            Markup.button.callback('4️⃣', 'rating_4'),
            Markup.button.callback('5️⃣', 'rating_5'),
        ],
        [Markup.button.callback('Пропустить', 'rating_skip')],
    ]),
}

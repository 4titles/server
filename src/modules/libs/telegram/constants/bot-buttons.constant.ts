import { Markup } from 'telegraf'

export enum BotButtonKeys {
    AUTH_SUCCESS = 'authSuccess',
    PROFILE = 'profile',
}
export interface BotButtons {
    [BotButtonKeys.AUTH_SUCCESS]: ReturnType<typeof Markup.inlineKeyboard>
    [BotButtonKeys.PROFILE]: ReturnType<typeof Markup.inlineKeyboard>
}

export const BOT_BUTTONS: BotButtons = {
    [BotButtonKeys.AUTH_SUCCESS]: Markup.inlineKeyboard([
        [
            Markup.button.callback('📜 Мои подписки', 'follows'),
            Markup.button.callback('👤 Просмотреть профиль', 'me'),
        ],
        [Markup.button.url('🌐 На сайт', 'https://4titles.ru')],
    ]),
    [BotButtonKeys.PROFILE]: Markup.inlineKeyboard([
        Markup.button.url(
            '⚙️ Настройки аккаунта',
            'https://4titles.ru/dashboard/settings',
        ),
    ]),
}

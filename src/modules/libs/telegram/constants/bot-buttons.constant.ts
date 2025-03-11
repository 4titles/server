import { InlineKeyboardButton, InlineKeyboardMarkup } from '@telegraf/types'
import { Markup } from 'telegraf'

export enum BotButtonKeys {
    AUTH_SUCCESS = 'authSuccess',
    PROFILE = 'profile',
    FEEDBACK = 'feedback',
    RATING = 'rating',
    DEFAULT = 'default',
}

type ButtonRow = InlineKeyboardButton[]
export interface BotButtons {
    [BotButtonKeys.AUTH_SUCCESS]: Markup.Markup<InlineKeyboardMarkup>
    [BotButtonKeys.PROFILE]: Markup.Markup<InlineKeyboardMarkup>
    [BotButtonKeys.FEEDBACK]: Markup.Markup<InlineKeyboardMarkup>
    [BotButtonKeys.RATING]: Markup.Markup<InlineKeyboardMarkup>
    [BotButtonKeys.DEFAULT]: Markup.Markup<InlineKeyboardMarkup>
}

const createButtonRow = (...buttons: InlineKeyboardButton[]): ButtonRow =>
    buttons

const ON_SITE_BUTTON = createButtonRow(
    Markup.button.url('🌐 На сайт', 'https://4titles.ru'),
)

export const BOT_BUTTONS: BotButtons = {
    [BotButtonKeys.AUTH_SUCCESS]: Markup.inlineKeyboard([
        createButtonRow(
            Markup.button.callback('📜 Мои подписки', 'follows'),
            Markup.button.callback('👤 Просмотреть профиль', 'me'),
        ),
        ON_SITE_BUTTON,
        createButtonRow(
            Markup.button.callback('💬 Оставить отзыв', 'feedback'),
        ),
    ]),
    [BotButtonKeys.PROFILE]: Markup.inlineKeyboard([
        createButtonRow(
            Markup.button.url(
                '⚙️ Настройки аккаунта',
                'https://4titles.ru/dashboard/settings',
            ),
        ),
        createButtonRow(
            Markup.button.callback('💬 Оставить отзыв', 'feedback'),
        ),
    ]),
    [BotButtonKeys.FEEDBACK]: Markup.inlineKeyboard([
        createButtonRow(
            Markup.button.callback(
                'Общий отзыв о платформе',
                'feedback_general',
            ),
        ),
        createButtonRow(
            Markup.button.callback('Сообщить о проблеме', 'feedback_bug'),
        ),
        createButtonRow(
            Markup.button.callback('Предложить улучшение', 'feedback_feature'),
        ),
        createButtonRow(Markup.button.callback('Отмена', 'feedback_cancel')),
    ]),
    [BotButtonKeys.RATING]: Markup.inlineKeyboard([
        createButtonRow(
            Markup.button.callback('1️⃣', 'rating_1'),
            Markup.button.callback('2️⃣', 'rating_2'),
            Markup.button.callback('3️⃣', 'rating_3'),
            Markup.button.callback('4️⃣', 'rating_4'),
            Markup.button.callback('5️⃣', 'rating_5'),
        ),
        createButtonRow(Markup.button.callback('Пропустить', 'rating_skip')),
    ]),
    [BotButtonKeys.DEFAULT]: Markup.inlineKeyboard([
        ON_SITE_BUTTON,
        createButtonRow(Markup.button.callback('📜 Мои подписки', 'follows')),
    ]),
}

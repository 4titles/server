import { BotCommand } from 'telegraf/typings/core/types/typegram'

export const BOT_COMMANDS: BotCommand[] = [
    { command: 'me', description: 'Просмотреть профиль' },
    { command: 'follows', description: 'Посмотреть подписки' },
    { command: 'feedback', description: 'Отправить фидбэк' },
]

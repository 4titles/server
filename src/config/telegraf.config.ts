import type { TelegrafModuleOptions } from 'nestjs-telegraf'
import { registerAs } from '@nestjs/config'

export const telegrafConfig = registerAs(
    'telegraf',
    (): TelegrafModuleOptions => ({
        token: process.env.TELEGRAM_BOT_TOKEN,
    }),
)

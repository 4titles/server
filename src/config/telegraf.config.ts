import type { TelegrafModuleOptions } from 'nestjs-telegraf'
import { registerAs } from '@nestjs/config'

export default registerAs(
    'telegraf',
    (): TelegrafModuleOptions => ({
        token: process.env.TELEGRAM_BOT_TOKEN,
    }),
)

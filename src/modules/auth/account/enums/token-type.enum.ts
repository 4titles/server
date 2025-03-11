import { registerEnumType } from '@nestjs/graphql'

export enum TokenType {
    EMAIL_VERIFY = 'EMAIL_VERIFY',
    PASSWORD_RESET = 'PASSWORD_RESET',
    DEACTIVATE_ACCOUNT = 'DEACTIVATE_ACCOUNT',
    TELEGRAM_AUTH = 'TELEGRAM_AUTH',
}

registerEnumType(TokenType, {
    name: 'TokenType',
    description: 'The type of token',
})

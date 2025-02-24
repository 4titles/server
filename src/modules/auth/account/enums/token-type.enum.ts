import { registerEnumType } from '@nestjs/graphql'

export enum TokenType {
    EMAIL_VERIFY = 'EMAIL_VERIFY',
    PASSWORD_RESET = 'PASSWORD_RESET',
}

registerEnumType(TokenType, {
    name: 'TokenType',
    description: 'The type of token',
})

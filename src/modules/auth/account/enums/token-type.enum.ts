import { registerEnumType } from '@nestjs/graphql'

export enum TokenType {
    EMAIL_VERIFY = 'EMAIL_VERIFY',
}

registerEnumType(TokenType, {
    name: 'TokenType',
    description: 'The type of token',
})

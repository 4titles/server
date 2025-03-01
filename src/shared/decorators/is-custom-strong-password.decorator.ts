import { applyDecorators } from '@nestjs/common'
import { IsString, IsStrongPassword, MinLength } from 'class-validator'

export function IsCustomStrongPassword() {
    return applyDecorators(
        IsString(),
        MinLength(8),
        IsStrongPassword(
            {
                minLength: 8,
                minLowercase: 1,
                minUppercase: 1,
                minNumbers: 1,
                minSymbols: 0,
            },
            {
                message:
                    'The password should contain at least 1 uppercase character, 1 lowercase, 1 number and should be at least 8 characters long.',
            },
        ),
    )
}

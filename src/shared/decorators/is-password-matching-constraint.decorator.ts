import { NewPasswordInput } from '@/modules/auth/recovery/input/new-password.input'
import {
    ValidationArguments,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator'

@ValidatorConstraint({ name: 'IsPasswordMatchingConstraint', async: false })
export class IsPasswordMatchingConstraint
    implements ValidatorConstraintInterface
{
    validate(passwordRepeat: string, args: ValidationArguments): boolean {
        const obj = args.object as NewPasswordInput

        return obj.password === passwordRepeat
    }

    defaultMessage(): string {
        return "Passwords don't match"
    }
}

import { Field, InputType } from '@nestjs/graphql'
import { IsBoolean } from 'class-validator'

@InputType()
export class ChangeNotificationSettingsInput {
    @Field(() => Boolean)
    @IsBoolean()
    isSiteNotificationsEnabled: boolean

    @Field(() => Boolean)
    @IsBoolean()
    isTelegramNotificationsEnabled: boolean
}

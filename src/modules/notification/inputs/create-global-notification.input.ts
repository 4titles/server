import { Field, InputType } from '@nestjs/graphql'
import { IsNotEmpty, IsString, MaxLength } from 'class-validator'

@InputType()
export class CreateGlobalNotificationInput {
    @Field(() => String, { description: 'Notification message' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    message: string
}

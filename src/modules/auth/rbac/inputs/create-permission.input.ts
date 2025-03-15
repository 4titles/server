import { Field, InputType } from '@nestjs/graphql'
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { Action } from '../enums/actions.enum'
import { Resource } from '../enums/resources.enum'

@InputType()
export class CreatePermissionInput {
    @Field(() => String)
    @IsString()
    @IsNotEmpty()
    @IsIn(Object.values(Resource))
    resource: string

    @Field(() => String)
    @IsString()
    @IsNotEmpty()
    @IsIn(Object.values(Action))
    action: string

    @Field(() => String, { nullable: true })
    @IsString()
    @IsOptional()
    description?: string
}

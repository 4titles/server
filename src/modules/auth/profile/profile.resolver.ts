import { Authorization } from '@/shared/decorators/auth.decorator'
import { Authorized } from '@/shared/decorators/authorized.decorator'
import { FileValidationPipe } from '@/shared/pipes/file-validation.pipe'
import { GraphQLUploadScalar } from '@/shared/scalars/gql-upload.scalar'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import * as Upload from 'graphql-upload/Upload.js'
import { User } from '../account/models/user.model'
import { ChangeProfileInfoInput } from './inputs/change-profile-info.input'
import { ProfileService } from './profile.service'

@Resolver()
export class ProfileResolver {
    constructor(private readonly profileService: ProfileService) {}

    @Authorization()
    @Mutation(() => Boolean)
    public async changeAvatar(
        @Authorized() user: User,
        @Args('avatar', { type: () => GraphQLUploadScalar }, FileValidationPipe)
        avatar: Upload,
    ) {
        return this.profileService.changeAvatar(user, avatar.file)
    }

    @Authorization()
    @Mutation(() => Boolean)
    async removeAvatar(@Authorized() user: User) {
        return await this.profileService.removeAvatar(user)
    }

    @Authorization()
    @Mutation(() => Boolean)
    async changeProfileInfo(
        @Authorized() user: User,
        @Args('data') input: ChangeProfileInfoInput,
    ) {
        return await this.profileService.changeInfo(user, input)
    }
}

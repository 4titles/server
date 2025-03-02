import { Authorization } from '@/shared/decorators/auth.decorator'
import { Authorized } from '@/shared/decorators/authorized.decorator'
import { FileValidationPipe } from '@/shared/pipes/file-validation.pipe'
import { GraphQLUploadScalar } from '@/shared/scalars/gql-upload.scalar'
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql'
import * as Upload from 'graphql-upload/Upload.js'
import { User } from '../account/models/user.model'
import { ChangeProfileInfoInput } from './inputs/change-profile-info.input'
import {
    SocialLinkInput,
    SocialLinkOrderInput,
} from './inputs/social-link.input'
import { SocialLink } from './models/social-link.model'
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

    @Authorization()
    @Query(() => [SocialLink])
    async findSocialLinks(@Authorized() user: User) {
        return await this.profileService.findSocialLinks(user)
    }

    @Authorization()
    @Mutation(() => Boolean)
    async createSocialLink(
        @Authorized() user: User,
        @Args('data') input: SocialLinkInput,
    ) {
        return await this.profileService.createSocialLink(user, input)
    }

    @Authorization()
    @Mutation(() => Boolean)
    async reorderSocialLinks(
        @Args('list', { type: () => [SocialLinkOrderInput] })
        list: SocialLinkOrderInput[],
    ) {
        return await this.profileService.reorderSocialLinks(list)
    }

    @Authorization()
    @Mutation(() => Boolean)
    async updateSocialLink(
        @Args('id') id: string,
        @Args('data') input: SocialLinkInput,
    ) {
        return await this.profileService.updateSocialLink(id, input)
    }

    @Authorization()
    @Mutation(() => Boolean)
    async removeSocialLink(@Args('id') id: string) {
        return await this.profileService.removeSocialLink(id)
    }
}

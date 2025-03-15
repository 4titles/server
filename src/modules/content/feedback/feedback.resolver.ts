import { Action } from '@/modules/auth/rbac/enums/actions.enum'
import { Resource } from '@/modules/auth/rbac/enums/resources.enum'
import { Authorized } from '@/shared/decorators/authorized.decorator'
import { UserAgent } from '@/shared/decorators/user-agent.decorator'
import { RbacProtected } from '@/shared/guards/rbac-protected.guard'
import { GqlContext } from '@/shared/types/gql-context.types'
import { getSessionMetadata } from '@/shared/utils/seesion/session-metadata.util'
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql'
import { User } from '../../auth/account/models/user.model'
import { FeedbackSource } from './enums/feedback-source.enum'
import { FeedbackService } from './feedback.service'
import { CreateFeedbackInput } from './inputs/create-feedback.input'
import { FilterFeedbackInput } from './inputs/filter-feedback.input'
import { UpdateFeedbackStatusInput } from './inputs/update-feedback-status.input'
import { FeedbackStats } from './models/feedback-stats.model'
import { FeedbackSubmitResponse } from './models/feedback-submit-response.model'
import { Feedback } from './models/feedback.model'

@Resolver(() => Feedback)
export class FeedbackResolver {
    constructor(private readonly feedbackService: FeedbackService) {}

    @RbacProtected({
        resource: Resource.FEEDBACK,
        action: Action.CREATE,
        possession: 'own',
    })
    @Mutation(() => FeedbackSubmitResponse)
    async submitFeedback(
        @Args('data') input: CreateFeedbackInput,
        @Authorized() user: User,
    ): Promise<FeedbackSubmitResponse> {
        return await this.feedbackService.create(input, user)
    }

    @Mutation(() => FeedbackSubmitResponse)
    async submitAnonymousFeedback(
        @Context() { req }: GqlContext,
        @UserAgent() userAgent: string,
        @Args('data') input: CreateFeedbackInput,
    ): Promise<FeedbackSubmitResponse> {
        return await this.feedbackService.create(
            input,
            undefined,
            FeedbackSource.WEBSITE,
            getSessionMetadata(req, userAgent),
        )
    }

    @RbacProtected({
        resource: Resource.FEEDBACK,
        action: Action.READ,
        possession: 'own',
    })
    @Query(() => [Feedback])
    async findMyFeedbacks(@Authorized() user: User): Promise<Feedback[]> {
        return await this.feedbackService.findByUser(user.id)
    }

    @RbacProtected({
        resource: Resource.FEEDBACK,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => [Feedback])
    async findAllFeedbacks(
        @Args('filters', { nullable: true }) filters?: FilterFeedbackInput,
    ): Promise<Feedback[]> {
        return await this.feedbackService.findAll(filters)
    }

    @RbacProtected({
        resource: Resource.FEEDBACK,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => Feedback)
    async findFeedbackById(@Args('id') id: string): Promise<Feedback> {
        return await this.feedbackService.findById(id)
    }

    @RbacProtected({
        resource: Resource.FEEDBACK,
        action: Action.UPDATE,
        possession: 'any',
    })
    @Mutation(() => Feedback)
    async updateFeedbackStatus(
        @Args('data') input: UpdateFeedbackStatusInput,
    ): Promise<Feedback> {
        return await this.feedbackService.updateStatus(input)
    }

    @RbacProtected({
        resource: Resource.FEEDBACK,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => FeedbackStats)
    async getFeedbackStats(
        @Args('filters', { nullable: true }) filters?: FilterFeedbackInput,
    ): Promise<FeedbackStats> {
        return await this.feedbackService.getStats(filters)
    }

    @RbacProtected({
        resource: Resource.FEEDBACK,
        action: Action.READ,
        possession: 'own',
    })
    @Query(() => FeedbackStats)
    async getOwnFeedbacksStats(
        @Args('filters') filters: FilterFeedbackInput,
    ): Promise<FeedbackStats> {
        return await this.feedbackService.getStats(filters)
    }
}

import { Authorization } from '@/shared/decorators/auth.decorator'
import { Authorized } from '@/shared/decorators/authorized.decorator'
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql'
import { User } from '../auth/account/models/user.model'
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

    @Authorization()
    @Mutation(() => FeedbackSubmitResponse)
    async submitFeedback(
        @Args('data') input: CreateFeedbackInput,
        @Authorized() user: User,
    ): Promise<FeedbackSubmitResponse> {
        return await this.feedbackService.create(input, user)
    }

    @Mutation(() => FeedbackSubmitResponse)
    async submitAnonymousFeedback(
        @Args('data') input: CreateFeedbackInput,
    ): Promise<FeedbackSubmitResponse> {
        return await this.feedbackService.create(input)
    }

    @Authorization()
    @Query(() => [Feedback])
    async findMyFeedbacks(@Authorized() user: User): Promise<Feedback[]> {
        return await this.feedbackService.findByUser(user.id)
    }

    @Authorization()
    // @Roles(UserRole.ADMIN)
    @Query(() => [Feedback])
    async findAllFeedbacks(
        @Args('filters', { nullable: true }) filters?: FilterFeedbackInput,
    ): Promise<Feedback[]> {
        return await this.feedbackService.findAll(filters)
    }

    @Authorization()
    // @Roles(UserRole.ADMIN)
    @Query(() => Feedback)
    async findFeedbackById(@Args('id') id: string): Promise<Feedback> {
        return await this.feedbackService.findById(id)
    }

    @Authorization()
    // @Roles(UserRole.ADMIN)
    @Mutation(() => Feedback)
    async updateFeedbackStatus(
        @Args('data') input: UpdateFeedbackStatusInput,
    ): Promise<Feedback> {
        return await this.feedbackService.updateStatus(input)
    }

    @Authorization()
    // @Roles(UserRole.ADMIN)
    @Query(() => FeedbackStats)
    async getFeedbackStats(
        @Args('filters', { nullable: true }) filters?: FilterFeedbackInput,
    ): Promise<FeedbackStats> {
        return await this.feedbackService.getStats(filters)
    }
}

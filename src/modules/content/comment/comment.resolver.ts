import { User } from '@/modules/auth/account/models/user.model'
import { Action } from '@/modules/auth/rbac/enums/actions.enum'
import { Resource } from '@/modules/auth/rbac/enums/resources.enum'
import { Authorization } from '@/shared/decorators/auth.decorator'
import { Authorized } from '@/shared/decorators/authorized.decorator'
import { RbacProtected } from '@/shared/guards/rbac-protected.guard'
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql'
import { CommentFilterInput } from './inputs/comment-filter.input'
import { CreateCommentInput } from './inputs/create-comment.input'
import { DeleteCommentInput } from './inputs/delete-comment.input'
import { GetCommentCountInput } from './inputs/get-comment-count.input'
import { ToggleLikeCommentInput } from './inputs/toggle-like-comment.input'
import { UpdateCommentInput } from './inputs/update-comment.input'
import { Comment } from './models/comment.model'
import { CommentService } from './services/comment.service'

@Resolver(() => Comment)
export class CommentResolver {
    constructor(private readonly commentService: CommentService) {}

    @Authorization()
    @Query(() => [Comment])
    async findComments(
        @Args('filter') filter: CommentFilterInput,
        @Authorized() user: User,
    ): Promise<Comment[]> {
        return await this.commentService.findComments(filter, user.id)
    }

    @Query(() => Comment)
    async findCommentById(
        @Args('id') id: string,
        @Authorized() user?: User,
    ): Promise<Comment> {
        return await this.commentService.findById(id, user?.id)
    }

    @Query(() => Number)
    async getCommentCount(
        @Args('input') input: GetCommentCountInput,
    ): Promise<number> {
        return await this.commentService.getCommentCount(input)
    }

    // @RbacProtected({
    //     resource: Resource.COMMENT,
    //     action: Action.CREATE,
    //     possession: 'own',
    // })
    @Authorization()
    @Mutation(() => Boolean)
    async createComment(
        @Args('input') input: CreateCommentInput,
        @Authorized() user: User,
    ): Promise<boolean> {
        return await this.commentService.create(input, user.id)
    }

    // @RbacProtected({
    //     resource: Resource.COMMENT,
    //     action: Action.UPDATE,
    //     possession: 'own',
    // })
    @Authorization()
    @Mutation(() => Boolean)
    async updateComment(
        @Args('input') input: UpdateCommentInput,
        @Authorized() user: User,
    ): Promise<boolean> {
        return await this.commentService.update(input, user.id)
    }

    // @RbacProtected({
    //     resource: Resource.COMMENT,
    //     action: Action.DELETE,
    //     possession: 'own',
    // })
    @Authorization()
    @Mutation(() => Boolean)
    async deleteComment(
        @Args('input') input: DeleteCommentInput,
        @Authorized() user: User,
    ): Promise<boolean> {
        return await this.commentService.delete(input, user.id)
    }

    // @RbacProtected({
    //     resource: Resource.COMMENT,
    //     action: Action.UPDATE,
    //     possession: 'own',
    // })
    @Authorization()
    @Mutation(() => Boolean)
    async toggleLikeComment(
        @Args('input') input: ToggleLikeCommentInput,
        @Authorized() user: User,
    ): Promise<boolean> {
        return await this.commentService.toggleLike(input, user.id)
    }
}

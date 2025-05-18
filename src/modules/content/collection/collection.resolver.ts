import { User } from '@/modules/auth/account/models/user.model'
import { Action } from '@/modules/auth/rbac/enums/actions.enum'
import { Resource } from '@/modules/auth/rbac/enums/resources.enum'
import { Authorized } from '@/shared/decorators/authorized.decorator'
import { RbacProtected } from '@/shared/guards/rbac-protected.guard'
import { FileValidationPipe } from '@/shared/pipes/file-validation.pipe'
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql'
import { CollectionService } from './collection.service'
import { AddCollectionItemInput } from './inputs/add-collection-item.input'
import { CollectionItemOrderInput } from './inputs/collection-item-order.input'
import { CreateCollectionInput } from './inputs/create-collection.input'
import { FindCollectionByIdInput } from './inputs/find-collection-by-id.input'
import { FindCollectionsInput } from './inputs/find-collections.input'
import { GetCollectionItemsCountInput } from './inputs/get-collection-items-count.input'
import { RemoveCollectionItemInput } from './inputs/remove-collection-item.input'
import { UpdateCollectionInput } from './inputs/update-collection.input'
import { Collection } from './models/collection.model'

import { GraphQLUploadScalar } from '@/shared/scalars/gql-upload.scalar'
import * as Upload from 'graphql-upload/Upload.js'

@Resolver(() => Collection)
export class CollectionResolver {
    constructor(private readonly collectionService: CollectionService) {}

    @Query(() => Collection)
    async findCollectionBySlug(
        @Args('slug', { type: () => String }) slug: string,
    ): Promise<Collection> {
        return await this.collectionService.findCollectionBySlug(slug)
    }

    @RbacProtected({
        resource: Resource.COLLECTION,
        action: Action.READ,
        possession: 'own',
    })
    @Query(() => Collection)
    async findMyCollectionById(
        @Authorized() user: User,
        @Args('input', { type: () => FindCollectionByIdInput })
        input: FindCollectionByIdInput,
    ): Promise<Collection> {
        return await this.collectionService.findUserCollectionById(
            user,
            input.id,
        )
    }

    @RbacProtected({
        resource: Resource.COLLECTION,
        action: Action.READ,
        possession: 'own',
    })
    @Query(() => [Collection])
    async findCollections(
        @Authorized() user: User,
        @Args('input') input: FindCollectionsInput,
    ): Promise<Collection[]> {
        return await this.collectionService.findCollections(input, user)
    }

    @RbacProtected({
        resource: Resource.COLLECTION,
        action: Action.READ,
        possession: 'own',
    })
    @Query(() => Int)
    async getCollectionItemsCount(
        @Args('input') input: GetCollectionItemsCountInput,
    ): Promise<number> {
        const { id, type } = input
        return await this.collectionService.getCollectionItemsCount(id, type)
    }

    @RbacProtected({
        resource: Resource.COLLECTION,
        action: Action.CREATE,
        possession: 'own',
    })
    @Mutation(() => Collection)
    async createCollection(
        @Authorized() user: User,
        @Args('input')
        input: CreateCollectionInput,
        @Args(
            'coverImage',
            { type: () => GraphQLUploadScalar, nullable: true },
            FileValidationPipe,
        )
        coverImage?: Upload,
    ): Promise<Collection> {
        return await this.collectionService.create(
            user,
            input,
            coverImage?.file,
        )
    }

    @RbacProtected({
        resource: Resource.COLLECTION,
        action: Action.UPDATE,
        possession: 'own',
    })
    @Mutation(() => Collection)
    async updateCollection(
        @Authorized() user: User,
        @Args('input') input: UpdateCollectionInput,
        @Args(
            'coverImage',
            { type: () => GraphQLUploadScalar, nullable: true },
            FileValidationPipe,
        )
        coverImage?: Upload,
    ): Promise<Collection> {
        return await this.collectionService.update(
            user,
            input,
            coverImage?.file,
        )
    }

    @RbacProtected({
        resource: Resource.COLLECTION,
        action: Action.UPDATE,
        possession: 'own',
    })
    @Mutation(() => Boolean)
    async reorderCollectionItems(
        @Args('list', { type: () => [CollectionItemOrderInput] })
        list: CollectionItemOrderInput[],
    ): Promise<boolean> {
        return await this.collectionService.reorderCollectionItems(list)
    }

    @RbacProtected({
        resource: Resource.COLLECTION,
        action: Action.DELETE,
        possession: 'own',
    })
    @Mutation(() => Boolean)
    async deleteCollection(
        @Authorized() user: User,
        @Args('id', { type: () => String }) id: string,
    ): Promise<boolean> {
        return await this.collectionService.delete(user, id)
    }

    @RbacProtected({
        resource: Resource.COLLECTION,
        action: Action.CREATE,
        possession: 'own',
    })
    @Mutation(() => Boolean)
    async addCollectionItem(
        @Authorized() user: User,
        @Args('input') input: AddCollectionItemInput,
    ): Promise<boolean> {
        return await this.collectionService.addCollectionItem(user, input)
    }

    @RbacProtected({
        resource: Resource.COLLECTION,
        action: Action.DELETE,
        possession: 'own',
    })
    @Mutation(() => Boolean)
    async removeCollectionItem(
        @Authorized() user: User,
        @Args('input') input: RemoveCollectionItemInput,
    ): Promise<boolean> {
        return await this.collectionService.removeCollectionItem(user, input)
    }

    @RbacProtected({
        resource: Resource.COLLECTION,
        action: Action.UPDATE,
        possession: 'own',
    })
    @Mutation(() => Boolean)
    async removeCollectionCoverImage(
        @Authorized() user: User,
        @Args('id', { type: () => String }) id: string,
    ): Promise<boolean> {
        return await this.collectionService.removeCoverImage(id, user)
    }
}

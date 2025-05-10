import { User } from '@/modules/auth/account/models/user.model'
import { Action } from '@/modules/auth/rbac/enums/actions.enum'
import { Resource } from '@/modules/auth/rbac/enums/resources.enum'
import { DbFavoriteSelect } from '@/modules/infrastructure/drizzle/schema/favorites.schema'
import { Authorized } from '@/shared/decorators/authorized.decorator'
import { RbacProtected } from '@/shared/guards/rbac-protected.guard'
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql'
import { FavoriteService } from './favorite.service'
import { AddToFavoritesInput } from './inputs/add-to-favorites.input'
import { FindFavoritesInput } from './inputs/find-favorites.input'
import { IsEntityFavoriteInput } from './inputs/is-entity-favorite.input'
import { RemoveFromFavoritesInput } from './inputs/remove-from-favorites.input'
import { Favorite } from './models/favorite.model'

@Resolver(() => Favorite)
export class FavoriteResolver {
    constructor(private readonly favoriteService: FavoriteService) {}

    @RbacProtected({
        resource: Resource.USER,
        action: Action.UPDATE,
        possession: 'own',
    })
    @Mutation(() => Favorite, {
        nullable: true,
        description:
            "Adds an item (Title or Location) to the current user's favorites.",
    })
    async addToFavorites(
        @Authorized() user: User,
        @Args('input') input: AddToFavoritesInput,
    ): Promise<DbFavoriteSelect | null> {
        return await this.favoriteService.addToFavorites(user.id, input)
    }

    @RbacProtected({
        resource: Resource.USER,
        action: Action.DELETE,
        possession: 'own',
    })
    @Mutation(() => Boolean, {
        description:
            "Removes an item (Title or Location) from the current user's favorites.",
    })
    async removeFromFavorites(
        @Authorized() user: User,
        @Args('input') input: RemoveFromFavoritesInput,
    ): Promise<boolean> {
        return await this.favoriteService.removeFromFavorites(user.id, input)
    }

    @RbacProtected({
        resource: Resource.USER,
        action: Action.READ,
        possession: 'own',
    })
    @Query(() => Boolean, {
        description:
            "Checks if a specific entity is in the current user's favorites.",
    })
    async isEntityFavorite(
        @Authorized() user: User,
        @Args('input') input: IsEntityFavoriteInput,
    ): Promise<boolean> {
        return await this.favoriteService.isFavorite(user.id, input)
    }

    @RbacProtected({
        resource: Resource.USER,
        action: Action.READ,
        possession: 'own',
    })
    @Query(() => [Favorite], {
        description:
            "Retrieves the current user's favorites, optionally filtered by type.",
    })
    async findMyFavorites(
        @Authorized() user: User,
        @Args('filters') input: FindFavoritesInput,
    ): Promise<Favorite[]> {
        return (await this.favoriteService.findUserFavorites(
            user.id,
            input,
        )) as Favorite[]
    }
}

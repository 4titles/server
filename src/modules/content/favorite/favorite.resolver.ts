import { User } from '@/modules/auth/account/models/user.model'
import { Action } from '@/modules/auth/rbac/enums/actions.enum'
import { Resource } from '@/modules/auth/rbac/enums/resources.enum'
import { DbFavoriteSelect } from '@/modules/infrastructure/drizzle/schema/favorites.schema'
import { Authorized } from '@/shared/decorators/authorized.decorator'
import { RbacProtected } from '@/shared/guards/rbac-protected.guard'
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql'
import { FavoriteType } from './enums/favorite-type.enum'
import { FavoriteService } from './favorite.service'
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
        @Args('type', { type: () => FavoriteType }) type: FavoriteType,
        @Args('entityId', { type: () => String }) entityId: string,
    ): Promise<DbFavoriteSelect | null> {
        return await this.favoriteService.addToFavorites(
            user.id,
            type,
            entityId,
        )
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
        @Args('type', { type: () => FavoriteType }) type: FavoriteType,
        @Args('entityId', { type: () => String }) entityId: string,
    ): Promise<boolean> {
        return await this.favoriteService.removeFromFavorites(
            user.id,
            type,
            entityId,
        )
    }

    @RbacProtected({
        resource: Resource.USER,
        action: Action.READ,
        possession: 'own',
    })
    @Query(() => Boolean, {
        description:
            "Checks if a specific title is in the current user's favorites.",
    })
    async isTitleFavorite(
        @Authorized() user: User,
        @Args('titleId', { type: () => String }) titleId: string,
    ): Promise<boolean> {
        return await this.favoriteService.isFavorite(
            user.id,
            FavoriteType.TITLE,
            titleId,
        )
    }

    @RbacProtected({
        resource: Resource.USER,
        action: Action.READ,
        possession: 'own',
    })
    @Query(() => Boolean, {
        description:
            "Checks if a specific location is in the current user's favorites.",
    })
    async isLocationFavorite(
        @Authorized() user: User,
        @Args('locationId', { type: () => String }) locationId: string,
    ): Promise<boolean> {
        return await this.favoriteService.isFavorite(
            user.id,
            FavoriteType.LOCATION,
            locationId,
        )
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
    async myFavorites(
        @Authorized() user: User,
        @Args('type', { type: () => FavoriteType, nullable: true })
        type?: FavoriteType,
    ): Promise<Favorite[]> {
        return (await this.favoriteService.getUserFavorites(
            user.id,
            type,
        )) as Favorite[]
    }
}

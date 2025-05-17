import { Module, forwardRef } from '@nestjs/common'
import { CollectionModule } from '../collection/collection.module'
import { FilmingLocationModule } from '../title/modules/filming-location/filming-location.module'
import { TitleModule } from '../title/title.module'
import { FavoriteResolver } from './favorite.resolver'
import { FavoriteService } from './favorite.service'

@Module({
    imports: [
        forwardRef(() => CollectionModule),
        forwardRef(() => TitleModule),
        FilmingLocationModule,
    ],
    providers: [FavoriteService, FavoriteResolver],
    exports: [FavoriteService],
})
export class FavoriteModule {}

import { Module, forwardRef } from '@nestjs/common'
import { FilmingLocationModule } from '../title/modules/filming-location/filming-location.module'
import { TitleModule } from '../title/title.module'
import { FavoriteResolver } from './favorite.resolver'
import { FavoriteService } from './favorite.service'

@Module({
    imports: [forwardRef(() => TitleModule), FilmingLocationModule],
    providers: [FavoriteResolver, FavoriteService],
    exports: [FavoriteService],
})
export class FavoriteModule {}

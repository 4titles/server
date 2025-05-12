import { Module, forwardRef } from '@nestjs/common'
import { TitleModule } from '../title/title.module'
import { FavoriteResolver } from './favorite.resolver'
import { FavoriteService } from './favorite.service'

@Module({
    imports: [forwardRef(() => TitleModule)],
    providers: [FavoriteResolver, FavoriteService],
    exports: [FavoriteService],
})
export class FavoriteModule {}

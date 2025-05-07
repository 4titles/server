import { ContentModerationModule } from '@/modules/content/content-moderation/content-moderation.module'
import { TitleFilmingLocationService } from '@/modules/content/title/services/relations/title-filming-location.service'
import { TitleElasticsearchLocationSyncService } from '@/modules/content/title/services/sync/title-elasticsearch-location-sync.service'
import { TitleModule } from '@/modules/content/title/title.module'
import { forwardRef, Module } from '@nestjs/common'
import { TitleElasticsearchModule } from '../../../elasticsearch/title-elasticsearch.module'
import { FilmingLocationModule } from '../../filming-location.module'
import { FilmingLocationProposalResolver } from './filming-location-proposal.resolver'
import { FilmingLocationProposalService } from './filming-location-proposal.service'

@Module({
    imports: [
        forwardRef(() => TitleModule),
        forwardRef(() => FilmingLocationModule),
        ContentModerationModule,
        TitleElasticsearchModule,
    ],
    providers: [
        FilmingLocationProposalService,
        FilmingLocationProposalResolver,
        TitleFilmingLocationService,
        TitleElasticsearchLocationSyncService,
    ],
    exports: [FilmingLocationProposalService],
})
export class FilmingLocationProposalModule {}

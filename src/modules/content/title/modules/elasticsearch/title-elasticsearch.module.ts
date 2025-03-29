import { AppElasticsearchModule } from '@/modules/infrastructure/elasticsearch/elasticsearch.module'
import { Module } from '@nestjs/common'
import { TitleElasticsearchService } from './title-elasticsearch.service'

@Module({
    imports: [AppElasticsearchModule],
    providers: [TitleElasticsearchService],
    exports: [TitleElasticsearchService],
})
export class TitleElasticsearchModule {}

import getElasticSearchConfig from '@/config/elasticsearch.config'
import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ElasticsearchModule } from '@nestjs/elasticsearch'
import { ElasticsearchService } from './elasticsearch.service'

@Module({
    imports: [
        ElasticsearchModule.registerAsync({
            useFactory: getElasticSearchConfig,
            inject: [ConfigService],
        }),
    ],
    providers: [ElasticsearchService],
    exports: [ElasticsearchService],
})
export class AppElasticsearchModule {}

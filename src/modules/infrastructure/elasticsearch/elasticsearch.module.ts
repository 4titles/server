import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ElasticsearchModule } from '@nestjs/elasticsearch'
import { ElasticsearchService } from './elasticsearch.service'

@Module({
    imports: [
        ElasticsearchModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                node: configService.getOrThrow<string>('ELASTICSEARCH_NODE'),
                auth: {
                    username: configService.getOrThrow<string>(
                        'ELASTICSEARCH_USERNAME',
                    ),
                    password: configService.getOrThrow<string>(
                        'ELASTICSEARCH_PASSWORD',
                    ),
                },
            }),
            inject: [ConfigService],
        }),
    ],
    providers: [ElasticsearchService],
    exports: [ElasticsearchService],
})
export class AppElasticsearchModule {}

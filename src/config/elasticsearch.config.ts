import { ClientOptions } from '@elastic/elasticsearch'
import { ConfigService } from '@nestjs/config'

export default function getElasticSearchConfig(
    configService: ConfigService,
): ClientOptions {
    return {
        node: configService.getOrThrow<string>('ELASTICSEARCH_NODE'),
        auth: {
            username: configService.getOrThrow<string>(
                'ELASTICSEARCH_USERNAME',
            ),
            password: configService.getOrThrow<string>(
                'ELASTICSEARCH_PASSWORD',
            ),
        },
        requestTimeout:
            configService.get<number>('ELASTICSEARCH_REQUEST_TIMEOUT_MS') ||
            60000,
        maxRetries: configService.get<number>('ELASTICSEARCH_MAX_RETRIES') || 3,
        sniffOnStart:
            configService.get<boolean>('ELASTICSEARCH_SNIFF_ON_START') || false,
        sniffInterval:
            configService.get<number>('ELASTICSEARCH_SNIFF_INTERVAL_MS') ||
            30000,
        sniffOnConnectionFault:
            configService.get<boolean>(
                'ELASTICSEARCH_SNIFF_ON_CONNECTION_FAULT',
            ) || true,
        resurrectStrategy:
            configService.get<'ping' | 'optimistic' | 'none'>(
                'ELASTICSEARCH_RESURRECT_STRATEGY',
            ) || 'ping',
    }
}

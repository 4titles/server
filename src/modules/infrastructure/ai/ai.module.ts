import { Module } from '@nestjs/common'
import { AiApiKeyPoolService } from './ai-api-key-pool.service'
import { AiRateLimiterService } from './ai-rate-limiter.service'
import { AiService } from './ai.service'
import { DeepseekService } from './deepseek.service'

@Module({
    providers: [
        AiService,
        DeepseekService,
        AiRateLimiterService,
        AiApiKeyPoolService,
    ],
    exports: [AiService, DeepseekService, AiRateLimiterService],
})
export class AiModule {}

import { Module } from '@nestjs/common'
import { AiService } from './ai.service'
import { DeepseekService } from './deepseek.service'

@Module({
    providers: [AiService, DeepseekService],
    exports: [AiService, DeepseekService],
})
export class AiModule {}

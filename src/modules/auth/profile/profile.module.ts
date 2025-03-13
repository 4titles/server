import { ContentModerationModule } from '@/modules/content/content-moderation/content-moderation.module'
import { Module } from '@nestjs/common'
import { ProfileResolver } from './profile.resolver'
import { ProfileService } from './profile.service'

@Module({
    imports: [ContentModerationModule],
    providers: [ProfileResolver, ProfileService],
})
export class ProfileModule {}

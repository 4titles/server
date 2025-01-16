import { TitlesService } from '@/modules/titles/services'
import { Injectable, Logger } from '@nestjs/common'
import { Command, Positional } from 'nestjs-command'
import { TitleCategory } from '@/modules/titles/enums/title-category.enum'

@Injectable()
export class SyncTitlesCommand {
    private readonly logger = new Logger(SyncTitlesCommand.name)

    constructor(private readonly titlesService: TitlesService) {}

    @Command({
        command: 'sync:titles <category>',
        describe: 'Immediately sync titles by category',
    })
    async run(
        @Positional({
            name: 'category',
            describe: 'Category of titles to sync',
            type: 'string',
        })
        category: TitleCategory,
    ): Promise<void> {
        switch (category) {
            case TitleCategory.POPULAR:
                await this.titlesService.syncPopularTitles()
                this.logger.log('Finished popular titles synchronization')
                break
            case TitleCategory.TOP_RATED:
                await this.titlesService.syncTopRatedTitles()
                this.logger.log('Finished top rated titles synchronization')
                break
            case TitleCategory.TRENDING:
                await this.titlesService.syncTrendingTitles()
                this.logger.log('Finished trending titles synchronization')
                break
            case TitleCategory.UPCOMING:
                await this.titlesService.syncUpcomingTitles()
                this.logger.log('Finished upcoming titles synchronization')
                break
            case TitleCategory.AIRING:
                await this.titlesService.syncAiringTitles()
                this.logger.log('Finished airing titles synchronization')
                break
            default:
                this.logger.error(`Unsupported category: ${category}`)
                throw new Error(`Unsupported category: ${category}`)
        }
    }
}

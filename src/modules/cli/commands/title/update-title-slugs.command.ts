import { Injectable, Logger } from '@nestjs/common'
import { Command, Positional } from 'nestjs-command'
import { TitleService } from '../../../content/title/services/title.service'

@Injectable()
export class UpdateTitleSlugsCommand {
    private readonly logger = new Logger(UpdateTitleSlugsCommand.name)

    constructor(private readonly titleService: TitleService) {}

    @Command({
        command: 'title:update-slugs [force]',
        describe: 'Update slugs for all titles based on English translations',
    })
    async run(
        @Positional({
            name: 'force',
            describe: 'Force update slugs for all titles',
            type: 'boolean',
            default: false,
        })
        force: boolean,
    ): Promise<void> {
        try {
            this.logger.log('Starting slug update process...')

            if (force) {
                this.logger.log(
                    'Force update mode enabled - updating all slugs',
                )
            } else {
                this.logger.log('Updating only titles without slugs')
            }

            const updatedCount =
                await this.titleService.updateSlugsForAllTitles(force)

            this.logger.log(`Successfully updated ${updatedCount} title slugs`)
        } catch (error) {
            this.logger.error('Failed to update title slugs:', error)
        }
    }
}

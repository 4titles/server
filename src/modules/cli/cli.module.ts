import { Module } from '@nestjs/common'
import { CommandModule } from 'nestjs-command'
import { TitlesModule } from '../content/titles/titles.module'
import * as seeders from '../infrastructure/drizzle/seeders'
import { TmdbModule } from '../infrastructure/tmdb/tmdb.module'
import * as commands from './commands'

@Module({
    imports: [CommandModule, TmdbModule, TitlesModule],
    providers: [...Object.values(seeders), ...Object.values(commands)],
})
export class CliModule {}

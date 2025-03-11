import { Module } from '@nestjs/common'
import { CommandModule } from 'nestjs-command'
import * as seeders from '../drizzle/seeders'
import { TitlesModule } from '../titles/titles.module'
import { TmdbModule } from '../tmdb/tmdb.module'
import * as commands from './commands'

@Module({
    imports: [CommandModule, TmdbModule, TitlesModule],
    providers: [...Object.values(seeders), ...Object.values(commands)],
})
export class CliModule {}

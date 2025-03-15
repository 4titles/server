import { Module } from '@nestjs/common'
import { CommandModule } from 'nestjs-command'
import { TmdbModule } from '../content/titles/modules/tmdb/tmdb.module'
import * as seeders from '../infrastructure/drizzle/seeders'
import * as commands from './commands'

@Module({
    imports: [CommandModule, TmdbModule],
    providers: [...Object.values(seeders), ...Object.values(commands)],
})
export class CliModule {}

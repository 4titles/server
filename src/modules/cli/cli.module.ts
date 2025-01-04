import { Module } from '@nestjs/common'
import { TmdbModule } from '../tmdb/tmdb.module'
import { DrizzleModule } from '../drizzle/drizzle.module'
import { CommandModule } from 'nestjs-command'
import * as commands from './commands'
import * as seeders from '../drizzle/seeders'

@Module({
    imports: [CommandModule, TmdbModule, DrizzleModule],
    providers: [...Object.values(seeders), ...Object.values(commands)],
})
export class CliModule {}

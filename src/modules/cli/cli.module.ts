import { Module } from '@nestjs/common'
import { CommandModule } from 'nestjs-command'
import { TitleModule } from '../content/title/title.module'

import * as seeders from '@/modules/infrastructure/drizzle/seeders/'
import * as commands from './commands'

@Module({
    imports: [CommandModule, TitleModule],
    providers: [...Object.values(commands), ...Object.values(seeders)],
    exports: [...Object.values(commands)],
})
export class CliModule {}

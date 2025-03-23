import { Module } from '@nestjs/common'
import { TmdbModule } from '../tmdb/tmdb.module'
import { LanguageResolver } from './language.resolver'
import { LanguageService } from './language.service'

@Module({
    imports: [TmdbModule],
    providers: [LanguageService, LanguageResolver],
    exports: [LanguageService],
})
export class LanguageModule {}

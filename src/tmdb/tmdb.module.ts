import { Module } from '@nestjs/common'
import { TmdbService } from './tmdb-service'
import { ConfigService } from '@nestjs/config'

@Module({
    providers: [TmdbService, ConfigService],
    exports: [TmdbService],
})
export class TmdbModule {}

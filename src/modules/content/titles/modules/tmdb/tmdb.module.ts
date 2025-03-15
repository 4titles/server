import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { TmdbService } from './tmdb.service'

@Module({
    imports: [HttpModule],
    providers: [TmdbService],
    exports: [TmdbService],
})
export class TmdbModule {}

import { Module } from '@nestjs/common'
import { TmdbService } from './tmdb.service'
import { HttpModule } from '@nestjs/axios'

@Module({
    imports: [HttpModule],
    providers: [TmdbService],
    exports: [TmdbService],
})
export class TmdbModule {}
